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
    this.state = { value: 0 };
  }

  _onGLContextCreate = (gl) => {
    const { route } = this.props;
    const { box, itemsTotal } = route.params ?? { box: null, itemsTotal: [] }; // Provide default values

    console.log("Received itemsTotal in Display3D:", itemsTotal);
    console.log("Received BOX in Display3D:", box);

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
        color: 0x00ff00,
      });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      console.log(itemsTotal);
      for (var i = 0; i < itemsTotal.length; i++) {
        // edges.add(itemss[i].dis);
        cube.add(itemsTotal[i].dis);
        console.log("item", itemsTotal[i].SKU, "added");
      }

      camera.position.set(-1.2, 0.5, 2);
      camera.lookAt(0, 0, 0);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      //cube.rotation.y = this.state.value;
      for (var i = 1; i <= itemsTotal.length; i++) {
        itemsTotal[i - 1].dis.position.y = itemsTotal[i - 1].pos[1];
      }
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
          const items = route.params?.itemsTotal ?? [];
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
