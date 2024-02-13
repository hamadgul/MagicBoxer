import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { GLView } from "expo-gl";
import * as THREE from "three"; // Assuming expo-three provides THREE
import { Renderer } from "expo-three";

export default class Display3D extends Component {
  componentDidMount() {
    // This method is kept for potential future use.
  }
  constructor(props) {
    super(props);
    this.cubes = [];
    this.state = { value: 0 }; // Declaring cubes at the component level
  }
  _onGLContextCreate = (gl, items) => {
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
    var scale = 10;
    items.forEach((item) => {
      const geometry = new THREE.BoxGeometry(
        parseFloat(item.itemWidth) / 10, // Using a fixed scale for simplicity
        parseFloat(item.itemHeight) / 10,
        parseFloat(item.itemLength) / 10
      );
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      this.cubes.push(cube); // Correctly using 'this.cubes' to reference the component-level array
    });

    // console.log(this.params.items);

    const animate = () => {
      requestAnimationFrame(animate);
      this.cubes.forEach((cube) => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      });
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  render() {
    return (
      <GLView
        style={styles.container}
        onContextCreate={(gl) => {
          const { route } = this.props;
          const items = route.params?.items ?? [];
          this._onGLContextCreate(gl, items);
        }}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
