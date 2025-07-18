// FormPage.js

import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  ToastAndroid,
  BackHandler,
  InteractionManager,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { VStack } from "native-base";  
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';

import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import { isIpad } from "../utils/screenScaling";
import styles from "../theme/Styles";
import { modalStyles } from "../theme/ModalStyles";
import { Ionicons } from "@expo/vector-icons";
import base64 from 'base-64';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width, height) / 375; // Base scale on iPhone 8 dimensions

// Common tooltip modal styles
const tooltipModalStyles = {
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxWidth: 350,
    maxHeight: '80%', // Prevent overflow on smaller screens
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#000', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  contentContainer: { 
    width: '100%', 
    marginBottom: 20 
  },
  iconContainer: {
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12
  },
  rowContainer: {
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 16
  },
  textContainer: {
    flex: 1, // Allow text to wrap properly
  },
  tipContainer: {
    backgroundColor: '#F2F2F7', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 20, 
    width: '100%'
  },
  tipText: {
    fontSize: 14, 
    color: '#555', 
    textAlign: 'center', 
    lineHeight: 20
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    elevation: 2,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonText: {
    color: 'white', 
    fontWeight: '600', 
    fontSize: 16
  },
  labelText: {
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000'
  },
  descriptionText: {
    fontSize: 15, 
    color: '#555', 
    marginTop: 2
  },
};


