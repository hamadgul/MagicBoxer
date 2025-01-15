// FormPage.js

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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { VStack } from "native-base";  
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import styles from "../components/Styles";
import { modalStyles } from "../components/ModalStyles";
var Buffer = require("@craftzdog/react-native-buffer").Buffer;
const productList = require('../products.json') || [];

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
  const [isEditable, setIsEditable] = React.useState(false);
  const [editedItem, setEditedItem] = React.useState({
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

  const handleQuantityChange = (action) => {
    const currentQuantity = parseInt(editedItem.quantity) || 0;
    if (action === 'decrease' && currentQuantity > 1) {
      setEditedItem({ ...editedItem, quantity: (currentQuantity - 1).toString() });
    } else if (action === 'increase') {
      setEditedItem({ ...editedItem, quantity: (currentQuantity + 1).toString() });
    }
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
            <View style={[modalStyles.modalContent]}>
              <View style={[modalStyles.modalHeader]}>
                <Text style={[modalStyles.modalTitle, { color: 'white' }]}>
                  {isEditable ? "Edit Item" : "Item Details"}
                </Text>
              </View>

              <ScrollView 
                style={{ width: '97%', maxHeight: '80%' }} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={{ width: '100%' }}>
                  <View style={modalStyles.fieldRow}>
                    <Text style={modalStyles.fieldLabel}>Name:</Text>
                    {isEditable ? (
                      <TextInput
                        style={[
                          modalStyles.fieldValue,
                          {
                            backgroundColor: '#F8FAFC',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: '#334155',
                            height: 42,
                          }
                        ]}
                        value={editedItem.itemName}
                        onChangeText={(text) =>
                          setEditedItem({ ...editedItem, itemName: text })
                        }
                        maxLength={20}
                      />
                    ) : (
                      <Text style={modalStyles.fieldValue}>{item?.itemName}</Text>
                    )}
                  </View>
                  
                  <View style={modalStyles.fieldRow}>
                    <Text style={modalStyles.fieldLabel}>Length:</Text>
                    {isEditable ? (
                      <View style={[
                        modalStyles.fieldValue,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#F8FAFC',
                          borderRadius: 8,
                          paddingVertical: 0,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          minHeight: 44,
                        }
                      ]}>
                        <TextInput
                          style={{
                            flex: 1,
                            fontSize: 15,
                            color: '#334155',
                            paddingVertical: 8,
                          }}
                          value={editedItem.itemLength}
                          onChangeText={(text) => {
                            setEditedItem({ ...editedItem, itemLength: text });
                          }}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                        <Text style={{ 
                          fontSize: 15,
                          color: '#94A3B8',
                        }}>inches</Text>
                      </View>
                    ) : (
                      <Text style={modalStyles.fieldValue}>{item?.itemLength} inches</Text>
                    )}
                  </View>
                  
                  <View style={modalStyles.fieldRow}>
                    <Text style={modalStyles.fieldLabel}>Width:</Text>
                    {isEditable ? (
                      <View style={[
                        modalStyles.fieldValue,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#F8FAFC',
                          borderRadius: 8,
                          paddingVertical: 0,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          minHeight: 44,
                        }
                      ]}>
                        <TextInput
                          style={{
                            flex: 1,
                            fontSize: 15,
                            color: '#334155',
                            paddingVertical: 8,
                          }}
                          value={editedItem.itemWidth}
                          onChangeText={(text) => {
                            setEditedItem({ ...editedItem, itemWidth: text });
                          }}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                        <Text style={{ 
                          fontSize: 15,
                          color: '#94A3B8',
                        }}>inches</Text>
                      </View>
                    ) : (
                      <Text style={modalStyles.fieldValue}>{item?.itemWidth} inches</Text>
                    )}
                  </View>
                  
                  <View style={modalStyles.fieldRow}>
                    <Text style={modalStyles.fieldLabel}>Height:</Text>
                    {isEditable ? (
                      <View style={[
                        modalStyles.fieldValue,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#F8FAFC',
                          borderRadius: 8,
                          paddingVertical: 0,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          minHeight: 44,
                        }
                      ]}>
                        <TextInput
                          style={{
                            flex: 1,
                            fontSize: 15,
                            color: '#334155',
                            paddingVertical: 8,
                          }}
                          value={editedItem.itemHeight}
                          onChangeText={(text) => {
                            setEditedItem({ ...editedItem, itemHeight: text });
                          }}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                        <Text style={{ 
                          fontSize: 15,
                          color: '#94A3B8',
                        }}>inches</Text>
                      </View>
                    ) : (
                      <Text style={modalStyles.fieldValue}>{item?.itemHeight} inches</Text>
                    )}
                  </View>
                  
                  <View style={[modalStyles.fieldRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <Text style={modalStyles.fieldLabel}>Quantity:</Text>
                    {isEditable ? (
                      <View style={[
                        modalStyles.fieldValue,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#F8FAFC',
                          borderRadius: 8,
                          paddingVertical: 0,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          minHeight: 44,
                        }
                      ]}>
                        <TouchableOpacity
                          onPress={() => handleQuantityChange('decrease')}
                          style={{
                            paddingVertical: 8,
                            paddingRight: 12,
                          }}
                        >
                          <Text style={{ fontSize: 20, color: '#334155' }}>-</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={{
                            flex: 1,
                            fontSize: 15,
                            color: '#334155',
                            textAlign: 'center',
                            paddingVertical: 8,
                          }}
                          value={editedItem.quantity.toString()}
                          onChangeText={(text) => {
                            const newQuantity = parseInt(text) || 0;
                            setEditedItem({ ...editedItem, quantity: newQuantity });
                          }}
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          onPress={() => handleQuantityChange('increase')}
                          style={{
                            paddingVertical: 8,
                            paddingLeft: 12,
                          }}
                        >
                          <Text style={{ fontSize: 20, color: '#334155' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={modalStyles.fieldValue}>{item?.quantity || 1}</Text>
                    )}
                  </View>
                </View>
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
      itemWidth: "",
      itemHeight: "",
      itemLength: "",
      quantity: 1,
      items: [],
      selectedItem: null,
      showSavePackageModal: false,
      packageName: '',
      isLoading: false,
      filteredProducts: [],
      showSuggestions: false
    };
    this.inputRef = React.createRef();
  }

  handleChange = (text) => {
    this.setState({ itemName: text });
    
    if (!text.trim()) {
      this.setState({ 
        filteredProducts: [],
        showSuggestions: false 
      });
      return;
    }

    const results = productList.filter(product =>
      product.name.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions

    this.setState({ 
      filteredProducts: results,
      showSuggestions: results.length > 0
    });
  }

  handleProductSelect = (product) => {
    // Extract numeric values from dimension strings
    const extractDimension = (dim) => {
      const match = dim.match(/(\d+\.?\d*)/);
      return match ? match[1] : "";
    };

    this.setState({
      itemName: product.name,
      itemLength: extractDimension(product.dimensions.length),
      itemWidth: extractDimension(product.dimensions.width),
      itemHeight: extractDimension(product.dimensions.height),
      showSuggestions: false,
      filteredProducts: []
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update if these state values change
    const relevantStateKeys = [
      'itemName',
      'itemLength',
      'itemWidth',
      'itemHeight',
      'quantity',
      'items',
      'showDetails',
      'selectedItem',
      'showSavePackageModal',
      'packageName',
      'isLoading'
    ];

    return relevantStateKeys.some(key => this.state[key] !== nextState[key]);
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
        
        // Ensure each item has replicatedNames with proper structure
        const validatedItems = deserializedItems.map(item => {
          if (!item.replicatedNames || !item.replicatedNames[0]?.id) {
            const quantity = item.quantity || 1;
            item.replicatedNames = Array.from({ length: quantity }, (_, i) => ({
              name: item.itemName,
              id: generateUUID(),
              parentId: item.id
            }));
          }
          return item;
        });

        this.setState({ items: validatedItems });
      }
    } catch (error) {
      console.error("Error loading items:", error);
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
    const replicatedNames = Array.from({ length: quantity }, (_, i) => ({
      name: updatedItem.itemName,
      id: generateUUID(),
      parentId: updatedItem.id
    }));

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
        Alert.alert("Success", `${updatedItem.itemName} was successfully updated`);
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

  prepareItemsForPacking = (items) => {
    let itemsTotal = [];
    
    if (!items || !Array.isArray(items)) {
      return null;
    }
    
    items.forEach((item) => {
      if (!item || !Array.isArray(item.replicatedNames)) {
        console.warn("Invalid item or missing replicatedNames:", item);
        return;
      }
      
      item.replicatedNames.forEach((replicatedName) => {
        itemsTotal.push([
          item.itemLength,
          item.itemWidth,
          item.itemHeight,
          item.id,
          "No Carrier",
          replicatedName.name || item.itemName || "Unnamed Item",
        ]);
      });
    });

    return itemsTotal;
  }

  handleVisualize = async () => {
    if (this.state.items.length === 0) {
      Alert.alert("No Items", "Please add at least one item before packing.");
      return;
    }

    this.setState({ isLoading: true });

    try {
      const itemListString = await AsyncStorage.getItem("itemList");
      let itemList = [];
      if (itemListString) {
        const deserializedItems = JSON.parse(
          Buffer.from(itemListString, "base64").toString("utf8")
        );
        itemList = deserializedItems;
      }

      // Use requestAnimationFrame to ensure smooth UI updates
      requestAnimationFrame(() => {
        this.setState({ items: itemList }, () => {
          const itemsTotal = this.prepareItemsForPacking(this.state.items);
          
          if (!itemsTotal || itemsTotal.length === 0) {
            this.setState({ isLoading: false });
            Alert.alert("Error", "No valid items to pack.");
            return;
          }

          const packedResult = pack(itemsTotal, "No Carrier", 0);
          if (!packedResult || packedResult.length === 0) {
            this.setState({ isLoading: false });
            Alert.alert("Error", "Failed to pack items.");
            return;
          }

          const scale = Math.max(packedResult.x, packedResult.y, packedResult.z) > 15 ? 20 : 10;
          const itemsDisplay = createDisplay(packedResult, scale);
          
          if (!itemsDisplay || !Array.isArray(itemsDisplay)) {
            this.setState({ isLoading: false });
            Alert.alert("Error", "Failed to create display items.");
            return;
          }

          const selectedBox = {
            dimensions: [packedResult.x, packedResult.y, packedResult.z],
            finalBoxType: packedResult.type,
            priceText: packedResult.priceText
          };

          this.setState({ isLoading: false }, () => {
            this.props.navigation.navigate("Display3D", {
              box: packedResult,
              itemsTotal: itemsDisplay,
              selectedBox: selectedBox,
              selectedCarrier: "No Carrier",
              items: this.state.items,
            });
          });
        });
      });
    } catch (error) {
      this.setState({ isLoading: false });
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

    const id = generateUUID();
    const replicatedNames = Array.from({ length: quantity }, (_, i) => ({
      name: this.state.itemName,
      id: generateUUID(),
      parentId: id
    }));

    const newItem = {
      id: id,
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

  renderItem = (item, index) => {
    const backgroundColor = itemButtonColors[index % itemButtonColors.length];
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemButton, { backgroundColor }]}
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
    );
  }

  renderItemsList = () => {
    const { items } = this.state;
    if (items.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#94A3B8', fontSize: 16, textAlign: 'left', marginBottom: 10 }}>
            No items added yet for this package.
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 16, textAlign: 'center' }}>
            Add items above and access saved packages on the side menu.
          </Text>
        </View>
      );
    }

    return items.map((item, index) => this.renderItem(item, index));
  }

  render() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={() => {
            Keyboard.dismiss();
            this.setState({ showSuggestions: false });
          }}>
            <View style={styles.container}>
              <View style={styles.formContainer}>
                <VStack space={2} width="100%">
                  <Text style={[styles.label, styles.condensedLabel]}>Name:</Text>
                  <View style={{ position: 'relative', zIndex: 1 }}>
                    <TextInput
                      ref={this.inputRef}
                      style={[styles.input, styles.condensedInput]}
                      value={this.state.itemName}
                      onChangeText={this.handleChange}
                      maxLength={50}
                      placeholder="MacBook, Xbox etc"
                      placeholderTextColor={"#d3d3d3"}
                      autoCorrect={false}
                      spellCheck={false}
                    />
                    {this.state.showSuggestions && (
                      <View style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 4,
                        maxHeight: 200,
                        zIndex: 1000,
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                      }}>
                        <ScrollView>
                          {this.state.filteredProducts.map((product) => (
                            <TouchableOpacity
                              key={product.id}
                              style={{
                                padding: 15,
                                borderBottomWidth: 1,
                                borderBottomColor: '#eee',
                              }}
                              onPress={() => this.handleProductSelect(product)}
                            >
                              <Text style={{ fontSize: 16 }}>{product.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.label, styles.condensedLabel]}>Length:</Text>
                  <View style={[styles.input, styles.condensedInput, { 
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                  }]}>
                    <TextInput
                      style={{
                        flex: 1,
                        height: '100%',
                        paddingHorizontal: 14,
                        fontSize: 15,
                        color: '#334155',
                      }}
                      value={this.state.itemLength}
                      onChangeText={(text) => this.setState({ itemLength: text })}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={{ 
                      paddingRight: 14,
                      fontSize: 15,
                      color: '#64748B',
                    }}>inches</Text>
                  </View>
                  <Text style={[styles.label, styles.condensedLabel]}>Width:</Text>
                  <View style={[styles.input, styles.condensedInput, { 
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                  }]}>
                    <TextInput
                      style={{
                        flex: 1,
                        height: '100%',
                        paddingHorizontal: 14,
                        fontSize: 15,
                        color: '#334155',
                      }}
                      value={this.state.itemWidth}
                      onChangeText={(text) => this.setState({ itemWidth: text })}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={{ 
                      paddingRight: 14,
                      fontSize: 15,
                      color: '#64748B',
                    }}>inches</Text>
                  </View>
                  <Text style={[styles.label, styles.condensedLabel]}>Height:</Text>
                  <View style={[styles.input, styles.condensedInput, { 
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                  }]}>
                    <TextInput
                      style={{
                        flex: 1,
                        height: '100%',
                        paddingHorizontal: 14,
                        fontSize: 15,
                        color: '#334155',
                      }}
                      value={this.state.itemHeight}
                      onChangeText={(text) => this.setState({ itemHeight: text })}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={{ 
                      paddingRight: 14,
                      fontSize: 15,
                      color: '#64748B',
                    }}>inches</Text>
                  </View>
                  <Text style={[styles.label, styles.condensedLabel]}>Quantity:</Text>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <TouchableOpacity 
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: '#F1F5F9',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8,
                      }}
                      onPress={() => {
                        const currentQuantity = parseInt(this.state.quantity) || 0;
                        if (currentQuantity > 1) {
                          this.setState({ quantity: currentQuantity - 1 });
                        }
                      }}
                    >
                      <Text style={{ fontSize: 20, color: '#64748B', fontWeight: '500' }}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.input, 
                        styles.condensedInput,
                        { 
                          flex: 1,
                          marginBottom: 0,
                          textAlign: 'center'
                        }
                      ]}
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
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: '#F1F5F9',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: 8,
                      }}
                      onPress={() => {
                        const currentQuantity = parseInt(this.state.quantity) || 0;
                        this.setState({ quantity: currentQuantity + 1 });
                      }}
                    >
                      <Text style={{ fontSize: 20, color: '#64748B', fontWeight: '500' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={this.handleSubmit}
                  >
                    <Text style={styles.buttonText}>Add item</Text>
                  </TouchableOpacity>
                </VStack>
              </View>

              <View style={styles.contentContainer}>
                <ScrollView
                  style={styles.itemsContainer}
                  contentContainerStyle={styles.itemsList}
                  removeClippedSubviews={true}
                  initialNumToRender={10}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  updateCellsBatchingPeriod={50}
                  keyboardShouldPersistTaps="handled"
                >
                  {this.renderItemsList()}
                </ScrollView>
              </View>

              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                  style={styles.savePackageButton}
                  onPress={this.toggleSavePackageModal}
                >
                  <Text style={styles.savePackageButtonText}>Save Package</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.packButton}
                  onPress={this.handleVisualize}
                  disabled={this.state.isLoading}
                >
                  {this.state.isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Pack</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Save Package Modal */}
              <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.showSavePackageModal}
                onRequestClose={this.toggleSavePackageModal}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={modalStyles.centeredView}>
                    <View style={modalStyles.modalContent}>
                      <View style={modalStyles.modalHeader}>
                        <Text style={modalStyles.modalTitle}>Save Package</Text>
                      </View>
                      <Text style={modalStyles.modalSubtitle}>
                        Enter a name for your package to save it for future use
                      </Text>
                      <View style={modalStyles.inputContainer}>
                        <TextInput
                          style={modalStyles.fieldInput}
                          placeholder="Enter package name"
                          placeholderTextColor="#9CA3AF"
                          value={this.state.packageName}
                          onChangeText={(text) => this.setState({ packageName: text })}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      <View style={modalStyles.modalButtonContainer}>
                        <TouchableOpacity
                          style={[modalStyles.button, modalStyles.cancelButton]}
                          onPress={this.toggleSavePackageModal}
                        >
                          <Text style={modalStyles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[modalStyles.button, modalStyles.applyButton]}
                          onPress={this.handleSavePackage}
                        >
                          <Text style={modalStyles.buttonText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.dropdownOpen &&
      !prevState.dropdownOpen
    ) {
      // Flash the scrollbar when dropdown opens
      this.setState({ flashScrollbar: true }, () => {
        if (this.scrollViewRef.current) {
          // Scroll slightly to trigger the scrollbar
          this.scrollViewRef.current.scrollTo({ y: 1, animated: true });
          setTimeout(() => {
            // Scroll back
            this.scrollViewRef.current.scrollTo({ y: 0, animated: true });
            this.setState({ flashScrollbar: false });
          }, 500);
        }
      });
    }
  }
}