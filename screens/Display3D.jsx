import React, { Component } from "react";
import { View, StyleSheet, Text, PanResponder } from "react-native";
import Slider from "@react-native-community/slider";
import { GLView } from "expo-gl";
import * as THREE from "three";
import { Renderer } from "expo-three";

export default class Display3D extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rotationY: 0, // Controls the rotation and lifting of items
      theta: 0, // Horizontal angle for camera spherical coordinates
      phi: Math.PI / 2, // Vertical angle for camera spherical coordinates
      userInteracted: false, // Tracks if user has interacted with the scene
    };

    // Initialize PanResponder to handle gestures for 360 camera rotation
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
    });
  }

  _onGLContextCreate = (gl) => {
    const { box, itemsTotal } = this.props.route.params ?? {
      box: null,
      itemsTotal: [],
    };

    if (!box) {
      console.error("No box data received.");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const scale = Math.max(box.x, box.y, box.z) > 15 ? 20 : 10;
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
    scene.add(cube);

    itemsTotal.forEach((item) => {
      if (item.dis) cube.add(item.dis); // Add item display if it exists
    });

    camera.position.set(-1.2, 0.5, 5); // Set initial camera position and zoom
    camera.lookAt(0, 0, 0); // Ensure camera is focused on the scene center

    const animate = () => {
      requestAnimationFrame(animate);

      if (!this.state.userInteracted) {
        // Default behavior: rotate the cube and lift items using slider value
        cube.rotation.y = this.state.rotationY;

        const maxMovement = (box.y / scale) * 1.5; // Maximum movement allowed along the y-axis
        itemsTotal.forEach((item) => {
          if (item.dis) {
            item.dis.position.y =
              Math.sin(this.state.rotationY) * maxMovement + item.pos[1];
          }
        });

        // Reset camera position to focus on the current rotation position
        camera.position.set(-1.2, 0.5, 5);
        camera.lookAt(0, 0, 0);
      } else {
        // If user has interacted, rotate around the current box's position
        const boxRotationY = this.state.rotationY; // Current rotation of the box from slider
        camera.position.x =
          5 *
          Math.sin(this.state.phi) *
          Math.cos(this.state.theta + boxRotationY);
        camera.position.y = 5 * Math.cos(this.state.phi);
        camera.position.z =
          5 *
          Math.sin(this.state.phi) *
          Math.sin(this.state.theta + boxRotationY);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  handleRotationChange = (value) => {
    // Update rotation and item lifting based on slider
    this.setState({ rotationY: value, userInteracted: false });
  };

  // Handle touch gestures for rotating the camera
  handlePanResponderMove = (event, gestureState) => {
    const { dx, dy } = gestureState; // Get the drag distances

    // Further reduce sensitivity for smoother camera movement
    this.setState((prevState) => ({
      theta: prevState.theta - dx * 0.001, // Reduced sensitivity for horizontal rotation
      phi: Math.max(
        0.1,
        Math.min(Math.PI - 0.1, prevState.phi - dy * 0.001) // Reduced sensitivity for vertical rotation
      ),
      userInteracted: true, // Set userInteracted to true when the user moves the camera
    }));
  };

  render() {
    const { selectedBox, selectedCarrier } = this.props.route.params ?? {
      selectedBox: null,
      selectedCarrier: "",
    };

    if (!selectedBox || !selectedBox.dimensions) {
      return <Text style={styles.noBoxText}>No box selected</Text>;
    }

    const boxDimensions =
      selectedBox.dimensions && selectedBox.dimensions.length === 3 ? (
        <View style={styles.boxDimensionsContainer}>
          <Text style={styles.boxTitle}>Optimal Box Size</Text>
          <Text style={styles.boxSubtitle}>For This Package:</Text>
          <Text style={styles.boxDetails}>
            {selectedBox.dimensions[0]}L x {selectedBox.dimensions[1]}W x{" "}
            {selectedBox.dimensions[2]}H
          </Text>
          <Text style={styles.text}>
            Estimated Box Price:{" "}
            {selectedBox.price !== null && selectedBox.price !== undefined
              ? selectedBox.price === 0
                ? "Free with Service"
                : `$${selectedBox.price.toFixed(2)}`
              : "N/A"}
          </Text>

          <Text style={styles.carrierText}>Carrier: {selectedCarrier}</Text>
        </View>
      ) : null;

    return (
      <View style={styles.container}>
        <View style={styles.sliderContainer}>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={Math.PI}
            step={0.01}
            value={this.state.rotationY}
            onValueChange={this.handleRotationChange}
          />
        </View>
        {boxDimensions}
        <GLView
          {...this.panResponder.panHandlers} // Attach pan handlers to GLView for 360 view
          style={styles.glView}
          onContextCreate={this._onGLContextCreate}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sliderContainer: {
    height: 40,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  glView: {
    flex: 1,
  },
  boxDimensionsContainer: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    margin: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  boxSubtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  boxDetails: {
    fontSize: 20,
    fontWeight: "600",
    color: "#007bff",
  },
  carrierText: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  noBoxText: {
    fontSize: 16,
    color: "#f00",
    textAlign: "center",
    margin: 20,
  },
});
