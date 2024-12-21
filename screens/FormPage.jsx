// FormPage.js

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
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { VStack } from "native-base";  
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import styles from "../components/Styles";
var Buffer = require("@craftzdog/react-native-buffer").Buffer;

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 15,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 15,
  },
  bulletText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#4B5563',
  },
  boldText: {
    fontWeight: '600',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  fieldLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginRight: 10,
  },
  fieldValue: {
    flex: 2,
    fontSize: 16,
    color: '#1F2937',
  },
  fieldInput: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: 'white',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  applyButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  }
});

const itemButtonColors = [
  "#3B5998",
  "#008080",
  "#556B2F",
  "#8B0000",
  "#FF8C00",
  "#6A0DAD",
  "#008B8B",
];

// Make sure ItemDetailsModal is exported correctly
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
    itemLength: item?.itemLength?.toString() || "",
    itemWidth: item?.itemWidth?.toString() || "",
    itemHeight: item?.itemHeight?.toString() || "",
    quantity: item?.quantity?.toString() || "1",
  });

  const handleEditToggle = () => {
    if (isEditable) {
      // Reset form when canceling edit
      setEditedItem({
        itemName: item?.itemName || "",
        itemLength: item?.itemLength?.toString() || "",
        itemWidth: item?.itemWidth?.toString() || "",
        itemHeight: item?.itemHeight?.toString() || "",
        quantity: item?.quantity?.toString() || "1",
      });
    }
    setIsEditable(!isEditable);
  };

  const handleApplyChanges = () => {
    // Validate inputs before applying changes
    const length = parseFloat(editedItem.itemLength);
    const width = parseFloat(editedItem.itemWidth);
    const height = parseFloat(editedItem.itemHeight);
    const quantity = parseInt(editedItem.quantity);

    if (isNaN(length) || isNaN(width) || isNaN(height) || isNaN(quantity)) {
      Alert.alert("Invalid Input", "Please enter valid numbers for dimensions and quantity");
      return;
    }

    if (!editedItem.itemName.trim()) {
      Alert.alert("Invalid Input", "Please enter an item name");
      return;
    }

    handleUpdateItem({
      ...item,
      itemName: editedItem.itemName.trim(),
      itemLength: length,
      itemWidth: width,
      itemHeight: height,
      quantity: quantity,
    });
    setIsEditable(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        if (!isEditable) closeModal();
      }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          if (!isEditable) closeModal();
        }}>
          <View style={modalStyles.centeredView}>
            <View style={modalStyles.modalContent}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>
                  {isEditable ? "Edit Item" : "Item Details"}
                </Text>
              </View>

              <ScrollView 
                style={{ width: '97%', maxHeight: '80%' }} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {isEditable ? (
                  <View style={{ width: '100%', paddingBottom: 16 }}>
                    <View style={modalStyles.fieldContainer}>
                      <Text style={modalStyles.bulletText}>
                        <Text style={modalStyles.boldText}>Name</Text>
                      </Text>
                      <TextInput
                        style={modalStyles.fieldInput}
                        value={editedItem.itemName}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemName: text })
                        }
                        placeholder="Enter Name"
                        maxLength={20}
                      />
                    </View>
                    
                    <View style={modalStyles.fieldContainer}>
                      <Text style={modalStyles.bulletText}>
                        <Text style={modalStyles.boldText}>Length (inches)</Text>
                      </Text>
                      <TextInput
                        style={modalStyles.fieldInput}
                        value={editedItem.itemLength}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemLength: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Length"
                        maxLength={3}
                      />
                    </View>
                    
                    <View style={modalStyles.fieldContainer}>
                      <Text style={modalStyles.bulletText}>
                        <Text style={modalStyles.boldText}>Width (inches)</Text>
                      </Text>
                      <TextInput
                        style={modalStyles.fieldInput}
                        value={editedItem.itemWidth}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemWidth: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Width"
                        maxLength={3}
                      />
                    </View>
                    
                    <View style={modalStyles.fieldContainer}>
                      <Text style={modalStyles.bulletText}>
                        <Text style={modalStyles.boldText}>Height (inches)</Text>
                      </Text>
                      <TextInput
                        style={modalStyles.fieldInput}
                        value={editedItem.itemHeight}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemHeight: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Height"
                        maxLength={3}
                      />
                    </View>
                    
                    <View style={modalStyles.fieldContainer}>
                      <Text style={modalStyles.bulletText}>
                        <Text style={modalStyles.boldText}>Quantity</Text>
                      </Text>
                      <TextInput
                        style={modalStyles.fieldInput}
                        value={editedItem.quantity}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, quantity: text })
                        }
                        keyboardType="numeric"
                        placeholder="Enter Quantity"
                        maxLength={2}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={{ width: '100%' }}>
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Name:</Text>
                      <Text style={modalStyles.fieldValue}>{item?.itemName}</Text>
                    </View>
                    
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Length:</Text>
                      <Text style={modalStyles.fieldValue}>{item?.itemLength} inches</Text>
                    </View>
                    
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Width:</Text>
                      <Text style={modalStyles.fieldValue}>{item?.itemWidth} inches</Text>
                    </View>
                    
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Height:</Text>
                      <Text style={modalStyles.fieldValue}>{item?.itemHeight} inches</Text>
                    </View>
                    
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Quantity:</Text>
                      <Text style={modalStyles.fieldValue}>{item?.quantity || 1}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={{ flex: 1 }} />

              <View style={[modalStyles.modalButtonContainer, { marginTop: 'auto', paddingVertical: 16 }]}>
                {isEditable ? (
                  <>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.applyButton]}
                      onPress={handleApplyChanges}
                    >
                      <Text style={modalStyles.buttonText}>Apply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.cancelButton]}
                      onPress={handleEditToggle}
                    >
                      <Text style={modalStyles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.editButton]}
                      onPress={handleEditToggle}
                    >
                      <Text style={modalStyles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.deleteButton]}
                      onPress={() => handleDeleteAndClose(item)}
                    >
                      <Text style={modalStyles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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

  // Load items from AsyncStorage
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

  // Clear the items and reset form fields
  clearItems = async () => {
    try {
      // Clear the item list in AsyncStorage
      await AsyncStorage.removeItem("itemList");

      // Reset the state
      this.setState({
        itemName: "",
        itemWidth: "",
        itemHeight: "",
        itemLength: "",
        quantity: 1,
        items: [], // Clear the list of items
        selectedItem: null,
      });
    } catch (error) {
      Alert.alert("Error", `Failed to clear items: ${error.message}`);
    }
  };

  toggleSavePackageModal = () => {
    const { items } = this.state;

    // Check if there are any items in the package
    if (items.length === 0) {
      Alert.alert("Error", "Cannot save a package with no items.");
      return;
    }

    // Toggle the Save Package modal if items are present and clear package name
    this.setState({ 
      showSavePackageModal: !this.state.showSavePackageModal,
      packageName: '' // Clear package name when toggling modal
    });
  };

  // Handle Saving Package
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
      // Retrieve existing packages from AsyncStorage
      const existingPackages = await AsyncStorage.getItem("packages");
      const packages = existingPackages ? JSON.parse(existingPackages) : {};

      // Check if a package with the same name already exists
      if (packages[packageName]) {
        Alert.alert("Error", "A package with this name already exists.");
        return;
      }

      // Save the package
      packages[packageName] = items;
      await AsyncStorage.setItem("packages", JSON.stringify(packages));

      // Once saved successfully, alert success and clear items
      Alert.alert("Success", "Package saved successfully.");

      // Clear items after successful save
      this.clearItems();

      // Close the modal and clear package name
      this.setState({ 
        showSavePackageModal: false,
        packageName: '' // Clear package name after saving
      });
    } catch (error) {
      // Catch and display any errors
      Alert.alert("Error", `Failed to save package: ${error.message}`);
    }
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

  handleSubmit = (e) => {
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
    const quantity = this.state.quantity;

    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      Alert.alert(
        "Error",
        "Item length, width, and height must be numeric values."
      );
      return;
    }

    const exists = this.state.items.some(
      (item) => item.itemName === this.state.itemName
    );
    if (exists) {
      Alert.alert("Error", "An item with the same name already exists.");
      return;
    }

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
      quantity: quantity,
      replicatedNames: replicatedNames,
    };

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.formContainer}>
            <VStack space={2} width="100%">
              <Text style={[styles.label, styles.condensedLabel]}>Item Name:</Text>
              <TextInput
                style={[styles.input, styles.condensedInput]}
                value={this.state.itemName}
                onChangeText={this.handleChange}
                maxLength={10}
                returnKeyType={"next"}
                keyboardAppearance="light"
                placeholder="MacBook, Xbox etc"
                placeholderTextColor={"#d3d3d3"}
                autoCorrect={false}
                spellCheck={false}
              />
              <Text style={[styles.label, styles.condensedLabel]}>Length:</Text>
              <TextInput
                style={[styles.input, styles.condensedInput]}
                value={this.state.itemLength}
                onChangeText={(text) => this.setState({ itemLength: text })}
                keyboardType="numeric"
                keyboardAppearance="light"
                placeholder="-- inches"
                placeholderTextColor={"#d3d3d3"}
                maxLength={3}
              />
              <Text style={[styles.label, styles.condensedLabel]}>Width:</Text>
              <TextInput
                style={[styles.input, styles.condensedInput]}
                value={this.state.itemWidth}
                onChangeText={(text) => this.setState({ itemWidth: text })}
                keyboardType="numeric"
                placeholder="-- inches"
                keyboardAppearance="light"
                placeholderTextColor={"#d3d3d3"}
                maxLength={3}
              />
              <Text style={[styles.label, styles.condensedLabel]}>Height:</Text>
              <TextInput
                style={[styles.input, styles.condensedInput]}
                value={this.state.itemHeight}
                onChangeText={(text) => this.setState({ itemHeight: text })}
                keyboardType="numeric"
                placeholder="-- inches"
                keyboardAppearance="light"
                placeholderTextColor={"#d3d3d3"}
                maxLength={3}
              />
              <Text style={[styles.label, styles.condensedLabel]}>Quantity:</Text>
              <TextInput
                style={[styles.input, styles.condensedInput]}
                value={this.state.quantity.toString()}
                onChangeText={(text) => {
                  const newQuantity = text === "" ? "" : parseInt(text);
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
            </VStack>
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
                <Text 
                  style={styles.buttonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.itemName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.savePackageButton}
              onPress={this.toggleSavePackageModal}
            >
              <Text style={styles.buttonText}>Save Package</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.visualizeButton}
              onPress={this.handleVisualize}
            >
              <Text style={styles.buttonText}>Pack!</Text>
            </TouchableOpacity>
          </View>

          {/* Save Package Modal */}
          <Modal
            visible={this.state.showSavePackageModal}
            animationType="slide"
            transparent={true}
            onRequestClose={this.toggleSavePackageModal}
          >
            <TouchableWithoutFeedback onPress={this.toggleSavePackageModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 24 }]}>
                    <TextInput
                      style={[styles.input, { 
                        textAlign: 'center', 
                        width: '80%',
                        marginBottom: 20,
                        fontSize: 16,
                      }]}
                      value={this.state.packageName}
                      onChangeText={(text) => this.setState({ packageName: text })}
                      placeholder="Enter Package Name"
                      placeholderTextColor="#94A3B8"
                      autoFocus={true}
                      autoCorrect={false}
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    <TouchableOpacity
                      style={[styles.buttonApply1, { 
                        width: 100,
                        height: 40,
                        alignItems: 'center', 
                        justifyContent: 'center'
                      }]}
                      onPress={this.handleSavePackage}
                    >
                      <Text style={[styles.buttonText, { textAlign: 'center' }]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
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