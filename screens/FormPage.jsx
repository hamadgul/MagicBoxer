//FormPage.js

import React, { Component } from "react";
import {
  Alert,
  Text,
  TextInput,
  View,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Form } from "native-base";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import styles from "../components/Styles";

var Buffer = require("@craftzdog/react-native-buffer").Buffer;

const itemButtonColors = [
  "#3B5998",
  "#008080",
  "#556B2F",
  "#8B0000",
  "#FF8C00",
  "#6A0DAD",
  "#008B8B",
];

export default class FormPage extends Component {
  static ItemDetailsModal = (props) => {
    const [isEditable, setIsEditable] = React.useState(false);
    const [editedItem, setEditedItem] = React.useState({
      itemName: props.item.itemName,
      itemLength: props.item.itemLength.toString(),
      itemWidth: props.item.itemWidth.toString(),
      itemHeight: props.item.itemHeight.toString(),
      quantity: props.item.quantity?.toString() || "1", // Track quantity separately
    });

    const handleEditToggle = () => {
      setIsEditable(!isEditable);
    };

    const handleApplyChanges = () => {
      const updatedItem = {
        ...props.item,
        itemName: editedItem.itemName,
        itemLength: parseFloat(editedItem.itemLength),
        itemWidth: parseFloat(editedItem.itemWidth),
        itemHeight: parseFloat(editedItem.itemHeight),
        quantity: parseInt(editedItem.quantity) || 1, // Apply changes with parsed quantity
      };

      props.handleUpdateItem(updatedItem); // Pass the updated item to be saved
      setIsEditable(false);
    };

    return (
      <View style={styles.centeredView}>
        <Modal visible={props.visible} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalContent}>
                {isEditable ? (
                  <>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>Name</Text>
                      <TextInput
                        style={styles.input}
                        value={editedItem.itemName}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemName: text })
                        }
                        placeholder="Enter Name"
                      />
                    </View>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>Length</Text>
                      <TextInput
                        style={styles.input}
                        value={editedItem.itemLength}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemLength: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Length"
                      />
                    </View>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>Width</Text>
                      <TextInput
                        style={styles.input}
                        value={editedItem.itemWidth}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemWidth: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Width"
                      />
                    </View>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>Height</Text>
                      <TextInput
                        style={styles.input}
                        value={editedItem.itemHeight}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemHeight: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Height"
                      />
                    </View>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>Quantity</Text>
                      <TextInput
                        style={styles.input}
                        value={editedItem.quantity}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, quantity: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Quantity"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={handleApplyChanges}
                      style={styles.buttonApply}
                    >
                      <Text style={styles.buttonText}>Apply Changes</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>
                      Item Name: {props.item.itemName}
                    </Text>
                    <Text style={styles.label}>
                      Length: {props.item.itemLength}
                    </Text>
                    <Text style={styles.label}>
                      Width: {props.item.itemWidth}
                    </Text>
                    <Text style={styles.label}>
                      Height: {props.item.itemHeight}
                    </Text>
                    <Text style={styles.label}>
                      Quantity: {props.item.quantity || 1}
                    </Text>
                  </>
                )}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    onPress={() => props.handleDeleteAndClose(props.item)}
                    style={styles.buttonDelete}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleEditToggle}
                    style={styles.buttonEdit}
                  >
                    <Text style={styles.buttonText}>
                      {isEditable ? "Cancel" : "Edit"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={props.closeModal}
                    style={styles.buttonClose}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
      selectedItem: null,
      unit: "inches",
      selectedCarrier: "No Carrier", // Set default carrier
      quantity: 1, // new state variable for quantity
    };
  }

  handleUpdateItem = (updatedItem) => {
    // Regenerate replicated names based on the updated quantity
    const quantity = parseInt(updatedItem.quantity) || 1; // Ensure quantity is a number
    const replicatedNames = Array.from({ length: quantity }, (_, i) =>
      i === 0 ? updatedItem.itemName : `${updatedItem.itemName}${i + 1}`
    );

    // Update the item with new quantity and replicated names
    const updatedItemWithReplications = {
      ...updatedItem,
      quantity: quantity,
      replicatedNames: replicatedNames,
    };

    // Update items in the state and backend
    const updatedItems = this.state.items.map((item) =>
      item.id === updatedItem.id ? updatedItemWithReplications : item
    );

    this.setState({ items: updatedItems }, async () => {
      try {
        const serializedItems = Buffer.from(
          JSON.stringify(this.state.items)
        ).toString("base64");
        await AsyncStorage.setItem("itemList", serializedItems);
        Alert.alert("Item Updated");
        this.closeModal();
      } catch (error) {
        Alert.alert("Error updating item", error.message);
      }
    });
  };

  // Use arrow functions to automatically bind 'this'
  resetForm = () => {
    this.setState({
      itemName: "",
      itemWidth: "",
      itemHeight: "",
      itemLength: "",
      quantity: 1,
    });
  };

  handleDeleteAndClose = (itemToDelete) => {
    const updatedItems = this.state.items.filter(
      (item) => item.id !== itemToDelete.id
    );
    this.setState({ items: updatedItems }, async () => {
      try {
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
    if (this.state.items.length === 0) {
      Alert.alert("No Items", "Please add at least one item before packing.");
      return;
    }
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
        let itemsTotal = [];
        this.state.items.forEach((item) => {
          item.replicatedNames.forEach((name) => {
            itemsTotal.push([
              item.itemLength,
              item.itemWidth,
              item.itemHeight,
              item.id,
              item.selectedCarrier,
              name, // Pass each replicated name
            ]);
          });
        });

        const packedResult = pack(itemsTotal, "No Carrier", 0);
        if (!packedResult || packedResult.length === 0) {
          Alert.alert("Error", "Failed to pack items.");
          return;
        }

        const scale =
          Math.max(packedResult.x, packedResult.y, packedResult.z) > 15
            ? 20
            : 10;
        const itemsDisplay = createDisplay(packedResult, scale);

        const selectedBox = {
          dimensions: [packedResult.x, packedResult.y, packedResult.z],
          price: packedResult.price,
          finalBoxType: packedResult.type,
        };

        this.props.navigation.navigate("Display3D", {
          box: packedResult,
          itemsTotal: itemsDisplay,
          selectedBox: selectedBox,
          selectedCarrier: "No Carrier",
          items: this.state.items,
        });
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while retrieving the item list");
    }
  };

  handleSubmit = (e) => {
    // Validation checks
    if (
      this.state.itemLength === "" ||
      this.state.itemWidth === "" ||
      this.state.itemHeight === "" ||
      this.state.itemName === "" ||
      this.state.selectedCarrier === ""
    ) {
      Alert.alert(
        "Missing Field",
        "Name, Length, Width, or Height can't be empty."
      );
      return;
    }
    if (
      this.state.itemLength === "0" ||
      this.state.itemWidth === "0" ||
      this.state.itemHeight === "0"
    ) {
      Alert.alert("Error", "Item dimensions cannot be 0.");
      return;
    }

    const length = parseFloat(this.state.itemLength);
    const width = parseFloat(this.state.itemWidth);
    const height = parseFloat(this.state.itemHeight);
    const quantity = this.state.quantity; // Get the quantity value

    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      Alert.alert(
        "Error",
        "Item length, width, and height must be numeric values."
      );
      return;
    }

    // Check if item already exists (using item name)
    const exists = this.state.items.some(
      (item) => item.itemName === this.state.itemName
    );
    if (exists) {
      Alert.alert("Error", "An item with the same name already exists.");
      return;
    }

    // Create a single item with the replicated details stored in backend
    const replicatedNames = Array.from({ length: quantity }, (_, i) =>
      i === 0 ? this.state.itemName : `${this.state.itemName}${i + 1}`
    );

    const newItem = {
      id: generateUUID(),
      itemName: this.state.itemName,
      itemLength: length,
      itemWidth: width,
      itemHeight: height,
      selectedCarrier: this.state.selectedCarrier,
      quantity: quantity, // Store the quantity
      replicatedNames: replicatedNames, // Store replicated names in backend
    };

    // Add the single new item to the items array
    this.setState({ items: [...this.state.items, newItem] }, () => {
      this._storeData();
    });

    Alert.alert("Success", "Item was submitted.");
    this.resetForm();
    Keyboard.dismiss();
  };

  closeModal = () => {
    this.setState({ showDetails: false, selectedItem: null });
  };

  openModal = (item) => {
    this.setState({ showDetails: true, selectedItem: item });
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.formContainer}>
            <Form onSubmit={this.handleSubmit}>
              <Text style={styles.label}>Item Name:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemName}
                onChangeText={this.handleChange}
                maxLength={10}
                returnKeyType={"next"}
                keyboardAppearance="light"
                placeholder="MacBook, Xbox etc"
                placeholderTextColor={"#d3d3d3"}
              />
              <Text style={styles.label}>Length:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemLength}
                onChangeText={(text) => this.setState({ itemLength: text })}
                keyboardType="numeric"
                keyboardAppearance="light"
                placeholder="-- inches"
                placeholderTextColor={"#d3d3d3"}
                maxLength={3}
              />
              <Text style={styles.label}>Width:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemWidth}
                onChangeText={(text) => this.setState({ itemWidth: text })}
                keyboardType="numeric"
                placeholder="-- inches"
                keyboardAppearance="light"
                placeholderTextColor={"#d3d3d3"}
                maxLength={3}
              />
              <Text style={styles.label}>Height:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemHeight}
                onChangeText={(text) => this.setState({ itemHeight: text })}
                keyboardType="numeric"
                placeholder="-- inches"
                keyboardAppearance="light"
                placeholderTextColor={"#d3d3d3"}
                maxLength={3}
              />
              <Text style={styles.label}>Quantity:</Text>
              <TextInput
                style={styles.input}
                value={this.state.quantity.toString()}
                onChangeText={(text) => {
                  // Allow empty string and valid numbers
                  const newQuantity = text === "" ? "" : parseInt(text);
                  // Only update state if newQuantity is a valid number or empty
                  if (!isNaN(newQuantity) || text === "") {
                    this.setState({ quantity: newQuantity });
                  }
                }}
                keyboardType="numeric"
                placeholder="Enter Quantity"
                placeholderTextColor={"#d3d3d3"}
                maxLength={3}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={this.handleSubmit}
              >
                <Text style={styles.buttonText}>Add Item</Text>
              </TouchableOpacity>
            </Form>
          </View>

          <ScrollView
            style={styles.itemsContainer}
            contentContainerStyle={styles.itemsList}
          >
            {this.state.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemButton,
                  {
                    backgroundColor:
                      itemButtonColors[index % itemButtonColors.length],
                  },
                ]}
                onPress={() => this.openModal(item)}
              >
                <Text style={styles.buttonText}>{item.itemName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.visualizeButton}
              onPress={this.handleVisualize}
            >
              <Text style={styles.buttonText}>Pack!</Text>
            </TouchableOpacity>
          </View>

          {this.state.showDetails && this.state.selectedItem && (
            <FormPage.ItemDetailsModal
              visible={this.state.showDetails}
              item={{
                ...this.state.selectedItem,
                quantity: this.state.selectedItem.quantity || 1,
              }} // Provide a default value for quantity
              closeModal={this.closeModal}
              handleDeleteAndClose={this.handleDeleteAndClose}
              handleUpdateItem={this.handleUpdateItem}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
