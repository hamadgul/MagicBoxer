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
  Platform
} from "react-native";
import {
  GLView
} from "expo-gl";
import * as THREE from "three";
import { Renderer } from "expo-three";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { pack, createDisplay } from "../packing_algo/packing";
import Slider from "@react-native-community/slider";

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
      sliderValue: 0, // Directly set slider value in state
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
    });

    // Add listener for slider animation
    this.rotationAnim.addListener(({ value }) => {
      if (this.cube && !this.state.userInteracted) {
        this.cube.rotation.y = value;
        const maxMovement = this.state.box ? (this.state.box.y / 10) * 1.5 : 0;
        this.state.itemsTotal.forEach((item) => {
          if (item.dis) {
            item.dis.position.y = Math.sin(value) * maxMovement + item.pos[1];
          }
        });
      }
    });
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

  _onGLContextCreate = (gl) => {
    this.setState({ gl }, () => {
      if (this.state.box) {
        this.initialize3DScene();
      }
    });
  };

  renderLegendModal = () => {
    const { itemsTotal, isLegendVisible } = this.state;

    const groupedItems = {};
    itemsTotal.forEach(item => {
      const name = item.itemName || "Unnamed Item";
      if (!groupedItems[name]) {
        groupedItems[name] = [];
      }
      groupedItems[name].push(item);
    });

    const finalItems = [];
    Object.keys(groupedItems).sort().forEach(name => {
      const items = groupedItems[name];
      const padLength = items.length > 1 ? String(items.length).length : 0;
      
      items.forEach((item, index) => {
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

    finalItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

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
              {finalItems.map((item, index) => (
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
              ))}
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

    const scene = new THREE.Scene();
    const isSpecialSize = (
      (box.x === 12 && box.y === 15.5 && box.z === 3) ||
      (box.x === 17 && box.y === 11 && box.z === 8) ||
      (box.x === 17 && box.y === 17 && box.z === 7) ||
      (box.x === 8 && box.y === 6 && box.z === 4) ||
      (box.x === 16 && box.y === 13 && box.z === 3) ||
      (box.x === 9 && box.y === 6 && box.z === 3) ||
      // General rules for small boxes
      (Math.max(box.x, box.y) <= 9 && Math.min(box.x, box.y, box.z) <= 4) ||
      (Math.min(box.x, box.y, box.z) <= 4 && Math.max(box.x, box.y) >= 8)
    );

    let cameraDistance = isSpecialSize ? 3.5 : 5;
    let fov = isSpecialSize ? 60 : 75;

    const camera = new THREE.PerspectiveCamera(
      fov,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(0, cameraDistance * 0.5, cameraDistance);
    camera.lookAt(0, 0, 0);

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    scene.background = new THREE.Color(0xffffff);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Ensure box and items are added after scene is fully initialized
    this.addBoxToScene();

    this.animate();
  };

  createBox = (box, itemsTotal) => {
    const isSpecialSize = (
      (box.x === 12 && box.y === 15.5 && box.z === 3) ||
      (box.x === 17 && box.y === 11 && box.z === 8) ||
      (box.x === 17 && box.y === 17 && box.z === 7) ||
      (box.x === 8 && box.y === 6 && box.z === 4) ||
      (box.x === 16 && box.y === 13 && box.z === 3) ||
      (box.x === 9 && box.y === 6 && box.z === 3) ||
      // General rules for small boxes
      (Math.max(box.x, box.y) <= 9 && Math.min(box.x, box.y, box.z) <= 4) ||
      (Math.min(box.x, box.y, box.z) <= 4 && Math.max(box.x, box.y) >= 8)
    );

    const scale = isSpecialSize ? 12 : (Math.max(box.x, box.y, box.z) > 15 ? 20 : 10);
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

    itemsTotal.forEach((item) => {
      if (item.dis) cube.add(item.dis);
    });

    return cube;
  };

  onCarrierChange = (packedResult) => {
    if (!packedResult) {
      console.error("No packing result received");
      return;
    }

    const isSpecialSize = (
      (packedResult.x === 12 && packedResult.y === 15.5 && packedResult.z === 3) ||
      (packedResult.x === 17 && packedResult.y === 11 && packedResult.z === 8) ||
      (packedResult.x === 17 && packedResult.y === 17 && packedResult.z === 7) ||
      (packedResult.x === 8 && packedResult.y === 6 && packedResult.z === 4) ||
      (packedResult.x === 16 && packedResult.y === 13 && packedResult.z === 3) ||
      (packedResult.x === 9 && packedResult.y === 6 && packedResult.z === 3) ||
      // General rules for small boxes
      (Math.max(packedResult.x, packedResult.y) <= 9 && Math.min(packedResult.x, packedResult.y, packedResult.z) <= 4) ||
      (Math.min(packedResult.x, packedResult.y, packedResult.z) <= 4 && Math.max(packedResult.x, packedResult.y) >= 8)
    );

    const scale = isSpecialSize ? 12 : (Math.max(packedResult.x, packedResult.y, packedResult.z) > 15 ? 20 : 10);
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
    const { gl, userInteracted } = this.state;
    if (!gl || !this.renderer || !this.scene || !this.camera) return;

    if (userInteracted) {
      // Use gesture-based rotation when user is interacting
      const boxRotationY = this.state.theta;
      this.cube.rotation.y = boxRotationY;
      this.camera.position.x =
        5 *
        Math.sin(this.state.phi) *
        Math.cos(this.state.theta + boxRotationY);
      this.camera.position.y = 5 * Math.cos(this.state.phi);
      this.camera.position.z =
        5 *
        Math.sin(this.state.phi) *
        Math.sin(this.state.theta + boxRotationY);
    } else {
      // Use slider animation when not interacting
      const value = this.rotationAnim._value;
      this.cube.rotation.y = value;
      if (this.state.box) {
        const maxMovement = (this.state.box.y / 10) * 1.5;
        this.state.itemsTotal.forEach((item) => {
          if (item.dis) {
            item.dis.position.y = Math.sin(value) * maxMovement + item.pos[1];
          }
        });
      }
      this.camera.position.set(-1.2, 0.5, 5);
    }
    
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
    gl.endFrameEXP();
  };

  handlePanResponderMove = (event, gestureState) => {
    const { dx, dy } = gestureState;
    this.setState((prevState) => ({
      theta: prevState.theta - dx * 0.001,
      phi: Math.max(0.1, Math.min(Math.PI - 0.1, prevState.phi - dy * 0.001)),
      userInteracted: true
    }));
  };

  handleRotationChange = (value) => {
    // When user touches slider, reset to slider mode
    if (this.state.userInteracted) {
      this.setState({
        userInteracted: false,
        theta: 0,
        phi: Math.PI / 2
      });
    }
    this.rotationAnim.setValue(value);
  };

  resetSlider = () => {
    console.log('Resetting slider animation value to 0'); // Debug log
    
    // Remove any existing listeners
    this.rotationAnim.removeAllListeners();
    
    // Create a new animation value
    this.rotationAnim = new Animated.Value(0);
    
    // Re-add the listener
    this.rotationAnim.addListener(({ value }) => {
      if (this.cube && !this.state.userInteracted) {
        this.cube.rotation.y = value;
        const maxMovement = this.state.box ? (this.state.box.y / 10) * 1.5 : 0;
        this.state.itemsTotal.forEach((item) => {
          if (item.dis) {
            item.dis.position.y = Math.sin(value) * maxMovement + item.pos[1];
          }
        });
      }
    });
    
    // Force update to ensure the new animation value is used
    this.forceUpdate();
    console.log('Animation value after reset:', this.rotationAnim._value); // Debug log
  }

  updateVisualsBasedOnCarrier = (carrier) => {
    console.log(`Switching to carrier: ${carrier}`); // Debug log
    
    // First update the state
    this.setState(
      {
        selectedCarrier: carrier,
        theta: 0,
        phi: Math.PI / 2,
        userInteracted: false,
      },
      () => {
        console.log('State updated.'); // Debug log
        this.handleVisualize();
        
        // Reset the slider after a short delay to ensure state is updated
        setTimeout(() => {
          this.resetSlider();
          console.log('Animation value after delayed reset:', this.rotationAnim._value); // Debug log
        }, 50);
      }
    );
  };

  renderCustomSlider = () => {
    console.log('Rendering slider with animation value:', this.rotationAnim._value); // Debug log
    return (
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={Math.PI}
          step={Platform.OS === 'android' ? 0.02 : 0.01}
          value={this.rotationAnim._value}
          onValueChange={(value) => {
            requestAnimationFrame(() => {
              this.rotationAnim.setValue(value);
              this.handleRotationChange(value);
            });
          }}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#B4B4B4"
          thumbTintColor="#007AFF"
        />
      </View>
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

    this.onCarrierChange(packedResult);
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

  render() {
    const { selectedBox, selectedCarrier, isBoxCollapsed } = this.state;

    if (!selectedBox || !selectedBox.dimensions) {
      return <Text style={styles.noBoxText}>No box selected</Text>;
    }

    const boxDimensions = (
      <View style={[styles.boxDimensionsContainer, isBoxCollapsed && styles.collapsedBox]}>
        <View style={styles.boxHeaderContainer}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.boxTitle}>Optimal Box Size</Text>
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
          <Text style={styles.boxSubtitle}>For {this.props.route.params.packageName || "This Package"}:</Text>
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
    );

    return (
      <View style={styles.container}>
        <View style={[styles.topContainer, isBoxCollapsed && styles.collapsedTopContainer]}>
          <View style={styles.boxWrapper}>
            {boxDimensions}
          </View>
        </View>
        <Animated.View 
          style={[
            styles.glViewContainer,
            {
              height: this.state.glViewHeight,
              marginTop: isBoxCollapsed ? 40 : 2,
            }
          ]}
        >
          <GLView
            {...this.panResponder.panHandlers}
            style={styles.glView}
            onContextCreate={this._onGLContextCreate}
          />
        </Animated.View>
        {this.renderLegendModal()}
        {this.renderCustomSlider()}
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
  },
  glView: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#fff",
  },
  sliderContainer: {
    height: 40,
    paddingHorizontal: 30,
    marginBottom: 30,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    transform: Platform.OS === 'android' ? [{ scale: 1.2 }] : [],
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    height: 32,
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
});