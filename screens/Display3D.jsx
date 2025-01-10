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
  Dimensions,
  Easing
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
import { setupScene } from "../utils/renderUtils";
import { RENDER_CONFIG } from "../utils/renderConfig";
import Slider from "@react-native-community/slider";

// Memoize carrier data to prevent recreation
const carrierData = Object.freeze([
  { label: "No Carrier", value: "No Carrier" },
  { label: "UPS", value: "UPS" },
  { label: "USPS", value: "USPS" },
  { label: "FedEx", value: "FedEx" },
]);

// Memoize URL mappings
const CARRIER_URLS = Object.freeze({
  "Priority Mail": "https://postcalc.usps.com/",
  "FedEx One Rate": "https://www.fedex.com/en-us/online/rating.html#",
  "Flat Rates Start at": "https://wwwapps.ups.com/ctc/request?loc=en_US"
});

// Memoize PriceText component
const PriceText = React.memo(({ carrier, priceText }) => {
  if (!priceText) {
    return <Text style={styles.text}>Price not available</Text>;
  }

  const handlePress = () => {
    const url = Object.entries(CARRIER_URLS).find(([key]) => priceText.includes(key))?.[1];
    if (url) {
      Linking.openURL(url);
    }
  };

  const isClickable = Object.keys(CARRIER_URLS).some(key => priceText.includes(key));

  return isClickable ? (
    <TouchableOpacity onPress={handlePress}>
      <Text style={[styles.text, styles.linkText]}>{priceText}</Text>
    </TouchableOpacity>
  ) : (
    <Text style={styles.text}>{priceText}</Text>
  );
});

