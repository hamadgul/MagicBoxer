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
} from "react-native";
import Slider from "@react-native-community/slider";
import { GLView } from "expo-gl";
import * as THREE from "three";
import { Renderer } from "expo-three";
import { Dropdown } from "react-native-element-dropdown";
import AntDesign from "@expo/vector-icons/AntDesign";
import { pack, createDisplay } from "../packing_algo/packing";

const carrierData = [
  { label: "No Carrier", value: "No Carrier" },
  { label: "UPS", value: "UPS" },
  { label: "USPS", value: "USPS" },
  { label: "FedEx", value: "FedEx" },
];

export default class Display3D extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rotationY: 0,
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
    };

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: this.handlePanResponderMove,
    });
  }

  componentDidMount() {
    this.unsubscribeFocus = this.props.navigation.addListener("focus", () => {
      this.forceUpdateWithProps();
    });
  }

  componentWillUnmount() {
    if (this.unsubscribeFocus) {
      this.unsubscribeFocus();
    }
  }
  forceUpdateWithProps() {
    const { route } = this.props;
    this.setState(
      {
        items: route.params.items || [],
        itemsTotal: route.params.itemsTotal || [],
        box: route.params.box || null,
        selectedBox: route.params.selectedBox || null,
      },
      () => {
        if (this.state.gl) {
          this.initialize3DScene();
        }
      }
    );
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(prevProps.route.params.items) !==
      JSON.stringify(this.props.route.params.items)
    ) {
      this.forceUpdateWithProps();
    }
  }

  _onGLContextCreate = (gl) => {
    this.setState({ gl }, () => {
      if (this.state.box && this.state.itemsTotal.length > 0) {
        this.initialize3DScene();
      }
    });
  };

  renderLegendModal = () => {
    const { itemsTotal, isLegendVisible } = this.state;

    return (
      <Modal
        visible={isLegendVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => this.setState({ isLegendVisible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.legendTitle}>Legend</Text>
            <ScrollView>
              {itemsTotal.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[styles.colorBox, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.legendText}>
                    {item.itemName || "Unnamed Item"}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => this.setState({ isLegendVisible: false })}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  initialize3DScene = () => {
    const { gl, box } = this.state;
    if (!gl || !box) {
      console.error("GL context or box data is not available.");
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

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.cube = this.createBox(box, this.state.itemsTotal);
    scene.add(this.cube);

    const maxDimension = Math.max(box.x, box.y, box.z);
    const distance = Math.max(5, maxDimension * 1.5);
    camera.position.set(0, distance * 0.5, distance);
    camera.lookAt(0, 0, 0);

    this.animate();
  };
  createBox = (box, itemsTotal) => {
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

    itemsTotal.forEach((item) => {
      if (item.dis) cube.add(item.dis);
    });

    return cube;
  };

  animate = () => {
    requestAnimationFrame(this.animate);

    const { gl } = this.state;

    // Ensure GL context is available before rendering
    if (!gl) {
      return;
    }

    if (!this.state.userInteracted) {
      this.cube.rotation.y = this.state.rotationY;

      const maxMovement = (this.state.box.y / 10) * 1.5;
      this.state.itemsTotal.forEach((item) => {
        if (item.dis) {
          item.dis.position.y =
            Math.sin(this.state.rotationY) * maxMovement + item.pos[1];
        }
      });

      this.camera.position.set(-1.2, 0.5, 5);
      this.camera.lookAt(0, 0, 0);
    } else {
      const boxRotationY = this.state.rotationY;
      this.camera.position.x =
        5 *
        Math.sin(this.state.phi) *
        Math.cos(this.state.theta + boxRotationY);
      this.camera.position.y = 5 * Math.cos(this.state.phi);
      this.camera.position.z =
        5 *
        Math.sin(this.state.phi) *
        Math.sin(this.state.theta + boxRotationY);
      this.camera.lookAt(0, 0, 0);
    }

    this.renderer.render(this.scene, this.camera);
    gl.endFrameEXP();
  };

  handleRotationChange = (value) => {
    this.setState({ rotationY: value, userInteracted: false });
  };

  handlePanResponderMove = (event, gestureState) => {
    const { dx, dy } = gestureState;
    this.setState((prevState) => ({
      theta: prevState.theta - dx * 0.001,
      phi: Math.max(0.1, Math.min(Math.PI - 0.1, prevState.phi - dy * 0.001)),
      userInteracted: true,
    }));
  };

  updateVisualsBasedOnCarrier = (carrier) => {
    this.setState(
      {
        selectedCarrier: carrier,
        rotationY: 0,
        userInteracted: false,
      },
      () => {
        this.handleVisualize();
        if (this.state.gl) {
          this.initialize3DScene();
        }
      }
    );
  };

  handleVisualize = () => {
    const { items, selectedCarrier } = this.state;

    if (items.length === 0) {
      Alert.alert("No Items", "Please add at least one item before packing.");
      return;
    }

    const itemsTotal = items.flatMap((item) =>
      item.replicatedNames.map((name) => [
        item.itemLength,
        item.itemWidth,
        item.itemHeight,
        item.id,
        selectedCarrier,
        name,
      ])
    );

    const packedResult = pack(itemsTotal, selectedCarrier, 0);

    if (!packedResult || packedResult.length === 0) {
      Alert.alert("Error", "Failed to pack items.");
      return;
    }

    const scale =
      Math.max(packedResult.x, packedResult.y, packedResult.z) > 15 ? 20 : 10;
    const itemsDisplay = createDisplay(packedResult, scale);

    this.setState(
      {
        box: packedResult,
        itemsTotal: itemsDisplay,
        selectedBox: {
          dimensions: [packedResult.x, packedResult.y, packedResult.z],
          price: packedResult.price,
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

  render() {
    const { selectedBox, selectedCarrier } = this.state;

    if (!selectedBox || !selectedBox.dimensions) {
      return <Text style={styles.noBoxText}>No box selected</Text>;
    }

    const boxDimensions = (
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
        <Text style={styles.text}>{selectedBox.finalBoxType || "N/A"}</Text>
        <View style={styles.carrierDropdownContainer}>
          <Text style={styles.carrierLabel}>Carrier:</Text>
          <Dropdown
            style={styles.input}
            data={carrierData}
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
        <TouchableOpacity
          style={styles.legendButton}
          onPress={() => this.setState({ isLegendVisible: true })}
        >
          <Text style={styles.legendButtonText}>Show Legend</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.container}>
        <View style={styles.topContainer}>{boxDimensions}</View>
        <View style={styles.glViewContainer}>
          <GLView
            {...this.panResponder.panHandlers}
            style={styles.glView}
            onContextCreate={this._onGLContextCreate}
          />
        </View>
        {this.renderLegendModal()}
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
  },
  glViewContainer: {
    height: 460,
    marginTop: 2,
  },
  glView: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#fff",
  },
  sliderContainer: {
    height: 40,
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  boxDimensionsContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
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
  carrierDropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  carrierLabel: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  noBoxText: {
    fontSize: 16,
    color: "#f00",
    textAlign: "center",
    margin: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  icon: {
    marginRight: 5,
  },
  legendButton: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    alignSelf: "center",
  },
  legendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
    textAlign: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  colorBox: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#3B82F6",
    width: 120,
    height: 40,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
