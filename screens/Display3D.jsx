import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Text,
  PanResponder,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Linking,
  Platform,
  Dimensions
} from "react-native";
import {
  GLView
} from "expo-gl";
import * as THREE from "three";
import { Renderer } from "expo-three";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { pack, createDisplay } from "../packing_algo/packing";
import { isSpecialSize, getScale } from "../utils/boxSizes";
import Slider from "@react-native-community/slider";
import { Picker } from '@react-native-picker/picker';

const carrierData = [
  { label: "No Carrier", value: "No Carrier" },
  { label: "UPS", value: "UPS" },
  { label: "USPS", value: "USPS" },
  { label: "FedEx", value: "FedEx" },
];

const PriceText = ({ carrier, priceText }) => {
  if (!priceText) {
    return <Text style={styles.text}>Price not available</Text>;
  }

  const handlePress = () => {
    let url = "";
    if (priceText.includes("Priority Mail")) {
      url = "https://postcalc.usps.com/";
    } else if (priceText.includes("FedEx One Rate")) {
      url = "https://www.fedex.com/en-us/online/rating.html#";
    } else if (priceText.includes("Flat Rates Start at")) {
      url = "https://wwwapps.ups.com/ctc/request?loc=en_US";
    }
    
    if (url) {
      Linking.openURL(url);
    }
  };

  const isClickable = priceText.includes("Priority Mail") || 
                     priceText.includes("FedEx One Rate") || 
                     priceText.includes("Flat Rates Start at");

  return isClickable ? (
    <TouchableOpacity onPress={handlePress}>
      <Text style={[styles.text, styles.linkText]}>{priceText}</Text>
    </TouchableOpacity>
  ) : (
    <Text style={styles.text}>{priceText}</Text>
  );
};

export default class Display3D extends Component {
  constructor(props) {
    super(props);
    this.rotationAnim = new Animated.Value(0);
    this.state = {
      theta: 0,
      phi: Math.PI / 2,
      userInteracted: false,
      selectedCarrier: props.route.params.selectedCarrier || "No Carrier",
      items: props.route.params.items || [],
      itemsTotal: props.route.params.itemsTotal || [],
      box: props.route.params.box || null,
      selectedBox: props.route.params.selectedBox || null,
      gl: null,
      isLegendVisible: false,
      isBoxCollapsed: false,
      boxContentHeight: new Animated.Value(1),
      glViewHeight: new Animated.Value(420),
      sliderKey: 0,
      sliderValue: 0,
      dimensions: {
        width: 0,
        height: 0,
      },
      isSliding: false,
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
    });

    // Add listener for rotation animation
    this.rotationAnim.addListener(({ value }) => {
      if (this.cube && this.scene) {
        this.cube.rotation.y = value;
        
        if (this.state.box && Array.isArray(this.state.itemsTotal)) {
          // Get the scale for the current box
          const scale = getScale(this.state.box);
          
          // Calculate base movement
          const baseMovement = this.state.box.y / 10;
          
          // Adjust movement multiplier based on scale
          let movementMultiplier;
          if (scale === 6) {
            // For small boxes (scale 6), use a larger multiplier
            const boxHeight = this.state.box.y;
            if (boxHeight <= 6) {
              movementMultiplier = 3.0; // Extra boost for very small boxes
            } else if (boxHeight <= 8) {
              movementMultiplier = 2.5; // Boost for small boxes
            } else {
              movementMultiplier = 2.0; // Standard boost for scale 6
            }
          } else {
            // For larger boxes, use the original multiplier
            movementMultiplier = 1.5;
          }
          
          const maxMovement = baseMovement * movementMultiplier;
          
          this.state.itemsTotal.forEach((item) => {
            if (item && item.dis && item.dis.position && item.pos) {
              try {
                item.dis.position.y = Math.sin(value) * maxMovement + item.pos[1];
              } catch (error) {
                console.log('Error updating item position:', error);
              }
            }
          });
        }
      }
    });

