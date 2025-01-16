import React, { Component } from 'react';
import { View } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { isSpecialSize, getScale } from '../../utils/boxSizes';
import { createDisplay } from '../../packing_algo/packing';
import { box3DStyles } from './styles';

export default class Box3DRenderer extends Component {
  constructor(props) {
    super(props);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cube = null;
    this.animationFrameId = null;
  }

  componentWillUnmount() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.cleanupThreeJS();
  }

  cleanupThreeJS = () => {
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
    this.camera = null;
    this.cube = null;
  }

  createBox = (box, itemsTotal, scale) => {
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
      const boxWithItems = {
        x: box.x,
        y: box.y,
        z: box.z,
        type: box.type,
        priceText: box.priceText,
        cx: box.x / 2,
        cy: -box.y / 2,
        cz: box.z / 2,
        items: itemsTotal
      };

      const displayItems = createDisplay(boxWithItems, scale);
      if (displayItems && displayItems.length > 0) {
        displayItems.forEach(item => {
          if (item.dis) {
            cube.add(item.dis);
          }
        });
        this.props.onItemsCreated?.(displayItems);
      }
    }

    return cube;
  }

  _onGLContextCreate = async (gl) => {
    const { box } = this.props;
    
    if (!this.scene) {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xffffff);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(5, 5, 5);
      this.scene.add(directionalLight);
    }

    const specialSize = isSpecialSize(box);
    let cameraDistance = specialSize ? 3.5 : 5;
    let fov = specialSize ? 60 : 75;

    if (!this.camera) {
      this.camera = new THREE.PerspectiveCamera(
        fov,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
    }
    
    this.camera.position.set(0, cameraDistance * 0.5, cameraDistance);
    this.camera.lookAt(0, 0, 0);

    if (!this.renderer) {
      this.renderer = new Renderer({ gl });
      this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    this.props.onGLContextCreated?.(gl);
    this.addBoxToScene();
    this.animate();
  }

  addBoxToScene = () => {
    const { box, itemsTotal } = this.props;
    
    if (!box || !this.scene) return;

    if (this.cube) {
      this.scene.remove(this.cube);
    }

    const scale = getScale(box);
    this.cube = this.createBox(box, itemsTotal, scale);
    
    if (this.scene) {
      this.scene.add(this.cube);
    }
  }

  animate = () => {
    if (!this.renderer || !this.scene || !this.camera) {
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const { onAnimate } = this.props;
    if (onAnimate) {
      onAnimate(this.cube, this.camera);
    }

    this.renderer.render(this.scene, this.camera);
    this.props.gl?.endFrameEXP();
  }

  render() {
    return (
      <View style={box3DStyles.container}>
        <GLView
          style={box3DStyles.glView}
          onContextCreate={this._onGLContextCreate}
        />
      </View>
    );
  }
}
