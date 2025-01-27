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
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { pack, createDisplay } from "../packing_algo/packing";
import { isSpecialSize, getScale } from "../utils/boxSizes";
import { setupScene, setupCamera, setupRenderer, createBoxMesh } from "../utils/renderUtils";
import { RENDER_CONFIG } from "../utils/renderConfig";
import Slider from "@react-native-community/slider";
import { scaleWidth, scaleHeight, getScaleFactors } from '../utils/screenScaling';
import memoize from 'memoize-one';

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
    
    // Pre-bind methods to avoid recreating functions in render
    this.handlePanResponderMove = this.handlePanResponderMove.bind(this);
    this.handlePanResponderRelease = this.handlePanResponderRelease.bind(this);
    this._onGLContextCreate = this._onGLContextCreate.bind(this);
    this.animate = this.animate.bind(this);
    this.handleRotationChange = this.handleRotationChange.bind(this);
    this.handleSlidingStart = this.handleSlidingStart.bind(this);
    this.handleSlidingComplete = this.handleSlidingComplete.bind(this);
    this.updateRotation = this.updateRotation.bind(this);
    this.handleVisualize = this.handleVisualize.bind(this);
    this.updateVisualsBasedOnCarrier = this.updateVisualsBasedOnCarrier.bind(this);
    this.resetSlider = this.resetSlider.bind(this);
    this.addBoxToScene = this.addBoxToScene.bind(this);
    this.initialize3DScene = this.initialize3DScene.bind(this);
    
    // Cache frequently accessed values
    this._carrierData = null;
    this._lastDimensions = null;
    this._lastBoxScale = null;
    this.isUnmounting = false;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    
    // Initialize PanResponder once with optimized handlers
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderRelease,
    });
    
    // Pre-create and memoize scene
    this.scene = setupScene();
    
    // Animation properties
    this.animationStartTime = 0;
    this.isAnimating = false;
    this.boxMesh = null;
    this.frameId = null;

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
        width: scaleWidth(393),
        height: scaleHeight(852)
      },
      currentRotation: 0,
      cameraPosition: RENDER_CONFIG.camera.initialPosition,
      expandedItems: {},
      isTransitioning: false,
      isSliding: false
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
      const progress = Math.min(elapsed / RENDER_CONFIG.box.animation.duration, 1);
      
      if (progress <= 0.5) {
        const fadeOutProgress = progress * 2;
        const scale = RENDER_CONFIG.box.animation.scale.max - 
          ((RENDER_CONFIG.box.animation.scale.max - RENDER_CONFIG.box.animation.scale.min) * fadeOutProgress);
        const opacity = 1 - fadeOutProgress;
        const rotation = Math.PI * fadeOutProgress;

        this.boxMesh.scale.setScalar(scale);
        this.boxMesh.rotation.y = rotation;
        
        materials.forEach(material => {
          material.opacity = opacity;
        });
      } else {
        const fadeInProgress = (progress - 0.5) * 2;
        const scale = RENDER_CONFIG.box.animation.scale.min + 
          ((RENDER_CONFIG.box.animation.scale.max - RENDER_CONFIG.box.animation.scale.min) * fadeInProgress);
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
    if (carrier === this.state.selectedCarrier) return;
    
    this.setState({ isTransitioning: true }, () => {
      this.animateCarrierTransition(() => {
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
      const scale = this.getBoxScale(this.state.box);
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
      requestAnimationFrame(() => {
        this.setState({ 
          sliderValue: value,
          currentRotation: value 
        }, () => {
          this.updateRotation(value);
        });
      });
    } else {
      if (this.state.isSliding) {
        this.updateRotation(value);
      }
    }
  };

  handleSlidingStart = () => {
    if (Platform.OS === 'android') {
      this.setState({ isSliding: true });
    }
  };

  handleSlidingComplete = (value) => {
    if (Platform.OS === 'android') {
      this.setState({ 
        isSliding: false,
        currentRotation: value,
        sliderValue: value
      });
    }
  };

  handlePanResponderMove = (event, gestureState) => {
    const { dx, dy } = gestureState;
    this.setState(prevState => ({
      theta: prevState.theta - dx * 0.001,
      phi: Math.max(0.1, Math.min(Math.PI - 0.1, prevState.phi - dy * 0.001)),
      userInteracted: true
    }));
  };

  handlePanResponderRelease = (event, gestureState) => {
    // Do nothing
  };

  componentWillUnmount() {
    this.isUnmounting = true;
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
    }
    if (this.focusListener) {
      this.focusListener();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Enhanced cleanup for THREE.js resources
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              if (material.map) material.map.dispose();
              material.dispose();
            });
          } else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        }
        if (object.texture) {
          object.texture.dispose();
        }
      });
      this.scene = null;
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }
    
    if (this.camera) {
      this.camera = null;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Optimize re-renders by checking specific state changes
    return (
      this.state.selectedCarrier !== nextState.selectedCarrier ||
      this.state.sliderValue !== nextState.sliderValue ||
      this.state.currentRotation !== nextState.currentRotation ||
      this.state.isBoxCollapsed !== nextState.isBoxCollapsed ||
      this.state.isLegendVisible !== nextState.isLegendVisible ||
      this.state.gl !== nextState.gl ||
      this.state.userInteracted !== nextState.userInteracted ||
      this.state.isTransitioning !== nextState.isTransitioning ||
      JSON.stringify(this.state.itemsTotal) !== JSON.stringify(nextState.itemsTotal) ||
      JSON.stringify(this.state.selectedBox) !== JSON.stringify(nextState.selectedBox) ||
      JSON.stringify(this.state.dimensions) !== JSON.stringify(nextState.dimensions) ||
      JSON.stringify(this.state.expandedItems) !== JSON.stringify(nextState.expandedItems)
    );
  }

  _onGLContextCreate = async (gl) => {
    const { box } = this.state;
    
    if (!this.camera) {
      const specialSize = isSpecialSize(box);
      this.camera = setupCamera(gl, specialSize);
    }

    if (!this.renderer) {
      this.renderer = setupRenderer(gl);
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

    const scale = this.getBoxScale(this.state.box);
    this.cube = createBoxMesh(this.state.box, scale);
    this.boxMesh = this.cube;

    if (this.scene && this.cube) {
      this.scene.add(this.cube);
      
      // Create items
      if (this.state.itemsTotal.length > 0) {
        const displayItems = createDisplay(this.state.box, scale);
        displayItems.forEach(item => {
          if (item.dis) {
            this.cube.add(item.dis);
          }
        });
        this.setState({ itemsTotal: displayItems });
      }
    }
  };

  initialize3DScene = () => {
    const { box, gl } = this.state;
    if (!box || !gl) return;

    // Ensure box and items are added after scene is fully initialized
    this.addBoxToScene();

    this.animate();
  };

  createBoxMesh = (box, scale) => {
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

    return cube;
  };

  onCarrierChange = (packedResult) => {
    if (!packedResult) {
      console.error("No packing result received");
      return;
    }

    const scale = this.getBoxScale(packedResult);
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
        itemsTotal: createDisplay(packedResult, this.getBoxScale(packedResult)),
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
    if (!this.state.gl || !this.camera || !this.scene || !this.renderer || this.isUnmounting) {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      return;
    }

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    
    // Limit to ~60 FPS
    if (elapsed > 16) {
      this.lastFrameTime = now;
      this.frameCount++;

      if (this.state.userInteracted) {
        const boxRotationY = this.state.currentRotation;
        const { theta, phi } = this.state;
        
        // Cache math calculations
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
    }
    
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  renderCustomSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Slider
          key={Platform.OS === 'android' ? this.state.sliderKey : undefined}
          style={[
            styles.slider,
            Platform.OS === 'android' && {
              height: 40,
              padding: 10,
            }
          ]}
          minimumValue={0}
          maximumValue={Math.PI}
          step={Platform.OS === 'android' ? 0.05 : 0.01}
          value={this.state.currentRotation}
          onValueChange={this.handleRotationChange}
          onSlidingStart={this.handleSlidingStart}
          onSlidingComplete={this.handleSlidingComplete}
          minimumTrackTintColor="#4A90E2"
          maximumTrackTintColor="rgba(74, 144, 226, 0.2)"
          thumbTintColor="#4A90E2"
          inverted={Platform.OS === 'ios'}
          {...(Platform.OS === 'android' ? {
            thumbStyle: {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#4A90E2',
            },
            hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
            touchSlop: 0
          } : {})}
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
      duration: 250,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease)
    }).start();
  };

  initializeAnimations = (items) => {
    items.forEach(item => {
      if (item.isParent && !this.animations[item.displayName]) {
        this.animations[item.displayName] = new Animated.Value(
          this.state.expandedItems[item.displayName] ? 1 : 0
        );
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

  calculateVolume = (l, w, h) => {
    const length = parseFloat(l);
    const width = parseFloat(w);
    const height = parseFloat(h);
    
    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      console.log('Invalid dimensions:', { l, w, h });
      return 0;
    }
    
    return length * width * height;
  };

  getVolumeInfo = memoize((selectedBox, itemsTotal) => {
    if (!selectedBox || !selectedBox.dimensions) {
      return { totalVolume: 0, usedVolume: 0 };
    }

    const boxDims = selectedBox.dimensions;
    const totalVolume = this.calculateVolume(boxDims[0], boxDims[1], boxDims[2]);
    
    let usedVolume = 0;
    if (Array.isArray(itemsTotal)) {
      usedVolume = itemsTotal.reduce((acc, item) => {
        return acc + this.calculateVolume(item.x, item.y, item.z);
      }, 0);
    }

    return { totalVolume, usedVolume };
  });

  renderVolumeInfo = () => {
    const { totalVolume, usedVolume } = this.getVolumeInfo(this.state.selectedBox, this.state.itemsTotal);
    const volumePercentage = totalVolume > 0 ? ((usedVolume / totalVolume) * 100).toFixed(1) : 0;
    const percentageColor = volumePercentage > 95 ? '#4CAF50' :  // Dark green for excellent utilization
                          volumePercentage > 85 ? '#66BB6A' :  // Light green for very good utilization
                          volumePercentage > 70 ? '#81C784' :  // Lighter green for good utilization
                          volumePercentage > 50 ? '#FFA726' :  // Orange for medium utilization
                          volumePercentage > 40 ? '#DAA520' :  // Goldenrod (darker yellow) for low-medium utilization
                          '#FF7043';  // Red-orange for low utilization

    return (
      <View style={styles.volumeInfo}>
        <View style={styles.volumeRow}>
          <View style={styles.volumeItem}>
            <Text style={styles.volumeLabel}>Used Volume</Text>
            <Text style={styles.volumeValue}>
              {!isNaN(usedVolume) ? usedVolume.toFixed(2) : '0.00'}
              <Text style={styles.volumeUnit}> in³</Text>
            </Text>
          </View>
          <View style={styles.volumeDivider} />
          <View style={styles.volumeItem}>
            <Text style={styles.volumeLabel}>Box Volume</Text>
            <Text style={styles.volumeValue}>
              {!isNaN(totalVolume) ? totalVolume.toFixed(2) : '0.00'}
              <Text style={styles.volumeUnit}> in³</Text>
            </Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(100, volumePercentage)}%`, backgroundColor: percentageColor }]} />
          </View>
          <View style={[styles.percentageContainer, { 
            width: volumePercentage <= 15 ? 'auto' : `${Math.min(100, volumePercentage)}%`,
            left: volumePercentage <= 15 ? 2 : 'auto',
            right: volumePercentage <= 15 ? 'auto' : 0,
            alignItems: volumePercentage <= 15 ? 'flex-start' : 'flex-end'
          }]}>
            <Text style={[styles.percentageText, { 
              color: percentageColor,
              textAlign: volumePercentage <= 15 ? 'left' : 'right'
            }]}>
              {volumePercentage}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
                              outputRange: [0, 500]
                            }) || 0,
                            opacity: this.animations[item.displayName]?.interpolate({
                              inputRange: [0, 0.3, 1],
                              outputRange: [0, 1, 1]
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

  getMemoizedCarrierData = memoize((isFromTestPage, testPageCarrier) => {
    const carriers = isFromTestPage 
      ? [testPageCarrier]
      : ['No Carrier', 'USPS', 'FedEx', 'UPS'];
      
    return carriers.map(carrier => ({
      label: carrier,
      value: carrier
    }));
  });

  getBoxScale = (box) => {
    if (!box) return 1;
    
    const boxKey = `${box.x}-${box.y}-${box.z}`;
    if (this._lastBoxScale?.key === boxKey) {
      return this._lastBoxScale.scale;
    }
    
    const scale = getScale(box);
    this._lastBoxScale = { key: boxKey, scale };
    return scale;
  };

  handleLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    if (this._lastDimensions?.width !== width || 
        this._lastDimensions?.height !== height) {
      this._lastDimensions = { width, height };
      this.setState({ dimensions: { width, height } });
    }
  };

  render() {
    const { selectedBox, selectedCarrier, isBoxCollapsed } = this.state;
    const carriers = this.getMemoizedCarrierData(
      this.props.route.params?.isFromTestPage,
      this.props.route.params?.testPageCarrier
    );

    if (!selectedBox || !selectedBox.dimensions) {
      return <Text style={styles.noBoxText}>No box selected</Text>;
    }

    return (
      <View 
        style={[styles.container]} 
        onLayout={(event) => {
          this.handleLayout(event);
        }}
      >
        <View style={styles.fixedContent}>
          <View style={styles.glViewWrapper}>
            <GLView
              {...this.panResponder.panHandlers}
              style={styles.glView}
              onContextCreate={this._onGLContextCreate}
            />
            {this.renderVolumeInfo()}
            {this.renderCustomSlider()}
          </View>
        </View>
        <View style={[styles.topContainer, { paddingTop: scaleHeight(15) }, isBoxCollapsed && styles.collapsedTopContainer]}>
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
                    data={carriers}
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
    top: scaleHeight(220),
    left: 0,
    right: 0,
    zIndex: 0,
  },
  glViewWrapper: {
    height: scaleHeight(460),
    width: '100%',
  },
  glView: {
    flex: 1,
  },
  sliderContainer: {
    position: 'absolute',
    right: scaleWidth(20),
    top: '50%',
    transform: [{ translateY: scaleHeight(-100) }],
    height: scaleHeight(159),
    width: scaleWidth(40),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  slider: {
    width: scaleWidth(170),
    height: scaleHeight(5),
    transform: [
      { rotate: '-90deg' },
      Platform.OS === 'android' ? { scale: 1.2 } : null
    ].filter(Boolean),
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: scaleHeight(15),
    paddingHorizontal: scaleWidth(15),
    paddingBottom: scaleHeight(10),
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
  childLegendText: {
    fontSize: 14,
    color: '#4A5568',
  },
  childDimensionsContainer: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  childDimensionsText: {
    fontSize: 14,
    color: '#4A5568',
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
  volumeInfo: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(230, 230, 230, 0.5)',
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  volumeItem: {
    flex: 1,
    alignItems: 'center',
  },
  volumeDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 15,
  },
  volumeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  volumeUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
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
});
