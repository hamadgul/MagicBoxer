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
  BackHandler,
  InteractionManager,
} from "react-native";
import { VStack } from "native-base";  
import AsyncStorage from "@react-native-async-storage/async-storage";

import { generateUUID } from "three/src/math/MathUtils";
import { pack, createDisplay } from "../packing_algo/packing";
import styles from "../theme/Styles";
import { modalStyles } from "../theme/ModalStyles";
import { Ionicons } from "@expo/vector-icons";

var Buffer = require("@craftzdog/react-native-buffer").Buffer;


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
      productList: [], // Initialize with empty array instead of defaultProductList
      recentSavedItems: [], // Store recently saved items
      showRecentItems: false,
      flashScrollbar: false,
      scrollViewRef: React.createRef(),
      dimensionsFromSavedItem: false // Track if dimensions are from a saved item
    };
    this.inputRef = React.createRef();
  }

  // Load saved items from SavedItems page for suggestions
  loadSavedItemsForSuggestions = async () => {
    try {
      const savedItemsString = await AsyncStorage.getItem("savedItems");
      if (savedItemsString) {
        const savedItems = JSON.parse(savedItemsString);
        
        // Log the structure of the first saved item for debugging
        if (savedItems.length > 0) {
          console.log('First saved item structure:', JSON.stringify(savedItems[0]));
        }
        
        // Get the 3 most recently added items for quick suggestions
        const recentItems = [...savedItems]
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 3);
          
        this.setState({ recentSavedItems: recentItems });
        console.log(`Loaded ${recentItems.length} saved items for suggestions`);
      } else {
        this.setState({ recentSavedItems: [] });
      }
    } catch (error) {
      console.error("Error loading saved items for suggestions:", error);
      this.setState({ recentSavedItems: [] });
    }
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
        dimensionsFromSavedItem: false // Reset the tracking state
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
      'isLoading'
    ];

    return relevantStateKeys.some(key => this.state[key] !== nextState[key]);
  }

  componentDidMount() {
    console.log("FormPage - componentDidMount");
    this.loadItems();
    this.loadCustomProducts();
    this.loadSavedItemsForSuggestions();
    

    
    // Refresh data when the screen comes into focus
    this.focusListener = this.props.navigation.addListener(
      "focus",
      () => {
        console.log("FormPage - focus event");
        this.loadCustomProducts();
        this.loadItems();
        this.loadSavedItemsForSuggestions();
        // Show recent items when the screen comes into focus
        this.setState({ showRecentItems: true });
        

        
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
      const serializedItems = Buffer.from(
        JSON.stringify(updatedItems)
      ).toString("base64");
      await AsyncStorage.setItem("itemList", serializedItems);
      Alert.alert("Success", `${itemToDelete.itemName} was removed`);
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
        <View style={styles.horizontalItemContentContainer}>
          <View style={styles.horizontalItemNameContainer}>
            <Text style={[styles.buttonText, { color: '#64748B', textAlign: 'center' }]} numberOfLines={2}>
              {item.itemName}{item.quantity > 1 ? `
(×${item.quantity})` : ''}
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
    if (items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No items added yet for this package.
          </Text>
          <Text style={styles.emptySubtext}>
            Add items above and access saved packages on the side menu.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.horizontalCarouselContainer}
        decelerationRate="fast"
        snapToInterval={170} // Width of the item + margins
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, index) => this.renderItem(item, index))}
      </ScrollView>
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
                    <View style={{ position: 'relative', zIndex: 1 }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      position: 'relative'
                    }}>
                      <TextInput
                        ref={this.inputRef}
                        style={[styles.input, styles.condensedInput, { 
                          flex: 1, 
                          paddingRight: 40,
                          // Only connect with suggestions if they're actually visible
                          borderBottomWidth: (() => {
                            // Check if we have filtered items to show
                            const hasFilteredItems = this.state.recentSavedItems.some(item => {
                              const itemName = item.itemName || item.name || '';
                              const alreadyAdded = this.state.items.some(addedItem => 
                                (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
                              );
                              return !alreadyAdded;
                            });
                            
                            // Only remove bottom border if we're showing recent items AND there are filtered items to show
                            return this.state.showRecentItems && hasFilteredItems ? 0 : 1;
                          })(),
                          borderBottomLeftRadius: (() => {
                            // Check if we have filtered items to show
                            const hasFilteredItems = this.state.recentSavedItems.some(item => {
                              const itemName = item.itemName || item.name || '';
                              const alreadyAdded = this.state.items.some(addedItem => 
                                (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
                              );
                              return !alreadyAdded;
                            });
                            
                            // Only remove radius if we're showing recent items AND there are filtered items to show
                            return this.state.showRecentItems && hasFilteredItems ? 0 : 8;
                          })(),
                          borderBottomRightRadius: (() => {
                            // Check if we have filtered items to show
                            const hasFilteredItems = this.state.recentSavedItems.some(item => {
                              const itemName = item.itemName || item.name || '';
                              const alreadyAdded = this.state.items.some(addedItem => 
                                (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
                              );
                              return !alreadyAdded;
                            });
                            
                            // Only remove radius if we're showing recent items AND there are filtered items to show
                            return this.state.showRecentItems && hasFilteredItems ? 0 : 8;
                          })(),
                          borderBottomColor: '#E2E8F0',
                          marginBottom: 0 // Remove bottom margin
                        }]}
                        value={this.state.itemName}
                        onChangeText={this.handleChange}
                        onFocus={() => {
                          // Show recent items when the field is focused
                          if (!this.state.itemName.trim()) {
                            this.setState({ 
                              showRecentItems: true,
                              showSuggestions: false
                            });
                          }
                        }}
                        maxLength={50}
                        placeholder="MacBook, Xbox etc"
                        placeholderTextColor={"#d3d3d3"}
                        autoCorrect={false}
                        spellCheck={false}
                      />
                      <TouchableOpacity 
                        style={{
                          position: 'absolute',
                          right: 10,
                          padding: 5,
                        }}
                        onPress={() => {
                          // This will be implemented later as mentioned
                          Alert.alert("Coming Soon", "Search functionality will be implemented in a future update.");
                        }}
                      >
                        <Ionicons name="search" size={22} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Recently saved items suggestions - positioned directly below the name field */}
                    {this.state.showRecentItems && !this.state.showSuggestions && (() => {
                      // Filter out items that already exist in the added items container
                      const filteredItems = this.state.recentSavedItems.filter(item => {
                        const itemName = item.itemName || item.name || '';
                        
                        // Check if this item already exists in the added items container
                        const alreadyAdded = this.state.items.some(addedItem => 
                          (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
                        );
                        
                        // Only show items that don't already exist in the added items container
                        return !alreadyAdded;
                      });
                      
                      // Only render the suggestions container if there are items to display
                      return filteredItems.length > 0 && (
                      <View style={{
                        marginTop: -3, /* Connect directly to input field above */
                        marginBottom: 8,
                        paddingTop: 10, /* Increase top padding for better spacing */
                        paddingBottom: 8,
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderTopWidth: 0, /* No top border to connect with input */
                        borderColor: '#E2E8F0',
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                      }}>
                        <Text style={{ 
                          fontSize: 12, 
                          color: '#64748B',
                          marginRight: 8,
                          fontWeight: '500'
                        }}>Recent:</Text>
                        {filteredItems.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={{
                                backgroundColor: '#EBF5FF',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                                marginRight: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: 32,
                                marginTop: 0,
                                borderWidth: 1,
                                borderColor: '#DBEAFE',
                              }}
                              onPress={() => {
                                // Log the item to debug
                                console.log('Selected saved item:', JSON.stringify(item));
                              
                              // Check if the item has itemName or name property
                              const name = item.itemName || item.name || '';
                              
                              // Extract dimensions from the item based on the structure in SavedItemsPage
                              let length = '';
                              let width = '';
                              let height = '';
                              
                              // Check if the item has dimensions object (as in SavedItemsPage)
                              if (item.dimensions) {
                                // Parse dimensions from strings like "12.00 inches"
                                const extractNumber = (dimensionStr) => {
                                  if (!dimensionStr) return '';
                                  const match = dimensionStr.match(/([\d.]+)/);
                                  if (!match) return '';
                                  
                                  // Convert to number and back to string to remove trailing zeros
                                  const num = parseFloat(match[1]);
                                  return num % 1 === 0 ? Math.floor(num).toString() : num.toString();
                                };
                                
                                length = extractNumber(item.dimensions.length);
                                width = extractNumber(item.dimensions.width);
                                height = extractNumber(item.dimensions.height);
                              } 
                              // Check if dimensions are in the items array (as in packages)
                              else if (item.items && item.items.length > 0) {
                                const firstItem = item.items[0];
                                if (firstItem.dimensions) {
                                  const extractNumber = (dimensionStr) => {
                                    if (!dimensionStr) return '';
                                    const match = dimensionStr.match(/([\d.]+)/);
                                    if (!match) return '';
                                    
                                    // Convert to number and back to string to remove trailing zeros
                                    const num = parseFloat(match[1]);
                                    return num % 1 === 0 ? Math.floor(num).toString() : num.toString();
                                  };
                                  
                                  length = extractNumber(firstItem.dimensions.length);
                                  width = extractNumber(firstItem.dimensions.width);
                                  height = extractNumber(firstItem.dimensions.height);
                                } else {
                                  length = firstItem.itemLength || firstItem.length || '';
                                  width = firstItem.itemWidth || firstItem.width || '';
                                  height = firstItem.itemHeight || firstItem.height || '';
                                }
                              } 
                              // Otherwise try direct properties
                              else {
                                length = item.itemLength || item.length || '';
                                width = item.itemWidth || item.width || '';
                                height = item.itemHeight || item.height || '';
                              }
                              
                              console.log('Extracted dimensions:', { length, width, height });
                              
                              // Populate form with saved item dimensions
                              this.setState({
                                itemName: name,
                                itemLength: length.toString(),
                                itemWidth: width.toString(),
                                itemHeight: height.toString(),
                                showRecentItems: false,
                                dimensionsFromSavedItem: true // Mark dimensions as coming from a saved item
                              });
                            }}
                          >
                            <Text style={{ 
                              fontSize: 14, 
                              color: '#0066FF',
                              fontWeight: '500',
                              marginRight: 4,
                            }}>{item.name}</Text>
                            <Ionicons name="arrow-forward-outline" size={14} color="#0066FF" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                    })()} 
                  </View>
                </VStack>
                
                {/* Product suggestions dropdown has been deactivated */}
                
                {/* Add spacer when recent items are not shown or after adding items */}
                {(!this.state.showRecentItems || this.state.itemName === "") && <View style={{ height: 16 }} />}
                
                <VStack space={2} width="100%">
                  <Text style={[styles.label, styles.condensedLabel]}>Length</Text>
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
                  <Text style={[styles.label, styles.condensedLabel]}>Width</Text>
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
                  <Text style={[styles.label, styles.condensedLabel]}>Height</Text>
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
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Pack</Text>
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