import React, { Component } from "react";
import { View, StyleSheet, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { GLView } from "expo-gl";
import * as THREE from "three";
import { Renderer } from "expo-three";

export default class Display3D extends Component {
  constructor(props) {
    super(props);
    this.state = { rotationY: 0 };
  }

  _onGLContextCreate = (gl) => {
    const { box, itemsTotal } = this.props.route.params ?? {
      box: null,
      itemsTotal: [],
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(-1.2, 0.5, 5); // Set initial camera position and zoom

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

    camera.lookAt(0, 0, 0); // Ensure camera is focused on the scene center

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.y = this.state.rotationY;

      const maxMovement = (box.y / scale) * 1.5; // Maximum movement allowed along the y-axis

      itemsTotal.forEach((item) => {
        item.dis.position.y =
          Math.sin(this.state.rotationY) * maxMovement + item.pos[1];
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  handleRotationChange = (value) => {
    this.setState({ rotationY: value });
  };

  render() {
    const { selectedBox, selectedCarrier } = this.props.route.params ?? {
      selectedBox: [],
      selectedCarrier: "",
    };

    const boxDimensions =
      selectedBox.length === 3 ? (
        <View style={styles.boxDimensionsContainer}>
          <Text style={styles.boxTitle}>Optimal Box Size</Text>
          <Text style={styles.boxSubtitle}>For This Package:</Text>
          <Text style={styles.boxDetails}>
            {selectedBox[0]}L x {selectedBox[1]}W x {selectedBox[2]}H
          </Text>
          <Text style={styles.carrierText}>Carrier: {selectedCarrier}</Text>
        </View>
      ) : (
        <Text style={styles.noBoxText}>No box selected</Text>
      );

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
