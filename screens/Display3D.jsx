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

  createTextSprite( // Not yet supported on React Native gl. Most likely support will come in an update.
    text,
    color = "rgba(0, 0, 0, 1)",
    backgroundColor = "rgba(255, 255, 255, 0.8)"
  ) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = "24px Arial";
    context.fillStyle = backgroundColor;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    canvas.width = textWidth + 20;
    canvas.height = 40; // Fixed height for simplicity
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.fillText(text, 10, 30);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.25, 1); // You might need to adjust this based on your scene scale
    return sprite;
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

    const xLabel = this.createTextSprite(`Width: ${box.x}`);
    const yLabel = this.createTextSprite(`Height: ${box.y}`);
    const zLabel = this.createTextSprite(`Depth: ${box.z}`);

    // Adjust positions relative to the cube dimensions and scale
    xLabel.position.set(box.x / (2 * scale) + 0.1, 0, 0);
    yLabel.position.set(0, box.y / (2 * scale) + 0.1, 0);
    zLabel.position.set(0, 0, box.z / (2 * scale) + 0.1);

    cube.add(xLabel);
    cube.add(yLabel);
    cube.add(zLabel);

    for (var i = 0; i < itemsTotal.length; i++) {
      // edges.add(itemss[i].dis);
      cube.add(itemsTotal[i].dis);
    }
    //item.dis && cube.add(item.dis); // Check if `dis` exists before adding

    camera.position.set(-1.2, 0.5, 2);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.y = this.state.rotationY;
      // Rotate each cube
      for (var i = 1; i <= itemsTotal.length; i++) {
        itemsTotal[i - 1].dis.position.y =
          0.5 * this.state.rotationY + itemsTotal[i - 1].pos[1];
      }
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
            maximumValue={(Math.PI * 2) / 3}
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
