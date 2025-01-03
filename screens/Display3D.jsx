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
import { createBoxMesh, setupScene } from "../utils/renderUtils";
import { RENDER_CONFIG } from "../utils/renderConfig";
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
    
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
    });

    // Pre-create scene using shared utility
    this.scene = setupScene();

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
      mainContentMargin: new Animated.Value(220),
      sliderKey: 0,
      sliderValue: 0,
      dimensions: {
        width: 0,
        height: 0,
      },
      currentRotation: 0,
      cameraPosition: { x: -1.2, y: 0.5, z: 5 },
      expandedItems: {},
    };
    // Initialize animations object outside of state
    this.animations = {};
  }

  updateRotation = (value) => {
    if (!this.cube || !this.scene) return;
    
    this.cube.rotation.y = value;
    
    if (this.state.box && Array.isArray(this.state.itemsTotal)) {
      const scale = getScale(this.state.box);
      const baseMovement = this.state.box.y / 10;
      
      let movementMultiplier;
      if (scale === 6) {
        const boxHeight = this.state.box.y;
        if (boxHeight <= 6) {
          movementMultiplier = 3.0;
        } else if (boxHeight <= 8) {
          movementMultiplier = 2.5;
        } else {
          movementMultiplier = 2.0;
        }
      } else {
        movementMultiplier = 1.5;
      }
      
      const maxMovement = baseMovement * movementMultiplier;
      
      this.state.itemsTotal.forEach((item) => {
        if (item?.dis?.position && item.pos) {
          item.dis.position.y = Math.sin(value) * maxMovement + item.pos[1] / scale;
        }
      });
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  handleRotationChange = (value) => {
    if (Platform.OS === 'ios') {
      this.setState({ 
        sliderValue: value,
        currentRotation: value 
      }, () => {
        this.updateRotation(value);
      });
    } else {
      this.updateRotation(value);
    }
  };

  animate = () => {
    if (!this.state.gl) return;

    const animate = () => {
      if (!this.state.gl || !this.camera || !this.scene || !this.renderer) {
        this.animationFrameId = requestAnimationFrame(animate);
        return;
      }

      if (this.state.userInteracted) {
        const boxRotationY = this.state.currentRotation;
        const { theta, phi } = this.state;
        
        // Cache calculations to avoid recomputing
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const thetaRotation = theta + boxRotationY;
        
        this.camera.position.x = 5 * sinPhi * Math.cos(thetaRotation);
        this.camera.position.y = 5 * cosPhi;
        this.camera.position.z = 5 * sinPhi * Math.sin(thetaRotation);
        this.camera.lookAt(0, 0, 0);
      } else {
        const { x, y, z } = this.state.cameraPosition;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
      }

      this.renderer.render(this.scene, this.camera);
      this.state.gl.endFrameEXP();
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  };

  handlePanResponderMove = (event, gestureState) => {
    const { dx, dy } = gestureState;
    this.setState(prevState => {
      return {
        theta: prevState.theta - dx * 0.001,
        phi: Math.max(0.1, Math.min(Math.PI - 0.1, prevState.phi - dy * 0.001)),
        userInteracted: true
      };
    });
  };

  componentWillUnmount() {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
    }
    if (this.focusListener) {
      this.focusListener();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Clean up THREE.js resources
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      this.scene = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.camera) {
      this.camera = null;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update if these specific states change
    return (
      this.state.selectedCarrier !== nextState.selectedCarrier ||
      this.state.sliderValue !== nextState.sliderValue ||
      this.state.currentRotation !== nextState.currentRotation ||
      this.state.isBoxCollapsed !== nextState.isBoxCollapsed ||
      this.state.isLegendVisible !== nextState.isLegendVisible ||
      JSON.stringify(this.state.itemsTotal) !== JSON.stringify(nextState.itemsTotal) ||
      JSON.stringify(this.state.selectedBox) !== JSON.stringify(nextState.selectedBox)
    );
  }

  _onGLContextCreate = async (gl) => {
    const { box } = this.state;
    
    if (!this.camera) {
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
    }

    if (!this.renderer) {
      this.renderer = new Renderer({ gl });
      this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

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
    const geometry = new THREE.BoxGeometry(
      box.x / scale,
      box.y / scale,
      box.z / scale
    );
    const material = new THREE.MeshBasicMaterial(RENDER_CONFIG.box.material);
    const cube = new THREE.Mesh(geometry, material);

    // Create wireframe
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial(RENDER_CONFIG.box.wireframe);
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

  resetSlider = () => {
    // Reset both animation value and user interaction state
    this.setState({ userInteracted: false, currentRotation: 0 });
  };

  updateVisualsBasedOnCarrier = (carrier) => {
    // Reset animation value
    this.resetSlider();
    
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
          value={this.state.currentRotation}
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
  
    Animated.timing(this.state.boxContentHeight, {
      toValue: newState ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  
    this.setState({ isBoxCollapsed: newState });
  };

  toggleItemExpansion = (itemName) => {
    console.log('Toggling item:', itemName);
    
    // Initialize animation if it doesn't exist
    if (!this.animations[itemName]) {
      this.animations[itemName] = new Animated.Value(0);
    }

    const willExpand = !this.state.expandedItems[itemName];
    
    this.setState(prevState => ({
      expandedItems: {
        ...prevState.expandedItems,
        [itemName]: willExpand
      }
    }));

    Animated.timing(this.animations[itemName], {
      toValue: willExpand ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  };

  initializeAnimations = (items) => {
    // Reset animations
    this.animations = {};
    
    // Initialize animation for each parent item
    items.forEach(item => {
      if (item.isParent) {
        this.animations[item.displayName] = new Animated.Value(0);
      }
    });
  };

  toggleLegend = () => {
    this.setState(prevState => ({
      isLegendVisible: !prevState.isLegendVisible,
      expandedItems: {} // Reset expanded state when closing
    }));
  };

  calculateModalHeight = (items) => {
    // Base height for header and close button
    const baseHeight = 150;
    // Height per item and child item
    const heightPerItem = 60;
    const heightPerChildItem = 40;
    const maxHeight = '70%';
    const minHeight = '25%';
    
    let totalHeight = baseHeight;
    
    // Calculate total height including expanded items
    items.forEach(item => {
      totalHeight += heightPerItem; // Add height for the main item
      
      // If item has children (quantity > 1), add their heights
      if (item.childItems && item.childItems.length > 0) {
        // Only add child heights if the item is expanded
        if (this.state.expandedItems[item.displayName]) {
          // Add height for each child item, capped at a reasonable amount
          const childrenHeight = Math.min(item.childItems.length * heightPerChildItem, 200);
          totalHeight += childrenHeight;
        }
      }
    });
    
    const viewportHeight = Dimensions.get('window').height;
    const maxHeightPixels = (parseInt(maxHeight) / 100) * viewportHeight;
    const minHeightPixels = (parseInt(minHeight) / 100) * viewportHeight;
    
    // Clamp the height between min and max
    const clampedHeight = Math.max(minHeightPixels, Math.min(totalHeight, maxHeightPixels));
    
    // Convert back to percentage
    return `${Math.round((clampedHeight / viewportHeight) * 100)}%`;
  }

  renderLegendModal = () => {
    const { itemsTotal, isLegendVisible, expandedItems } = this.state;

    if (!isLegendVisible) return null;

    // Initialize empty objects/arrays
    const groupedItems = {};
    const finalItems = [];
    let totalItemCount = 0;

    // Group items by base name and parent ID
    itemsTotal.forEach(item => {
      if (!item) return;
      totalItemCount++;
      const name = item.itemName || "Unnamed Item";
      const baseKey = name.replace(/\s+\d+$/, ''); // Remove trailing numbers
      
      if (!groupedItems[baseKey]) {
        groupedItems[baseKey] = {
          items: [],
          baseItem: null
        };
      }
      
      // If this is the original item (no number suffix)
      if (name === baseKey) {
        groupedItems[baseKey].baseItem = item;
      }
      
      groupedItems[baseKey].items.push({
        ...item,
        displayName: name,
        sortKey: baseKey
      });
    });

    // Create final items with proper grouping
    Object.entries(groupedItems).forEach(([baseKey, group]) => {
      if (group.items.length === 1) {
        // Single item
        const item = group.items[0];
        finalItems.push({
          ...item,
          displayName: baseKey,
          sortKey: baseKey,
          x: item.x,
          y: item.y,
          z: item.z,
        });
      } else {
        // Multiple items - create parent item
        const baseItem = group.baseItem || group.items[0];
        finalItems.push({
          displayName: baseKey,
          isParent: true,
          childItems: group.items.map((item, index) => ({
            ...item,
            displayName: baseKey,
            sortKey: `${baseKey}_${index}`,
          })),
          colors: [...new Set(group.items.map(item => item.color))],
          sortKey: baseKey,
          x: baseItem.x,
          y: baseItem.y,
          z: baseItem.z,
        });
      }
    });

    // Sort items alphabetically
    finalItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Initialize animations for all items
    this.initializeAnimations(finalItems);

    return (
      <Modal
        transparent={true}
        visible={isLegendVisible}
        onRequestClose={this.toggleLegend}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: this.calculateModalHeight(finalItems) }]}>
            <View style={styles.legendHeader}>
              <Text style={styles.legendTitle}>Legend</Text>
              <Text style={styles.totalItemsText}>
                {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Total Items'}
              </Text>
            </View>
            <ScrollView style={styles.legendScrollView}>
              {finalItems.length > 0 ? (
                finalItems.map((item, index) => (
                  <View key={index}>
                    <TouchableOpacity
                      style={[
                        styles.legendItem, 
                        item.isParent && styles.legendItemParent,
                        item.childItems && item.childItems.length > 0 && !item.isParent && styles.legendItemWithBorder
                      ]}
                      onPress={() => {
                        if (item.isParent) {
                          this.toggleItemExpansion(item.displayName);
                        }
                      }}
                      activeOpacity={item.isParent ? 0.6 : 1}
                    >
                      <View style={styles.legendItemLeft}>
                        {item.isParent ? (
                          <View style={styles.multiColorBoxContainer}>
                            {this.renderMultiColorBox(item.colors)}
                            <Text style={styles.itemCount}>
                              {item.childItems.length}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.colorBox}>
                            <View 
                              style={[
                                styles.colorBoxInner,
                                { backgroundColor: item.color }
                              ]}
                            />
                          </View>
                        )}
                        <Text style={styles.legendText}>
                          {item.displayName}
                        </Text>
                        <View style={styles.dimensionsContainer}>
                          <Text style={styles.dimensionsText}>
                            {`${item.x}L × ${item.y}W × ${item.z}H`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {item.isParent && (
                      <Animated.View 
                        style={[
                          styles.childItemsContainer,
                          {
                            maxHeight: this.animations[item.displayName]?.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1000]
                            }) || 0,
                            opacity: this.animations[item.displayName]?.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, 0, 1]
                            }) || 0
                          }
                        ]}
                      >
                        <ScrollView style={styles.childItemsScrollView}>
                          {item.childItems.map((childItem, childIndex) => (
                            <View key={childIndex} style={styles.childItem}>
                              <View style={styles.childColorBox}>
                                <View 
                                  style={[
                                    styles.childColorInner,
                                    { backgroundColor: childItem.color }
                                  ]}
                                />
                              </View>
                              <Text style={styles.childItemText}>
                                {childItem.displayName}
                                <Text style={styles.childItemNumber}>
                                  {` #${(childIndex + 1).toString().padStart(2, '0')}`}
                                </Text>
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </Animated.View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noItemsText}>No items to display</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={this.toggleLegend}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  renderMultiColorBox = (colors) => {
    const uniqueColors = [...new Set(colors)];
    const numColors = Math.min(uniqueColors.length, colors.length);
    const displayColors = uniqueColors.slice(0, numColors);
    
    return (
      <View style={styles.multiColorBox}>
        {displayColors.map((color, index) => (
          <View
            key={index}
            style={[
              styles.multiColorSection,
              {
                backgroundColor: color,
                left: `${(index / displayColors.length) * 100}%`,
                width: `${100 / displayColors.length}%`,
                height: '100%'
              }
            ]}
          />
        ))}
      </View>
    );
  }

  getMemoizedCarrierData = () => {
    if (this.props.route.params?.isFromTestPage) {
      return [this.props.route.params?.testPageCarrier];
    }
    return ['No Carrier', 'USPS', 'FedEx', 'UPS'];
  };

  render() {
    const { selectedBox, selectedCarrier, isBoxCollapsed } = this.state;
    const carriers = this.getMemoizedCarrierData();

    if (!selectedBox || !selectedBox.dimensions) {
      return <Text style={styles.noBoxText}>No box selected</Text>;
    }

    return (
      <View 
        style={[styles.container]} 
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          if (width !== this.state.dimensions.width || 
              height !== this.state.dimensions.height) {
            this.setState({ dimensions: { width, height } });
          }
        }}
      >
        <View style={styles.fixedContent}>
          <View style={styles.glViewWrapper}>
            <GLView
              {...this.panResponder.panHandlers}
              style={styles.glView}
              onContextCreate={this._onGLContextCreate}
            />
          </View>
          <View style={styles.sliderContainer}>
            <Slider
              key={Platform.OS === 'android' ? this.state.sliderKey : undefined}
              style={styles.slider}
              minimumValue={0}
              maximumValue={Math.PI}
              step={Platform.OS === 'android' ? 0.05 : 0.01}
              value={this.state.currentRotation}
              onValueChange={this.handleRotationChange}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#B4B4B4"
              thumbTintColor="#007AFF"
            />
          </View>
        </View>
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
                    height: this.state.boxContentHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 140],
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
                    onPress={() => this.toggleLegend()}
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
                  onPress={() => this.toggleLegend()}
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
  fixedContent: {
    position: 'absolute',
    top: 220,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  glViewWrapper: {
    height: 460,
    width: '100%',
  },
  glView: {
    flex: 1,
  },
  sliderContainer: {
    height: 40,
    paddingHorizontal: 30,
    marginBottom: 10,
    marginTop: -10,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    transform: Platform.OS === 'android' ? [{ scale: 1.2 }] : [],
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 12,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: '#fff',
  },
  collapsedTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
  },
  glViewContainer: {
    marginBottom: 10,
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
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 2,
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 8,
    paddingRight: 16,
  },
  legendTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
  },
  totalItemsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  legendScrollView: {
    maxHeight: '70%',
  },
  legendItemsContainer: {
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  legendItemParent: {
    backgroundColor: '#F7FAFC',
  },
  legendItemWithBorder: {
    borderLeftWidth: 3,
    borderLeftColor: '#4A5568',
  },
  legendItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
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
  multiColorBoxContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    marginRight: 12,
  },
  multiColorBox: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  multiColorSection: {
    position: 'absolute',
    top: 0,
  },
  itemCount: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#4A5568',
    color: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    overflow: 'hidden',
  },
  itemCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  childItemsContainer: {
    overflow: 'hidden',
  },
  childItemsScrollView: {
    paddingLeft: 32,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  childColorBox: {
    width: 20,
    height: 20,
    marginRight: 12,
    borderRadius: 4,
    padding: 2,
    backgroundColor: '#E2E8F0',
  },
  childColorInner: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  childItemText: {
    fontSize: 14,
    color: '#4A5568',
  },
  childItemNumber: {
    fontSize: 13,
    color: '#718096',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  colorBox: {
    width: 24,
    height: 24,
    marginRight: 12,
    borderRadius: 4,
    padding: 2,
    backgroundColor: '#E2E8F0',
  },
  colorBoxInner: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  dimensionsContainer: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  dimensionsText: {
    fontSize: 14,
    color: '#4A5568',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});