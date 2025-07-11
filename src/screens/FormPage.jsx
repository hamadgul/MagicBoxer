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
} from 'react-native';
import { VStack } from "native-base";  
import AsyncStorage from "@react-native-async-storage/async-storage";

import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import styles from "../theme/Styles";
import { modalStyles } from "../theme/ModalStyles";
import { Ionicons } from "@expo/vector-icons";
import base64 from 'base-64';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width, height) / 375; // Base scale on iPhone 8 dimensions




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

export default class FormPage extends Component {
  constructor(props) {
    super(props);
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
      productList: [], // Initialize with empty array instead of defaultProductList
      recentSavedItems: [], // Store recently saved items
      allSavedItems: [], // Store all saved items
      showRecentItems: true, // Start with recent items visible by default
      showAllSavedItemsModal: false, // For the modal with all items
      flashScrollbar: false,
      scrollViewRef: React.createRef(),
      dimensionsFromSavedItem: false // Track if dimensions are from a saved item
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
          recentSavedItems: sortedItems.slice(0, 5),
          showRecentItems: true,
        });
        console.log(
          `Loaded ${sortedItems.length} total saved items, with ${
            sortedItems.slice(0, 5).length
          } recent items.`
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
        dimensionsFromSavedItem: false, // Reset the tracking state
        showAllSavedItemsModal: false
      });
      return;
    }
    
    this.setState({ itemName: text });
    
    if (!text.trim()) {
      this.setState({ 
        filteredProducts: [],
        showSuggestions: false,
        showRecentItems: true // Show recent items when input is empty
      });
      return;
    }

    // Deactivated product suggestions dropdown
    // Just update the text without showing suggestions
    this.setState({ 
      filteredProducts: [],
      showSuggestions: false,
      showRecentItems: false
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
      'savedItemsSearchQuery'
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
          
          // Check if we need to add a new item from AI Search
          if (this.props.route.params?.newItem && this.props.route.params?.addToCurrentPackage) {
            this.addItemFromAISearch(this.props.route.params.newItem);
            // Clear the params to prevent re-adding on future focus events
            this.props.navigation.setParams({ newItem: null, addToCurrentPackage: false });
          }
          
          // After all data is loaded on focus, ensure recent items are shown
          this.setState({ showRecentItems: true });
          this.forceUpdate();
        });
        

        
        // Set custom header left button (hamburger menu)
        this.props.navigation.setOptions({
          headerLeft: () => (
            <TouchableOpacity
              style={{ paddingLeft: 16 }}
              onPress={this.handleMenuPress}
              testID="custom-menu-button"
            >
              <Ionicons name="menu" size={24} color="#64748B" />
            </TouchableOpacity>
          )
        });
        
        // Disable drawer gesture if there are items
        if (this.state.items.length > 0) {
          // Try to disable drawer gesture
          try {
            const drawerParent = this.props.navigation.getParent();
            if (drawerParent && drawerParent.setOptions) {
              drawerParent.setOptions({
                swipeEnabled: false
              });
              console.log("FormPage - Disabled drawer gesture");
            }
          } catch (error) {
            console.error("FormPage - Error disabling drawer gesture:", error);
          }
        } else {
          // Enable drawer gesture
          try {
            const drawerParent = this.props.navigation.getParent();
            if (drawerParent && drawerParent.setOptions) {
              drawerParent.setOptions({
                swipeEnabled: true
              });
              console.log("FormPage - Enabled drawer gesture");
            }
          } catch (error) {
            console.error("FormPage - Error enabling drawer gesture:", error);
          }
        }
      }
    );
    
    // Add a direct hardware back button handler for Android
    this.backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        console.log("FormPage - hardware back button pressed");
        // If there are items in the container, show confirmation
        if (this.state.items.length > 0) {
          console.log("FormPage - showing alert for back button");
          Alert.alert(
            "Unsaved Changes",
            "You have unsaved items in your package. What would you like to do?",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  console.log("FormPage - user chose Cancel");
                  // User decided to stay on the page
                }
              },
              {
                text: "Discard",
                style: "destructive",
                onPress: () => {
                  console.log("FormPage - user chose Discard");
                  // Clear items and continue with navigation
                  this.clearItems();
                  // Go back
                  this.props.navigation.goBack();
                }
              },
              {
                text: "Save Package",
                style: "default",
                onPress: () => {
                  console.log("FormPage - user chose Save Package");
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
        
        // If there are no items, allow navigation
        if (this.state.items.length === 0) {
          console.log("FormPage - no items, allowing navigation");
          return;
        }
        
        // Prevent default navigation
        e.preventDefault();
        console.log("FormPage - prevented navigation");
        
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
                // User decided to stay on the page
              }
            },
            {
              text: "Discard",
              style: "destructive",
              onPress: () => {
                console.log("FormPage - user chose Discard");
                // Clear items and continue with navigation
                this.clearItems();
                // Continue with navigation
                this.props.navigation.dispatch(e.data.action);
              }
            },
            {
              text: "Save Package",
              style: "default",
              onPress: () => {
                console.log("FormPage - user chose Save Package");
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
  

  
  // Handle menu button press
  handleMenuPress = () => {
    console.log("FormPage - handleMenuPress");
    // If there are items in the package, show alert
    if (this.state.items.length > 0) {
      console.log("FormPage - showing alert for menu press");
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved items in your package. What would you like to do?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              console.log("FormPage - user chose Cancel");
              // User decided to stay on the page
            }
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              console.log("FormPage - user chose Discard");
              // Clear items and continue with navigation
              this.clearItems();
              // Re-enable drawer gesture
              try {
                const drawerParent = this.props.navigation.getParent();
                if (drawerParent && drawerParent.setOptions) {
                  drawerParent.setOptions({
                    swipeEnabled: true
                  });
                  console.log("FormPage - Re-enabled drawer gesture after discard");
                }
              } catch (error) {
                console.error("FormPage - Error re-enabling drawer gesture:", error);
              }
              // Open drawer
              this.props.navigation.openDrawer();
            }
          },
          {
            text: "Save Package",
            style: "default",
            onPress: () => {
              console.log("FormPage - user chose Save Package");
              // Open the save package modal
              this.setState({
                showSavePackageModal: true,
                pendingNavigationAction: 'openDrawer'
              });
            }
          }
        ],
        { cancelable: false }
      );
    } else {
      // Otherwise, open the drawer normally
      console.log("FormPage - opening drawer");
      this.props.navigation.openDrawer();
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
        this.props.navigation.dispatch(this.pendingNavigationAction);
        this.pendingNavigationAction = null;
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
    if (this.state.items.length === 0) {
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
          });
        });
      });
    } catch (error) {
      this.setState({ isLoading: false });
      console.error(error);
      Alert.alert("Error", "An error occurred while retrieving the item list");
    }
  };

  // Method to add an item received from AI Search page
  addItemFromAISearch = (newItemData) => {
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
      
      // Clear the form fields after adding the item
      this.resetForm();
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
            <Text style={[styles.buttonText, { color: '#64748B', textAlign: 'center' }]} numberOfLines={2}>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 20 * scale, paddingRight: 10 * scale, marginBottom: 5 * scale }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 20 * scale, paddingRight: 10 * scale, marginBottom: 5 * scale }}>
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
        
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={[styles.horizontalCarouselContainer, { paddingBottom: 10 * scale }]}
          decelerationRate="fast"
          snapToInterval={170} // Width of the item + margins
          snapToAlignment="start"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {items.map((item, index) => this.renderItem(item, index))}
        </ScrollView>
      </View>
    );
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
              this.setState({ 
                showSuggestions: false,
                showRecentItems: false
              });
            }}>
              <View style={styles.container}>
                <View style={styles.formContainer}>
                <VStack space={2} width="100%">
                    <Text style={[styles.label, styles.condensedLabel]}>Name</Text>
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
                            borderBottomWidth: (() => {
                              const { recentSavedItems, items, showRecentItems, itemName } = this.state;
                              const hasFilteredItems = recentSavedItems.filter(item => {
                                const name = item.itemName || item.name || '';
                                return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === name.toLowerCase());
                              }).length > 0;
                              return showRecentItems && hasFilteredItems && !itemName ? 0 : 1;
                            })(),
                            borderBottomLeftRadius: (() => {
                              const { recentSavedItems, items, showRecentItems, itemName } = this.state;
                              const hasFilteredItems = recentSavedItems.filter(item => {
                                const name = item.itemName || item.name || '';
                                return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === name.toLowerCase());
                              }).length > 0;
                              return showRecentItems && hasFilteredItems && !itemName ? 0 : 8;
                            })(),
                            borderBottomRightRadius: (() => {
                              const { recentSavedItems, items, showRecentItems, itemName } = this.state;
                              const hasFilteredItems = recentSavedItems.filter(item => {
                                const name = item.itemName || item.name || '';
                                return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === name.toLowerCase());
                              }).length > 0;
                              return showRecentItems && hasFilteredItems && !itemName ? 0 : 8;
                            })(),
                            borderBottomColor: '#E2E8F0',
                            marginBottom: 0
                          }]}
                          value={this.state.itemName}
                          onChangeText={this.handleChange}
                          onFocus={() => {
                            if (!this.state.itemName.trim()) {
                              this.setState({ 
                                showRecentItems: true,
                                showSuggestions: false
                              });
                            }
                          }}
                          maxLength={50}
                          placeholder="Enter item name (MacBook, Xbox etc)"
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
                          onPress={() => this.setState({ savedItemsSearchQuery: this.state.itemName, showAllSavedItemsModal: true, showRecentItems: false })}
                        >
                          <Ionicons name="search" size={22} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                      
                      {(() => {
                        const { recentSavedItems, items, showRecentItems, itemName, showSuggestions } = this.state;
                        
                        if (!showRecentItems || itemName.length > 0 || showSuggestions) {
                          return null;
                        }

                        const filteredItems = recentSavedItems.filter(item => {
                          const name = item.itemName || item.name || '';
                          return !items.some(addedItem => (addedItem.itemName || '').toLowerCase() === name.toLowerCase());
                        });

                        if (filteredItems.length === 0) {
                          return null;
                        }

                        return (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F8FAFC',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            borderTopWidth: 0,
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                            paddingLeft: 16,
                            paddingRight: 16,
                            paddingVertical: 12,
                            marginTop: -1,
                          }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginRight: 8 }}>
                              Recent:
                            </Text>
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
                                      backgroundColor: '#EFF6FF',
                                      borderRadius: 16,
                                      paddingVertical: 10,
                                      paddingHorizontal: 16,
                                      marginRight: 8,
                                      borderWidth: 1,
                                      borderColor: '#DBEAFE',
                                    }}
                                    onPress={() => this.selectSavedItem(item)}
                                  >
                                    <Text style={{ 
                                      fontSize: 14, 
                                      color: '#0066FF',
                                      fontWeight: '500',
                                    }}>{item.itemName || item.name || ''} <Text style={{ color: '#3B82F6' }}>↵</Text></Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          </View>
                        );
                      })()}

                    </View>
                    
                    
                    
                    <VStack space={2} width="100%">
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.label, styles.condensedLabel]}>Length</Text>
                        <Ionicons name="swap-horizontal-outline" size={16} color="#64748B" style={{ marginLeft: 4 }} />
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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.label, styles.condensedLabel]}>Width</Text>
                        <Ionicons name="resize-outline" size={16} color="#64748B" style={{ marginLeft: 4 }} />
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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.label, styles.condensedLabel]}>Height</Text>
                        <Ionicons name="arrow-up-outline" size={16} color="#64748B" style={{ marginLeft: 4 }} />
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
                      <Text style={[styles.label, styles.condensedLabel]}>Quantity</Text>
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
                    </VStack>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={this.handleSubmit}
                    >
                      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Add item</Text>
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
                                return (
                                  <TouchableOpacity
                                    key={item.id}
                                    onPress={() => !alreadyAdded && this.selectSavedItem(item)}
                                    disabled={alreadyAdded}
                                    style={{
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      paddingVertical: 16,
                                      borderBottomWidth: 1,
                                      borderBottomColor: '#E2E8F0',
                                      opacity: alreadyAdded ? 0.4 : 1,
                                    }}
                                  >
                                    <View>
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
                                    {alreadyAdded ? (
                                      <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                                    ) : (
                                      <Text style={{ color: '#3B82F6', fontSize: 24 }}>↵</Text>
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
                                  <Text style={{ fontSize: 15, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
                                    Try a different search, or use the button below to find your item with AI Search.
                                  </Text>
                                </View>
                              );
                            }
                          })()}
                        </ScrollView>

                        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                          <TouchableOpacity
                            style={{
                              paddingVertical: 14,
                              backgroundColor: '#0066FF',
                              borderRadius: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onPress={() => {
                              this.hideAllSavedItemsModal();
                              this.props.navigation.navigate('AI Item Search', { 
                                searchQuery: this.state.savedItemsSearchQuery,
                                fromFormPage: true // Flag to indicate navigation from FormPage
                              });
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                              Find with AI Search
                            </Text>
                          </TouchableOpacity>
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