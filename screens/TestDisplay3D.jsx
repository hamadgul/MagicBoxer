import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
} from "react-native";
import { GLView } from "expo-gl";
import * as THREE from "three";
import { Renderer } from "expo-three";
import Slider from "@react-native-community/slider";
import { createDisplay } from "../packing_algo/packing";

const PriceText = ({ carrier, priceText }) => {
  if (!priceText) return null;
  return <Text style={styles.text}>{priceText}</Text>;
};

export default class TestDisplay3D extends Component {
  constructor(props) {
    super(props);
    console.log('TestDisplay3D constructor with props:', props.route.params);
    this.rotationAnim = new Animated.Value(0);
    this.glViewHeight = new Animated.Value(460);
    
    // Store 3D objects as instance properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cube = null;

    // Transform items into the format expected by createDisplay
    const transformedItems = props.route.params?.itemsTotal || [];
    console.log('Using transformed items:', transformedItems);

    this.state = {
      theta: 0,
      phi: Math.PI / 2,
      userInteracted: false,
      selectedCarrier: props.route.params?.selectedCarrier || "No Carrier",
      items: props.route.params?.items || [],
      itemsTotal: transformedItems,
      box: props.route.params?.box || null,
      selectedBox: props.route.params?.selectedBox || null,
      gl: null,
      isBoxCollapsed: false,
      boxContentHeight: new Animated.Value(1),
      sliderValue: 0,
    };
    console.log('Initial state:', this.state);

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
    });

    // Add listener for rotation animation
    this.rotationAnim.addListener(({ value }) => {
      if (this.cube && !this.state.userInteracted) {
        this.cube.rotation.y = value;
        const maxMovement = this.state.box ? (this.state.box.y / 10) * 1.5 : 0;
        if (Array.isArray(this.state.itemsTotal)) {
          this.state.itemsTotal.forEach((item) => {
            if (item && item.dis) {
              // Map slider value to sine wave that peaks at slider midpoint
              const normalizedValue = (value / Math.PI) * Math.PI;
              item.dis.position.y = Math.sin(normalizedValue) * maxMovement + item.pos[1];
            }
          });
        }
      }
    });
  }

  componentDidMount() {
    console.log('TestDisplay3D mounted with state:', this.state);
    
    // Force a re-initialization if we have initial data
    if (this.state.box && this.state.itemsTotal) {
      console.log('Has initial data, will initialize scene');
      // Wait for next tick to ensure GL context is ready
      setTimeout(() => {
        if (this.state.gl) {
          this.initialize3DScene();
        }
      }, 0);
    }
  }

  componentWillUnmount() {
    this.rotationAnim.removeAllListeners();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.cube !== this.state.cube) {
      console.log('Cube changed:', !!this.state.cube);
    }

    // Check for navigation state changes
    if (
      JSON.stringify(prevProps.route.params?.items) !==
      JSON.stringify(this.props.route.params?.items)
    ) {
      const transformedItems = this.props.route.params?.itemsTotal || [];

      this.setState({
        items: this.props.route.params?.items || [],
        itemsTotal: transformedItems,
        box: this.props.route.params?.box || null,
        selectedBox: this.props.route.params?.selectedBox || null,
      }, () => {
        if (this.state.gl) {
          this.initialize3DScene();
        }
      });
    }
  }

  handleRotationChange = (value) => {
    // When user touches slider, reset to slider mode
    if (this.state.userInteracted) {
      this.setState({
        userInteracted: false,
        theta: 0,
        phi: Math.PI / 2
      });
    }
    
    // Update rotation value
    this.rotationAnim.setValue(value);
    this.setState({ sliderValue: value });

    // Update cube and items
    if (this.cube) {
      this.cube.rotation.y = value;
      const maxMovement = this.state.box ? (this.state.box.y / 10) * 1.5 : 0;
      if (Array.isArray(this.state.itemsTotal)) {
        this.state.itemsTotal.forEach((item) => {
          if (item && item.dis) {
            // Map slider value to sine wave that peaks at slider midpoint
            const normalizedValue = (value / Math.PI) * Math.PI;
            item.dis.position.y = Math.sin(normalizedValue) * maxMovement + item.pos[1];
          }
        });
      }
    }
  };

  renderCustomSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={Math.PI}
          step={Platform.OS === 'android' ? 0.02 : 0.01}
          value={this.state.sliderValue}
          onValueChange={this.handleRotationChange}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#B4B4B4"
          thumbTintColor="#007AFF"
        />
      </View>
    );
  };

  animate = () => {
    if (!this.renderer || !this.scene || !this.camera) {
      console.error('Missing required render components');
      requestAnimationFrame(this.animate);
      return;
    }

    requestAnimationFrame(this.animate);

    if (!this.state.userInteracted) {
      // Use slider animation when not interacting
      const value = this.state.sliderValue;
      if (this.cube) {
        this.cube.rotation.y = value;
      }
      if (this.state.box) {
        const maxMovement = (this.state.box.y / 10) * 1.5;
        if (Array.isArray(this.state.itemsTotal)) {
          this.state.itemsTotal.forEach((item) => {
            if (item && item.dis) {
              // Map slider value to sine wave that peaks at slider midpoint
              const normalizedValue = (value / Math.PI) * Math.PI;
              item.dis.position.y = Math.sin(normalizedValue) * maxMovement + item.pos[1];
            }
          });
        }
      }
      this.camera.position.set(-1.2, 0.5, 5);
    } else {
      // Use gesture-based rotation when user is interacting
      const boxRotationY = this.state.theta;
      if (this.cube) {
        this.cube.rotation.y = boxRotationY;
      }
      this.camera.position.x = 5 * Math.sin(this.state.phi) * Math.cos(this.state.theta + boxRotationY);
      this.camera.position.y = 5 * Math.cos(this.state.phi);
      this.camera.position.z = 5 * Math.sin(this.state.phi) * Math.sin(this.state.theta + boxRotationY);
    }

    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
    this.state.gl.endFrameEXP();
  };

  handlePanResponderMove = (e, gestureState) => {
    this.setState({ userInteracted: true });
    if (this.cube) {
      this.cube.rotation.y += gestureState.dx * 0.05;
      this.cube.rotation.x += gestureState.dy * 0.05;
    }
  };

  createBox = (box, itemsTotal) => {
    console.log('Creating box with:', { box, itemsTotal });
    const isSpecialSize = (
      // Original special sizes
      (box.x === 12 && box.y === 15.5 && box.z === 3) ||
      (box.x === 17 && box.y === 11 && box.z === 8) ||
      (box.x === 17 && box.y === 17 && box.z === 7) ||
      (box.x === 8 && box.y === 6 && box.z === 4) ||
      (box.x === 16 && box.y === 13 && box.z === 3) ||
      (box.x === 9 && box.y === 6 && box.z === 3) ||
      
      // New special sizes that need magnification
      (Math.abs(box.x - 6.25) < 0.01 && Math.abs(box.y - 3.125) < 0.01 && Math.abs(box.z - 0.5) < 0.01) ||
      (Math.abs(box.x - 6) < 0.01 && Math.abs(box.y - 4) < 0.01 && Math.abs(box.z - 2) < 0.01)
    );

    const scale = isSpecialSize ? 12 : (Math.max(box.x, box.y, box.z) > 15 ? 20 : 10);
    console.log('Using scale:', scale);
    
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

    // Create items
    if (itemsTotal && itemsTotal.length > 0) {
      console.log('Creating items:', itemsTotal);
      
      // Create box object with items in the format expected by createDisplay
      const boxWithItems = {
        x: box.x,
        y: box.y,
        z: box.z,
        type: box.type,
        priceText: box.priceText,
        cx: box.x / 2,
        cy: -box.y / 2,
        cz: box.z / 2,
        items: itemsTotal.map(item => ({
          x: item[0],
          y: item[1],
          z: item[2],
          SKU: item[3],
          itemName: item[5],
          xx: item[0],
          yy: item[1],
          zz: item[2]
        }))
      };

      console.log('Created box with items:', boxWithItems);
      const displayItems = createDisplay(boxWithItems, scale);
      console.log('Display items created:', displayItems);
      
      if (displayItems && displayItems.length > 0) {
        displayItems.forEach(item => {
          if (item.dis) {
            cube.add(item.dis);
            console.log('Added item to cube:', item);
          } else {
            console.warn('Item has no display object:', item);
          }
        });
        this.setState({ itemsTotal: displayItems });
      } else {
        console.warn('No display items created from:', itemsTotal);
      }
    } else {
      console.warn('No items to display');
    }

    return cube;
  };

  _onGLContextCreate = async (gl) => {
    console.log('GL Context Created');
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    const isSpecialSize = (
      // Original special sizes
      (this.state.box.x === 12 && this.state.box.y === 15.5 && this.state.box.z === 3) ||
      (this.state.box.x === 17 && this.state.box.y === 11 && this.state.box.z === 8) ||
      (this.state.box.x === 17 && this.state.box.y === 17 && this.state.box.z === 7) ||
      (this.state.box.x === 8 && this.state.box.y === 6 && this.state.box.z === 4) ||
      (this.state.box.x === 16 && this.state.box.y === 13 && this.state.box.z === 3) ||
      (this.state.box.x === 9 && this.state.box.y === 6 && this.state.box.z === 3) ||
      
      // New special sizes that need magnification
      (Math.abs(this.state.box.x - 6.25) < 0.01 && Math.abs(this.state.box.y - 3.125) < 0.01 && Math.abs(this.state.box.z - 0.5) < 0.01) ||
      (Math.abs(this.state.box.x - 6) < 0.01 && Math.abs(this.state.box.y - 4) < 0.01 && Math.abs(this.state.box.z - 2) < 0.01)
    );

    let cameraDistance = isSpecialSize ? 3.5 : 5;
    let fov = isSpecialSize ? 60 : 75;

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
      console.log('GL context set');
      this.addBoxToScene();
      this.animate();
    });
  };

  addBoxToScene = () => {
    const { box } = this.state;
    console.log('Adding box to scene:', box);
    
    if (!box || !this.scene) {
      console.error('Missing box or scene:', { hasBox: !!box, hasScene: !!this.scene });
      return;
    }

    // Remove existing cube if any
    if (this.cube) {
      this.scene.remove(this.cube);
    }

    this.cube = this.createBox(box, this.state.itemsTotal);
    if (this.scene) {
      this.scene.add(this.cube);
      console.log('Added cube to scene');
    }
  };

  render() {
    const { selectedBox, selectedCarrier, isBoxCollapsed } = this.state;
    const { route } = this.props;

    return (
      <View style={styles.container}>
        <View style={[styles.topContainer, isBoxCollapsed && styles.collapsedTopContainer]}>
          <View style={styles.boxWrapper}>
            {selectedBox && (
              <View style={styles.boxDimensionsContainer}>
                <Text style={styles.boxDetails}>
                  {selectedBox.dimensions[0]}L x {selectedBox.dimensions[1]}W x{" "}
                  {selectedBox.dimensions[2]}H
                </Text>
                <Text style={styles.text}>{selectedBox.finalBoxType}</Text>
                <PriceText carrier={selectedCarrier} priceText={selectedBox.priceText} />
              </View>
            )}
          </View>
        </View>
        <Animated.View 
          style={[
            styles.glViewContainer,
            {
              height: this.glViewHeight,
              marginTop: 2,
              marginBottom: 10,
            }
          ]}
        >
          <GLView
            style={styles.glView}
            onContextCreate={this._onGLContextCreate}
            {...this.panResponder.panHandlers}
          />
        </Animated.View>
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
  slider: {
    width: '100%',
    height: 40,
    transform: Platform.OS === 'android' ? [{ scale: 1.2 }] : [],
  },
  boxDimensionsContainer: {
    padding: 10,
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
  boxDetails: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  boxWrapper: {
    width: '100%',
  },
});
