import React, { Component } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { modalStyles } from "../theme/ModalStyles";
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

export default class SavedItemsPage extends Component {
  state = {
    savedItems: [],
    showAddItemModal: false,
    showOptionsModal: false,
    selectedItem: null,
    itemName: "",
    itemLength: "",
    itemWidth: "",
    itemHeight: "",
    isEditing: false, // Flag to determine if we're adding or editing an item
    currentItemId: null,
    selectionMode: false, // Flag to determine if we're in bulk selection mode
    selectedItems: [], // Array of selected item IDs
    showDeleteConfirmModal: false, // Flag to show delete confirmation modal
    isImporting: false, // Flag to show importing indicator
    showImportModal: false, // Flag to show import confirmation modal
    importPreview: [], // Preview of items to be imported
    isFabMenuOpen: false, // Flag to track if the FAB menu is open
    searchQuery: "", // Search query for filtering saved items
  };

  // Animation values
  fabRotation = new Animated.Value(0);
  addItemFabScale = new Animated.Value(0);
  importFabScale = new Animated.Value(0);
  addItemFabOpacity = new Animated.Value(0);
  importFabOpacity = new Animated.Value(0);

  constructor(props) {
    super(props);
    
    this.props.navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Ionicons name="bookmark-outline" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>My Saved Items</Text>
        </View>
      ),
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#E2E8F0',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#64748B',
    });
  }

  componentDidMount() {
    console.log('SavedItemsPage mounted');
    this.fetchSavedItems();
    
    // Initialize FAB animations
    this.addItemFabScale.setValue(0);
    this.importFabScale.setValue(0);
    this.addItemFabOpacity.setValue(0);
    this.importFabOpacity.setValue(0);
    
    this.focusListener = this.props.navigation.addListener(
      "focus",
      this.fetchSavedItems
    );
  }

  componentWillUnmount() {
    console.log('SavedItemsPage unmounting');
    
    if (this.focusListener) {
      this.focusListener();
    }
  }

  fetchSavedItems = async () => {
    try {
      const savedItemsString = await AsyncStorage.getItem("savedItems");
      const savedItems = savedItemsString ? JSON.parse(savedItemsString) : [];
      this.setState({ savedItems });
    } catch (error) {
      console.error("Error loading saved items:", error);
      Alert.alert("Error", "Failed to load saved items.");
    }
  };

  handleAddItem = async () => {
    const { itemName, itemLength, itemWidth, itemHeight, isEditing, selectedItem, savedItems } = this.state;
    
    // Validate inputs
    if (!itemName.trim()) {
      Alert.alert("Error", "Item name cannot be empty.");
      return;
    }
    
    const length = parseFloat(itemLength);
    const width = parseFloat(itemWidth);
    const height = parseFloat(itemHeight);
    
    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      Alert.alert("Error", "Dimensions must be valid numbers.");
      return;
    }
    
    let updatedItems;
    
    if (isEditing) {
      // Check if the name already exists (excluding the current item)
      const nameExists = savedItems.some(item => 
        item.id !== selectedItem.id && 
        item.name.toLowerCase() === itemName.trim().toLowerCase()
      );
      
      if (nameExists) {
        Alert.alert("Error", "An item with this name already exists.");
        return;
      }
      
      // Update existing item
      updatedItems = savedItems.map(item => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            name: itemName.trim(),
            dimensions: {
              length: `${length.toFixed(2)} inches`,
              width: `${width.toFixed(2)} inches`,
              height: `${height.toFixed(2)} inches`
            },
            timestamp: Date.now() // Update timestamp when editing to make it recent
          };
        }
        return item;
      });
    } else {
      // Check if item with same name already exists
      const itemExists = savedItems.some(item => item.name.toLowerCase() === itemName.trim().toLowerCase());
      if (itemExists) {
        Alert.alert("Error", "An item with this name already exists.");
        return;
      }
      
      // Create new item
      const newItem = {
        id: await Crypto.randomUUID(),
        name: itemName.trim(),
        dimensions: {
          length: `${length.toFixed(2)} inches`,
          width: `${width.toFixed(2)} inches`,
          height: `${height.toFixed(2)} inches`
        },
        timestamp: Date.now() // Add timestamp for sorting by recency
      };
      
      // Add to state
      updatedItems = [...savedItems, newItem];
    }
    
    // Update state and save
    this.setState({ 
      savedItems: updatedItems,
      showAddItemModal: false,
      isEditing: false,
      selectedItem: null,
      itemName: "",
      itemLength: "",
      itemWidth: "",
      itemHeight: "",
      isEditMode: false,
      editingItem: null
    }, async () => {
      try {
        // Save to AsyncStorage
        await AsyncStorage.setItem("savedItems", JSON.stringify(updatedItems));
        
        // Update custom products data
        await this.updateProductsData(updatedItems);
        
        const message = isEditing ? "Item updated successfully." : "Item saved successfully and will be available in the Add Items page.";
        Alert.alert("Success", message);
      } catch (error) {
        console.error("Error saving item:", error);
        Alert.alert("Error", "Failed to save item.");
      }
    });
  };

  updateProductsData = async (items) => {
    try {
      // Store the custom items in AsyncStorage as 'customProducts'
      await AsyncStorage.setItem("customProducts", JSON.stringify(items));
      console.log("Custom products saved successfully");
      
      // We'll merge these with the built-in products when needed in FormPage
      // This approach avoids trying to modify the app's bundled assets
      
      // Notify the user that their items will be available in the Add Items page
      return true;
    } catch (error) {
      console.error("Error saving custom products:", error);
      throw error;
    }
  };

  handleDeleteItem = async (itemId, skipConfirmation = false) => {
    // If skipConfirmation is true, delete without confirmation
    if (skipConfirmation) {
      try {
        const updatedItems = this.state.savedItems.filter(item => item.id !== itemId);
        
        this.setState({ 
          savedItems: updatedItems,
          showAddItemModal: false, // Close the modal
          showOptionsModal: false,
          isEditing: false,
          selectedItem: null,
          itemName: "",
          itemLength: "",
          itemWidth: "",
          itemHeight: ""
        }, async () => {
          // Save to AsyncStorage
          await AsyncStorage.setItem("savedItems", JSON.stringify(updatedItems));
          
          // Update custom products data
          await this.updateProductsData(updatedItems);
          
          Alert.alert("Success", "Item deleted successfully.");
        });
      } catch (error) {
        console.error("Error deleting item:", error);
        Alert.alert("Error", "Failed to delete item.");
      }
      return;
    }
    
    // Show confirmation if skipConfirmation is false
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedItems = this.state.savedItems.filter(item => item.id !== itemId);
              
              this.setState({ 
                savedItems: updatedItems,
                showAddItemModal: false, // Close the modal
                showOptionsModal: false,
                isEditing: false,
                selectedItem: null,
                itemName: "",
                itemLength: "",
                itemWidth: "",
                itemHeight: ""
              }, async () => {
                // Save to AsyncStorage
                await AsyncStorage.setItem("savedItems", JSON.stringify(updatedItems));
                
                // Update custom products data
                await this.updateProductsData(updatedItems);
                
                Alert.alert("Success", "Item deleted successfully.");
              });
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item.");
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  openEditModal = (item) => {
    // Get dimensions from either direct or nested structure
    let dimensions = null;
    if (item.dimensions) {
      dimensions = item.dimensions;
    } else if (item.items && item.items.length > 0 && item.items[0].dimensions) {
      dimensions = item.items[0].dimensions;
    }
    
    if (!dimensions) {
      Alert.alert("Error", "Could not find dimensions for this item.");
      return;
    }
    
    // Extract numeric values from dimensions
    const lengthValue = parseFloat(dimensions.length.toString().split(' ')[0]);
    const widthValue = parseFloat(dimensions.width.toString().split(' ')[0]);
    const heightValue = parseFloat(dimensions.height.toString().split(' ')[0]);
    
    this.setState({
      showAddItemModal: true,
      isEditing: true,
      selectedItem: item,
      itemName: item.name,
      itemLength: lengthValue.toString(),
      itemWidth: widthValue.toString(),
      itemHeight: heightValue.toString()
    });
  };

  // Helper function to format dimension values without unnecessary decimal places
  formatDimension = (value) => {
    if (!value) return "0";
    
    // Extract numeric part from the dimension string
    const numericPart = value.toString().replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(numericPart);
    
    // If it's a whole number, return without decimal places
    if (numericValue % 1 === 0) {
      return Math.floor(numericValue).toString();
    }
    
    // Otherwise, return with up to 2 decimal places
    return numericValue.toFixed(2);
  };

  // Filter saved items based on search query (name only)
  getFilteredItems = () => {
    const { savedItems, searchQuery } = this.state;
    
    let items = [...savedItems]; // Create a copy to avoid mutating state
    
    // Filter items if there's a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        // Check if the item name matches the query
        return item.name.toLowerCase().includes(query);
      });
    }
    
    // Reverse the order to show newest first
    return items.reverse();
  };

  toggleItemSelection = (itemId) => {
    this.setState(prevState => {
      const selectedItems = [...prevState.selectedItems];
      const index = selectedItems.indexOf(itemId);
      
      if (index > -1) {
        selectedItems.splice(index, 1);
      } else {
        selectedItems.push(itemId);
      }
      
      return { selectedItems };
    });
  };

  toggleSelectionMode = () => {
    this.setState(prevState => ({
      selectionMode: !prevState.selectionMode,
      selectedItems: []
    }));
  };

  // CSV Import functionality
  toggleFabMenu = () => {
    const { isFabMenuOpen } = this.state;
    
    // Toggle the menu state
    this.setState({ isFabMenuOpen: !isFabMenuOpen });
    
    // Animate the main FAB rotation
    Animated.timing(this.fabRotation, {
      toValue: isFabMenuOpen ? 0 : 1,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    
    // Animate the secondary FABs
    if (!isFabMenuOpen) {
      // Opening the menu
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(this.addItemFabScale, {
            toValue: 1,
            duration: 200,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(this.addItemFabOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(this.importFabScale, {
            toValue: 1,
            duration: 200,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(this.importFabOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Closing the menu
      Animated.parallel([
        Animated.timing(this.addItemFabScale, {
          toValue: 0,
          duration: 200,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(this.addItemFabOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(this.importFabScale, {
          toValue: 0,
          duration: 200,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(this.importFabOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };
  
  handleAddItemPress = () => {
    this.setState({ 
      showAddItemModal: true, 
      isEditing: false, 
      itemName: "", 
      itemLength: "", 
      itemWidth: "", 
      itemHeight: "" 
    });
    this.toggleFabMenu(); // Close the menu after selecting an option
  };
  
  handleImportPress = () => {
    this.setState({ showImportModal: true, importPreview: [] });
    this.toggleFabMenu(); // Close the menu after selecting an option
  };
  
  pickCSVFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        console.log('User cancelled file picking');
        return;
      }
      
      // Process the CSV file
      this.setState({ isImporting: true });
      await this.processCSVFile(result.assets[0].uri);
      
    } catch (error) {
      console.error('Error picking CSV file:', error);
      Alert.alert('Error', 'Failed to select CSV file. Please try again.');
      this.setState({ isImporting: false });
    }
  };
  
  processCSVFile = async (fileUri) => {
    try {
      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      
      // Parse CSV content
      const items = this.parseCSV(fileContent);
      
      if (items.length === 0) {
        Alert.alert('Error', 'No valid items found in the CSV file. Please check the format.');
        this.setState({ isImporting: false });
        return;
      }
      
      // Update state with preview
      this.setState({ 
        importPreview: items,
        isImporting: false 
      });
      
    } catch (error) {
      console.error('Error processing CSV file:', error);
      Alert.alert('Error', 'Failed to process CSV file. Please check the format.');
      this.setState({ isImporting: false });
    }
  };
  
  downloadSampleCSV = async () => {
    try {
      // Path to the sample CSV file
      const fileName = 'magicboxer_sample_items.csv';
      const samplePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Sample CSV content with proper line endings
      const sampleContent = 'Name,Length,Width,Height\r\nSmall Box,10,8,6\r\nMedium Box,14,12,10\r\nLarge Box,20,16,12\r\nFlat Mailer,12,9,0.5\r\nTube Mailer,24,3,3';
      
      // Write the sample file
      await FileSystem.writeAsStringAsync(samplePath, sampleContent);
      
      // Share the file
      const result = await Sharing.shareAsync(samplePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Save Sample CSV Template',
        UTI: 'public.comma-separated-values-text'
      });
      
      console.log('CSV file shared:', result);
      
    } catch (error) {
      console.error('Error sharing sample CSV:', error);
      Alert.alert('Error', 'Failed to download sample CSV file.');
    }
  };
  
  parseCSV = (csvContent) => {
    // Simple CSV parser
    const lines = csvContent.split('\n');
    if (lines.length <= 1) {
      return [];
    }
    
    // Get headers (first line)
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    
    // Check if required headers exist
    const requiredHeaders = ['name', 'length', 'width', 'height'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      Alert.alert('Error', `CSV file is missing required headers: ${missingHeaders.join(', ')}`);
      return [];
    }
    
    // Get indices for each required column
    const nameIndex = headers.indexOf('name');
    const lengthIndex = headers.indexOf('length');
    const widthIndex = headers.indexOf('width');
    const heightIndex = headers.indexOf('height');
    
    // Parse data rows
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const values = line.split(',').map(value => value.trim());
      
      // Validate row has enough columns
      if (values.length < Math.max(nameIndex, lengthIndex, widthIndex, heightIndex) + 1) {
        console.warn(`Skipping row ${i} due to insufficient columns`);
        continue;
      }
      
      const name = values[nameIndex];
      const length = parseFloat(values[lengthIndex]);
      const width = parseFloat(values[widthIndex]);
      const height = parseFloat(values[heightIndex]);
      
      // Validate data
      if (!name || isNaN(length) || isNaN(width) || isNaN(height) || 
          length <= 0 || width <= 0 || height <= 0) {
        console.warn(`Skipping row ${i} due to invalid data:`, { name, length, width, height });
        continue;
      }
      
      items.push({
        name,
        length: length.toFixed(2),
        width: width.toFixed(2),
        height: height.toFixed(2)
      });
    }
    
    return items;
  };
  
  handleImportItems = async () => {
    const { importPreview, savedItems } = this.state;
    
    if (importPreview.length === 0) {
      return;
    }
    
    this.setState({ isImporting: true });
    
    try {
      // Check for duplicate names
      const existingNames = new Set(savedItems.map(item => item.name.toLowerCase()));
      const newItems = [];
      const duplicates = [];
      
      // Process each item
      for (const item of importPreview) {
        if (existingNames.has(item.name.toLowerCase())) {
          duplicates.push(item.name);
          continue;
        }
        
        // Create new item with proper format
        const newItem = {
          id: await Crypto.randomUUID(),
          name: item.name,
          dimensions: {
            length: `${item.length} inches`,
            width: `${item.width} inches`,
            height: `${item.height} inches`
          },
          timestamp: Date.now()
        };
        
        newItems.push(newItem);
        existingNames.add(item.name.toLowerCase());
      }
      
      // Update state with new items
      const updatedItems = [...savedItems, ...newItems];
      
      this.setState({
        savedItems: updatedItems,
        showImportModal: false,
        importPreview: [],
        isImporting: false
      }, async () => {
        // Save to AsyncStorage
        await AsyncStorage.setItem("savedItems", JSON.stringify(updatedItems));
        
        // Update custom products data
        await this.updateProductsData(updatedItems);
        
        // Show results
        if (duplicates.length > 0) {
          const message = `Imported ${newItems.length} items. Skipped ${duplicates.length} duplicate items.`;
          Alert.alert('Import Complete', message);
        } else {
          Alert.alert('Import Complete', `Successfully imported ${newItems.length} items.`);
        }
      });
      
    } catch (error) {
      console.error('Error importing items:', error);
      Alert.alert('Error', 'Failed to import items. Please try again.');
      this.setState({ isImporting: false });
    }
  };
  
  deleteSelectedItems = async () => {
    const { savedItems, selectedItems } = this.state;
    
    try {
      // Filter out the selected items
      const updatedItems = savedItems.filter(item => !selectedItems.includes(item.id));
      
      // Save to AsyncStorage
      await AsyncStorage.setItem("savedItems", JSON.stringify(updatedItems));
      
      // Update state
      this.setState({
        savedItems: updatedItems,
        selectionMode: false,
        selectedItems: [],
        showDeleteConfirmModal: false
      });
      
      Alert.alert("Success", `${selectedItems.length} item(s) deleted successfully.`);
    } catch (error) {
      console.error("Error deleting items:", error);
      Alert.alert("Error", "Failed to delete items.");
    }
  };

  renderItem = (item) => {
    const { selectionMode, selectedItems } = this.state;
    const isSelected = selectedItems.includes(item.id);
    
    // Get dimensions from either direct or nested structure
    let dimensions = null;
    if (item.dimensions) {
      dimensions = item.dimensions;
    } else if (item.items && item.items.length > 0 && item.items[0].dimensions) {
      dimensions = item.items[0].dimensions;
    }
    
    return (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.itemContainer}>
          <TouchableOpacity
            style={[styles.item, isSelected && selectionMode && styles.selectedItem]}
            onPress={() => selectionMode ? this.toggleItemSelection(item.id) : this.openEditModal(item)}
          >
            <View style={styles.itemLeftContent}>
              {selectionMode ? (
                <Ionicons 
                  name={isSelected ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#3B82F6" 
                  style={styles.itemIcon} 
                />
              ) : (
                <Ionicons name="bookmark" size={20} color="#3B82F6" style={styles.itemIcon} />
              )}
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            {dimensions ? (
              <Text style={styles.itemDimensions}>
                {this.formatDimension(dimensions.length)}L × {this.formatDimension(dimensions.width)}W × {this.formatDimension(dimensions.height)}H
              </Text>
            ) : (
              <Text style={styles.itemDimensions}>Dimensions not available</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  render() {
    const { 
      savedItems, 
      showAddItemModal, 
      itemName,
      itemLength,
      itemWidth,
      itemHeight,
      isEditing,
      selectionMode,
      selectedItems,
      showDeleteConfirmModal,
      isImporting,
      showImportModal,
      importPreview
    } = this.state;

    return (
      <TouchableWithoutFeedback 
        onPress={() => {
          Keyboard.dismiss();
          // Close the FAB menu if it's open when tapping outside
          if (this.state.isFabMenuOpen) {
            this.toggleFabMenu();
          }
        }}>
        <View style={styles.container}>
          {/* Search bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                placeholderTextColor="#94A3B8"
                value={this.state.searchQuery}
                onChangeText={(text) => this.setState({ searchQuery: text })}
                clearButtonMode={Platform.OS === 'ios' ? 'never' : 'while-editing'}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {this.state.searchQuery ? (
                <TouchableOpacity 
                  onPress={() => this.setState({ searchQuery: "" })}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {/* Search results count */}
            {this.state.searchQuery.trim() !== "" && (
              <Text style={styles.searchResultsCount}>
                {this.getFilteredItems().length} {this.getFilteredItems().length === 1 ? "item" : "items"} found
              </Text>
            )}
          </View>
          
          {/* Selection mode action bar at the top */}
          {this.state.selectionMode && (
            <View style={styles.selectionActionBar}>
              <Text style={styles.selectedCountText}>
                {this.state.selectedItems.length} item(s) selected
              </Text>
              
              <View style={styles.selectionActionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelSelectionButton]}
                  onPress={this.toggleSelectionMode}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionDeleteButton]}
                  onPress={() => {
                    if (this.state.selectedItems.length > 0) {
                      this.setState({ showDeleteConfirmModal: true });
                    } else {
                      Alert.alert("No Items Selected", "Please select at least one item to delete.");
                    }
                  }}
                  disabled={this.state.selectedItems.length === 0}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent, 
              this.state.selectionMode && styles.scrollViewWithActionBar,
              this.state.searchQuery.trim() !== "" && styles.scrollViewWithSearch
            ]}
          >
            {savedItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="bookmark-outline" size={80} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Saved Items</Text>
                <Text style={styles.emptyText}>
                  Items you save will appear here and can be quickly accessed when creating packages.
                </Text>
                <TouchableOpacity 
                  style={styles.createItemButton}
                  onPress={() => this.setState({ showAddItemModal: true })}
                >
                  <Text style={styles.createItemButtonText}>Add New Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              this.getFilteredItems().length === 0 && this.state.searchQuery ? (
                <View style={styles.emptySearchContainer}>
                  <Ionicons name="search" size={60} color="#94A3B8" />
                  <Text style={styles.emptySearchTitle}>No Results Found</Text>
                  <Text style={styles.emptySearchText}>
                    No items match your search "{this.state.searchQuery}"
                  </Text>
                </View>
              ) : (
                this.getFilteredItems().map(item => this.renderItem(item))
              )
            )}
          </ScrollView>

          {/* Add Item Modal */}
          <Modal
            visible={showAddItemModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => this.setState({ 
              showAddItemModal: false,
              isEditing: false,
              selectedItem: null,
              itemName: "",
              itemLength: "",
              itemWidth: "",
              itemHeight: ""
            })}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <TouchableWithoutFeedback 
                onPress={() => {
                  Keyboard.dismiss();
                  this.setState({ 
                    showAddItemModal: false,
                    isEditing: false,
                    selectedItem: null,
                    itemName: "",
                    itemLength: "",
                    itemWidth: "",
                    itemHeight: ""
                  });
                }}>
                <View style={modalStyles.centeredView}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={modalStyles.modalContent}>
                  <View style={modalStyles.modalHeader}>
                    <Text style={modalStyles.modalTitle}>{this.state.isEditing ? 'Edit Item' : 'Add New Item'}</Text>
                  </View>
                  
                  <ScrollView style={{ width: '100%' }}>
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
                        value={itemName}
                        onChangeText={(text) => this.setState({ itemName: text })}
                        placeholder=""
                        placeholderTextColor="#64748B"
                        maxLength={30}
                      />
                    </View>
                    
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Length:</Text>
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
                          value={itemLength}
                          onChangeText={(text) => this.setState({ itemLength: text })}
                          keyboardType="decimal-pad"
                          placeholder=""
                          placeholderTextColor="#64748B"
                          maxLength={5}
                        />
                        <Text style={{ 
                          fontSize: 15,
                          color: '#94A3B8',
                        }}>inches</Text>
                      </View>
                    </View>
                    
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Width:</Text>
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
                          value={itemWidth}
                          onChangeText={(text) => this.setState({ itemWidth: text })}
                          keyboardType="decimal-pad"
                          placeholder=""
                          placeholderTextColor="#64748B"
                          maxLength={5}
                        />
                        <Text style={{ 
                          fontSize: 15,
                          color: '#94A3B8',
                        }}>inches</Text>
                      </View>
                    </View>
                    
                    <View style={modalStyles.fieldRow}>
                      <Text style={modalStyles.fieldLabel}>Height:</Text>
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
                          value={itemHeight}
                          onChangeText={(text) => this.setState({ itemHeight: text })}
                          keyboardType="decimal-pad"
                          placeholder=""
                          placeholderTextColor="#64748B"
                          maxLength={5}
                        />
                        <Text style={{ 
                          fontSize: 15,
                          color: '#94A3B8',
                        }}>inches</Text>
                      </View>
                    </View>
                  </ScrollView>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 20,
                    paddingHorizontal: 10
                  }}>
                    {this.state.isEditing ? (
                      <TouchableOpacity
                        style={[modalStyles.button, modalStyles.deleteButton, {
                          paddingVertical: 12,
                          paddingHorizontal: 25,
                          minWidth: 100,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }]}
                        onPress={() => {
                          if (this.state.selectedItem) {
                            this.handleDeleteItem(this.state.selectedItem.id);
                          }
                        }}
                      >
                        <Text style={modalStyles.buttonText}>Delete</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[modalStyles.button, modalStyles.cancelButton, {
                          paddingVertical: 12,
                          paddingHorizontal: 25,
                          minWidth: 100,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }]}
                        onPress={() => this.setState({ 
                          showAddItemModal: false,
                          isEditing: false,
                          selectedItem: null,
                          itemName: "",
                          itemLength: "",
                          itemWidth: "",
                          itemHeight: ""
                        })}
                      >
                        <Text style={modalStyles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.saveButton, {
                        paddingVertical: 12,
                        paddingHorizontal: 25,
                        minWidth: 100,
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 2
                      }]}
                      onPress={this.handleAddItem}
                    >
                      <Text style={[modalStyles.buttonText, {fontWeight: '600'}]}>{this.state.isEditing ? 'Update' : 'Save'}</Text>
                    </TouchableOpacity>
                  </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>



          {/* Delete confirmation modal */}
          <Modal
            visible={this.state.showDeleteConfirmModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => this.setState({ showDeleteConfirmModal: false })}
          >
            <TouchableWithoutFeedback 
              onPress={() => this.setState({ showDeleteConfirmModal: false })}
            >
              <View style={modalStyles.centeredView}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={modalStyles.modalContent}>
                    <View style={modalStyles.modalHeader}>
                      <Text style={modalStyles.modalTitle}>Confirm Deletion</Text>
                    </View>
                    
                    <Text style={modalStyles.modalSubtitle}>
                      Are you sure you want to delete {this.state.selectedItems.length} selected item(s)?
                    </Text>
                    
                    <View style={modalStyles.modalButtonContainer}>
                      <TouchableOpacity
                        style={[modalStyles.button, modalStyles.cancelButton]}
                        onPress={() => this.setState({ showDeleteConfirmModal: false })}
                      >
                        <Text style={modalStyles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[modalStyles.button, modalStyles.deleteButton]}
                        onPress={this.deleteSelectedItems}
                      >
                        <Text style={modalStyles.buttonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>



          
          {/* Main FAB */}
          <TouchableOpacity
            style={[styles.fab, styles.mainFab]}
            onPress={(e) => {
              e.stopPropagation();
              this.toggleFabMenu();
            }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: this.fabRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg']
                    })
                  }
                ]
              }}
            >
              <Ionicons name="add" size={30} color="white" />
            </Animated.View>
          </TouchableOpacity>
          
          {/* Add item FAB (animated) */}
          <Animated.View
            style={{
              position: 'absolute',
              right: 20,
              bottom: 100,
              opacity: this.addItemFabOpacity,
              transform: [{ scale: this.addItemFabScale }],
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              style={styles.menuButton}
              onPress={(e) => {
                e.stopPropagation();
                this.handleAddItemPress();
              }}
            >
              <View style={[styles.menuButtonIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="create-outline" size={20} color="white" />
              </View>
              <View style={styles.menuButtonTextContainer}>
                <Text style={styles.menuButtonText}>Add Item</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Import CSV FAB (animated) */}
          <Animated.View
            style={{
              position: 'absolute',
              right: 20,
              bottom: 160,
              opacity: this.importFabOpacity,
              transform: [{ scale: this.importFabScale }],
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              style={styles.menuButton}
              onPress={(e) => {
                e.stopPropagation();
                this.handleImportPress();
              }}
            >
              <View style={[styles.menuButtonIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="cloud-upload-outline" size={20} color="white" />
              </View>
              <View style={styles.menuButtonTextContainer}>
                <Text style={styles.menuButtonText}>Import CSV</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Selection Mode FAB */}
          {savedItems.length > 0 && (
            <TouchableOpacity
              style={[styles.fab, styles.selectFab]}
              onPress={() => this.setState({ selectionMode: !selectionMode, selectedItems: [] })}
            >
              <Ionicons name={selectionMode ? "close" : "list"} size={26} color="white" />
            </TouchableOpacity>
          )}
          
          {/* Import Modal */}
          <Modal
            visible={showImportModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => this.setState({ showImportModal: false })}
          >
            <TouchableWithoutFeedback onPress={() => this.setState({ showImportModal: false })}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.importModalContainer}>
                    <Text style={styles.importModalTitle}>Import Items from CSV</Text>
                    
                    {isImporting ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Processing CSV file...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.modalSubtitle}>
                          {importPreview.length > 0 
                            ? `Found ${importPreview.length} items to import.` 
                            : 'Preview of items to import will appear here.'}
                        </Text>
                        
                        {importPreview.length > 0 && (
                          <View style={styles.previewContainer}>
                            {importPreview.slice(0, 3).map((item, index) => (
                              <View key={`${item.name}-${index}`} style={styles.previewItem}>
                                <Text style={styles.previewItemName}>{item.name}</Text>
                                <Text style={styles.previewItemDimensions}>
                                  {item.length}" × {item.width}" × {item.height}"
                                </Text>
                              </View>
                            ))}
                            {importPreview.length > 3 && (
                              <Text style={styles.moreItemsText}>
                                +{importPreview.length - 3} more items
                              </Text>
                            )}
                          </View>
                        )}
                        
                        <View style={styles.modalButtonsRow}>
                          <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => this.setState({ showImportModal: false, importPreview: [] })}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.modalButton, styles.importButton, importPreview.length === 0 && styles.disabledButton]}
                            onPress={this.handleImportItems}
                            disabled={importPreview.length === 0}
                          >
                            <Text style={styles.importButtonText}>Import {importPreview.length} {importPreview.length === 1 ? 'Item' : 'Items'}</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.fileButtonsContainer}>
                        <TouchableOpacity
                          style={styles.selectFileButton}
                          onPress={this.pickCSVFile}
                        >
                          <Ionicons name="document-attach-outline" size={20} color="#3B82F6" />
                          <Text style={styles.selectFileButtonText}>Select CSV File</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.downloadSampleButton}
                          onPress={this.downloadSampleCSV}
                        >
                          <Ionicons name="download-outline" size={18} color="#64748B" />
                          <Text style={styles.downloadSampleText}>Download Sample</Text>
                        </TouchableOpacity>
                      </View>
                      </>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // iOS system background color
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F2F2F7", // iOS system background color
    borderBottomWidth: 0.5, // Thinner border for iOS
    borderBottomColor: "#C6C6C8", // iOS border color
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E5EA", // iOS search bar background
    borderRadius: 10, // iOS search bar radius
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 0, // No border for iOS search
    marginHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 17, // iOS standard font size
    color: "#000000", // iOS text color
    paddingVertical: 4,
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
  searchResultsCount: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    marginLeft: 4,
    fontStyle: "italic",
  },
  emptySearchContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  emptySearchTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#334155",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 16, // Reduced because we'll add more in contentContainerStyle
  },
  scrollViewContent: {
    paddingBottom: 100, // Increased padding to prevent overlap with FAB buttons
    paddingTop: 8,
  },
  scrollViewWithActionBar: {
    paddingTop: 8, // Reduced padding to match PackagesPage spacing
  },
  scrollViewWithSearch: {
    paddingTop: 10, // Add a bit of padding when search is active
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    width: '85%',
  },
  createItemButton: {
    backgroundColor: '#007AFF', // iOS blue
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10, // iOS button radius
    overflow: 'hidden',
  },
  createItemButtonText: {
    color: '#FFFFFF',
    fontSize: 17, // iOS button text size
    fontWeight: '600', // iOS button text weight
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    width: '85%',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10, // iOS card radius
    marginHorizontal: 2, // Slight margin for iOS feel
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    } : {
      elevation: 2,
    }),
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 60, // Consistent height for iOS list items
  },
  itemLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemName: {
    fontSize: 17, // iOS standard font size
    fontWeight: '500',
    color: '#000000', // iOS text color
    color: '#1E293B',
    flex: 1,
  },
  itemDimensions: {
    fontSize: 14,
    color: '#64748B',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainFab: {
    right: 20,
    bottom: 20,
    backgroundColor: '#3B82F6',
    zIndex: 3,
  },
  secondaryFab: {
    right: 20,
    width: 140,
    height: 45,
    borderRadius: 22.5,
  },
  addItemFab: {
    bottom: 100,
    backgroundColor: '#3B82F6',
  },
  importItemFab: {
    bottom: 170,
    backgroundColor: '#10B981',
  },
  fabTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  fabLabel: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    width: 140,
    justifyContent: 'flex-start',
  },
  menuButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuButtonTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B', // Updated to match the item name text color
    marginBottom: 15,
  },
  renameInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    width: '100%',
  },
  buttonApply1: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  selectFab: {
    left: 20, // Position on the far left of the screen, opposite to the add item FAB
    bottom: 20,
    backgroundColor: '#64748B',
  },
  importFab: {
    right: 20,
    bottom: 100, // Increased distance from the add item FAB
    backgroundColor: '#10B981', // Green color for import
  },
  selectedItem: {
    backgroundColor: '#E5F2FF', // iOS selection color
    borderWidth: 1, // Thinner border for iOS
    borderColor: '#007AFF', // iOS blue
  },
  selectionActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7', // iOS system background
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5, // Thinner iOS border
    borderBottomColor: '#C6C6C8', // iOS border color
    zIndex: 1,
  },
  selectedCountText: {
    fontSize: 17, // iOS text size
    fontWeight: '500',
    color: '#000000', // iOS text color
  },
  selectionActionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10, // iOS button radius
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  actionDeleteButton: {
    backgroundColor: '#FF3B30', // iOS red
    paddingHorizontal: 20,
  },
  cancelSelectionButton: {
    backgroundColor: '#E5E5EA', // iOS light gray
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#007AFF', // iOS blue
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 17, // iOS button text size
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 17, // iOS button text size
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  importInfoText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 15,
    textAlign: 'center',
  },
  moreItemsText: {
    textAlign: 'center',
    padding: 8,
    color: '#64748B',
    fontStyle: 'italic',
  },
  previewContainer: {
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  previewItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  previewItemDimensions: {
    fontSize: 15, // iOS secondary text size
    color: '#8E8E93', // iOS secondary text color
    marginLeft: 30,
  },
  moreItemsText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  modalButton: {
    borderRadius: 8,
    padding: 10,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  importButton: {
    backgroundColor: '#3B82F6',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  importButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  selectFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  selectFileButtonText: {
    marginLeft: 8,
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  fileButtonsContainer: {
    width: '100%',
    marginTop: 15,
    gap: 12,
  },
  downloadSampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#64748B',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  downloadSampleText: {
    marginLeft: 8,
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importModalContainer: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    alignSelf: 'center',
  },
  importModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    textAlign: 'center',
  },
  fabActionButton: {
    backgroundColor: '#007AFF', // iOS blue
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    } : {
      elevation: 5,
    }),
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30, // More bottom padding for iOS
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    backgroundColor: '#007AFF', // iOS blue
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    } : {
      elevation: 5,
    }),
  },
  modalCancelButton: {
    backgroundColor: "#F2F2F7", // iOS light gray
    borderRadius: 10, // iOS button radius
    padding: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 0, // No border for iOS buttons
  },
  modalCancelButtonText: {
    color: "#007AFF", // iOS blue
    fontWeight: "600",
    fontSize: 17, // iOS button text size
  },
  modalButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 17, // iOS button text size
  },
  fabActionLabel: {
    position: 'absolute',
    right: 64,
    backgroundColor: '#1C1C1E', // iOS dark background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8, // iOS rounded corners
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    } : {
      elevation: 2,
    }),
  },
});
