import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { GLView } from "expo-gl";
import * as THREE from "three";
import { Renderer } from "expo-three";

export default class Display3D extends Component {
  constructor(props) {
    super(props);
    this.state = { rotationY: 0 };
    this.cubes = []; // To store references to all cubes
  }

  _onGLContextCreate = (gl) => {
    const { route } = this.props;
    const { box, itemsTotal } = route.params ?? { box: null, itemsTotal: [] };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    itemsTotal.forEach((item, index) => {
      var scale = Math.max(box.x, box.y, box.z) > 15 ? 20 : 10;
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
      this.cubes.push(cube); // Store the cube
      scene.add(cube);

      item.dis && cube.add(item.dis); // Check if `dis` exists before adding
    });

    camera.position.set(-1.2, 0.5, 2);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      this.cubes.forEach((cube) => {
        cube.rotation.y = this.state.rotationY; // Rotate each cube
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
    return (
      <View style={styles.container}>
        <View style={styles.sliderContainer}>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={Math.PI * 2}
            step={0.01}
            value={this.state.rotationY}
            onValueChange={this.handleRotationChange}
          />
        </View>
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
    height: 40, // Set the height for the slider container
    paddingHorizontal: 10, // Optional padding for better spacing
    backgroundColor: "#fff", // Optional background color for visibility
  },
  glView: {
    flex: 1, // Ensure GLView takes up the rest of the space
  },
});
