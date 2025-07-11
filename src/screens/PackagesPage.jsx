import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Keyboard,
  Platform,
  BackHandler,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons"; 
import { ItemDetailsModal } from "./FormPage"; 
import { pack, createDisplay } from "../packing_algo/packing";
import * as Crypto from 'expo-crypto';
import { modalStyles } from "../theme/ModalStyles"; // Import modalStyles

export default class PackagesPage extends Component {
  state = {
    packages: {},
    selectedPackage: null,
    showPackageModal: false,
    selectedItem: null,
    showDetailsModal: false,
    showOptionsModal: false,
    renamePackageModal: false,
    newPackageName: "",
    isEditMode: false,
    editingPackage: null,
    showSavedItemsModal: false,
    savedItems: [],
    savedItemsSearchQuery: '',
    allSavedItems: [], // Store all saved items
    // Search functionality for packages
    searchQuery: '',
    // Bulk selection state
    selectionMode: false,
    selectedPackages: [],
    showDeleteConfirmModal: false,
  };

  constructor(props) {
    super(props);
    this.shakeAnimation = new Animated.Value(0);

    this.props.navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Ionicons name="archive-outline" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Saved Packages</Text>
        </View>
      ),
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#E2E8F0',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#64748B'
    });
  }

  componentDidMount() {
    console.log('PackagesPage mounted');
    this.fetchPackages();
    this.loadSavedItems();
    
    // Set up navigation focus listener to reload data when screen comes into focus
    this.focusListener = this.props.navigation.addListener('focus', () => {
      console.log('PackagesPage focused, reloading data...');
      this.fetchPackages();
      this.loadSavedItems();
    });
    
    // Reset any stuck state when the component mounts
    this.setState({
      showPackageModal: false,
      showDetailsModal: false,
      selectedItem: null,
      selectedPackage: null,
      showOptionsModal: false,
      showSavedItemsModal: false
    });
    
    // Initialize these properties to avoid undefined errors
    this.selectedItemTemp = null;
    this.tempPackageName = null;
    
    // Add error boundary for production
    if (!__DEV__) {
      this.errorHandler = error => {
        console.error('Caught error in PackagesPage:', error);
        Alert.alert(
          'Something went wrong',
          'The application encountered an error. Please try again.'
        );
        // Reset modal state to avoid freezes
        this.setState({
          showPackageModal: false,
          showDetailsModal: false,
          selectedItem: null,
          selectedPackage: null,
          showOptionsModal: false,
          showSavedItemsModal: false
        });
      };
      
      // Set up error handler
      this.errorSubscription = global.ErrorUtils?.setGlobalHandler?.(this.errorHandler);
    }
    
    // Add a back button handler for hardware back button (Android) and gesture (iOS)
    this.navigationBackHandler = this.props.navigation.addListener(
      'beforeRemove',
      (e) => {
        // If any modal is open, prevent navigation and close the modal instead
        if (this.state.showDetailsModal || this.state.showPackageModal) {
          e.preventDefault();
          this.closePackageModal();
        }
      }
    );
    
    // Add a hardware back button handler for Android
    if (Platform.OS === 'android') {
      this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (this.state.showDetailsModal) {
          // If details modal is open, close it and show package modal
          const packageName = this.state.selectedPackage || this.tempPackageName || Object.keys(this.state.packages)[0];
          
          // Close the details modal first
          this.setState({ 
            showDetailsModal: false,
            selectedItem: null
          });
          
          // Wait for animation to complete before showing package modal
          setTimeout(() => {
            if (this.mounted) { // Check if component is still mounted
              this.setState({ 
                showPackageModal: true,
                selectedPackage: packageName
              });
            }
          }, 500);
          
          return true; // Prevent default back behavior
        } else if (this.state.showPackageModal) {
          // If package modal is open, close it
          this.closePackageModal();
          return true; // Prevent default back behavior
        }
        return false; // Let default back behavior happen
      });
    }
    
    // Set mounted flag for safety checks
    this.mounted = true;
    
    // Initial fetch of saved items
    this.loadSavedItems();
  }

  componentWillUnmount() {
    console.log('PackagesPage unmounting');
    
    // Set mounted flag to false to prevent setState after unmount
    this.mounted = false;
    
    // Clean up listeners
    if (this.focusListener) {
      this.focusListener();
    }
    
    if (this.navigationBackHandler) {
      this.navigationBackHandler();
    }
    
    if (this.backHandler) {
      if (Platform.OS === 'android') {
        this.backHandler.remove();
      } else if (typeof this.backHandler === 'function') {
        this.backHandler();
      }
    }
    
    // Clean up error handler if it exists
    if (this.errorSubscription) {
      global.ErrorUtils?.setGlobalHandler?.(global.ErrorUtils.getGlobalHandler());
    }
    
    // Make sure we clean up any dangling state
    this.selectedItemTemp = null;
    this.tempPackageName = null;
  }

  fetchPackages = async () => {
    try {
      const packagesString = await AsyncStorage.getItem("packages");
      const packages = packagesString ? JSON.parse(packagesString) : {};
      this.setState({ packages });
    } catch (error) {
      Alert.alert("Error", "Failed to load packages.");
    }
  };

  loadSavedItems = async () => {
    try {
      console.log('Loading saved items...');
      const savedItemsString = await AsyncStorage.getItem("savedItems");
      
      if (!savedItemsString) {
        console.log('No saved items found in storage');
        this.setState({ savedItems: [], allSavedItems: [] });
        return;
      }
      
      try {
        const savedItems = JSON.parse(savedItemsString);
        console.log('Saved items loaded successfully:', savedItems);
        
        // Sort items by timestamp, newest first
        const sortedItems = savedItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        this.setState({ 
          savedItems: sortedItems,
          allSavedItems: sortedItems 
        }, () => {
          console.log('Saved items state updated:', this.state.savedItems);
        });
      } catch (parseError) {
        console.error('Error parsing saved items JSON:', parseError);
        this.setState({ savedItems: [], allSavedItems: [] });
        Alert.alert("Error", "There was a problem loading your saved items.");
      }
    } catch (error) {
      console.error("Error loading saved items:", error);
      this.setState({ savedItems: [], allSavedItems: [] });
      Alert.alert("Error", "Failed to load saved items.");
    }
  };

  handleDeletePackage = async (packageName) => {
    Alert.alert(
      "Delete Package",
      `Are you sure you want to delete "${packageName}"? This action cannot be undone.`,
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
              const packagesString = await AsyncStorage.getItem("packages");
              const packages = packagesString ? JSON.parse(packagesString) : {};
              delete packages[packageName];
              await AsyncStorage.setItem("packages", JSON.stringify(packages));
              this.setState({ 
                packages, 
                showOptionsModal: false,
                isEditMode: false,
                editingPackage: null
              });
              Alert.alert("Success", "Package deleted successfully.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete package.");
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  handleRenamePackage = async () => {
    const { selectedPackage, newPackageName, packages } = this.state;
    if (!newPackageName.trim()) {
      Alert.alert("Error", "Package name cannot be empty.");
      return;
    }
  };

  openPackageDetails = (packageName) => {
    this.setState({ selectedPackage: packageName, showPackageModal: true });
  };

  closePackageModal = () => {
    // Close all modals with a clean approach
    // Reset all modal-related state to prevent any lingering state issues
    this.setState({
      showPackageModal: false,
      showDetailsModal: false,
      selectedItem: null,
      showOptionsModal: false,
      showSavedItemsModal: false
    });
    
    // Also clear any temporary references
    this.selectedItemTemp = null;
    this.tempPackageName = null;
  };

  handleEditItem = (item) => {
    if (!item) return;
    
    try {
      console.log('handleEditItem called with item:', item.id);
      
      // Make a deep copy of the item to avoid reference issues
      const itemCopy = JSON.parse(JSON.stringify(item));
      
      // Store the item and package name for later use
      this.selectedItemTemp = itemCopy;
      this.tempPackageName = this.state.selectedPackage;
      
      console.log('Setting selectedItem first');
      
      // PRODUCTION-SAFE APPROACH WITH DIRECT NAVIGATION
      // Instead of using nested modals, close everything and set a flag
      // to show the item details after a delay
      this.setState({ 
        showPackageModal: false,
        showDetailsModal: false,
        selectedItem: null
      }, () => {
        // Use a longer timeout to ensure all modal animations are complete
        setTimeout(() => {
          // Then open the details modal with the selected item
          this.setState({ 
            selectedItem: itemCopy,
            showDetailsModal: true 
          });
        }, 500);
      });
    } catch (error) {
      console.error('Error in handleEditItem:', error);
      Alert.alert('Error', 'There was a problem opening the item details. Please try again.');
    }
  };

  handleSaveEditedItem = async (updatedItem) => {
    if (!this.mounted) return; // Safety check
    
    try {
      console.log('Saving edited item:', updatedItem.id);
      
      // First close the modal
      this.setState({ 
        showDetailsModal: false,
        selectedItem: null 
      });
      
      // Use the stored package name if selectedPackage is null
      const packageName = this.state.selectedPackage || this.tempPackageName;
      const { packages } = this.state;
      
      if (!packageName || !packages[packageName]) {
        Alert.alert("Error", "Could not find the package to update.");
        return;
      }

      // If quantity is 0, treat it as a delete operation
      if (updatedItem.quantity === 0) {
        this.handleDeleteItem(updatedItem);
        return;
      }

      // Generate replicated names
      let replicatedNames = [];
      try {
        replicatedNames = await Promise.all(Array.from({ length: updatedItem.quantity }, async (_, i) => ({
          name: updatedItem.itemName,
          id: await Crypto.randomUUID(),
          parentId: updatedItem.id
        })));
      } catch (error) {
        console.error('Error generating UUIDs:', error);
        // Fallback for UUID generation
        replicatedNames = Array.from({ length: updatedItem.quantity }, (_, i) => ({
          name: updatedItem.itemName,
          id: 'item-' + Math.random().toString(36).substring(2, 15),
          parentId: updatedItem.id
        }));
      }

      const updatedItemWithReplications = {
        ...updatedItem,
        replicatedNames: replicatedNames,
      };

      // Log the package structure for debugging
      console.log('Package structure:', {
        packageName,
        packageExists: !!packages[packageName],
        packageType: packages[packageName] ? typeof packages[packageName] : 'undefined',
        isArray: Array.isArray(packages[packageName])
      });
      
      // Handle both old and new package formats
      let packageItems = [];
      let isNewFormat = false;
      let dateCreated = null;
      
      if (packages[packageName]) {
        // New format with dateCreated
        if (typeof packages[packageName] === 'object' && !Array.isArray(packages[packageName]) && packages[packageName].items) {
          packageItems = packages[packageName].items;
          dateCreated = packages[packageName].dateCreated;
          isNewFormat = true;
          console.log('Using new package format with dateCreated:', dateCreated);
        }
        // Old format (direct array)
        else if (Array.isArray(packages[packageName])) {
          packageItems = packages[packageName];
          console.log('Using old package format (array)');
        } else {
          console.error('Unknown package format:', packages[packageName]);
          packageItems = [];
        }
      } else {
        console.error('Package not found:', packageName);
        packageItems = [];
      }
      
      // Find if the item already exists in the package
      const itemExists = packageItems.some(item => item.id === updatedItem.id);
      
      let updatedItems;
      if (itemExists) {
        // Update existing item
        updatedItems = packageItems.map((item) =>
          item.id === updatedItem.id ? updatedItemWithReplications : item
        );
      } else {
        // Add as new item if it doesn't exist
        updatedItems = [...packageItems, updatedItemWithReplications];
      }
      
      // Preserve the package structure based on its format
      let updatedPackageData;
      if (isNewFormat) {
        // Preserve the dateCreated and other properties in the new format
        updatedPackageData = {
          ...packages[packageName],
          items: updatedItems,
          dateCreated: dateCreated
        };
      } else {
        // For old format, just use the array
        updatedPackageData = updatedItems;
      }

      const updatedPackages = { ...packages, [packageName]: updatedPackageData };

      try {
        await AsyncStorage.setItem("packages", JSON.stringify(updatedPackages));
        
        // Update state after AsyncStorage is updated
        if (this.mounted) { // Safety check
          this.setState({ packages: updatedPackages }, () => {
            Alert.alert("Success", `${updatedItem.itemName} was successfully updated`, [
              {
                text: "OK",
                onPress: () => {
                  // Use setTimeout to ensure alert is dismissed before showing modal
                  setTimeout(() => {
                    if (this.mounted) { // Safety check
                      // Show the package modal again with the correct package selected
                      this.setState({ 
                        showPackageModal: true,
                        selectedPackage: packageName
                      });
                    }
                  }, 100);
                }
              }
            ]);
          });
        }
      } catch (error) {
        console.error('Error saving to AsyncStorage:', error);
        Alert.alert("Error", "Failed to save edited item.");
      }
    } catch (error) {
      console.error('Error in handleSaveEditedItem:', error);
      Alert.alert("Error", "An unexpected error occurred while saving the item.");
    }
  };

  handleDeleteItem = (itemToDelete) => {
    if (!this.mounted) return; // Safety check
    
    try {
      console.log('Deleting item:', itemToDelete.id);
      
      // First close the modal
      this.setState({ 
        showDetailsModal: false,
        selectedItem: null 
      });
      
      // Use the stored package name if selectedPackage is null
      const packageName = this.state.selectedPackage || this.tempPackageName;
      const { packages } = this.state;
      
      if (!packageName) {
        Alert.alert("Error", "Could not determine which package to update.");
        return;
      }
      
      if (!packages[packageName]) {
        console.error(`Package '${packageName}' not found in packages:`, packages);
        Alert.alert("Error", `Could not find the package '${packageName}' to update.`);
        return;
      }
      
      // Handle the package structure correctly - packages have an 'items' array
      const packageData = packages[packageName];
      
      if (!packageData.items || !Array.isArray(packageData.items)) {
        console.error(`Package '${packageName}' does not have a valid items array:`, packageData);
        Alert.alert("Error", "The package data is corrupted. Please try reloading the app.");
        return;
      }
      
      // Filter out the item to delete
      const updatedItems = packageData.items.filter(
        (item) => item.id !== itemToDelete.id
      );

      // Create a new packages object to ensure state updates properly
      const updatedPackages = { ...packages };
      
      // If the updated items array is empty, delete the entire package
      if (updatedItems.length === 0) {
        delete updatedPackages[packageName];
      } else {
        // Otherwise, update the package with the remaining items
        // Preserve other package properties like dateCreated
        updatedPackages[packageName] = {
          ...packageData,
          items: updatedItems
        };
      }

      // Update AsyncStorage and state
      AsyncStorage.setItem("packages", JSON.stringify(updatedPackages))
        .then(() => {
          if (this.mounted) { // Safety check
            this.setState({ packages: updatedPackages }, () => {
              if (updatedItems.length === 0) {
                Alert.alert(
                  "Success",
                  `Package "${packageName}" was removed`
                );
                this.closePackageModal();
              } else {
                Alert.alert("Success", `${itemToDelete.itemName} was removed`, [
                  {
                    text: "OK",
                    onPress: () => {
                      // Use setTimeout to ensure alert is dismissed before showing modal
                      setTimeout(() => {
                        if (this.mounted) { // Safety check
                          this.setState({ 
                            showPackageModal: true,
                            selectedPackage: packageName
                          });
                        }
                      }, 100);
                    }
                  }
                ]);
              }
            });
          }
        })
        .catch(error => {
          console.error('Error deleting item:', error);
          Alert.alert("Error", "Failed to delete item or package.");
        });
    } catch (error) {
      console.error('Error in handleDeleteItem:', error);
      Alert.alert("Error", "An unexpected error occurred while deleting the item.");
    }
  };

  handlePackItems = async () => {
    const { selectedPackage } = this.state;

    if (!selectedPackage) {
      Alert.alert("No items to pack.");
      return;
    }

    try {
      const updatedPackagesString = await AsyncStorage.getItem("packages");
      if (!updatedPackagesString) {
        throw new Error("No packages found in storage");
      }

      const updatedPackages = JSON.parse(updatedPackagesString);
      const packageData = updatedPackages[selectedPackage];
      
      // Handle both old and new package formats
      let items = [];
      if (packageData) {
        // New format with dateCreated
        if (typeof packageData === 'object' && !Array.isArray(packageData) && packageData.items) {
          items = packageData.items;
        }
        // Old format (direct array)
        else if (Array.isArray(packageData)) {
          items = packageData;
        }
      }

      if (!items || items.length === 0) {
        throw new Error(
          "Selected package not found in updated packages or package is empty"
        );
      }

      let itemsTotal = [];
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

      const packedResult = pack(itemsTotal, "No Carrier", 0);
      if (!packedResult || packedResult.length === 0) {
        throw new Error("Failed to pack items");
      }

      const scale =
        Math.max(packedResult.x, packedResult.y, packedResult.z) > 15 ? 20 : 10;
      const itemsDisplay = createDisplay(packedResult, scale);

      const selectedBox = {
        dimensions: [packedResult.x, packedResult.y, packedResult.z],
        priceText: packedResult.priceText,
        finalBoxType: packedResult.type,
      };

      this.props.navigation.navigate("Display3D", {
        box: packedResult,
        itemsTotal: itemsDisplay,
        selectedBox: selectedBox,
        selectedCarrier: "No Carrier",
        items: items,
        packageName: selectedPackage
      });

      this.closePackageModal();
    } catch (error) {
      console.error("Packing error:", error);
      Alert.alert("Error", "An error occurred while preparing the package.");
    }
  };

  handleShipPackage = (pkg) => {
    this.closePackageModal();
    this.props.navigation.navigate('Shipping Estimate', { 
      package: {
        name: pkg.name,
        items: pkg.items,
        weight: this.calculateTotalWeight(pkg.items)
      }
    });
  };

  calculateTotalWeight = (items) => {
    // Sum up the weights of all items
    return items.reduce((total, item) => {
      const itemWeight = parseFloat(item.itemWeight) || 0;
      return total + (itemWeight * (item.quantity || 1));
    }, 0).toFixed(2);
  };

  getItemsArray = (packageName) => {
    const packageData = this.state.packages[packageName];
    if (!packageData) return [];
    
    // Handle new format (with dateCreated)
    if (typeof packageData === 'object' && !Array.isArray(packageData) && packageData.items) {
      return packageData.items;
    }
    
    // Handle old format (direct array)
    if (Array.isArray(packageData)) {
      return packageData;
    }
    
    return [];
  };
  
  getItemsCount = (packageName) => {
    const items = this.getItemsArray(packageName);
    return items.length;
  };

  calculateTotalItems = (packageName) => {
    const items = this.getItemsArray(packageName);
    return items.reduce((total, item) => {
      // Count replicated items
      const replicatedCount = item.replicatedNames ? item.replicatedNames.length : 0;
      return total + (replicatedCount > 0 ? replicatedCount : 1);
    }, 0);
  };

  startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(this.shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(this.shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(this.shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(this.shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start();
  };

  toggleEditMode = (packageName) => {
    const { isEditMode, editingPackage } = this.state;
    
    if (isEditMode && editingPackage === packageName) {
      this.setState({ isEditMode: false, editingPackage: null });
    } else {
      this.setState({ isEditMode: true, editingPackage: packageName }, () => {
        this.startShakeAnimation();
      });
    }
  };

  openRenameModal = (packageName) => {
    this.setState({
      showOptionsModal: false,
      renamePackageModal: true,
      selectedPackage: packageName,
      newPackageName: packageName, // Pre-populate with current name
    });
  };

  render() {
    console.log('Rendering PackagesPage, showSavedItemsModal:', this.state.showSavedItemsModal);
    
    const {
      packages,
      showOptionsModal,
      selectedPackage,
      renamePackageModal,
      newPackageName,
      showPackageModal,
      showDetailsModal,
      selectedItem,
      isEditMode,
      showSavedItemsModal,
      allSavedItems,
      savedItemsSearchQuery
    } = this.state;

    return (
      <TouchableWithoutFeedback 
        onPress={() => {
          if (isEditMode) {
            this.setState({ isEditMode: false, editingPackage: null });
          }
        }}
      >
        <View style={styles.container}>
          {/* Search bar */}
          {Object.keys(packages).length > 0 && (
            <View style={styles.searchBarContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search packages by name..."
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
                  {Object.keys(this.getFilteredPackages()).length} {Object.keys(this.getFilteredPackages()).length === 1 ? "package" : "packages"} found
                </Text>
              )}
            </View>
          )}
          
          {/* Selection mode action bar */}
          {this.state.selectionMode && (
            <View style={styles.selectionActionBar}>
              <Text style={styles.selectedCountText}>
                {this.state.selectedPackages.length} package(s) selected
              </Text>
              
              <View style={styles.selectionActionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelSelectionButton]}
                  onPress={this.cancelSelection}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionDeleteButton]}
                  onPress={() => {
                    if (this.state.selectedPackages.length > 0) {
                      this.setState({ showDeleteConfirmModal: true });
                    } else {
                      Alert.alert("No Packages Selected", "Please select at least one package to delete.");
                    }
                  }}
                  disabled={this.state.selectedPackages.length === 0}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <ScrollView 
            style={[styles.scrollView]}
            contentContainerStyle={[styles.scrollViewContent, this.state.searchQuery.trim() !== "" && styles.scrollViewWithSearch]}
          >
            {Object.keys(packages).length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="cube-outline" size={80} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Saved Packages</Text>
                <Text style={styles.emptyText}>
                  Create and save packages to access them here for future shipments.
                </Text>
                <TouchableOpacity 
                  style={styles.createPackageButton}
                  onPress={() => this.props.navigation.navigate('Create Package')}
                >
                  <Text style={styles.createPackageButtonText}>Create Package</Text>
                </TouchableOpacity>
              </View>
            ) : this.state.searchQuery.trim() !== "" && Object.keys(this.getFilteredPackages()).length === 0 ? (
              <View style={styles.emptySearchContainer}>
                <Ionicons name="search" size={50} color="#CBD5E1" />
                <Text style={styles.emptySearchTitle}>No Matching Packages</Text>
                <Text style={styles.emptySearchText}>
                  No packages match your search query. Try a different search term.
                </Text>
              </View>
            ) : (
              Object.keys(this.state.searchQuery.trim() !== "" ? this.getFilteredPackages() : packages).reverse().map(this.renderPackage)
            )}
          </ScrollView>

          {/* Options Modal */}
          <Modal
            visible={showOptionsModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => this.setState({ showOptionsModal: false })}
          >
            {/* Touchable outside the modal content to close it */}
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => this.setState({ showOptionsModal: false })}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() =>
                    this.setState({
                      showOptionsModal: false,
                      renamePackageModal: true,
                    })
                  }
                >
                  <Text style={styles.optionText}>Rename Package</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButtonClose}
                  onPress={() => this.handleDeletePackage(selectedPackage)}
                >
                  <Text style={styles.optionText}>Delete Package</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
                      Are you sure you want to delete {this.state.selectedPackages.length} selected package(s)?
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
                        onPress={this.deleteSelectedPackages}
                      >
                        <Text style={modalStyles.buttonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          
          {/* Rename Package Modal */}
          <Modal
            visible={renamePackageModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => {
              Keyboard.dismiss();
              this.setState({ renamePackageModal: false });
            }}
          >
            <TouchableWithoutFeedback 
              onPress={() => {
                Keyboard.dismiss();
                this.setState({ renamePackageModal: false });
              }}
            >
              <View style={modalStyles.centeredView}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={modalStyles.modalContent}>
                    <View style={modalStyles.modalHeader}>
                      <Text style={modalStyles.modalTitle}>Edit Package Name</Text>
                    </View>
                    
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
                        value={newPackageName}
                        onChangeText={(text) => this.setState({ newPackageName: text })}
                        placeholder="Enter package name"
                        placeholderTextColor="#64748B"
                        autoFocus={false}
                        selectTextOnFocus={true}
                      />
                    </View>
                    
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 20,
                      paddingHorizontal: 10
                    }}>
                      <TouchableOpacity
                        style={[modalStyles.button, modalStyles.cancelButton, {
                          paddingVertical: 12,
                          paddingHorizontal: 20,
                          elevation: 2
                        }]}
                        onPress={() => {
                          Keyboard.dismiss();
                          this.setState({ renamePackageModal: false });
                        }}
                      >
                        <Text style={modalStyles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[modalStyles.button, modalStyles.saveButton, {
                          paddingVertical: 12,
                          paddingHorizontal: 25,
                          elevation: 2
                        }]}
                        onPress={() => {
                          Keyboard.dismiss();
                          this.handleRenamePackage();
                        }}
                      >
                        <Text style={[modalStyles.buttonText, {fontWeight: '600'}]}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Package Details Modal */}
          <Modal
            visible={showPackageModal}
            transparent={true}
            animationType="slide"
            onRequestClose={this.closePackageModal}
          >
            <TouchableWithoutFeedback onPress={this.closePackageModal}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    {/* Add a proper header with rounded corners */}
                    <View style={modalStyles.modalHeader}>
                      <Text style={modalStyles.modalTitle}>
                        {selectedPackage}
                      </Text>
                    </View>
                    <FlatList
                      data={selectedPackage ? this.getItemsArray(selectedPackage) : []}
                      style={styles.flatListStyle}
                      contentContainerStyle={styles.flatListContainer}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.itemContainer}
                          onPress={() => this.handleEditItem(item)}
                        >
                          <View style={{ width: "100%" }}>
                            <Text style={styles.itemText}>{item.itemName}</Text>
                            <Text style={styles.itemDimensions}>
                              Quantity: {item.quantity}
                            </Text>
                            <Text style={styles.itemDimensions}>
                              {item.itemLength}L x {item.itemWidth}W x {item.itemHeight}H
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    />

                    {/* Add spacing between item list and button */}
                    <View style={{ height: 16 }} />

                    <TouchableOpacity
                      style={[styles.addItemPlaceholder, { alignSelf: 'center' }]}
                      onPress={() => {
                        console.log('Add from saved items button pressed');
                        this.showSavedItemsSelector();
                      }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
                      <Text style={styles.addItemText}>Add from saved items</Text>
                    </TouchableOpacity>
                    
                    <View style={[styles.modalFooter, { width: '100%', alignSelf: 'center' }]}>

                      <TouchableOpacity
                        style={[styles.footerButton, styles.packButton]}
                        onPress={this.handlePackItems}
                      >
                        <Ionicons name="cube" size={20} color="#fff" />
                        <Text style={styles.footerButtonText}>Pack Items</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.footerButton, styles.shipButton]}
                        onPress={() => this.handleShipPackage({ name: selectedPackage, items: this.getItemsArray(selectedPackage) })}
                      >
                        <View style={styles.buttonInnerContainer}>
                          <Ionicons name="airplane" size={20} color="#fff" />
                          <View style={styles.buttonTextContainer}>
                            <Text style={styles.buttonTextLine}>Shipping</Text>
                            <Text style={styles.buttonTextLine}>Estimate</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Saved Items Modal */}
          {console.log('Modal visible state:', this.state.showSavedItemsModal)}
          {console.log('allSavedItems length:', this.state.allSavedItems?.length)}
          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.showSavedItemsModal}
            onRequestClose={() => {
              this.setState({ showSavedItemsModal: false }, () => {
                // After a short delay, show the package modal again
                setTimeout(() => {
                  this.setState({ showPackageModal: true });
                }, 300);
              });
            }}
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
                      <TouchableOpacity onPress={() => {
                        this.setState({ showSavedItemsModal: false }, () => {
                          // After a short delay, show the package modal again
                          setTimeout(() => {
                            this.setState({ showPackageModal: true });
                          }, 300);
                        });
                      }}>
                        <Ionicons name="close" size={24} color="#64748B" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15 }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 8,
                        paddingHorizontal: 12,
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
                      style={{ paddingHorizontal: 20 }} 
                      contentContainerStyle={{ flexGrow: 1 }} 
                      keyboardShouldPersistTaps="handled"
                    >
                      {(() => {
                        // Log the structure of saved items for debugging
                        console.log('All saved items structure:', JSON.stringify(this.state.allSavedItems));
                        
                        const filteredItems = this.state.allSavedItems
                          ? this.state.allSavedItems.filter(item => {
                              const itemName = (item.name || '').toLowerCase();
                              return itemName.includes(this.state.savedItemsSearchQuery.toLowerCase());
                            })
                          : [];

                        if (filteredItems.length > 0) {
                          return filteredItems.map((item) => {
                            const itemName = item.name || '';
                            // Check if the item is already in the package
                            const alreadyAdded = this.state.packages[this.state.selectedPackage]?.items?.some(addedItem =>
                              (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
                            ) || false;
                            
                            // Extract dimensions from the first item in the items array if it exists
                            // This follows the nested structure mentioned in the memory
                            let dimensions = {};
                            if (item.items && item.items.length > 0 && item.items[0].dimensions) {
                              dimensions = item.items[0].dimensions;
                            } else if (item.dimensions) {
                              dimensions = item.dimensions;
                            }
                            return (
                              <TouchableOpacity
                                key={item.id}
                                onPress={() => !alreadyAdded && this.handleAddSavedItemToPackage(item)}
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

                    <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                      <TouchableOpacity
                        style={{
                          paddingVertical: 14,
                          backgroundColor: '#0066FF',
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          this.setState({ showSavedItemsModal: false });
                          this.props.navigation.navigate('AI Item Search', { 
                            searchQuery: this.state.savedItemsSearchQuery,
                            fromPackagesPage: true, // Flag to indicate navigation from PackagesPage
                            selectedPackage: this.state.selectedPackage // Pass the selected package name
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

          {/* Completely separate modal rendering from state updates */}
          {/* Using key to force re-render of the modal when selectedItem changes */}
          <ItemDetailsModal
            key={selectedItem ? selectedItem.id : 'no-item'}
            visible={showDetailsModal && selectedItem !== null}
            item={selectedItem}
            closeModal={() => {
              console.log('Closing item details modal');
              // Just close this modal first with a clean approach
              this.setState({ 
                showDetailsModal: false,
                selectedItem: null 
              });
            }}
            handleDeleteAndClose={() => selectedItem && this.handleDeleteItem(selectedItem)}
            handleUpdateItem={this.handleSaveEditedItem}
            showBackButton={true}
            onBackButtonPress={() => {
              console.log('Back button pressed in ItemDetailsModal');
              // First ensure we have the package name stored
              const packageName = this.state.selectedPackage || this.tempPackageName || Object.keys(this.state.packages)[0];
              
              // IMPROVED APPROACH FOR PRODUCTION COMPATIBILITY
              // First close the details modal completely
              this.setState({ 
                showDetailsModal: false,
                selectedItem: null
              }, () => {
                // Use a longer timeout to ensure modal is fully closed
                setTimeout(() => {
                  // Then show the package modal
                  this.setState({ 
                    showPackageModal: true,
                    selectedPackage: packageName
                  });
                }, 500);
              });
            }}
          />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => this.props.navigation.navigate("Create Package")}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>




          
          <TouchableOpacity
            style={[styles.fab, styles.selectFab]}
            onPress={this.toggleSelectionMode}
          >
            <Ionicons name={this.state.selectionMode ? "close" : "list"} size={26} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderPackage = (packageName) => {
    const isEditing = this.state.isEditMode && this.state.editingPackage === packageName;
    const { selectionMode, selectedPackages } = this.state;
    const isSelected = selectedPackages.includes(packageName);
    const animatedStyle = {
      transform: [{ translateX: isEditing ? this.shakeAnimation : 0 }],
    };
    
    // Get package data and handle both old and new format
    const packageData = this.state.packages[packageName];
    const isNewFormat = packageData && typeof packageData === 'object' && !Array.isArray(packageData);
    const dateCreated = isNewFormat ? packageData.dateCreated : null;

    return (
      <View key={packageName} style={styles.packageRow}>
        {isEditing && !selectionMode && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => this.handleDeletePackage(packageName)}
          >
            <Ionicons name="remove-circle" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )}
        
        <Animated.View style={[styles.packageContainer, animatedStyle]}>
          <TouchableOpacity
            style={[styles.package, isSelected && selectionMode && styles.selectedPackage]}
            onPress={() => {
              if (selectionMode) {
                this.togglePackageSelection(packageName);
              } else if (!isEditing) {
                this.openPackageDetails(packageName);
              }
            }}
            onLongPress={() => !selectionMode && this.toggleEditMode(packageName)}
          >
            <View style={styles.packageLeftContent}>
              {selectionMode ? (
                <Ionicons 
                  name={isSelected ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#3B82F6" 
                  style={styles.packageIcon} 
                />
              ) : (
                <Ionicons name="cube" size={20} color="#3B82F6" style={styles.packageIcon} />
              )}
              <View style={styles.packageNameContainer}>
                <Text style={styles.packageName}>{packageName}</Text>
                {dateCreated && (
                  <Text style={styles.dateText}>Created: {dateCreated}</Text>
                )}
              </View>
            </View>
            <View style={styles.itemCountContainer}>
              <Text style={styles.itemCount}>
                {this.getItemsCount(packageName)} unique {this.getItemsCount(packageName) === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.totalItemCount}>
                {this.calculateTotalItems(packageName)} total {this.calculateTotalItems(packageName) === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {isEditing && !selectionMode && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => this.openRenameModal(packageName)}
          >
            <Ionicons name="pencil" size={24} color="#3498db" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Toggle selection mode for bulk operations
  toggleSelectionMode = () => {
    this.setState(prevState => ({
      selectionMode: !prevState.selectionMode,
      selectedPackages: [],
      isEditMode: false,
      editingPackage: null,
      showOptionsModal: false,
      showPackageModal: false
    }));
  };

  // Toggle selection of a package
  togglePackageSelection = (packageName) => {
    this.setState(prevState => {
      const isSelected = prevState.selectedPackages.includes(packageName);
      const updatedSelection = isSelected
        ? prevState.selectedPackages.filter(name => name !== packageName)
        : [...prevState.selectedPackages, packageName];
      
      return {
        selectedPackages: updatedSelection
      };
    });
  };

  // Cancel selection mode
  cancelSelection = () => {
    this.setState({
      selectionMode: false,
      selectedPackages: []
    });
  };

  calculateTotalItems = (packageName) => {
    // Calculate the total number of items including replicated items
    const items = this.getItemsArray(packageName);
    return items.reduce((total, item) => {
      // Add the quantity or the number of replicated items
      return total + (item.quantity || (item.replicatedNames ? item.replicatedNames.length : 1));
    }, 0);
  };

  // Delete selected packages
  deleteSelectedPackages = async () => {
    const { selectedPackages, packages } = this.state;
    
    if (selectedPackages.length === 0) {
      Alert.alert("No Packages Selected", "Please select at least one package to delete.");
      return;
    }
    
    try {
      // Create a copy of packages without the selected ones
      const updatedPackages = { ...packages };
      selectedPackages.forEach(packageName => {
        delete updatedPackages[packageName];
      });
      
      // Save updated packages to AsyncStorage
      await AsyncStorage.setItem('packages', JSON.stringify(updatedPackages));
      
      // Update state
      this.setState({
        packages: updatedPackages,
        selectedPackages: [],
        selectionMode: false,
        showDeleteConfirmModal: false
      });
      
      // Show success message
      Alert.alert(
        "Success",
        `${selectedPackages.length} package(s) deleted successfully.`
      );
    } catch (error) {
      console.error('Error deleting packages:', error);
      Alert.alert("Error", "There was a problem deleting the selected packages.");
    }
  };
  
  showSavedItemsSelector = async () => {
    console.log('showSavedItemsSelector called');
    try {
      const savedItemsString = await AsyncStorage.getItem("savedItems");
      console.log('Saved items from AsyncStorage:', savedItemsString);
      const items = savedItemsString ? JSON.parse(savedItemsString) : [];
      console.log('Parsed items:', items);
      
      if (items.length === 0) {
        console.log('No saved items found');
        Alert.alert(
          "No Saved Items", 
          "You don't have any saved items yet. Go to the Saved Items page to create some items first.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Go to Saved Items", 
              onPress: () => {
                this.closePackageModal();
                this.props.navigation.navigate("My Saved Items");
              }
            }
          ]
        );
        return;
      }
      
      // Sort items by timestamp, newest first
      const sortedItems = items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      console.log('Sorted items:', sortedItems);
      
      // First close the package modal, then show the saved items modal
      // This prevents having nested modals which can cause visibility issues
      console.log('Closing package modal before showing saved items modal');
      this.setState({
        showPackageModal: false,
        allSavedItems: sortedItems,
        savedItemsSearchQuery: ''
      }, () => {
        // After package modal is closed, show the saved items modal
        setTimeout(() => {
          this.setState({ showSavedItemsModal: true }, () => {
            console.log('State updated, modal should be visible:', this.state.showSavedItemsModal);
          });
        }, 300); // Small delay to ensure the first modal is fully closed
      });
    } catch (error) {
      console.error('Error loading saved items:', error);
      Alert.alert("Error", "Failed to load saved items: " + error.message);
    }
  };

  handleAddSavedItemToPackage = async (savedItem) => {
    try {
      console.log('Adding saved item to package:', savedItem);
      const { selectedPackage, packages } = this.state;
      
      if (!selectedPackage) {
        Alert.alert("Error", "No package selected.");
        return;
      }
      
      // Make sure the package exists and has an items array
      if (!packages[selectedPackage]) {
        console.error('Selected package does not exist:', selectedPackage);
        Alert.alert("Error", "The selected package could not be found.");
        return;
      }
      
      // Initialize items array if it doesn't exist
      if (!packages[selectedPackage].items) {
        packages[selectedPackage].items = [];
      }
      
      // Check if an item with the same name already exists in the package
      const existingItem = packages[selectedPackage].items.find(
        item => item.itemName.toLowerCase() === savedItem.name.toLowerCase()
      );
      
      if (existingItem) {
        // Item already exists in the package
        Alert.alert(
          "Item Already in Package",
          `${savedItem.name} is already in this package. You can edit the quantity if you'd like.`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Edit Item", 
              onPress: () => this.handleEditItem(existingItem)
            }
          ]
        );
        return;
      }
      
      // Extract dimensions based on the nested structure
      let dimensions = {};
      if (savedItem.items && savedItem.items.length > 0 && savedItem.items[0].dimensions) {
        // If the saved item has a nested items array with dimensions
        dimensions = savedItem.items[0].dimensions;
      } else if (savedItem.dimensions) {
        // Fallback to top-level dimensions if available
        dimensions = savedItem.dimensions;
      } else {
        // Default empty dimensions if none found
        dimensions = { length: '0', width: '0', height: '0' };
      }
      
      console.log('Using dimensions:', dimensions);
      
      // Convert saved item format to package item format
      const itemId = await this.generateUUID();
      const newItem = {
        id: itemId,
        itemName: savedItem.name,
        itemLength: this.parseItemDimension(dimensions.length),
        itemWidth: this.parseItemDimension(dimensions.width),
        itemHeight: this.parseItemDimension(dimensions.height),
        quantity: 1,
        replicatedNames: [{
          name: savedItem.name,
          id: await this.generateUUID(),
          parentId: itemId
        }]
      };
      
      console.log('Converted item:', newItem);
      
      // Add the item to the package
      const updatedPackages = { ...packages };
      
      // Make sure we're adding to the items array
      if (!updatedPackages[selectedPackage].items) {
        updatedPackages[selectedPackage].items = [];
      }
      
      // Add the new item to the items array
      updatedPackages[selectedPackage].items.push(newItem);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem("packages", JSON.stringify(updatedPackages));
      
      // Update state - close saved items modal and reopen package modal
      this.setState({
        packages: updatedPackages,
        showSavedItemsModal: false
      }, () => {
        // After a short delay, show the package modal again
        setTimeout(() => {
          this.setState({ showPackageModal: true });
        }, 300);
      });
      
      Alert.alert("Success", `${savedItem.name} added to ${selectedPackage}.`);
    } catch (error) {
      console.error("Error adding saved item to package:", error);
      Alert.alert("Error", "Failed to add item to package.");
    }
  };

  // Generate a unique ID for the new item
  generateUUID = async () => {
    try {
      return await Crypto.randomUUID();
    } catch (error) {
      // Fallback for older devices
      return 'item-' + Math.random().toString(36).substring(2, 15);
    }
  };
  
  // Parse dimensions from the saved item format (e.g., "5.00 inches" -> 5)
  parseItemDimension = (dimensionStr) => {
    if (!dimensionStr) return 0;
    const match = dimensionStr.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };
  
  // Filter packages based on search query (name only)
  getFilteredPackages = () => {
    const { packages, searchQuery } = this.state;
    
    if (!searchQuery || !searchQuery.trim()) {
      return packages;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filteredPackages = {};
    
    Object.keys(packages).forEach(packageName => {
      if (packageName.toLowerCase().includes(query)) {
        filteredPackages[packageName] = packages[packageName];
      }
    });
    
    return filteredPackages;
  };
  
  // Sort packages by date, newest to oldest
  getSortedPackageNames = (packagesObj) => {
    return Object.keys(packagesObj).sort((a, b) => {
      const packageA = packagesObj[a];
      const packageB = packagesObj[b];
      
      // Extract dates from packages
      const dateA = packageA && typeof packageA === 'object' && packageA.dateCreated ? 
        new Date(packageA.dateCreated) : new Date(0);
      const dateB = packageB && typeof packageB === 'object' && packageB.dateCreated ? 
        new Date(packageB.dateCreated) : new Date(0);
      
      // Sort newest to oldest
      return dateB - dateA;
    });
  };
}

const styles = StyleSheet.create({
  // Search bar styles
  searchBarContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#334155",
    paddingVertical: 4,
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
    paddingTop: 80,
    paddingHorizontal: 40,
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
    marginBottom: 24,
  },
  scrollViewWithSearch: {
    paddingTop: 10, // Add a bit of padding when search is active
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16, // Match searchBarContainer paddingHorizontal
    paddingBottom: 96, // Reduced padding since buttons are side by side
  },
  scrollViewContent: {
    paddingBottom: 96, // Add padding at the bottom of the ScrollView
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  packageContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  package: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 16,
  },
  packageLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageNameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  packageIcon: {
    marginRight: 12,
    marginLeft: 2,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    letterSpacing: 0.3,
    flex: 1,
  },
  itemCountContainer: {
    alignItems: 'flex-end',
  },
  itemCount: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  totalItemCount: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "400",
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  flatListStyle: {
    width: "100%",
    marginTop: 10,
  },
  flatListContainer: {
    paddingVertical: 8,
  },
  itemContainer: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
  },
  itemDimensions: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  modalButtonContainer: {
    marginTop: 16,
    width: "100%",
    paddingHorizontal: 10,
  },
  packButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#64748B", // Updated to match the item name text color
    textAlign: "center",
    marginBottom: 10,
    backgroundColor: '#E2E8F0', // Updated to match the item card background
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: -20,
    marginTop: -20,
  },
  infoFab: {
    position: 'absolute',
    left: 20, // Position on the left side
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  selectFab: {
    backgroundColor: '#64748B',
    right: 'auto', // Override the right positioning from fab style
    left: 20,     // Position on the left side
  },
  noPackagesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  titleUnderline: {
    height: 1,
    backgroundColor: '#E5E5E5',
    width: '100%',
    marginBottom: 15,
  },
  renameInput: {
    height: 42,
    width: "80%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#F8FAFC",
    color: "#2c3e50",
    placeholderTextColor: "#94A3B8",
  },
  selectionActionBar: {
    width: '100%',
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 8,
    marginTop: 8,
  },
  selectedCountText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  selectionActionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  actionDeleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
  },
  cancelSelectionButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedPackage: {
    backgroundColor: '#EFF6FF',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    width: "90%",
    alignSelf: "center",
  },
  buttonApply1: {
    backgroundColor: "#2ECC71",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    width: "40%",
  },
  buttonClose: {
    marginTop: 10,
  },
  buttonClose1: {
    backgroundColor: "#f39c12",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    width: "40%",
    alignSelf: "center",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  optionButton: {
    padding: 10,
    backgroundColor: "#FF8C00",
    marginVertical: 5,
    borderRadius: 5,
    alignSelf: "center",
    width: "80%",
  },
  optionButtonClose: {
    padding: 10,
    backgroundColor: "red",
    marginVertical: 5,
    borderRadius: 5,
    alignSelf: "center",
    width: "80%",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 2,
    paddingBottom: 0,
    alignSelf: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
  },
  packButton: {
    backgroundColor: '#3b82f6',
  },
  shipButton: {
    backgroundColor: '#10b981',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonTextContainer: {
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonTextLine: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    marginHorizontal: 16,
  },
  addItemButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 16,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  addItemPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    marginTop: 4,
    width: '100%',
  },
  addItemText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
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
  createPackageButton: {
    backgroundColor: '#475569',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  createPackageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});