// Make sure ItemDetailsModal is exported correctly
export const ItemDetailsModal = ({
  visible,
  item,
  closeModal,
  handleUpdateItem,
  handleDeleteAndClose,
  showBackButton = false,
  onBackButtonPress,
}) => {
  const [isEditable, setIsEditable] = React.useState(false);
  const [editedItem, setEditedItem] = React.useState({
    itemName: "",
    itemLength: "",
    itemWidth: "",
    itemHeight: "",
    quantity: "1",
  });
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  // Log when modal becomes visible for debugging
  React.useEffect(() => {
    if (visible) {
      console.log('ItemDetailsModal became visible, item:', item?.id);
    }
  }, [visible]);
  
  // Update editedItem whenever the item prop changes
  React.useEffect(() => {
    try {
      if (item) {
        console.log('ItemDetailsModal received item update:', item.id);
        setEditedItem({
          itemName: item.itemName || "",
          itemLength: item.itemLength?.toString() || "",
          itemWidth: item.itemWidth?.toString() || "",
          itemHeight: item.itemHeight?.toString() || "",
          quantity: item.quantity?.toString() || "1",
        });
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Error updating editedItem:', error);
    }
  }, [item]);

  const handleEditToggle = () => {
    if (isEditable) {
      // Reset form when canceling edit
      if (item) {
        setEditedItem({
          itemName: item.itemName || "",
          itemLength: item.itemLength?.toString() || "",
          itemWidth: item.itemWidth?.toString() || "",
          itemHeight: item.itemHeight?.toString() || "",
          quantity: item.quantity?.toString() || "1",
        });
      }
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

  const handleBackPress = () => {
    if (onBackButtonPress) {
      onBackButtonPress();
    } else {
      closeModal();
    }
  };

  // Safety check for production builds
  const safeItem = React.useMemo(() => {
    if (!item) return null;
    try {
      // Validate that item has all required properties
      const validatedItem = {
        ...item,
        itemName: item.itemName || '',
        itemLength: item.itemLength || 0,
        itemWidth: item.itemWidth || 0,
        itemHeight: item.itemHeight || 0,
        quantity: item.quantity || 1,
      };
      return validatedItem;
    } catch (error) {
      console.error('Error validating item:', error);
      return null;
    }
  }, [item]);

  // Don't render if there's no valid item or if modal isn't visible
  if (!visible || !safeItem) {
    return null;
  }
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible && isLoaded}
      onRequestClose={() => {
        console.log('Modal onRequestClose triggered');
        // Handle back button press properly
        if (!isEditable) {
          if (showBackButton && onBackButtonPress) {
            // Use the custom back button handler if provided
            onBackButtonPress();
          } else {
            closeModal();
          }
        }
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
              <View style={[modalStyles.modalHeader, { height: 54 }]}>
                {showBackButton && !isEditable && (
                  <TouchableOpacity
                    style={{ position: 'absolute', left: 15, top: 15, zIndex: 1 }}
                    onPress={handleBackPress}
                  >
                    <Ionicons name="arrow-back" size={24} color="#64748B" />
                  </TouchableOpacity>
                )}
                <View style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  top: 0, 
                  bottom: 0, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  paddingHorizontal: 40 
                }}>
                  <Text 
                    style={[modalStyles.modalTitle, { 
                      color: '#64748B', // Updated to match the item name text color
                      textAlign: 'center'
                    }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {isEditable ? "Edit Item" : item?.itemName}
                  </Text>
                </View>
              </View>

              <ScrollView 
                style={{ width: '97%', maxHeight: '80%' }} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={{ width: '100%' }}>
                  {isEditable ? (
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Name:</Text>
                      <TextInput
                        style={[
                          modalStyles.fieldValue,
                          {
                            backgroundColor: '#F8FAFC',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            paddingVertical: 8,
                            paddingHorizontal: 16,
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
                    </View>
                  ) : null}
                  
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

// Use the simplest approach with inline tooltips
const isTablet = Math.max(width, height) >= 768;

// Style for the label row with tooltip
const tooltipContainerStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  height: 20,
  marginBottom: 2,
};

// No fixed width for labels - let them take their natural width

// Simple tooltip icon style - positioned right next to the label
const tooltipIconStyle = {
  height: 20,
  width: 20,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 2, // Small gap between label and icon
};

export default class FormPage extends Component {
  constructor(props) {
    super(props);
    this.scrollViewRef = React.createRef(); // Initialize ref here
    this.state = {
      savedItemsSearchQuery: '',
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
      showSuggestions: false,
      nameInputFocused: false,
      preventAutoFocus: false, // Flag to prevent auto-focus after returning from AI Search
      hasMatchingRecentItems: true, // Track if there are matching recent items
      productList: [], // Initialize with empty array instead of defaultProductList
      recentSavedItems: [], // Store recently saved items
      allSavedItems: [], // Store all saved items
      showRecentItems: true, // Start with recent items visible by default
      showAllSavedItemsModal: false, // For the modal with all items
      flashScrollbar: false,
      dimensionsFromSavedItem: false, // Track if dimensions are from a saved item
      contentScrollable: false, // Whether horizontal content is scrollable
      currentScrollX: 0, // Current horizontal scroll position
      contentWidth: 0, // Total width of scrollable content
      containerWidth: 0, // Width of the container
      canScrollLeft: false, // Whether we can scroll left
      canScrollRight: false, // Whether we can scroll right
      // Bulk selection state for saved items modal
      savedItemsSelectionMode: false,
      selectedSavedItems: [],
      isBulkAddInProgress: false
    };
    this.inputRef = React.createRef();
  }

  // Load saved items from SavedItems page for suggestions
  // Keep the original method for backward compatibility
  loadSavedItemsForSuggestions = async () => {
    await this.loadSavedItemsAsync();
  };
  
  // New method that returns a promise for better async handling
  loadSavedItemsAsync = async () => {
    try {
      const savedItemsString = await AsyncStorage.getItem("savedItems");
      if (savedItemsString) {
        const savedItems = JSON.parse(savedItemsString);
        
        // Log the structure of the first saved item for debugging
        if (savedItems.length > 0) {
          console.log('First saved item structure:', JSON.stringify(savedItems[0]));
        }
        
        // Sort items by timestamp, newest first
        const sortedItems = savedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        this.setState({
          allSavedItems: sortedItems,
          recentSavedItems: sortedItems, // Show all saved items instead of limiting to 5
          showRecentItems: true,
        });
        console.log(
          `Loaded ${sortedItems.length} total saved items, showing all in recent bar.`
        );
      } else {
        this.setState({ recentSavedItems: [], showRecentItems: false });
      }
    } catch (error) {
      console.error("Error loading saved items for suggestions:", error);
      this.setState({ recentSavedItems: [], allSavedItems: [], showRecentItems: false });
    }
  };

    showAllSavedItemsModal = () => this.setState({ showAllSavedItemsModal: true });

  hideAllSavedItemsModal = () => this.setState({ showAllSavedItemsModal: false });

  selectSavedItem = (item) => {
    const name = item.name || '';
    let length = '';
    let width = '';
    let height = '';

    // From SavedItemsPage.jsx, we know the structure is item.dimensions.length, etc.
    // The values are strings like "10.00 inches", so we need to parse the numeric part.
    if (item.dimensions) {
      length = parseFloat(item.dimensions.length) || '';
      width = parseFloat(item.dimensions.width) || '';
      height = parseFloat(item.dimensions.height) || '';
    }

    this.setState({
      itemName: name,
      itemLength: String(length),
      itemWidth: String(width),
      itemHeight: String(height),
      dimensionsFromSavedItem: true, // This flag makes the dimension fields read-only
      showRecentItems: false, // Hide the suggestions bar after selection
      showAllSavedItemsModal: false, // Also close the modal if it was open
    });
  };

  handleSelectSavedItem = (item) => {
    this.selectSavedItem(item);
    this.hideAllSavedItemsModal();
  };
  
  // Bulk selection methods for saved items modal
  enterBulkSelectionMode = () => {
    this.setState({
      savedItemsSelectionMode: true,
      selectedSavedItems: []
    });
  };

  exitBulkSelectionMode = () => {
    this.setState({
      savedItemsSelectionMode: false,
      selectedSavedItems: []
    });
  };

  toggleSavedItemSelection = (item) => {
    const { selectedSavedItems } = this.state;
    const isSelected = selectedSavedItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      this.setState({
        selectedSavedItems: selectedSavedItems.filter(selected => selected.id !== item.id)
      });
    } else {
      this.setState({
        selectedSavedItems: [...selectedSavedItems, item]
      });
    }
  };

  selectAllSavedItems = () => {
    const { allSavedItems, items } = this.state;
    // Only select items that are not already added to the package
    const selectableItems = allSavedItems.filter(item => {
      const itemName = item.itemName || item.name || '';
      return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase());
    });
    
    this.setState({
      selectedSavedItems: selectableItems
    });
  };

  clearAllSavedItemsSelection = () => {
    this.setState({
      selectedSavedItems: []
    });
  };

  bulkAddSavedItemsToPackage = async () => {
    const { selectedSavedItems } = this.state;
    
    if (selectedSavedItems.length === 0) {
      return;
    }

    this.setState({ isBulkAddInProgress: true });

    try {
      // Create new items from selected saved items with proper structure
      const newItems = selectedSavedItems.map(item => {
        const name = item.name || item.itemName || '';
        let length = '';
        let width = '';
        let height = '';

        // Parse dimensions from saved item - check multiple possible structures
        if (item.dimensions) {
          length = parseFloat(item.dimensions.length) || '';
          width = parseFloat(item.dimensions.width) || '';
          height = parseFloat(item.dimensions.height) || '';
        } else if (item.itemLength && item.itemWidth && item.itemHeight) {
          // Direct properties
          length = parseFloat(item.itemLength) || '';
          width = parseFloat(item.itemWidth) || '';
          height = parseFloat(item.itemHeight) || '';
        }

        const itemId = generateUUID();
        const quantity = 1;
        
        // Create replicatedNames array (required for Test Pack functionality)
        const replicatedNames = Array.from({ length: quantity }, (_, i) => ({
          name: name,
          id: generateUUID(),
          parentId: itemId
        }));

        return {
          id: itemId,
          itemName: name,
          itemLength: length,  // Keep as number for packing algorithm
          itemWidth: width,    // Keep as number for packing algorithm
          itemHeight: height,  // Keep as number for packing algorithm
          selectedCarrier: 'No Carrier',
          quantity: quantity,
          replicatedNames: replicatedNames, // This is crucial for Test Pack to work
        };
      });

      // Add all new items to the items array
      const updatedItems = [...this.state.items, ...newItems];
      
      this.setState({ items: updatedItems }, async () => {
        try {
          // Save items to AsyncStorage
          const serializedItems = Buffer.from(
            JSON.stringify(this.state.items)
          ).toString("base64");
          await AsyncStorage.setItem("itemList", serializedItems);

          // Show success message
          Alert.alert(
            'Success',
            `${selectedSavedItems.length} item${selectedSavedItems.length > 1 ? 's' : ''} added to package`,
            [{ text: 'OK' }]
          );

          // Exit bulk selection mode and close modal
          this.setState({
            savedItemsSelectionMode: false,
            selectedSavedItems: [],
            showAllSavedItemsModal: false
          });
        } catch (error) {
          console.error('Error saving items:', error);
          Alert.alert('Error', 'Failed to save items to storage');
        }
      });
    } catch (error) {
      console.error('Error during bulk add:', error);
      Alert.alert('Error', 'Failed to add items to package');
    } finally {
      this.setState({ isBulkAddInProgress: false });
    }
  };

  // Override hideAllSavedItemsModal to reset bulk selection state
  hideAllSavedItemsModal = () => {
    this.setState({ 
      showAllSavedItemsModal: false,
      savedItemsSelectionMode: false,
      selectedSavedItems: []
    });
  };
  
  loadCustomProducts = async () => {
    try {
      // Load custom products from AsyncStorage
      const customProductsString = await AsyncStorage.getItem("customProducts");
      let customProducts = [];
      
      if (customProductsString) {
        customProducts = JSON.parse(customProductsString);
      }
      
      // Just use the custom products directly since we no longer have defaultProductList
      this.setState({ productList: customProducts });
      console.log(`Loaded ${customProducts.length} custom products`);
    } catch (error) {
      console.error("Error loading custom products:", error);
    }
  };

  handleChange = (text) => {
    // Check if backspace was pressed (text is shorter than current itemName)
    const wasBackspacePressed = text.length < this.state.itemName.length;
    
    // If backspace was pressed and dimensions were from a saved item, reset the form
    if (wasBackspacePressed && this.state.dimensionsFromSavedItem) {
      // Clear the entire name field and reset form with a single backspace
      this.setState({
        itemName: "",
        itemLength: "",
        itemWidth: "",
        itemHeight: "",
        filteredProducts: [],
        showSuggestions: false,
        showRecentItems: true,
        hasMatchingRecentItems: true, // Reset to true when clearing
        dimensionsFromSavedItem: false, // Reset the tracking state
        showAllSavedItemsModal: false,
        showDimensionsTooltip: false,
        showLengthTooltip: false,
        showWidthTooltip: false,
        showHeightTooltip: false,
        showNameTooltip: false,
      });
      return;
    }
    
    this.setState({ itemName: text });
    
    if (!text.trim()) {
      this.setState({ 
        filteredProducts: [],
        showSuggestions: false,
        showRecentItems: true, // Show recent items when input is empty
        hasMatchingRecentItems: true // All items match when input is empty
      });
      return;
    }

    // Check if there are any matching recent items for the current text
    const { recentSavedItems, items } = this.state;
    const searchText = text.toLowerCase().trim();
    
    // Filter out items already in the container and then check for matches
    const availableItems = recentSavedItems.filter(item => {
      const name = item.itemName || item.name || '';
      return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === name.toLowerCase());
    });
    
    const hasMatches = availableItems.some(item => {
      const name = (item.itemName || item.name || '').toLowerCase();
      return name.includes(searchText);
    });

    // Keep recent items visible while typing to show filtered results
    // This allows the filtering in the render method to work
    this.setState({ 
      filteredProducts: [],
      showSuggestions: false,
      showRecentItems: true, // Keep recent items visible to show filtered results
      hasMatchingRecentItems: hasMatches // Update whether we have matching items
    });
  };

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

  // Memoized calculation for input border styles to improve render performance
  getInputBorderStyles = () => {
    const { recentSavedItems, items, showRecentItems, itemName } = this.state;
    
    // Calculate available items (not already in container) - single calculation instead of 3 identical ones
    const availableItems = recentSavedItems.filter(item => {
      const name = item.itemName || item.name || '';
      return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === name.toLowerCase());
    });
    
    let shouldConnect = false;
    
    if (itemName.trim().length > 0) {
      const searchText = itemName.toLowerCase().trim();
      const hasMatchingItems = availableItems.some(item => {
        const name = (item.itemName || item.name || '').toLowerCase();
        return name.includes(searchText);
      });
      shouldConnect = showRecentItems && hasMatchingItems;
    } else {
      shouldConnect = showRecentItems && availableItems.length > 0;
    }
    
    return {
      borderBottomWidth: shouldConnect ? 0 : 1,
      borderBottomLeftRadius: shouldConnect ? 0 : 8,
      borderBottomRightRadius: shouldConnect ? 0 : 8
    };
  }

  // Bound methods to replace inline functions and improve performance
  handleDismissKeyboard = () => {
    Keyboard.dismiss();
    this.setState({ 
      showSuggestions: false,
      showRecentItems: false
    });
  }

  handleShowNameTooltip = () => {
    this.setState({ showNameTooltip: true });
  }

  handleHideNameTooltip = () => {
    this.setState({ showNameTooltip: false });
  }

  handleShowLengthTooltip = () => {
    this.setState({ showLengthTooltip: true });
  }

  handleHideLengthTooltip = () => {
    this.setState({ showLengthTooltip: false });
  }

  handleShowWidthTooltip = () => {
    this.setState({ showWidthTooltip: true });
  }

  handleHideWidthTooltip = () => {
    this.setState({ showWidthTooltip: false });
  }

  handleShowHeightTooltip = () => {
    this.setState({ showHeightTooltip: true });
  }

  handleHideHeightTooltip = () => {
    this.setState({ showHeightTooltip: false });
  }

  handleShowDimensionsTooltip = () => {
    this.setState({ showDimensionsTooltip: true });
  }

  handleHideDimensionsTooltip = () => {
    this.setState({ showDimensionsTooltip: false });
  }

  handleNameInputFocus = () => {
    if (!this.state.itemName.trim()) {
      this.setState({ 
        showRecentItems: true,
        showSuggestions: false
      });
    }
  }

  handleNavigateToAISearch = () => {
    console.log("FormPage - AI Search: setting isInternalNavigation = true");
    this.isInternalNavigation = true;
    
    this.props.navigation.navigate('AI Item Search', { 
      searchQuery: this.state.itemName,
      fromFormPage: true
    });
    
    // Reset flag after navigation
    setTimeout(() => {
      console.log("FormPage - AI Search: resetting isInternalNavigation = false");
      this.isInternalNavigation = false;
    }, 300);
  }

  handleQuantityDecrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentQuantity = parseInt(this.state.quantity) || 0;
    if (currentQuantity > 1) {
      this.setState({ quantity: currentQuantity - 1 });
    }
  }

  handleQuantityIncrease = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentQuantity = parseInt(this.state.quantity) || 0;
    this.setState({ quantity: currentQuantity + 1 });
  }

  handleClearItems = () => {
    this.setState({ items: [] });
  }

  handleSavePackage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.toggleSavePackageModal();
  }

  handleShowAllSavedItems = () => {
    this.showAllSavedItemsModal();
  }

  handleSubmitWithHaptics = () => {
    this.handleSubmit();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  handleTestPack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.handleVisualize();
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
      'isLoading',
      'showAllSavedItemsModal',
      'allSavedItems',
      'recentSavedItems',
      'showRecentItems',
      'savedItemsSearchQuery',
      'showDimensionsTooltip',
      'showLengthTooltip',
      'showWidthTooltip',
      'showHeightTooltip',
      'showNameTooltip',
      'savedItemsSelectionMode',
      'selectedSavedItems',
      'isBulkAddInProgress'
    ];

    return relevantStateKeys.some(key => this.state[key] !== nextState[key]);
  }

  componentDidMount() {
    console.log("FormPage - componentDidMount");
    
    // First load all data
    Promise.all([
      this.loadItems(),
      this.loadCustomProducts(),
      this.loadSavedItemsAsync() // New method that returns a promise
    ]).then(() => {
      // After all data is loaded, force update to ensure rendering
      console.log("FormPage - All data loaded, forcing update");
      this.setState({ showRecentItems: true });
      this.forceUpdate();
    });
    
    // Refresh data when the screen comes into focus
    this.focusListener = this.props.navigation.addListener(
      "focus",
      () => {
        console.log("FormPage - focus event");
        Promise.all([
          this.loadCustomProducts(),
          this.loadItems(),
          this.loadSavedItemsAsync()
        ]).then(() => {
          // Check if we need to load a saved package
          if (this.props.route.params?.loadPackage) {
            const packageToLoad = this.props.route.params.loadPackage;
            this.loadPackage(packageToLoad);
          }
          
          // Check if we need to add a new item from AI Search via global variable
          if (global.newItemFromAISearch) {
            console.log('FormPage - Processing item from AI Search:', global.newItemFromAISearch);
            const { newItem, clearNameField } = global.newItemFromAISearch;
            
            // Make sure we have a valid item before trying to add it
            if (newItem && typeof newItem === 'object') {
              console.log('FormPage - Adding item from AI Search:', newItem);
              // Pass true to skip resetting the form when adding item from AI Search
              this.addItemFromAISearch(newItem, true);
            } else {
              console.error('FormPage - Invalid item data received from AI Search:', newItem);
            }
            
            // Clear just the name field if requested and prevent auto-focus
            if (clearNameField) {
              this.setState({ 
                itemName: "",
                preventAutoFocus: true // Prevent auto-focus when returning from AI Search
              });
              
              // Use a timeout to ensure the keyboard is dismissed after the component has fully rendered
              setTimeout(() => {
                // Explicitly blur the input field to prevent keyboard from showing
                if (this.inputRef && this.inputRef.current) {
                  this.inputRef.current.blur();
                }
                
                // Dismiss keyboard explicitly
                Keyboard.dismiss();
              }, 100);
            }
            
            // Clear the global variable to prevent duplicate additions
            global.newItemFromAISearch = null;
          }
          
          // After all data is loaded on focus, ensure recent items are shown
          this.setState({ showRecentItems: true });
          this.forceUpdate();
        });
        
        // Remove custom header left button since we're using bottom tab navigation
        
        // Drawer gesture management removed since we're using bottom tab navigation
      }
    );
    
    // Initialize navigation dialog flag
    this.isShowingNavigationDialog = false;
    
    // Flag to track internal navigation (AI Search, Test Pack, etc.)
    this.isInternalNavigation = false;
    
    // Add a direct hardware back button handler for Android
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        console.log("FormPage - hardware back button pressed");
        // If there are items in the container and no dialog is showing, show confirmation
        if (this.state.items.length > 0 && !this.isShowingNavigationDialog) {
          console.log("FormPage - showing alert for back button");
          this.isShowingNavigationDialog = true;
          Alert.alert(
            "Unsaved Changes",
            "You have unsaved items in your package. What would you like to do?",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  console.log("FormPage - user chose Cancel");
                  this.isShowingNavigationDialog = false;
                  // User decided to stay on the page
                }
              },
              {
                text: "Discard",
                style: "destructive",
                onPress: () => {
                  console.log("FormPage - user chose Discard");
                  this.isShowingNavigationDialog = false;
                  // Clear items and continue with navigation (no confirmation needed)
                  this.clearItemsWithoutConfirmation();
                  // Go back
                  this.props.navigation.goBack();
                }
              },
              {
                text: "Save Package",
                style: "default",
                onPress: () => {
                  console.log("FormPage - user chose Save Package");
                  this.isShowingNavigationDialog = false;
                  // Open the save package modal
                  this.setState({ showSavePackageModal: true });
                }
              }
            ],
            { cancelable: false }
          );
          return true; // Prevents default back action
        }
        return false; // Allow default back action
      }
    );
    
    // Add a beforeRemove listener to catch navigation attempts
    this.beforeRemoveListener = this.props.navigation.addListener(
      'beforeRemove',
      (e) => {
        console.log("FormPage - beforeRemove event", e.data.action);
        console.log("FormPage - action payload:", e.data.action?.payload);
        
        // If there are no items, allow navigation
        if (this.state.items.length === 0) {
          console.log("FormPage - no items, allowing navigation");
          return;
        }
        
        // Check if we're navigating within the FormPage stack (AI Search, Test Pack, etc.)
        // These should not trigger the dialog
        const action = e.data.action;
        if (action && action.payload && action.payload.name) {
          const targetScreen = action.payload.name;
          const allowedScreens = ['AI Item Search', 'Display3D', 'Shipping Estimate'];
          
          if (allowedScreens.includes(targetScreen)) {
            console.log(`FormPage - allowing navigation to ${targetScreen} (within FormPage stack)`);
            console.log("FormPage - setting isInternalNavigation = true");
            this.isInternalNavigation = true;
            // Reset the flag after a short delay to allow blur event to check it
            setTimeout(() => {
              console.log("FormPage - resetting isInternalNavigation = false");
              this.isInternalNavigation = false;
            }, 200);
            return;
          }
        }
        
        // If dialog is already showing, prevent duplicate
        if (this.isShowingNavigationDialog) {
          console.log("FormPage - dialog already showing, preventing duplicate");
          e.preventDefault();
          return;
        }
        
        // Prevent default navigation
        e.preventDefault();
        console.log("FormPage - prevented navigation");
        this.isShowingNavigationDialog = true;
        
        // Show confirmation dialog
        Alert.alert(
          "Unsaved Changes",
          "You have unsaved items in your package. What would you like to do?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                console.log("FormPage - user chose Cancel");
                this.isShowingNavigationDialog = false;
                // User decided to stay on the page
              }
            },
            {
              text: "Discard",
              style: "destructive",
              onPress: () => {
                console.log("FormPage - user chose Discard");
                this.isShowingNavigationDialog = false;
                // Clear items and continue with navigation (no confirmation needed)
                this.clearItemsWithoutConfirmation();
                // Continue with navigation using proper method
                setTimeout(() => {
                  this.props.navigation.dispatch(e.data.action);
                }, 100);
              }
            },
            {
              text: "Save Package",
              style: "default",
              onPress: () => {
                console.log("FormPage - user chose Save Package");
                this.isShowingNavigationDialog = false;
                // Store the navigation action for after saving
                this.pendingNavigationAction = e.data.action;
                // Open the save package modal
                this.setState({ showSavePackageModal: true });
              }
            }
          ],
          { cancelable: false }
        );
      }
    );
    

    // Add a blur listener to catch tab navigation
    this.blurListener = this.props.navigation.addListener(
      'blur',
      () => {
        console.log("FormPage - blur event (tab navigation)");
        console.log("FormPage - isInternalNavigation:", this.isInternalNavigation);
        console.log("FormPage - items.length:", this.state.items.length);
        console.log("FormPage - isShowingNavigationDialog:", this.isShowingNavigationDialog);
        
        // Only show dialog if we have items, no dialog is showing, and this isn't internal navigation
        // The blur event fires when switching tabs, which is what we want to catch
        if (this.state.items.length > 0 && !this.isShowingNavigationDialog && !this.isInternalNavigation) {
          console.log("FormPage - showing dialog for tab navigation");
          this.isShowingNavigationDialog = true;
          
          setTimeout(() => {
            Alert.alert(
              "Unsaved Changes",
              "You have unsaved items in your package. What would you like to do?",
              [
                {
                  text: "Continue",
                  style: "cancel",
                  onPress: () => {
                    console.log("FormPage - user chose Continue");
                    this.isShowingNavigationDialog = false;
                  }
                },
                {
                  text: "Discard",
                  style: "destructive",
                  onPress: () => {
                    console.log("FormPage - user chose Discard");
                    this.isShowingNavigationDialog = false;
                    this.clearItemsWithoutConfirmation();
                    // For tab navigation, the user will naturally navigate to their intended tab
                    // No need to force navigation here
                  }
                },
                {
                  text: "Save Package",
                  style: "default",
                  onPress: () => {
                    console.log("FormPage - user chose Save Package");
                    this.isShowingNavigationDialog = false;
                    // Navigate back to FormPage and open save modal
                    this.props.navigation.navigate('Create Package');
                    setTimeout(() => {
                      this.setState({ showSavePackageModal: true });
                    }, 100);
                  }
                }
              ],
              { cancelable: false }
            );
          }, 100);
        }
      }
    );
    
    // Initialize with recent items visible
    this.setState({ showRecentItems: true });
  }
  
  componentWillUnmount() {
    console.log("FormPage - componentWillUnmount");
    // Clean up all listeners when component unmounts
    if (this.focusListener) {
      this.focusListener();
    }
    
    if (this.backHandler) {
      this.backHandler.remove();
    }
    
    if (this.beforeRemoveListener) {
      this.beforeRemoveListener();
    }
    
    if (this.blurListener) {
      this.blurListener();
    }
    
    // Re-enable drawer gesture when leaving
    try {
      const drawerParent = this.props.navigation.getParent();
      if (drawerParent && drawerParent.setOptions) {
        drawerParent.setOptions({
          swipeEnabled: true
        });
        console.log("FormPage - Re-enabled drawer gesture on unmount");
      }
    } catch (error) {
      console.error("FormPage - Error re-enabling drawer gesture:", error);
    }
    
    // Restore default header left button
    this.props.navigation.setOptions({
      headerLeft: undefined
    });
  }

  // Load items from AsyncStorage
  loadItems = async () => {
    try {
      const itemsJson = await AsyncStorage.getItem("@items");
      if (itemsJson) {
        const loadedItems = JSON.parse(itemsJson);
        this.setState({ items: loadedItems });
      }
    } catch (error) {
      console.error("Error loading items:", error);
      Alert.alert("Error", "Failed to load items.");
    }
  };
  
  // Clear items from AsyncStorage
  clearItems = async () => {
    try {
      await AsyncStorage.removeItem("@items");
      console.log("Items cleared successfully");
      this.setState({
        items: [],
        itemName: "",
        itemWidth: "",
        itemHeight: "",
        itemLength: "",
        quantity: 1,
        selectedItem: null,
        dimensionsFromSavedItem: false, // Reset to make fields editable again
        showRecentItems: true // Keep showing recent items
      }, () => {
        // Re-enable drawer gesture after clearing items
        try {
          const drawerParent = this.props.navigation.getParent();
          if (drawerParent && drawerParent.setOptions) {
            drawerParent.setOptions({
              swipeEnabled: true
            });
            console.log("FormPage - Re-enabled drawer gesture after clearing items");
          }
        } catch (error) {
          console.error("FormPage - Error re-enabling drawer gesture:", error);
        }
      });
    } catch (error) {
      Alert.alert("Error", `Failed to clear items: ${error.message}`);
    }
  };
  

  
  // handleMenuPress function removed since we're using bottom tab navigation
  

  

  
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

      // Get current date in MM/DD/YY format
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
      const year = String(today.getFullYear()).slice(-2);
      const dateCreated = `${month}/${day}/${year}`;

      // Save the package with date information
      packages[packageName] = {
        items: items,
        dateCreated: dateCreated
      };
      await AsyncStorage.setItem("packages", JSON.stringify(packages));

      // Once saved successfully, alert success and clear items
      Alert.alert("Success", "Package saved successfully.");

      // Clear items after successful save without confirmation
      this.clearItemsWithoutConfirmation();
      
      // Close the save package modal
      this.setState({ showSavePackageModal: false, packageName: '' });

      // Close the modal and clear package name
      this.setState({ 
        showSavePackageModal: false,
        packageName: '' // Clear package name after saving
      });
      
      // Continue with navigation if there was a pending action
      console.log("FormPage - handling pending navigation:", this.state.pendingNavigationAction);
      if (this.state.pendingNavigationAction === 'openDrawer') {
        console.log("FormPage - opening drawer after save");
        // Re-enable drawer gesture
        try {
          const drawerParent = this.props.navigation.getParent();
          if (drawerParent && drawerParent.setOptions) {
            drawerParent.setOptions({
              swipeEnabled: true
            });
            console.log("FormPage - Re-enabled drawer gesture after save");
          }
        } catch (error) {
          console.error("FormPage - Error re-enabling drawer gesture:", error);
        }
        this.props.navigation.openDrawer();
      } else if (this.pendingNavigationAction) {
        console.log("FormPage - dispatching navigation action");
        setTimeout(() => {
          this.props.navigation.dispatch(this.pendingNavigationAction);
          this.pendingNavigationAction = null;
        }, 100);
      }
      
      // Reset pending navigation
      this.setState({ pendingNavigationAction: null });
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
      dimensionsFromSavedItem: false, // Reset to make fields editable again
      showRecentItems: true // Keep showing recent items
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
        Alert.alert("Success", `${itemToDelete.itemName} was removed`);
        this.closeModal();
      } catch (error) {
        Alert.alert("Error deleting item", error.message);
      }
    });
  };

  deleteItem = async (index) => {
    const itemToDelete = this.state.items[index];
    const updatedItems = this.state.items.filter(
      (_, itemIndex) => index !== itemIndex
    );
    this.setState({ items: updatedItems });
    try {
      const serializedItems = base64.encode(JSON.stringify(updatedItems));
      await AsyncStorage.setItem("itemList", serializedItems);
      Alert.alert("Success", `${itemToDelete.itemName} was removed`);
    } catch (error) {
      Alert.alert("Error deleting item");
    }
  };

  _storeData = async () => {
    try {
      const serializedItems = base64.encode(JSON.stringify(this.state.items));
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

  // Method to clear items without confirmation - used after saving a package
  clearItemsWithoutConfirmation = () => {
    this.setState({ items: [] }, () => {
      this._storeData();
      // No need for platform-specific feedback here as the save success alert is enough
    });
  }

  // Method to clear items with confirmation - used when clicking the clear button
  clearItems = () => {
    Alert.alert(
      "Clear All Items",
      "Are you sure you want to clear all items from this package?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            this.setState({ items: [] }, () => {
              this._storeData();
              // Platform-specific feedback
              if (Platform.OS === 'android') {
                ToastAndroid.show('All items cleared', ToastAndroid.SHORT);
              }
              // For iOS, we don't need a toast as the alert dismissal is feedback enough
            });
          } 
        }
      ]
    );
  }

  handleVisualize = async () => {
    // Set internal navigation flag for Test Pack navigation
    console.log("FormPage - handleVisualize: setting isInternalNavigation = true");
    this.isInternalNavigation = true;
    
    if (this.state.items.length === 0) {
      // Reset flag since we're not navigating
      this.isInternalNavigation = false;
      Alert.alert(
        "No items",
        "Please add at least one item to visualize the packing.",
        [{ text: "OK" }]
      );
      return;
    }

    this.setState({ isLoading: true });

    try {
      const itemListString = await AsyncStorage.getItem("itemList");
      let itemList = [];
      if (itemListString) {
        const deserializedItems = JSON.parse(
          base64.decode(itemListString)
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
            // Reset flag after navigation
            setTimeout(() => {
              console.log("FormPage - handleVisualize: resetting isInternalNavigation = false");
              this.isInternalNavigation = false;
            }, 300);
          });
        });
      });
    } catch (error) {
      this.setState({ isLoading: false });
      // Reset flag in error case
      this.isInternalNavigation = false;
      console.error(error);
      Alert.alert("Error", "An error occurred while retrieving the item list");
    }
  };

  // Method to add an item received from AI Search page
  addItemFromAISearch = (newItemData, skipResetForm = false) => {
    if (!newItemData) return;
    
    try {
      const { itemName, itemLength, itemWidth, itemHeight, quantity = 1 } = newItemData;
      
      // Validate the item data
      if (!itemName || !itemLength || !itemWidth || !itemHeight) {
        console.error('Invalid item data received from AI Search');
        return;
      }
      
      // Check if an item with the same name already exists
      const exists = this.state.items.some(item => item.itemName === itemName);
      if (exists) {
        Alert.alert(
          "Duplicate Item", 
          `An item named "${itemName}" already exists in your package.`,
          [{ text: "OK" }]
        );
        return;
      }
      
      // Create a new item with the data from AI Search
      const id = generateUUID();
      const replicatedNames = Array.from({ length: quantity }, (_, i) => ({
        name: itemName,
        id: generateUUID(),
        parentId: id
      }));
      
      const newItem = {
        id: id,
        itemName: itemName,
        itemLength: parseFloat(itemLength),
        itemWidth: parseFloat(itemWidth),
        itemHeight: parseFloat(itemHeight),
        selectedCarrier: this.state.selectedCarrier || "No Carrier", // Use current carrier or default
        quantity: quantity,
        replicatedNames: replicatedNames,
      };
      
      // Add the item to the current package
      this.setState({ 
        items: [...this.state.items, newItem] 
      }, () => {
        this._storeData();
      });
      
      // Show success message
      Alert.alert("Success", `${itemName} has been added to your package`);
      
      // Only reset the form if not coming from global variable (AI Search)
      if (!skipResetForm) {
        this.resetForm();
      }
    } catch (error) {
      console.error('Error adding item from AI Search:', error);
      Alert.alert("Error", "Failed to add item from AI Search");
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

    this.setState({ items: [newItem, ...this.state.items] }, () => {
      this._storeData();
      
      // Explicitly update scroll indicators immediately after adding an item
      this.updateScrollState();
      
      // Force scroll indicators to show if we now have 3+ items
      if (this.state.items.length >= 3) {
        // Force immediate update
        this.forceUpdate();
        
        // Set direct state to ensure indicators show
        this.setState({
          contentScrollable: true,
          canScrollLeft: true,
          canScrollRight: true
        });
        
        // Force layout updates at multiple intervals
        [50, 200, 500].forEach(delay => {
          setTimeout(() => {
            if (this.scrollViewRef && this.scrollViewRef.current) {
              // Force scroll position update
              this.scrollViewRef.current.scrollTo({ x: 0, animated: false });
              
              // Force indicators to show again
              this.setState({
                contentScrollable: true,
                canScrollLeft: true,
                canScrollRight: true
              });
            }
          }, delay);
        });
      }
    });

    Alert.alert("Success", `${this.state.itemName} has been added`);
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
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.horizontalItemButton]}
        onPress={() => this.openModal(item)}
      >
        {item.quantity > 1 && (
          <View style={styles.itemCountContainer}>
            <Text style={styles.itemCount}>{item.quantity}</Text>
          </View>
        )}
        <View style={styles.horizontalItemContentContainer}>
          <View style={styles.horizontalItemNameContainer}>
            <Text style={[styles.buttonText, { color: '#64748B', textAlign: 'center' }]} numberOfLines={2} ellipsizeMode="tail">
              {item.itemName}
            </Text>
          </View>
          <View style={styles.horizontalItemDimensions}>
            <Text style={[styles.dimensionText, { color: '#64748B' }]}>{`${item.itemLength}×${item.itemWidth}×${item.itemHeight}`}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  renderItemsList = () => {
    const { items } = this.state;
    const containerHeight = 160 * scale; // Fixed height for consistency
    
    // Calculate total quantity of all items
    const totalQuantity = items.length > 0 ? items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
    
    // Common container style for consistent sizing
    const containerStyle = {
      height: containerHeight,
      paddingBottom: 5 * scale,
    };
    
    if (items.length === 0) {
      return (
        <View style={containerStyle}>
          {/* Header row with Total Items Counter and Clear Items button - same position as when items exist */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 10 * scale, paddingRight: 10 * scale, marginBottom: 5 * scale }}>
            {/* Total Items Counter */}
            <View style={styles.totalItemsContainer}>
              <Ionicons name="cube-outline" size={14 * scale} color="#3B82F6" />
              <Text style={styles.totalItemsText}>0 items</Text>
            </View>
            
            {/* Clear Items Button - disabled when empty */}
            <TouchableOpacity 
              style={[styles.clearItemsButton, { opacity: 0.5 }]}
              disabled={true}
            >
              <Ionicons name="trash-outline" size={14 * scale} color="#EF4444" />
              <Text style={styles.clearItemsText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.emptyContainer, { flex: 1 }]}>
            <Text style={styles.emptyText}>
              No items added yet for this package.
            </Text>
            <Text style={styles.emptySubtext}>
              Add items to create your package.
              View shipping rates & 3D packing in Saved Packages.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={containerStyle}>
        {/* Header row with Total Items Counter and Clear Items button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 10 * scale, paddingRight: 10 * scale, marginBottom: 5 * scale }}>
          {/* Total Items Counter */}
          <View style={styles.totalItemsContainer}>
            <Ionicons name="cube-outline" size={14 * scale} color="#3B82F6" />
            <Text style={styles.totalItemsText}>
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
            </Text>
          </View>
          
          {/* Clear Items Button */}
          <TouchableOpacity 
            style={styles.clearItemsButton}
            onPress={this.clearItems}
          >
            <Ionicons name="trash-outline" size={14 * scale} color="#EF4444" />
            <Text style={styles.clearItemsText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ flex: 1, position: 'relative' }} onLayout={(event) => {
          const containerWidth = event.nativeEvent.layout.width;
          this.setState({ containerWidth }, this.updateScrollState);
        }}>
          {/* Right scroll button - show when there are 3+ items */}
          {this.state.items.length >= 3 && (
            <TouchableOpacity 
              style={{ 
                position: 'absolute', 
                top: '50%', 
                right: -6, 
                zIndex: 10, 
                backgroundColor: 'rgba(255,255,255,0.8)', 
                borderRadius: 15,
                padding: 3,
                transform: [{ translateY: -10 }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              }}
              onPress={() => {
                try {
                  // Fixed scroll amount - width of one item card
                  const scrollAmount = 160 * scale;
                  
                  // Force scroll to the right
                  if (this.scrollViewRef && this.scrollViewRef.current) {
                    this.scrollViewRef.current.scrollTo({ 
                      x: this.state.currentScrollX + scrollAmount,
                      animated: true 
                    });
                  }
                } catch (error) {
                  console.log('Error scrolling right:', error);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          )}
          
          {/* Left scroll button - show when there are 3+ items */}
          {this.state.items.length >= 3 && (
            <TouchableOpacity 
              style={{ 
                position: 'absolute', 
                top: '50%', 
                left: -6, 
                zIndex: 10, 
                backgroundColor: 'rgba(255,255,255,0.8)', 
                borderRadius: 15,
                padding: 3,
                transform: [{ translateY: -10 }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              }}
              onPress={() => {
                try {
                  // Fixed scroll amount - width of one item card
                  const scrollAmount = 160 * scale;
                  
                  // Scroll to the left, but don't go past the beginning
                  if (this.scrollViewRef && this.scrollViewRef.current) {
                    this.scrollViewRef.current.scrollTo({ 
                      x: Math.max(0, this.state.currentScrollX - scrollAmount),
                      animated: true 
                    });
                  }
                } catch (error) {
                  console.log('Error scrolling left:', error);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={16} color="#3B82F6" />
            </TouchableOpacity>
          )}
          
          {/* Right side gradient fade - show when there are 3+ items */}
          {this.state.items.length >= 3 && (
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 30,
                zIndex: 5,
                pointerEvents: 'none'
              }}
            />
          )}
          
          {/* Left side gradient fade - show when there are 3+ items */}
          {this.state.items.length >= 3 && (
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 30,
                zIndex: 5,
                pointerEvents: 'none'
              }}
            />
          )}
          
          <ScrollView 
            ref={this.scrollViewRef}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalCarouselContainer, { paddingBottom: 10 * scale }]}
            decelerationRate="fast"
            snapToInterval={isIpad() ? 216 * scale : 172 * scale} // Width of the item + margins (200 + 16 for iPad)
            snapToAlignment="start"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            onContentSizeChange={(contentWidth) => {
              this.setState({ contentWidth }, this.updateScrollState);
            }}
            onScroll={(event) => {
              const scrollX = event.nativeEvent.contentOffset.x;
              this.setState({ currentScrollX: scrollX }, this.updateScrollState);
            }}
            scrollEventThrottle={16}
            onFocus={() => {
              // Check if we need to update the scroll state
              this.updateScrollState();
              
              // Check if we have a new item from AI Search via global variable
              if (global.newItemFromAISearch) {
                const { newItem, addToCurrentPackage, clearNameField } = global.newItemFromAISearch;
                
                // Add the item to the current package
                if (newItem) {
                  this.addItemFromAISearch(newItem, true); // Skip resetting the form
                }
                
                // Clear the name field if requested
                if (clearNameField) {
                  this.setState({
                    itemName: "",
                    preventAutoFocus: true // Prevent auto-focus when returning from AI Search
                  });
                  
                  // Use a timeout to ensure the keyboard is dismissed after the component has fully rendered
                  setTimeout(() => {
                    // Explicitly blur the input field to prevent keyboard from showing
                    if (this.inputRef && this.inputRef.current) {
                      this.inputRef.current.blur();
                    }
                    
                    // Dismiss keyboard explicitly
                    Keyboard.dismiss();
                  }, 100);
                }
                
                // Clear the global variable to prevent duplicate additions
                global.newItemFromAISearch = null;
              }
            }}
          >
            {items.map((item, index) => this.renderItem(item, index))}
          </ScrollView>
        </View>
      </View>
    );
  }


  
  render() {
    // Pre-calculate styles to improve performance
    const inputBorderStyles = this.getInputBorderStyles();
    
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
            <TouchableWithoutFeedback onPress={this.handleDismissKeyboard}>
              <View style={styles.container}>
                <View style={styles.formContainer}>
                <VStack space={2} width="100%">
                    <View style={tooltipContainerStyle}>
                      <Text style={styles.label}>Name</Text>
                      <TouchableOpacity 
                        onPress={this.handleShowNameTooltip}
                        style={tooltipIconStyle}
                      >
                        <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ position: 'relative', zIndex: 1, marginBottom: 8 }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        position: 'relative'
                      }}>
                        <TextInput
                          ref={this.inputRef}
                          style={[styles.input, styles.condensedInput, { 
                            flex: 1, 
                            paddingRight: 45, // Space for the icon
                            paddingVertical: 8, // Adjusted vertical padding
                            ...inputBorderStyles, // Use pre-calculated styles
                            borderBottomColor: '#E2E8F0',
                            marginBottom: 0
                          }]}
                          value={this.state.itemName}
                          onChangeText={this.handleChange}
                          onFocus={this.handleNameInputFocus}
                          maxLength={50}
                          placeholder=""
                          placeholderTextColor={"#94A3B8"}
                          autoCorrect={false}
                          spellCheck={false}
                        />
                        <TouchableOpacity 
                          style={{
                            position: 'absolute',
                            right: 0,
                            height: '100%',
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                          }}
                          onPress={this.handleNavigateToAISearch}
                          activeOpacity={0.6}
                        >
                          <View style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: '#F0F9FF',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                            <Image 
                              source={require('../assets/ai-technology.png')} 
                              style={{ width: 24, height: 24, tintColor: '#3B82F6' }} 
                              resizeMode="contain" 
                            />
                          </View>
                        </TouchableOpacity>
                      </View>
                      
                      {(() => {
                        const { recentSavedItems, items, showRecentItems, itemName, showSuggestions } = this.state;
                        
                        if (!showRecentItems || showSuggestions) {
                          return null;
                        }

                        // Filter items that are already in the container
                        let filteredItems = recentSavedItems.filter(item => {
                          const name = item.itemName || item.name || '';
                          return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === name.toLowerCase());
                        });
                        
                        // Additionally filter by input text if there's any
                        if (itemName.trim().length > 0) {
                          const searchText = itemName.toLowerCase().trim();
                          filteredItems = filteredItems.filter(item => {
                            const name = (item.itemName || item.name || '').toLowerCase();
                            return name.includes(searchText);
                          });
                        }

                        if (filteredItems.length === 0) {
                          return null;
                        }

                        return (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F2F2F7', // Light gray background to distinguish from input field
                            borderWidth: 1,
                            borderColor: '#D1D1D6', // Match iOS input border color
                            borderTopWidth: 0,
                            borderBottomLeftRadius: 10, // Match iOS input border radius
                            borderBottomRightRadius: 10, // Match iOS input border radius
                            paddingLeft: 16,
                            paddingRight: 16,
                            paddingVertical: 10,
                            marginTop: -1,
                            // Add subtle gradient effect
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 3,
                            elevation: 2,
                          }}>
                              <TouchableOpacity
                                onPress={() => this.showAllSavedItemsModal()}
                                style={{
                                  paddingHorizontal: 4,
                                  paddingVertical: 6,
                                  marginRight: 8,
                                }}
                                activeOpacity={0.6}
                              >
                                <Text style={{ 
                                  fontSize: 13, 
                                  fontWeight: '500', 
                                  color: Platform.OS === 'ios' ? '#007AFF' : '#0066FF',
                                  letterSpacing: -0.08
                                }}>
                                  Saved:
                                </Text>
                              </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 16 }}
                              >
                                {filteredItems.map((item) => (
                                  <TouchableOpacity
                                    key={item.id}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      backgroundColor: Platform.OS === 'ios' ? '#E5E5EA' : '#EFF6FF', // iOS system light gray background
                                      borderRadius: Platform.OS === 'ios' ? 16 : 14, // iOS uses more rounded corners
                                      paddingVertical: 6,
                                      paddingHorizontal: 12,
                                      marginRight: 8,
                                      borderWidth: Platform.OS === 'ios' ? 0 : 1, // iOS chips typically don't have borders
                                      borderColor: '#DBEAFE',
                                      // Add subtle shadow for iOS
                                      ...(Platform.OS === 'ios' ? {
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 1,
                                      } : {})
                                    }}
                                    onPress={() => this.selectSavedItem(item)}
                                  >
                                    <Text style={{ 
                                      fontSize: 13, 
                                      color: Platform.OS === 'ios' ? '#007AFF' : '#0066FF', // iOS blue
                                      fontWeight: '500',
                                    }}>{item.itemName || item.name || ''} <Text style={{ color: Platform.OS === 'ios' ? '#007AFF' : '#3B82F6' }}>↵</Text></Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>

                          </View>
                        );
                      })()}

                    </View>
                    
                    
                    
                    <VStack space={2} width="100%">
                      <View style={tooltipContainerStyle}>
                        <Text style={styles.label}>Length</Text>
                        <TouchableOpacity 
                          onPress={this.handleShowLengthTooltip}
                          style={tooltipIconStyle}
                        >
                          <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.input, styles.condensedInput, { 
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 0,
                        paddingHorizontal: 0,
                        backgroundColor: this.state.dimensionsFromSavedItem ? '#F8FAFC' : 'white',
                      }]}>
                        <TextInput
                          style={{
                            flex: 1,
                            height: '100%',
                            paddingHorizontal: 14,
                            fontSize: 15,
                            color: this.state.dimensionsFromSavedItem ? '#94A3B8' : '#334155',
                            backgroundColor: 'transparent',
                          }}
                          value={this.state.itemLength}
                          onChangeText={(text) => this.setState({ itemLength: text })}
                          keyboardType="numeric"
                          maxLength={3}
                          editable={!this.state.dimensionsFromSavedItem}
                        />
                        <Text style={{ 
                          paddingRight: 14,
                          fontSize: 15,
                          color: this.state.dimensionsFromSavedItem ? '#94A3B8' : '#64748B',
                        }}>inches</Text>
                      </View>
                      <View style={tooltipContainerStyle}>
                        <Text style={styles.label}>Width</Text>
                        <TouchableOpacity 
                          onPress={this.handleShowWidthTooltip}
                          style={tooltipIconStyle}
                        >
                          <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.input, styles.condensedInput, { 
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 0,
                        paddingHorizontal: 0,
                        backgroundColor: this.state.dimensionsFromSavedItem ? '#F8FAFC' : 'white',
                      }]}>
                        <TextInput
                          style={{
                            flex: 1,
                            height: '100%',
                            paddingHorizontal: 14,
                            fontSize: 15,
                            color: this.state.dimensionsFromSavedItem ? '#94A3B8' : '#334155',
                            backgroundColor: 'transparent',
                          }}
                          value={this.state.itemWidth}
                          onChangeText={(text) => this.setState({ itemWidth: text })}
                          keyboardType="numeric"
                          maxLength={3}
                          editable={!this.state.dimensionsFromSavedItem}
                        />
                        <Text style={{ 
                          paddingRight: 14,
                          fontSize: 15,
                          color: this.state.dimensionsFromSavedItem ? '#94A3B8' : '#64748B',
                        }}>inches</Text>
                      </View>
                      <View style={tooltipContainerStyle}>
                        <Text style={styles.label}>Height</Text>
                        <TouchableOpacity 
                          onPress={this.handleShowHeightTooltip}
                          style={tooltipIconStyle}
                        >
                          <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.input, styles.condensedInput, { 
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 0,
                        paddingHorizontal: 0,
                        backgroundColor: this.state.dimensionsFromSavedItem ? '#F8FAFC' : 'white',
                      }]}>
                        <TextInput
                          style={{
                            flex: 1,
                            height: '100%',
                            paddingHorizontal: 14,
                            fontSize: 15,
                            color: this.state.dimensionsFromSavedItem ? '#94A3B8' : '#334155',
                            backgroundColor: 'transparent',
                          }}
                          value={this.state.itemHeight}
                          onChangeText={(text) => this.setState({ itemHeight: text })}
                          keyboardType="numeric"
                          maxLength={3}
                          editable={!this.state.dimensionsFromSavedItem}
                        />
                        <Text style={{ 
                          paddingRight: 14,
                          fontSize: 15,
                          color: this.state.dimensionsFromSavedItem ? '#94A3B8' : '#64748B',
                        }}>inches</Text>
                      </View>
                      <Text style={[styles.label]}>Quantity</Text>
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
                          onPress={this.handleQuantityDecrease}
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
                          onPress={this.handleQuantityIncrease}
                        >
                          <Text style={{ fontSize: 20, color: '#64748B', fontWeight: '500' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </VStack>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.submitButton}
                      onPress={this.handleSubmitWithHaptics}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={[styles.buttonText, { color: '#FFFFFF', fontWeight: '600' }]}>Add item</Text>
                      </View>
                    </TouchableOpacity>
                  </VStack>
                </View>

                <View style={styles.horizontalContentContainer}>
                  <View
                    style={styles.itemsContainer}
                    removeClippedSubviews={true}
                  >
                    {this.renderItemsList()}
                  </View>
                </View>

                <View style={styles.bottomButtonContainer}>
                  <TouchableOpacity
                    style={styles.savePackageButton}
                    onPress={this.handleSavePackage}
                  >
                    <Text style={styles.savePackageButtonText}>Save Package</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.packButton}
                    onPress={this.handleTestPack}
                    disabled={this.state.isLoading}
                  >
                    {this.state.isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Test Pack</Text>
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
                <KeyboardAvoidingView 
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={{ flex: 1 }}
                >
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={modalStyles.centeredView}>
                      <View style={modalStyles.modalContent}>
                        <View style={modalStyles.modalHeader}>
                          <Text style={modalStyles.modalTitle}>Save Package</Text>
                        </View>
                        <Text style={modalStyles.modalSubtitle}>
                          Save your package to see realtime shipping estimates & 3D packing.
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
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              this.toggleSavePackageModal();
                            }}
                          >
                            <Text style={modalStyles.buttonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[modalStyles.button, modalStyles.applyButton]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              this.handleSavePackage();
                            }}
                          >
                            <Text style={modalStyles.buttonText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
              </Modal>

              <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.showAllSavedItemsModal}
                onRequestClose={this.hideAllSavedItemsModal}
              >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <View style={{
                        width: '95%',
                        maxHeight: '85%',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 5 },
                        shadowOpacity: 0.1,
                        shadowRadius: 15,
                        elevation: 10,
                      }}>
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 20,
                          borderBottomWidth: 1,
                          borderBottomColor: '#E2E8F0',
                        }}>
                          <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: '#1E293B'
                          }}>Select an Item</Text>
                          <TouchableOpacity onPress={this.hideAllSavedItemsModal}>
                            <Ionicons name="close" size={24} color="#64748B" />
                          </TouchableOpacity>
                        </View>

                        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                          }}>
                            <Ionicons name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                            <TextInput
                              style={{ 
                                flex: 1, 
                                height: 44,
                                fontSize: 16,
                                color: '#1E293B',
                              }}
                              placeholder="Search saved items..."
                              placeholderTextColor="#94A3B8"
                              value={this.state.savedItemsSearchQuery}
                              onChangeText={(text) => this.setState({ savedItemsSearchQuery: text })}
                            />
                          </View>
                        </View>

                        {/* Bulk Selection Controls */}
                        {this.state.savedItemsSelectionMode && (
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            backgroundColor: '#F1F5F9',
                            borderBottomWidth: 1,
                            borderBottomColor: '#E2E8F0',
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ fontSize: 14, color: '#64748B', marginRight: 12 }}>
                                {this.state.selectedSavedItems.length} selected
                              </Text>
                              <TouchableOpacity onPress={this.selectAllSavedItems} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#E2E8F0', borderRadius: 6, marginRight: 8 }}>
                                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Select All</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={this.clearAllSavedItemsSelection} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#E2E8F0', borderRadius: 6 }}>
                                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Clear All</Text>
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                              onPress={this.exitBulkSelectionMode}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                backgroundColor: '#EF4444',
                                borderRadius: 8,
                              }}
                            >
                              <Ionicons name="close" size={16} color="white" />
                              <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: 'white' }}>Exit</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        <ScrollView 
                          style={{ paddingHorizontal: 16 }} 
                          contentContainerStyle={{ flexGrow: 1 }} 
                          keyboardShouldPersistTaps="handled"
                        >
                          {(() => {
                            const filteredItems = this.state.allSavedItems
                              ? this.state.allSavedItems.filter(item => {
                                  const itemName = (item.itemName || item.name || '').toLowerCase();
                                  return itemName.includes(this.state.savedItemsSearchQuery.toLowerCase());
                                })
                              : [];

                            if (filteredItems.length > 0) {
                              return filteredItems.map((item) => {
                                const itemName = item.itemName || item.name || '';
                                const alreadyAdded = this.state.items.some(addedItem =>
                                  (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
                                );
                                const dimensions = item.dimensions || {};
                                const isSelected = this.state.selectedSavedItems.some(selected => selected.id === item.id);
                                const canSelect = !alreadyAdded; // Only allow selection if not already added
                                
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                      if (this.state.savedItemsSelectionMode) {
                                        if (canSelect) {
                                          this.toggleSavedItemSelection(item);
                                        }
                                      } else {
                                        if (!alreadyAdded) {
                                          this.selectSavedItem(item);
                                        }
                                      }
                                    }}
                                    onLongPress={() => {
                                      if (canSelect && !this.state.savedItemsSelectionMode) {
                                        this.enterBulkSelectionMode();
                                        this.toggleSavedItemSelection(item);
                                      }
                                    }}
                                    disabled={alreadyAdded && !this.state.savedItemsSelectionMode}
                                    style={{
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      paddingVertical: 16,
                                      paddingHorizontal: 16,
                                      borderBottomWidth: 1,
                                      borderBottomColor: '#E2E8F0',
                                      opacity: alreadyAdded && !this.state.savedItemsSelectionMode ? 0.4 : 1,
                                      backgroundColor: isSelected ? '#EBF4FF' : 'transparent',
                                    }}
                                  >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                       {/* Checkbox for bulk selection mode - only show for items not already added */}
                                       {this.state.savedItemsSelectionMode && !alreadyAdded && (
                                         <TouchableOpacity
                                           onPress={() => this.toggleSavedItemSelection(item)}
                                           style={{
                                             marginRight: 12,
                                             padding: 4
                                           }}
                                         >
                                           <Ionicons 
                                             name={isSelected ? "checkbox" : "square-outline"} 
                                             size={20} 
                                             color={isSelected ? "#3B82F6" : "#94A3B8"}
                                           />
                                         </TouchableOpacity>
                                       )}
                                       
                                       {/* Show disabled indicator for already added items in bulk selection mode */}
                                       {this.state.savedItemsSelectionMode && alreadyAdded && (
                                         <View style={{
                                           marginRight: 12,
                                           padding: 4
                                         }}>
                                           <Ionicons 
                                             name="checkmark-circle" 
                                             size={20} 
                                             color="#94A3B8"
                                           />
                                         </View>
                                       )}
                                      
                                      <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, color: '#1E293B', fontWeight: '600' }}>
                                          {itemName}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                          {dimensions.length && dimensions.width && dimensions.height ? (
                                            <>
                                              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginRight: 4 }}>L</Text>
                                                <Text style={{ fontSize: 12, color: '#475569' }}>{parseFloat(dimensions.length)}</Text>
                                              </View>
                                              <Text style={{ marginHorizontal: 4, color: '#94A3B8', fontSize: 12 }}>x</Text>
                                              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginRight: 4 }}>W</Text>
                                                <Text style={{ fontSize: 12, color: '#475569' }}>{parseFloat(dimensions.width)}</Text>
                                              </View>
                                              <Text style={{ marginHorizontal: 4, color: '#94A3B8', fontSize: 12 }}>x</Text>
                                              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginRight: 4 }}>H</Text>
                                                <Text style={{ fontSize: 12, color: '#475569' }}>{parseFloat(dimensions.height)}</Text>
                                              </View>
                                            </>
                                          ) : (
                                            <Text style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>
                                              No dimensions
                                            </Text>
                                          )}
                                        </View>
                                      </View>
                                    </View>
                                    
                                    {/* Right side icon */}
                                    {!this.state.savedItemsSelectionMode && (
                                      alreadyAdded ? (
                                        <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                                      ) : (
                                        <Text style={{ color: '#3B82F6', fontSize: 24 }}>↵</Text>
                                      )
                                    )}
                                  </TouchableOpacity>
                                );
                              });
                            } else {
                              return (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                  <Ionicons name="search-circle-outline" size={48} color="#CBD5E1" />
                                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#475569', marginTop: 16, textAlign: 'center' }}>
                                    No Saved Items Found
                                  </Text>
                                  <Text style={{ fontSize: 15, color: '#64748B', marginTop: 8, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                                    Try a different search, or use the button below to find your item with AI Search.
                                  </Text>
                                </View>
                              );
                            }
                          })()}
                        </ScrollView>

                        <View style={{ paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                          {this.state.savedItemsSelectionMode ? (
                            <TouchableOpacity
                              style={{
                                paddingVertical: 14,
                                backgroundColor: this.state.selectedSavedItems.length > 0 ? '#22C55E' : '#94A3B8',
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: this.state.isBulkAddInProgress ? 0.6 : 1,
                              }}
                              onPress={this.bulkAddSavedItemsToPackage}
                              disabled={this.state.selectedSavedItems.length === 0 || this.state.isBulkAddInProgress}
                            >
                              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                                {this.state.isBulkAddInProgress 
                                  ? 'Adding Items...' 
                                  : `Add Items (${this.state.selectedSavedItems.length})`
                                }
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={{
                                paddingVertical: 14,
                                backgroundColor: '#3B82F6',
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onPress={() => {
                                console.log("FormPage - AI Search from modal: setting isInternalNavigation = true");
                                this.isInternalNavigation = true;
                
                                this.hideAllSavedItemsModal();
                                this.props.navigation.navigate('AI Item Search', { 
                                  searchQuery: this.state.savedItemsSearchQuery,
                                  fromFormPage: true // Flag to indicate navigation from FormPage
                                });
                
                                // Reset flag after navigation
                                setTimeout(() => {
                                  console.log("FormPage - AI Search from modal: resetting isInternalNavigation = false");
                                  this.isInternalNavigation = false;
                                }, 300);
                              }}
                            >
                              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                                Find with AI Search
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
                  showBackButton={false}
                />
              )}
              
              {/* Name Tooltip Modal */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.showNameTooltip || false}
                onRequestClose={() => this.setState({ showNameTooltip: false })}
              >
                <TouchableWithoutFeedback onPress={this.handleHideNameTooltip}>
                  <View style={tooltipModalStyles.overlay}>
                    <TouchableWithoutFeedback>
                      <View style={tooltipModalStyles.container}>
                        <View style={tooltipModalStyles.contentContainer}>
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.descriptionText}>Saved items will appear below the name field for quick selection.</Text>
                            </View>
                          </View>
                          
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Image 
                                source={require('../assets/ai-technology.png')} 
                                style={{ width: 18, height: 18, tintColor: '#FFFFFF' }} 
                                resizeMode="contain" 
                              />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.descriptionText}>Use the AI Search icon to look up dimensions for common items.</Text>
                            </View>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          style={tooltipModalStyles.button}
                          onPress={this.handleHideNameTooltip}
                        >
                          <Text style={tooltipModalStyles.buttonText}>Got it</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
              
              {/* Length Tooltip Modal */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.showLengthTooltip || false}
                onRequestClose={() => this.setState({ showLengthTooltip: false })}
              >
                <TouchableWithoutFeedback onPress={this.handleHideLengthTooltip}>
                  <View style={tooltipModalStyles.overlay}>
                    <TouchableWithoutFeedback>
                      <View style={tooltipModalStyles.container}>
                        <View style={tooltipModalStyles.contentContainer}>
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Ionicons name="resize-outline" size={18} color="#FFFFFF" />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.labelText}>Length:</Text>
                              <Text style={tooltipModalStyles.descriptionText}>The longest side of your item</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={tooltipModalStyles.tipContainer}>
                          <Text style={tooltipModalStyles.tipText}>
                            Measure the longest dimension of your item in its natural orientation for best packing results.
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={tooltipModalStyles.button}
                          onPress={this.handleHideLengthTooltip}
                        >
                          <Text style={tooltipModalStyles.buttonText}>Got it</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
              
              {/* Width Tooltip Modal */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.showWidthTooltip || false}
                onRequestClose={() => this.setState({ showWidthTooltip: false })}
              >
                <TouchableWithoutFeedback onPress={() => this.setState({ showWidthTooltip: false })}>
                  <View style={tooltipModalStyles.overlay}>
                    <TouchableWithoutFeedback>
                      <View style={tooltipModalStyles.container}>
                        <View style={tooltipModalStyles.contentContainer}>
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Ionicons name="resize-outline" size={18} color="#FFFFFF" />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.labelText}>Width:</Text>
                              <Text style={tooltipModalStyles.descriptionText}>The second longest side of your item</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={tooltipModalStyles.tipContainer}>
                          <Text style={tooltipModalStyles.tipText}>
                            Measure the second longest dimension of your item for accurate box selection.
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={tooltipModalStyles.button}
                          onPress={() => this.setState({ showWidthTooltip: false })}
                        >
                          <Text style={tooltipModalStyles.buttonText}>Got it</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
              
              {/* Height Tooltip Modal */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.showHeightTooltip || false}
                onRequestClose={() => this.setState({ showHeightTooltip: false })}
              >
                <TouchableWithoutFeedback onPress={() => this.setState({ showHeightTooltip: false })}>
                  <View style={tooltipModalStyles.overlay}>
                    <TouchableWithoutFeedback>
                      <View style={tooltipModalStyles.container}>
                        <View style={tooltipModalStyles.contentContainer}>
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Ionicons name="resize-outline" size={18} color="#FFFFFF" />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.labelText}>Height:</Text>
                              <Text style={tooltipModalStyles.descriptionText}>The shortest side of your item</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={tooltipModalStyles.tipContainer}>
                          <Text style={tooltipModalStyles.tipText}>
                            Measure the shortest dimension of your item for optimal packing efficiency.
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={tooltipModalStyles.button}
                          onPress={() => this.setState({ showHeightTooltip: false })}
                        >
                          <Text style={tooltipModalStyles.buttonText}>Got it</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
              
              {/* Dimensions Tooltip Modal */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.showDimensionsTooltip || false}
                onRequestClose={() => this.setState({ showDimensionsTooltip: false })}
              >
                <TouchableWithoutFeedback onPress={() => this.setState({ showDimensionsTooltip: false })}>
                  <View style={tooltipModalStyles.overlay}>
                    <TouchableWithoutFeedback>
                      <View style={tooltipModalStyles.container}>
                        <View style={tooltipModalStyles.contentContainer}>
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Ionicons name="swap-horizontal-outline" size={18} color="#FFFFFF" />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.labelText}>Length:</Text>
                              <Text style={tooltipModalStyles.descriptionText}>The longest side of your item</Text>
                            </View>
                          </View>
                          
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Ionicons name="resize-outline" size={18} color="#FFFFFF" />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.labelText}>Width:</Text>
                              <Text style={tooltipModalStyles.descriptionText}>The second longest side of your item</Text>
                            </View>
                          </View>
                          
                          <View style={tooltipModalStyles.rowContainer}>
                            <View style={tooltipModalStyles.iconContainer}>
                              <Ionicons name="arrow-up-outline" size={18} color="#FFFFFF" />
                            </View>
                            <View style={tooltipModalStyles.textContainer}>
                              <Text style={tooltipModalStyles.labelText}>Height:</Text>
                              <Text style={tooltipModalStyles.descriptionText}>The shortest side of your item</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={tooltipModalStyles.tipContainer}>
                          <Text style={tooltipModalStyles.tipText}>
                            Measure your item in its natural orientation for optimal packing results.
                          </Text>
                        </View>
                        
                        <TouchableOpacity
                          style={tooltipModalStyles.button}
                          onPress={() => this.setState({ showDimensionsTooltip: false })}
                        >
                          <Text style={tooltipModalStyles.buttonText}>Got it</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
              
              {/* ... */}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  updateScrollState = () => {
    // Always show indicators when there are 3+ items
    const hasEnoughItems = this.state.items.length >= 3;
    
    // Force update scroll state with a more aggressive approach
    this.setState({
      contentScrollable: hasEnoughItems,
      canScrollLeft: hasEnoughItems,
      canScrollRight: hasEnoughItems
    }, () => {
      // Force a re-render after state update
      this.forceUpdate();
      
      // Schedule multiple updates to ensure indicators appear
      const checkTimes = [50, 100, 300, 500];
      checkTimes.forEach(delay => {
        setTimeout(() => {
          // Only update if component is still mounted
          if (this.scrollViewRef && this.scrollViewRef.current) {
            this.setState({
              contentScrollable: this.state.items.length >= 3,
              canScrollLeft: this.state.items.length >= 3,
              canScrollRight: this.state.items.length >= 3
            });
          }
        }, delay);
      });
    });
    
    // For debugging
    console.log('Updated scroll indicators:', { 
      hasEnoughItems, 
      itemCount: this.state.items.length,
      forceShowing: hasEnoughItems
    });
  }
  
  componentDidUpdate(prevProps, prevState) {
    // Check if items have changed
    if (prevState.items !== this.state.items) {
      // Update scroll state immediately when items change
      this.updateScrollState();
      
      // Force a layout update and measurement after a short delay
      setTimeout(() => {
        if (this.scrollViewRef && this.scrollViewRef.current) {
          // Trigger a small scroll to force measurement update
          this.scrollViewRef.current.scrollTo({ x: 0, animated: false });
          // Update scroll state again after measurements
          this.updateScrollState();
        }
      }, 100);
    }
    
    // Check if the route params have changed
    if (prevProps.route.params !== this.props.route.params) {
      console.log('FormPage - Route params changed:', this.props.route.params);
      
      // Check if we have a new item from AI Search
      if (this.props.route.params?.newItemFromAISearch) {
        console.log('FormPage - Processing item from AI Search:', this.props.route.params.newItemFromAISearch);
        const newItem = this.props.route.params.newItemFromAISearch;
        
        // Add the item to the package using the special method
        this.addItemFromAISearch(newItem, true); // Skip resetting the form
        
        // Clear the name field without focusing it
        this.setState({ itemName: "" });
        
        // Dismiss keyboard to ensure it doesn't appear
        Keyboard.dismiss();
        
        // Clear the route params to prevent duplicate additions
        this.props.navigation.setParams({ 
          newItemFromAISearch: null, 
          fromAISearch: null,
          timestamp: null
        });
      }
      
      // Handle regular new item addition (not from AI Search)
      else if (this.props.route.params?.newItem) {
        const { newItem, addToCurrentPackage } = this.props.route.params;
        
        // Regular item addition
        this.addItemToList(newItem, addToCurrentPackage);
        
        // Clear the route params to prevent duplicate additions
        this.props.navigation.setParams({ 
          newItem: null, 
          addToCurrentPackage: null
        });
      }
    }
    
    if (this.state.dropdownOpen && !prevState.dropdownOpen) {
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