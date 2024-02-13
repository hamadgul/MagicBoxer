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
    var scale = 15;
    console.log("Processing items:", items);
    items.forEach((item, index) => {
      const geometry = new THREE.BoxGeometry(
        parseFloat(item.itemWidth) / scale,
        parseFloat(item.itemHeight) / scale,
        parseFloat(item.itemLength) / scale
      );
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);

      // Adjust the position of each cube to prevent overlap
      cube.position.x = index * 1.5; // Adjust spacing as necessary

      scene.add(cube);
      this.cubes.push(cube);
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
