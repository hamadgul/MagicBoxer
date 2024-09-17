import React, { Component } from "react";
import { Alert, Button, Text, TextInput, View, Modal } from "react-native";
import { Form } from "native-base";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import styles from "../components/Styles";
import AntDesign from "@expo/vector-icons/AntDesign";

var Buffer = require("@craftzdog/react-native-buffer").Buffer;

const carrierData = [
  { label: "UPS", value: "UPS" },
  { label: "USPS", value: "USPS" },
  { label: "FedEx", value: "FedEx" },
  { label: "No Carrier", value: "Default" },
];

export default class FormPage extends Component {
  static ItemDetailsModal = (props) => {
    return (
      <View style={styles.centeredView}>
        <Modal visible={props.visible} animationType="slide" transparent={true}>
          <View style={styles.centeredView}>
            <View style={styles.modalContent}>
              <Text>Item Name: {props.item.itemName}</Text>
              <Text>Length: {props.item.itemLength}</Text>
              <Text>Width: {props.item.itemWidth}</Text>
              <Text>Height: {props.item.itemHeight}</Text>
              <Button
                onPress={() => props.handleDeleteAndClose(props.item)}
                title="Delete"
              />
              <Button onPress={props.closeModal} title="Close" />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  static ItemDetailsName = (props) => {
    return (
      <View>
        <Text>Item: {props.item.itemName}</Text>
      </View>
    );
  };
  constructor(props) {
    super(props);
    this.state = {
      itemName: "",
      itemWidth: 0,
      itemHeight: 0,
      itemLength: 0,
      items: [],
      showDetails: false,
      unit: "inches",
      selectedCarrier: "No Carrier",
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.handleVisualize = this.handleVisualize.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  resetForm = () => {
    this.setState({
      itemName: "",
      itemWidth: "",
      itemHeight: "",
      itemLength: "",
    });
  };

  handleDeleteAndClose = (itemToDelete) => {
    // Use a unique identifier for deletion logic if possible.
    const updatedItems = this.state.items.filter(
      (item) => item.id !== itemToDelete.id
    );
    this.setState({ items: updatedItems }, async () => {
      try {
        // Update AsyncStorage after modifying the items array.
        const serializedItems = Buffer.from(
          JSON.stringify(this.state.items)
        ).toString("base64");
        await AsyncStorage.setItem("itemList", serializedItems);
        Alert.alert("Item Deleted");
        this.closeModal();
      } catch (error) {
        Alert.alert("Error deleting item", error.message);
      }
    });
  };

  deleteItem = async (index) => {
    const updatedItems = this.state.items.filter(
      (_, itemIndex) => index !== itemIndex
    );
    this.setState({ items: updatedItems });
    try {
      const serializedItems = Buffer.from(
        JSON.stringify(updatedItems)
      ).toString("base64");
      await AsyncStorage.setItem("itemList", serializedItems);
      Alert.alert("Item Deleted");
    } catch (error) {
      Alert.alert("Error deleting item");
    }
  };

  handleChange = (itemName) => {
    this.setState({ itemName });
  };
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
      let itemList = [];
      if (itemListString) {
        const deserializedItems = JSON.parse(
          Buffer.from(itemListString, "base64").toString("utf8")
        );
        itemList = deserializedItems;
      }

      this.setState({ items: itemList }, () => {
        var itemsTotal = [];
        this.state.items.forEach((item) => {
          itemsTotal.push([
            item.itemLength,
            item.itemWidth,
            item.itemHeight,
            item.id,
            item.selectedCarrier,
          ]);
        });
        var packedResult = [];
        console.log("Test Dims:", itemsTotal);
        console.log("Selected", this.state.selectedCarrier);
        packedResult.push(pack(itemsTotal, this.state.selectedCarrier, 0));
        console.log("Packed Result:", packedResult);

        if (packedResult === 0) {
          Alert.alert(
            "Items are too big for a single standard box. Multiple boxed orders have not been implemented yet."
          );
        } else {
          var scale = 10;
          if (
            Math.max(packedResult[0].x, packedResult[0].y, packedResult[0].z) >
            15
          ) {
            scale = 20;
          }
          packedResult.push(createDisplay(packedResult[0], scale));

          // Extract dimensions and price for the selected box
          var selectedBox = {
            dimensions: [
              packedResult[0].x,
              packedResult[0].y,
              packedResult[0].z,
            ],
            price: packedResult[0].price, // Add the price from the packed result
          };

          console.log("selected box:", selectedBox);

          // Pass the selected box, items, and price to Display3D
          this.props.navigation.navigate("Display3D", {
            box: packedResult[0],
            itemsTotal: packedResult[1],
            selectedBox: selectedBox,
            selectedCarrier: this.state.selectedCarrier,
          });
        }
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while retrieving the item list");
    }
  };

  handleSubmit = (e) => {
    if (
      this.state.itemLength === "" ||
      this.state.itemWidth === "" ||
      this.state.itemHeight === "" ||
      this.state.itemName === "" ||
      this.state.itemHeight === "" ||
      this.state.selectedCarrier === ""
    ) {
      Alert.alert(
        "Error",
        "Item name, length , width, and height can not be empty."
      );
      return;
    }
    if (
      this.state.itemLength === "0" ||
      this.state.itemWidth === "0" ||
      this.state.itemHeight === "0" ||
      this.state.itemHeight === "0"
    ) {
      Alert.alert("Error", "Item dimensions can not be 0.");
      return;
    }

    // Convert dimensions to numbers
    const length = parseFloat(this.state.itemLength);
    const width = parseFloat(this.state.itemWidth);
    const height = parseFloat(this.state.itemHeight);

    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      // Display an error message
      Alert.alert(
        "Error",
        "Item length, width, and height must be numeric values."
      );
      // prevent the form from being submitted
      return;
    }
    // Check if dimensions are valid numbers
    if (
      !Number.isFinite(length) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      Alert.alert("Error", "Invalid item dimensions.");
      return;
    }

    const exists = this.state.items.some(
      (item) => item.itemName === this.state.itemName
    );
    if (exists) {
      Alert.alert("Error", "An item with the same name already exists.");
      return;
    }
    const newItem = {
      id: generateUUID(),
      itemName: this.state.itemName,
      itemLength: length,
      itemWidth: width,
      itemHeight: height,
      selectedCarrier: this.state.selectedCarrier,
    };
    this.setState({ items: [...this.state.items, newItem] }, () => {
      this._storeData();
    });

    alert("An item was submitted: " + this.state.itemName);
    //alert(`Number of items submitted so far: ${this.state.items.length + 1}`);
    this.resetForm();
    Keyboard.dismiss();
  };

  selectItem = (item) => {
    this.setState({ selectedItem: item });
  };

  closeModal = () => {
    this.setState({ showDetails: false });
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Form onSubmit={this.handleSubmit}>
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
              returnKeyType={"next"}
              placeholder="MacBook, Xbox etc"
              placeholderTextColor={"#d3d3d3"}
            />
            <Text style={styles.label}>Length:</Text>
            <TextInput
              style={styles.input}
              value={this.state.itemLength}
              onChangeText={(text) => this.setState({ itemLength: text })}
              keyboardType="numeric"
              placeholder="-- inches"
              placeholderTextColor={"#d3d3d3"}
              maxLength={2}
            />
            <Text style={styles.label}>Width:</Text>
            <TextInput
              style={styles.input}
              value={this.state.itemWidth}
              onChangeText={(text) => this.setState({ itemWidth: text })}
              keyboardType="numeric"
              placeholder="-- inches"
              placeholderTextColor={"#d3d3d3"}
              maxLength={2}
            />
            <Text style={styles.label}>Height:</Text>
            <TextInput
              style={styles.input}
              value={this.state.itemHeight}
              onChangeText={(text) => this.setState({ itemHeight: text })}
              keyboardType="numeric"
              placeholder="-- inches"
              placeholderTextColor={"#d3d3d3"}
              maxLength={2}
            />

            <View style={styles.buttonContainer}>
              <Button
                block
                style={styles.submitButton}
                onPress={() => {
                  this.handleSubmit();
                }}
                title="Add Item"
              >
                <Text>Add Item</Text>
              </Button>
              <Button
                block
                style={styles.visualizeButton}
                onPress={() => {
                  this.handleVisualize();
                }}
                title="Box!"
              >
                <Text>Pack!</Text>
              </Button>
            </View>
            <View>
              <View style={styles.modalButtonContainer}>
                {this.state.items.map((item, index) => (
                  <View
                    style={[styles.button, styles.buttonOpen]}
                    key={item.itemName}
                  >
                    <Button
                      key={index}
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
            </View>
          </Form>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