    // Helper method to update item positions
    this.updateItemPositions = (value, maxMovement) => {
      this.state.itemsTotal.forEach((item) => {
        if (item?.dis?.position && item?.pos) {
          try {
            item.dis.position.y = Math.sin(value) * maxMovement + item.pos[1];
          } catch (error) {
            console.log('Error updating item position:', error);
          }
        }
      });
    };
  }

  componentWillUnmount() {
    this.rotationAnim.removeAllListeners();
    if (this.focusListener) {
      this.focusListener();
    }
  }

  componentDidMount() {
    // Force a re-initialization if we have initial data
    if (this.state.box && this.state.itemsTotal) {
      // Wait for next tick to ensure GL context is ready
      setTimeout(() => {
        const packedResult = this.state.box;
        this.onCarrierChange(packedResult);
      }, 0);
    }
  }

  forceUpdateWithProps() {
    const { route } = this.props;
    this.setState(
      {
        items: route.params.items || [],
        itemsTotal: route.params.itemsTotal || [],
        box: route.params.box || null,
        selectedBox: route.params.selectedBox || null,
      },
      () => {
        if (this.state.gl) {
          this.initialize3DScene();
        }
      }
    );
  }

  componentDidUpdate(prevProps) {
    // Check for navigation state changes
    if (
      JSON.stringify(prevProps.route.params.items) !==
      JSON.stringify(this.props.route.params.items)
    ) {
      console.log('Route params changed, resetting state and slider'); // Debug log
      this.forceUpdateWithProps();
      this.resetSlider();
    }
  }

  _onGLContextCreate = async (gl) => {
    const { box } = this.state;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // Check if this is a special size box that needs adjusted camera settings
    const specialSize = isSpecialSize(box);
    let cameraDistance = specialSize ? 3.5 : 5;
    let fov = specialSize ? 60 : 75;

    this.camera = new THREE.PerspectiveCamera(
      fov,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    
    this.camera.position.set(0, cameraDistance * 0.5, cameraDistance);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new Renderer({ gl });
    this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    this.setState({ gl }, () => {
      this.addBoxToScene();
      this.animate();
    });
  };

  addBoxToScene = () => {
    if (!this.state.box || !this.state.itemsTotal) return;
    
    if (this.cube) {
      this.scene.remove(this.cube);
    }

    this.cube = this.createBox(this.state.box, this.state.itemsTotal);
    if (this.scene) {
      this.scene.add(this.cube);
    }
  };

  initialize3DScene = () => {
    const { box, gl } = this.state;
    if (!box || !gl) return;

    // Ensure box and items are added after scene is fully initialized
    this.addBoxToScene();

    this.animate();
  };

  createBox = (box, itemsTotal) => {
    const scale = getScale(box);
    console.log('Using scale for box:', { dimensions: [box.x, box.y, box.z], scale });

    const geometry = new THREE.BoxGeometry(
      box.x / scale,
      box.y / scale,
      box.z / scale
    );
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.25,
      color: 0x808080,
    });
    const cube = new THREE.Mesh(geometry, material);

    // Create wireframe
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    cube.add(wireframe);

    // Create items with the same scale as the box
    if (itemsTotal && itemsTotal.length > 0) {
      const displayItems = createDisplay(box, scale);
      displayItems.forEach(item => {
        if (item.dis) {
          cube.add(item.dis);
        }
      });
      this.setState({ itemsTotal: displayItems });
    }

    return cube;
  };

  onCarrierChange = (packedResult) => {
    if (!packedResult) {
      console.error("No packing result received");
      return;
    }

    const scale = getScale(packedResult);
    const itemsDisplay = createDisplay(packedResult, scale);

    this.setState(
      {
        box: packedResult,
        itemsTotal: itemsDisplay,
        selectedBox: {
          dimensions: [packedResult.x, packedResult.y, packedResult.z],
          finalBoxType: packedResult.type,
          priceText: packedResult.priceText
        },
      },
      () => {
        if (this.state.gl) {
          this.initialize3DScene();
        }
      }
    );
  };

  animate = () => {
    requestAnimationFrame(this.animate);

    const { gl } = this.state;
    if (!gl) return;

    if (this.state.userInteracted) {
      const boxRotationY = this.rotationAnim._value;
      this.camera.position.x = 5 * Math.sin(this.state.phi) * Math.cos(this.state.theta + boxRotationY);
      this.camera.position.y = 5 * Math.cos(this.state.phi);
      this.camera.position.z = 5 * Math.sin(this.state.phi) * Math.sin(this.state.theta + boxRotationY);
    } else {
      this.camera.position.set(-1.2, 0.5, 5);
    }

    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
    gl.endFrameEXP();
  };

  handleRotationChange = (value) => {
    this.rotationAnim.setValue(value);
    if (Platform.OS === 'ios') {
      this.setState({ sliderValue: value });
    }
  };

  handlePanResponderMove = (event, gestureState) => {
    const { dx, dy } = gestureState;
    this.setState((prevState) => ({
      theta: prevState.theta - dx * 0.001,
      phi: Math.max(0.1, Math.min(Math.PI - 0.1, prevState.phi - dy * 0.001)),
      userInteracted: true,
    }));
  };

  resetSlider = () => {
    // Reset both animation value and user interaction state
    this.rotationAnim.setValue(0);
    this.setState({ userInteracted: false });
  };

  updateVisualsBasedOnCarrier = (carrier) => {
    // Reset animation value
    this.rotationAnim.setValue(0);
    
    this.setState(
      {
        selectedCarrier: carrier,
        userInteracted: false,
        sliderKey: Platform.OS === 'android' ? this.state.sliderKey + 1 : this.state.sliderKey,
        sliderValue: 0,
      },
      () => {
        this.handleVisualize();
        if (this.state.gl) {
          this.initialize3DScene();
        }
        
        // For iOS, use a slight delay to ensure the reset takes effect
        if (Platform.OS === 'ios') {
          setTimeout(() => {
            this.rotationAnim.setValue(0);
            this.setState({ sliderValue: 0 });
          }, 50);
        }
      }
    );
  };

  handleVisualize = () => {
    const { items, selectedCarrier } = this.state;

    if (items.length === 0) {
      Alert.alert("No Items", "Please add at least one item before packing.");
      return;
    }

    const itemsTotal = items.flatMap((item) =>
      item.replicatedNames.map((name) => [
        item.itemLength,
        item.itemWidth,
        item.itemHeight,
        item.id,
        selectedCarrier,
        name,
      ])
    );

    const packedResult = pack(itemsTotal, selectedCarrier, 0);

    if (!packedResult || packedResult.length === 0) {
      Alert.alert("Error", "Failed to pack items.");
      return;
    }

    // Reset rotation when visualizing new box
    this.resetSlider();

    this.setState(
      {
        box: packedResult,
        itemsTotal: createDisplay(packedResult, getScale(packedResult)),
        selectedBox: {
          dimensions: [packedResult.x, packedResult.y, packedResult.z],
          priceText: packedResult.priceText,
          finalBoxType: packedResult.type,
        },
      },
      () => {
        if (this.state.gl) {
          this.initialize3DScene();
        }
      }
    );
  };

  renderCustomSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Slider
          key={Platform.OS === 'android' ? this.state.sliderKey : undefined}
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={Math.PI}
          step={Platform.OS === 'android' ? 0.05 : 0.01}
          value={Platform.OS === 'ios' ? this.state.sliderValue : this.rotationAnim._value}
          onValueChange={this.handleRotationChange}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#B4B4B4"
          thumbTintColor="#007AFF"
        />
      </View>
    );
  };

  toggleBoxCollapse = () => {
    const { isBoxCollapsed } = this.state;
    const newState = !isBoxCollapsed;
    
    const expandedHeight = 420;
    const optimalBoxHeight = 220; 
    const headerHeight = 40;

    const collapsedHeight = expandedHeight + (optimalBoxHeight - headerHeight);

    Animated.parallel([
      Animated.timing(this.state.boxContentHeight, {
        toValue: newState ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(this.state.glViewHeight, {
        toValue: newState ? collapsedHeight : expandedHeight,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (this.state.gl) {
        this.initialize3DScene();
      }
    });

    this.setState({ isBoxCollapsed: newState });
  };

  renderLegendModal = () => {
    const { itemsTotal, isLegendVisible } = this.state;

    // Initialize empty objects/arrays
    const groupedItems = {};
    const finalItems = [];

    // Only process items if itemsTotal is a valid array and not empty
    if (Array.isArray(itemsTotal) && itemsTotal.length > 0) {
      // Group items by name
      itemsTotal.forEach(item => {
        if (!item) return; // Skip invalid items
        const name = item.itemName || "Unnamed Item";
        if (!groupedItems[name]) {
          groupedItems[name] = [];
        }
        groupedItems[name].push(item);
      });

      // Create final items array with proper formatting
      Object.keys(groupedItems).sort().forEach(name => {
        const items = groupedItems[name];
        const padLength = items.length > 1 ? String(items.length).length : 0;
        
        items.forEach((item, index) => {
          if (!item) return; // Skip invalid items
          const number = index + 1;
          const paddedNumber = String(number).padStart(padLength, '0');
          finalItems.push({
            ...item,
            displayName: items.length > 1 ? `${name}${paddedNumber}` : name,
            sortKey: items.length > 1 ? `${name}${paddedNumber}` : name,
            dimensions: `${item.x}L × ${item.y}W × ${item.z}H`
          });
        });
      });

      // Sort final items
      finalItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }

    return (
      <Modal
        visible={isLegendVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => this.setState({ isLegendVisible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.legendTitle}>Legend</Text>
            <ScrollView style={styles.legendScrollView}>
              {finalItems.length > 0 ? (
                finalItems.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={styles.legendItemLeft}>
                      <View
                        style={[styles.colorBox, { backgroundColor: item.color }]}
                      />
                      <Text style={styles.legendText}>
                        {item.displayName}
                      </Text>
                    </View>
                    <View style={styles.dimensionsContainer}>
                      <Text style={styles.dimensionsText}>
                        {item.dimensions}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noItemsText}>No items to display</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => this.setState({ isLegendVisible: false })}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  render() {
    const { width, height } = this.state.dimensions;
    const glViewHeight = height * 0.6; // 60% of screen height
    const { selectedBox, selectedCarrier, isBoxCollapsed } = this.state;
    const { route } = this.props;
    const isFromTestPage = route.params?.isFromTestPage;
    const testPageCarrier = route.params?.testPageCarrier;

    const carriers = isFromTestPage ? 
      [testPageCarrier] : 
      ['No Carrier', 'USPS', 'FedEx', 'UPS'];

    if (!selectedBox || !selectedBox.dimensions) {
      return <Text style={styles.noBoxText}>No box selected</Text>;
    }

    return (
      <View 
        style={[styles.container]} 
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          this.setState({ dimensions: { width, height } });
        }}
      >
        <View style={[styles.topContainer, isBoxCollapsed && styles.collapsedTopContainer]}>
          <View style={styles.boxWrapper}>
            <View style={[styles.boxDimensionsContainer, isBoxCollapsed && styles.collapsedBox]}>
              <View style={styles.boxHeaderContainer}>
                <View style={styles.headerPlaceholder} />
                <Text style={styles.boxSubtitle}>For {this.props.route.params.packageName || "This Package"}:</Text>
                <TouchableOpacity
                  style={styles.collapseButton}
                  onPress={this.toggleBoxCollapse}
                >
                  <AntDesign
                    name={isBoxCollapsed ? "plus" : "minus"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <Animated.View
                style={[
                  styles.boxContent,
                  {
                    opacity: this.state.boxContentHeight,
                    maxHeight: this.state.boxContentHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 500],
                    }),
                  },
                ]}
              >
                
                <Text style={styles.boxDetails}>
                  {selectedBox.dimensions[0]}L x {selectedBox.dimensions[1]}W x{" "}
                  {selectedBox.dimensions[2]}H
                </Text>
                <Text style={styles.text}>{selectedBox.finalBoxType}</Text>
                <PriceText carrier={selectedCarrier} priceText={selectedBox.priceText} />
                <View style={styles.carrierDropdownContainer}>
                  <Dropdown
                    style={styles.input}
                    data={carrierData}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Carrier"
                    value={selectedCarrier}
                    onChange={(item) => this.updateVisualsBasedOnCarrier(item.value)}
                    renderLeftIcon={() => (
                      <AntDesign
                        style={styles.icon}
                        color="black"
                        name="Safety"
                        size={20}
                      />
                    )}
                    renderRightIcon={() => (
                      <AntDesign
                        style={styles.icon}
                        color="black"
                        name="down"
                        size={16}
                      />
                    )}
                  />
                </View>
                {!isBoxCollapsed && (
                  <TouchableOpacity
                    style={styles.legendButton}
                    onPress={() => this.setState({ isLegendVisible: true })}
                  >
                    <AntDesign 
                      name="infocirlceo" 
                      size={14} 
                      color="#666" 
                      style={styles.legendIcon}
                    />
                    <Text style={styles.legendButtonText}>Legend</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
              {isBoxCollapsed && (
                <TouchableOpacity
                  style={[styles.legendButton, styles.legendButtonCollapsed]}
                  onPress={() => this.setState({ isLegendVisible: true })}
                >
                  <AntDesign 
                    name="infocirlceo" 
                    size={14} 
                    color="#666" 
                    style={styles.legendIcon}
                  />
                  <Text style={styles.legendButtonText}>Legend</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        <Animated.View 
          style={[
            styles.glViewContainer,
            {
              flex: 1,
              height: glViewHeight,
              minHeight: 300,
              marginTop: isBoxCollapsed ? 40 : 2,
              marginBottom: 40,
            }
          ]}
        >
          <GLView
            {...this.panResponder.panHandlers}
            style={{
              width: '100%',
              height: '100%',
            }}
            onContextCreate={this._onGLContextCreate}
          />
        </Animated.View>

        <View style={{
          position: 'absolute',
          bottom: height * 0.18,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          backgroundColor: 'transparent',
          height: 40,
          zIndex: 999,
          ...(Platform.OS === 'android' ? { elevation: 1 } : { })
        }}>
          <Slider
            key={Platform.OS === 'android' ? this.state.sliderKey : undefined}
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={Math.PI}
            step={Platform.OS === 'android' ? 0.05 : 0.01}
            value={Platform.OS === 'ios' ? this.state.sliderValue : this.rotationAnim._value}
            onValueChange={this.handleRotationChange}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#B4B4B4"
            thumbTintColor="#007AFF"
          />
        </View>
        {this.renderLegendModal()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topContainer: {
    paddingHorizontal: 10,
    paddingTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  glViewContainer: {
    height: 460,
    marginTop: 2,
    marginBottom: 10,
  },
  glView: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#fff",
  },
  sliderContainer: {
    height: 40,
    paddingHorizontal: 30,
    marginBottom: 10,
    marginTop: 10,
    justifyContent: 'center',
  },
  boxDimensionsContainer: {
    padding: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    width: '90%',
    alignSelf: 'center',
  },
  boxHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    paddingHorizontal: 5,
    width: "100%",
  },
  headerPlaceholder: {
    width: 30,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  collapseButton: {
    padding: 3,
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  boxContent: {
    overflow: "hidden",
  },
  boxSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    textAlign: "center",
  },
  boxDetails: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  carrierDropdownContainer: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  input: {
    width: 160,
    height: 32,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 5,
  },
  noBoxText: {
    fontSize: 16,
    color: "#f00",
    textAlign: "center",
    margin: 20,
  },
  legendButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    alignSelf: 'center',
    width: 85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  legendButtonCollapsed: {
    marginTop: 8,
    alignSelf: 'center',
  },
  legendButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },
  legendIcon: {
    marginRight: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  legendScrollView: {
    marginVertical: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  legendItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  legendText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dimensionsContainer: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  dimensionsText: {
    fontSize: 14,
    color: "#666",
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  closeButton: {
    backgroundColor: "#3B82F6",
    width: 120,
    height: 40,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  collapsedBox: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  collapsedTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
  },
  boxWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline'
  },
  noItemsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
});