export default class Display3D extends Component {
  constructor(props) {
    super(props);
    
    // Memoize PanResponder
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
    });

    // Pre-create and memoize scene
    this.scene = setupScene();
    
    // Memoize animation constants
    this.ANIMATION_DURATION = 600;
    this.ANIMATION_SCALE_MIN = 0.8;
    this.ANIMATION_SCALE_MAX = 1;
    
    // Animation properties
    this.animationStartTime = 0;
    this.isAnimating = false;
    this.boxMesh = null;
    this.frameId = null;

    // Memoize initial camera settings
    this.defaultCameraSettings = {
      normal: { distance: 5, fov: 75 },
      special: { distance: 3.5, fov: 60 }
    };

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
      isTransitioning: false
    };

    this.animations = {};
  }

  animateCarrierTransition = (callback) => {
    if (!this.boxMesh) {
      if (callback) callback();
      return;
    }

    // Cancel any existing animation
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    this.isAnimating = true;
    this.animationStartTime = Date.now();
    
    // Cache materials that need animation
    const materials = [
      this.boxMesh.material,
      ...this.boxMesh.children
        .filter(child => child.material)
        .map(child => child.material)
    ];
    
    materials.forEach(material => {
      material.transparent = true;
    });

    const animate = () => {
      if (!this.isAnimating) return;

      const elapsed = Date.now() - this.animationStartTime;
      const progress = Math.min(elapsed / this.ANIMATION_DURATION, 1);
      
      if (progress <= 0.5) {
        const fadeOutProgress = progress * 2;
        const scale = this.ANIMATION_SCALE_MAX - ((this.ANIMATION_SCALE_MAX - this.ANIMATION_SCALE_MIN) * fadeOutProgress);
        const opacity = 1 - fadeOutProgress;
        const rotation = Math.PI * fadeOutProgress;

        this.boxMesh.scale.setScalar(scale);
        this.boxMesh.rotation.y = rotation;
        
        materials.forEach(material => {
          material.opacity = opacity;
        });
      } else {
        const fadeInProgress = (progress - 0.5) * 2;
        const scale = this.ANIMATION_SCALE_MIN + ((this.ANIMATION_SCALE_MAX - this.ANIMATION_SCALE_MIN) * fadeInProgress);
        const opacity = fadeInProgress;
        const rotation = Math.PI * (1 - fadeInProgress);

        this.boxMesh.scale.setScalar(scale);
        this.boxMesh.rotation.y = rotation;
        
        materials.forEach(material => {
          material.opacity = opacity;
        });
      }

      if (progress >= 1) {
        this.isAnimating = false;
        this.frameId = null;
        if (callback) callback();
        this.setState({ isTransitioning: false });
      } else {
        this.frameId = requestAnimationFrame(animate);
      }
    };

    this.frameId = requestAnimationFrame(animate);
  }

  updateVisualsBasedOnCarrier = (carrier) => {
    this.setState({ isTransitioning: true }, () => {
      // Start transition animation
      this.animateCarrierTransition(() => {
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
      });
    });
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
      const specialSize = isSpecialSize(box);
      const settings = specialSize ? 
        this.defaultCameraSettings.special : 
        this.defaultCameraSettings.normal;

      this.camera = new THREE.PerspectiveCamera(
        settings.fov,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      this.camera.position.set(0, settings.distance * 0.5, settings.distance);
      this.camera.lookAt(0, 0, 0);
    }

    if (!this.renderer) {
      this.renderer = new Renderer({ gl });
      this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      
      // Enable optimizations
      this.renderer.setPixelRatio(1); // Use device pixel ratio
      this.renderer.sortObjects = false; // Disable object sorting if not needed
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
    
    // Create material with original transparency settings
    const material = new THREE.MeshBasicMaterial({
      color: RENDER_CONFIG.box.material.color,
      transparent: RENDER_CONFIG.box.material.transparent,
      opacity: RENDER_CONFIG.box.material.opacity,
      side: THREE.DoubleSide
    });
    
    const cube = new THREE.Mesh(geometry, material);
    this.boxMesh = cube;

    // Create wireframe with original properties
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: RENDER_CONFIG.box.wireframe.color,
      transparent: true,
      opacity: RENDER_CONFIG.box.wireframe.opacity
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    cube.add(wireframe);

    // Create items with the same scale as the box
    if (itemsTotal && itemsTotal.length > 0) {
      const displayItems = createDisplay(box, scale);
      displayItems.forEach(item => {
        if (item.dis) {
          // Keep items fully opaque
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

  handleVisualize = () => {
    const { items, selectedCarrier } = this.state;

    if (items.length === 0) {
      Alert.alert("No Items", "Please add at least one item before packing.");
      return;
    }

    const itemsTotal = items.flatMap((item) =>
      item.replicatedNames.map((replicatedName) => [
        item.itemLength,
        item.itemWidth,
        item.itemHeight,
        item.id,
        selectedCarrier,
        replicatedName.name || item.itemName || "Unnamed Item",
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

  animate = () => {
    if (!this.state.gl || !this.camera || !this.scene || !this.renderer) {
      requestAnimationFrame(this.animate);
      return;
    }

    if (this.state.userInteracted) {
      const boxRotationY = this.state.currentRotation;
      const { theta, phi } = this.state;
      
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const thetaRotation = theta + boxRotationY;
      
      this.camera.position.x = 5 * sinPhi * Math.cos(thetaRotation);
      this.camera.position.y = 5 * cosPhi;
      this.camera.position.z = 5 * sinPhi * Math.sin(thetaRotation);
    } else {
      const { x, y, z } = this.state.cameraPosition;
      this.camera.position.set(x, y, z);
    }

    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
    this.state.gl.endFrameEXP();
    
    requestAnimationFrame(this.animate);
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
      duration: 300,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease)
    }).start(() => {
      // Force modal height recalculation after animation
      this.forceUpdate();
    });
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
    // Base height for header and close button (reduced from 150)
    const baseHeight = 120;
    // Height per item and child item
    const heightPerItem = 60;
    const heightPerChildItem = 40;
    const maxHeight = '80%';
    const minHeight = '25%';
    
    let totalHeight = baseHeight;
    
    // Calculate total height including expanded items
    items.forEach(item => {
      totalHeight += heightPerItem; // Add height for the main item
      
      // If item has children (quantity > 1) and is expanded, add their heights
      if (item.childItems && item.childItems.length > 0 && this.state.expandedItems[item.displayName]) {
        // Calculate child items height with padding
        const childrenHeight = Math.min(item.childItems.length * heightPerChildItem, 300);
        totalHeight += childrenHeight + 10; // Reduced padding from 20 to 10
      }
    });
    
    const viewportHeight = Dimensions.get('window').height;
    const maxHeightPixels = Math.floor((parseInt(maxHeight) / 100) * viewportHeight);
    const minHeightPixels = Math.floor((parseInt(minHeight) / 100) * viewportHeight);
    
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
      
      // Get the full name from the item
      const name = item.itemName;
      const baseKey = name;
      
      if (!groupedItems[baseKey]) {
        groupedItems[baseKey] = {
          items: [],
          baseItem: null
        };
      }
      
      groupedItems[baseKey].items.push({
        ...item,
        displayName: name,
        sortKey: baseKey
      });
    });

    // Convert grouped items to final format
    Object.entries(groupedItems).forEach(([baseKey, group]) => {
      if (group.items.length === 1) {
        // Single item - no need for grouping
        const item = group.items[0];
        finalItems.push({
          ...item,
          displayName: item.displayName,
          sortKey: item.sortKey
        });
      } else {
        // Multiple items - create parent item
        const baseItem = group.baseItem || group.items[0];
        finalItems.push({
          displayName: baseItem.displayName,
          isParent: true,
          childItems: group.items.map((item, index) => ({
            ...item,
            displayName: item.displayName,
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
          <View style={styles.modalContent}>
            <View style={styles.legendHeader}>
              <View style={styles.legendTitleContainer}>
                <Text style={styles.legendTitle}>Legend</Text>
              </View>
              <View style={styles.legendDivider} />
              <View style={styles.totalItemsContainer}>
                <Text style={styles.totalItemsText}>
                  {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Total Items'}
                </Text>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    marginHorizontal: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalInnerContent: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  legendTitleContainer: {
    flex: 1,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  legendDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  totalItemsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  totalItemsText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  legendScrollView: {
    flexGrow: 1,
  },
  legendItemsContainer: {
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
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
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
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
    marginBottom: 10,
  },
  childItemsScrollView: {
    paddingLeft: 20,
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
