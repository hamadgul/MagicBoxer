import React, { Component, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
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

// ItemDetailsModal Component
export const ItemDetailsModal = ({
  visible,
  item,
  closeModal,
  handleUpdateItem,
  handleDeleteAndClose,
}) => {
  const [isEditable, setIsEditable] = useState(false);
  const [editedItem, setEditedItem] = useState({
    itemName: item?.itemName || "",
    itemLength: item?.itemLength.toString() || "",
    itemWidth: item?.itemWidth.toString() || "",
    itemHeight: item?.itemHeight.toString() || "",
    quantity: item?.quantity?.toString() || "1",
  });

  const handleEditToggle = () => {
    setIsEditable(!isEditable);
  };

  const handleApplyChanges = () => {
    const updatedItem = {
      ...item,
      itemName: editedItem.itemName,
      itemLength: parseFloat(editedItem.itemLength),
      itemWidth: parseFloat(editedItem.itemWidth),
      itemHeight: parseFloat(editedItem.itemHeight),
      quantity: parseInt(editedItem.quantity) || 1,
    };
    handleUpdateItem(updatedItem);
    setIsEditable(false);
  };

  if (!item) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeModal}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                  style={styles.buttonApply1}
                >
                  <Text style={styles.buttonText}>Apply Changes</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Item Name: {item.itemName}</Text>
                <Text style={styles.label}>Length: {item.itemLength}</Text>
                <Text style={styles.label}>Width: {item.itemWidth}</Text>
                <Text style={styles.label}>Height: {item.itemHeight}</Text>
                <Text style={styles.label}>Quantity: {item.quantity || 1}</Text>
              </>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={() => handleDeleteAndClose(item)}
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
              <TouchableOpacity onPress={closeModal} style={styles.buttonClose}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default class FormPage extends Component {
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
      selectedCarrier: "No Carrier",
      quantity: 1,
      showSavePackageModal: false,
      packageName: "",
    };
  }

  componentDidMount() {
    this.loadItems();
  }

  loadItems = async () => {
    try {
      const itemListString = await AsyncStorage.getItem("itemList");
      if (itemListString) {
        const deserializedItems = JSON.parse(
          Buffer.from(itemListString, "base64").toString("utf8")
        );
        this.setState({ items: deserializedItems });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load items.");
    }
  };

  clearItems = async () => {
    try {
      await AsyncStorage.removeItem("itemList");
      this.setState({
        itemName: "",
        itemWidth: "",
        itemHeight: "",
        itemLength: "",
        quantity: 1,
        items: [],
        selectedItem: null,
      });
    } catch (error) {
      Alert.alert("Error", `Failed to clear items: ${error.message}`);
    }
  };

  toggleSavePackageModal = () => {
    const { items } = this.state;
    if (items.length === 0) {
      Alert.alert("Error", "Cannot save a package with no items.");
      return;
    }
    this.setState({ showSavePackageModal: !this.state.showSavePackageModal });
  };

  handleSavePackage = async () => {
    const { packageName, items } = this.state;

    if (!packageName.trim()) {
      Alert.alert("Error", "Package name cannot be empty.");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Error", "Cannot save a package with no items.");
      return;
    }

    try {
      const existingPackages = await AsyncStorage.getItem("packages");
      const packages = existingPackages ? JSON.parse(existingPackages) : {};

      if (packages[packageName]) {
        Alert.alert("Error", "A package with this name already exists.");
        return;
      }

      packages[packageName] = items;
      await AsyncStorage.setItem("packages", JSON.stringify(packages));

      Alert.alert("Success", "Package saved successfully.");
      this.clearItems();
      this.toggleSavePackageModal();
    } catch (error) {
      Alert.alert("Error", `Failed to save package: ${error.message}`);
    }
  };

  handleUpdateItem = (updatedItem) => {
    const quantity = parseInt(updatedItem.quantity) || 1;
    const replicatedNames = Array.from({ length: quantity }, (_, i) =>
      i === 0 ? updatedItem.itemName : `${updatedItem.itemName}${i + 1}`
    );

    const updatedItemWithReplications = {
      ...updatedItem,
      quantity: quantity,
      replicatedNames: replicatedNames,
    };

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

  handleSubmit = () => {
    const {
      itemName,
      itemLength,
      itemWidth,
      itemHeight,
      quantity,
      selectedCarrier,
    } = this.state;

    if (
      !itemName ||
      !itemLength ||
      !itemWidth ||
      !itemHeight ||
      !selectedCarrier
    ) {
      Alert.alert(
        "Missing Field",
        "Name, Length, Width, or Height can't be empty."
      );
      return;
    }

    if (itemLength === "0" || itemWidth === "0" || itemHeight === "0") {
      Alert.alert("Error", "Item dimensions cannot be 0.");
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

    const exists = this.state.items.some((item) => item.itemName === itemName);
    if (exists) {
      Alert.alert("Error", "An item with the same name already exists.");
      return;
    }

    const replicatedNames = Array.from({ length: quantity }, (_, i) =>
      i === 0 ? itemName : `${itemName}${i + 1}`
    );

    const newItem = {
      id: uuid.v4(),
      itemName,
      itemLength: length,
      itemWidth: width,
      itemHeight: height,
      selectedCarrier,
      quantity,
      replicatedNames,
    };

    this.setState({ items: [...this.state.items, newItem] }, () => {
      this._storeData();
    });

    Alert.alert("Success", "Item was submitted.");
    this.resetForm();
    Keyboard.dismiss();
  };

  resetForm = () => {
    this.setState({
      itemName: "",
      itemWidth: "",
      itemHeight: "",
      itemLength: "",
      quantity: 1,
    });
  };

  closeModal = () => {
    this.setState({ showDetails: false, selectedItem: null });
  };

  openModal = (item) => {
    this.setState({ showDetails: true, selectedItem: item });
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
              name,
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

  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.formContainer}>
            <View>
              <Text style={styles.label}>Item Name:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemName}
                onChangeText={(itemName) => this.setState({ itemName })}
                maxLength={10}
                placeholder="MacBook, Xbox etc"
                placeholderTextColor="#d3d3d3"
              />
              <Text style={styles.label}>Length:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemLength}
                onChangeText={(itemLength) => this.setState({ itemLength })}
                keyboardType="numeric"
                placeholder="-- inches"
                placeholderTextColor="#d3d3d3"
              />
              <Text style={styles.label}>Width:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemWidth}
                onChangeText={(itemWidth) => this.setState({ itemWidth })}
                keyboardType="numeric"
                placeholder="-- inches"
                placeholderTextColor="#d3d3d3"
              />
              <Text style={styles.label}>Height:</Text>
              <TextInput
                style={styles.input}
                value={this.state.itemHeight}
                onChangeText={(itemHeight) => this.setState({ itemHeight })}
                keyboardType="numeric"
                placeholder="-- inches"
                placeholderTextColor="#d3d3d3"
              />
              <Text style={styles.label}>Quantity:</Text>
              <TextInput
                style={styles.input}
                value={this.state.quantity.toString()}
                onChangeText={(text) =>
                  this.setState({ quantity: text === "" ? "" : parseInt(text) })
                }
                keyboardType="numeric"
                placeholder="Enter Quantity"
                placeholderTextColor="#d3d3d3"
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={this.handleSubmit}
              >
                <Text style={styles.buttonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
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
            <TouchableOpacity
              style={styles.savePackageButton}
              onPress={this.toggleSavePackageModal}
            >
              <Text style={styles.buttonText}>Save Package</Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={this.state.showSavePackageModal}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalContent}>
                <Text style={styles.label}>Enter Package Name</Text>
                <TextInput
                  style={styles.input}
                  value={this.state.packageName}
                  onChangeText={(text) => this.setState({ packageName: text })}
                  placeholder="Package Name"
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={styles.buttonApply}
                    onPress={this.handleSavePackage}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonClose}
                    onPress={this.toggleSavePackageModal}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {this.state.showDetails && this.state.selectedItem && (
            <ItemDetailsModal
              visible={this.state.showDetails}
              item={{
                ...this.state.selectedItem,
                quantity: this.state.selectedItem.quantity || 1,
              }}
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
