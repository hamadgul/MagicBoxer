import React, { Component } from "react";
import {
  Alert,
  Button,
  Text,
  TextInput,
  View,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Form } from "native-base";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import styles from "../components/Styles";
import AntDesign from "@expo/vector-icons/AntDesign";

const { Buffer } = require("@craftzdog/react-native-buffer");

const carrierData = [
  { label: "UPS", value: "UPS" },
  { label: "USPS", value: "USPS" },
  { label: "FedEx", value: "FedEx" },
];

class FormPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      itemName: "",
      itemWidth: "",
      itemHeight: "",
      itemLength: "",
      items: [],
      showDetails: false,
      selectedCarrier: "UPS",
    };
  }

  static ItemDetailsModal = ({
    visible,
    item,
    handleDeleteAndClose,
    closeModal,
  }) => (
    <View style={styles.centeredView}>
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.centeredView}>
          <View style={styles.modalContent}>
            <Text>Item Name: {item.itemName}</Text>
            <Text>Length: {item.itemLength}</Text>
            <Text>Width: {item.itemWidth}</Text>
            <Text>Height: {item.itemHeight}</Text>
            <Button onPress={() => handleDeleteAndClose(item)} title="Delete" />
            <Button onPress={closeModal} title="Close" />
          </View>
        </View>
      </Modal>
    </View>
  );

  resetForm = () => {
    this.setState({
      itemName: "",
      itemWidth: "",
      itemHeight: "",
      itemLength: "",
    });
  };

  handleDeleteAndClose = async (itemToDelete) => {
    const updatedItems = this.state.items.filter(
      (item) => item.id !== itemToDelete.id
    );
    this.setState({ items: updatedItems }, async () => {
      try {
        const serializedItems = Buffer.from(
          JSON.stringify(updatedItems)
        ).toString("base64");
        await AsyncStorage.setItem("itemList", serializedItems);
        Alert.alert("Item Deleted");
        this.closeModal();
      } catch (error) {
        Alert.alert("Error deleting item", error.message);
      }
    });
  };

  handleChange = (itemName) => this.setState({ itemName });

  _storeData = async () => {
    try {
      const serializedItems = Buffer.from(
        JSON.stringify(this.state.items)
      ).toString("base64");
      await AsyncStorage.setItem("itemList", serializedItems);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while storing the item list");
    }
  };

  handleVisualize = async () => {
    try {
      const itemListString = await AsyncStorage.getItem("itemList");
      let itemList = itemListString
        ? JSON.parse(Buffer.from(itemListString, "base64").toString("utf8"))
        : [];

      this.setState({ items: itemList }, () => {
        const itemsTotal = this.state.items.map((item) => [
          item.itemLength,
          item.itemWidth,
          item.itemHeight,
          item.id,
          item.selectedCarrier,
        ]);

        const packedResult = [pack(itemsTotal, this.state.selectedCarrier, 0)];
        if (packedResult[0] === 0) {
          Alert.alert(
            "Items are too big for a single standard box. Multiple boxed orders have not been implemented yet."
          );
        } else {
          let scale =
            Math.max(packedResult[0].x, packedResult[0].y, packedResult[0].z) >
            15
              ? 20
              : 10;
          packedResult.push(createDisplay(packedResult[0], scale));
          this.props.navigation.navigate("Display3D", {
            box: packedResult[0],
            itemsTotal: packedResult[1],
            selectedBox: [
              packedResult[0].x,
              packedResult[0].y,
              packedResult[0].z,
            ],
            selectedCarrier: this.state.selectedCarrier,
          });
        }
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while retrieving the item list");
    }
  };

  handleSubmit = () => {
    const { itemName, itemLength, itemWidth, itemHeight, selectedCarrier } =
      this.state;
    if (
      !itemName ||
      !itemLength ||
      !itemWidth ||
      !itemHeight ||
      !selectedCarrier
    ) {
      Alert.alert(
        "Error",
        "Item name, length, width, and height cannot be empty."
      );
      return;
    }

    const length = parseFloat(itemLength);
    const width = parseFloat(itemWidth);
    const height = parseFloat(itemHeight);
    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      Alert.alert(
        "Error",
        "Item length, width, and height must be numeric values."
      );
      return;
    }

    if (this.state.items.some((item) => item.itemName === itemName)) {
      Alert.alert("Error", "An item with the same name already exists.");
      return;
    }

    const newItem = {
      id: generateUUID(),
      itemName,
      itemLength: length,
      itemWidth: width,
      itemHeight: height,
      selectedCarrier,
    };
    this.setState({ items: [...this.state.items, newItem] }, this._storeData);
    Alert.alert("An item was submitted: " + itemName);
    this.resetForm();
    Keyboard.dismiss();
  };

  closeModal = () => this.setState({ showDetails: false });

  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Form>
            <Text style={styles.label}>Select Carrier:</Text>
            <Dropdown
              style={styles.input}
              data={carrierData}
              labelField="label"
              valueField="value"
              placeholder="Select Carrier"
              value={this.state.selectedCarrier}
              onChange={(item) =>
                this.setState({ selectedCarrier: item.value })
              }
              renderLeftIcon={() => (
                <AntDesign
                  style={styles.icon}
                  color="black"
                  name="Safety"
                  size={20}
                />
              )}
            />
            <Text style={styles.label}>Item Name:</Text>
            <TextInput
              style={styles.input}
              value={this.state.itemName}
              onChangeText={this.handleChange}
              maxLength={10}
              placeholder="MacBook, Xbox etc"
              placeholderTextColor="#d3d3d3"
            />
            <Text style={styles.label}>Length:</Text>
            <TextInput
              style={styles.input}
              value={this.state.itemLength}
              onChangeText={(text) => this.setState({ itemLength: text })}
              keyboardType="numeric"
              placeholder="-- inches"
              placeholderTextColor="#d3d3d3"
              maxLength={2}
            />
            <Text style={styles.label}>Width:</Text>
            <TextInput
              style={styles.input}
              value={this.state.itemWidth}
              onChangeText={(text) => this.setState({ itemWidth: text })}
              keyboardType="numeric"
              placeholder="-- inches"
              placeholderTextColor="#d3d3d3"
              maxLength={2}
            />
            <Text style={styles.label}>Height:</Text>
            <TextInput
              style={styles.input}
              value={this.state.itemHeight}
              onChangeText={(text) => this.setState({ itemHeight: text })}
              keyboardType="numeric"
              placeholder="-- inches"
              placeholderTextColor="#d3d3d3"
              maxLength={2}
            />

            <View style={styles.buttonContainer}>
              <Button onPress={this.handleSubmit} title="Add Item" />
              <Button onPress={this.handleVisualize} title="Box!" />
            </View>
            <View style={styles.modalButtonContainer}>
              {this.state.items.map((item) => (
                <View style={[styles.button, styles.buttonOpen]} key={item.id}>
                  <Button
                    onPress={() =>
                      this.setState({ showDetails: true, selectedItem: item })
                    }
                    title={item.itemName}
                  />
                </View>
              ))}
              {this.state.showDetails && (
                <FormPage.ItemDetailsModal
                  visible={this.state.showDetails}
                  item={this.state.selectedItem}
                  closeModal={this.closeModal}
                  handleDeleteAndClose={this.handleDeleteAndClose}
                />
              )}
            </View>
          </Form>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export default FormPage;
