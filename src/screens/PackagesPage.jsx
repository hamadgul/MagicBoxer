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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons"; 
import { ItemDetailsModal } from "./FormPage"; 
import { pack, createDisplay } from "../packing_algo/packing";
import * as Crypto from 'expo-crypto';
import { modalStyles } from "../theme/ModalStyles"; // Import modalStyles
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
    // Bulk selection for saved items modal
    savedItemsSelectionMode: false,
    selectedSavedItems: [],
    isBulkAddInProgress: false, // Flag to prevent individual alerts during bulk operations
    // Bulk selection for package items modal
    packageItemsSelectionMode: false,
    selectedPackageItems: [],
    isBulkRemoveInProgress: false, // Flag to prevent individual alerts during bulk remove operations
    // Import functionality
    showImportModal: false,
    importPreview: [],
    isImporting: false,
    // FAB menu functionality
    isFabMenuOpen: false,
    // Package naming after import
    showPackageNamingModal: false,
    importedPackageItems: [],
    newImportedPackageName: '',
  };

  constructor(props) {
    super(props);
    this.shakeAnimation = new Animated.Value(0);
    
    // FAB menu animations
    this.fabRotation = new Animated.Value(0);
    this.createPackageFabOpacity = new Animated.Value(0);
    this.createPackageFabScale = new Animated.Value(0);
    this.importPackageFabOpacity = new Animated.Value(0);
    this.importPackageFabScale = new Animated.Value(0);

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

  // FAB menu functionality
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
      Animated.parallel([
        Animated.timing(this.createPackageFabOpacity, {
          toValue: 1,
          duration: 200,
          delay: 50,
          useNativeDriver: true,
        }),
        Animated.timing(this.createPackageFabScale, {
          toValue: 1,
          duration: 200,
          delay: 50,
          useNativeDriver: true,
        }),
        Animated.timing(this.importPackageFabOpacity, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(this.importPackageFabScale, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Closing the menu
      Animated.parallel([
        Animated.timing(this.createPackageFabOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(this.createPackageFabScale, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(this.importPackageFabOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(this.importPackageFabScale, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  handleCreatePackagePress = () => {
    this.props.navigation.navigate('Create Package');
    this.toggleFabMenu(); // Close the menu after selecting an option
  };
  
  handleImportPackagePress = () => {
    this.setState({ showImportModal: true, importPreview: [] });
    this.toggleFabMenu(); // Close the menu after selecting an option
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
      showSavedItemsModal: false,
      // Reset bulk selection state for package items
      packageItemsSelectionMode: false,
      selectedPackageItems: []
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

  handleDeleteItem = (itemToDelete, suppressAlert = false) => {
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
              // Auto-suppress alerts if bulk remove is in progress
              const shouldSuppressAlert = suppressAlert || this.state.isBulkRemoveInProgress;
              
              if (updatedItems.length === 0) {
                if (!shouldSuppressAlert) {
                  Alert.alert(
                    "Success",
                    `Package "${packageName}" was removed`
                  );
                }
                this.closePackageModal();
              } else {
                if (!shouldSuppressAlert) {
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
                } else {
                  // For bulk operations, don't show modal again
                  // The bulk operation will handle the final state
                }
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

  // CSV Import functionality
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
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        Alert.alert('Error', 'CSV file appears to be empty or invalid.');
        this.setState({ isImporting: false });
        return;
      }
      
      // Parse header and data
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1);
      
      // Validate required columns
      const requiredColumns = ['name', 'length', 'width', 'height', 'quantity'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        Alert.alert(
          'Invalid CSV Format',
          `Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: ${requiredColumns.join(', ')}`
        );
        this.setState({ isImporting: false });
        return;
      }
      
      // Parse items
      const items = [];
      const errors = [];
      
      // Process each line and collect item data
      const itemsToCreate = [];
      
      dataLines.forEach((line, index) => {
        const values = line.split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Row ${index + 2}: Incorrect number of columns`);
          return;
        }
        
        const item = {};
        headers.forEach((header, i) => {
          item[header] = values[i];
        });
        
        // Validate and convert numeric values
        const length = parseFloat(item.length);
        const width = parseFloat(item.width);
        const height = parseFloat(item.height);
        const quantity = parseInt(item.quantity);
        
        if (isNaN(length) || isNaN(width) || isNaN(height) || isNaN(quantity)) {
          errors.push(`Row ${index + 2}: Invalid numeric values`);
          return;
        }
        
        if (length <= 0 || width <= 0 || height <= 0 || quantity <= 0) {
          errors.push(`Row ${index + 2}: Values must be greater than 0`);
          return;
        }
        
        if (!item.name || item.name.trim() === '') {
          errors.push(`Row ${index + 2}: Item name cannot be empty`);
          return;
        }
        
        // Add item data for each quantity
        for (let i = 0; i < quantity; i++) {
          itemsToCreate.push({
            itemName: item.name.trim(),
            itemLength: length,
            itemWidth: width,
            itemHeight: height,
            weight: 1, // Default weight
            quantity: 1 // Individual item quantity is always 1
          });
        }
      });
      
      // Create items with async UUIDs
      for (const itemData of itemsToCreate) {
        const itemId = await Crypto.randomUUID();
        const replicatedNames = [{
          name: itemData.itemName,
          id: await Crypto.randomUUID(),
          parentId: itemId
        }];
        
        items.push({
          id: itemId,
          ...itemData,
          replicatedNames: replicatedNames
        });
      }
      
      if (errors.length > 0) {
        Alert.alert(
          'Import Errors',
          `Found ${errors.length} error(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`
        );
        this.setState({ isImporting: false });
        return;
      }
      
      if (items.length === 0) {
        Alert.alert('Error', 'No valid items found in CSV file.');
        this.setState({ isImporting: false });
        return;
      }
      
      // Update preview
      this.setState({ 
        importPreview: items,
        isImporting: false 
      });
      
    } catch (error) {
      console.error('Error processing CSV file:', error);
      Alert.alert('Error', 'Failed to process CSV file. Please check the file format.');
      this.setState({ isImporting: false });
    }
  };
  
  handleImportPackage = async () => {
    try {
      const { importPreview } = this.state;
      
      if (importPreview.length === 0) {
        Alert.alert('Error', 'No items to import.');
        return;
      }
      
      // Store imported items and show naming modal
      this.setState({ 
        importedPackageItems: importPreview,
        showImportModal: false,
        showPackageNamingModal: true,
        newImportedPackageName: '',
        importPreview: []
      });
      
    } catch (error) {
      console.error('Error importing package:', error);
      Alert.alert('Error', 'Failed to import package. Please try again.');
    }
  };
  
  handleSaveImportedPackage = async () => {
    try {
      const { importedPackageItems, newImportedPackageName } = this.state;
      
      if (!newImportedPackageName || newImportedPackageName.trim() === '') {
        Alert.alert('Error', 'Please enter a package name.');
        return;
      }
      
      const packageName = newImportedPackageName.trim();
      
      // Check if package name already exists
      const existingPackages = await AsyncStorage.getItem('packages');
      const packages = existingPackages ? JSON.parse(existingPackages) : {};
      
      if (packages[packageName]) {
        Alert.alert('Error', 'A package with this name already exists. Please choose a different name.');
        return;
      }
      
      // Get current date in MM/DD/YY format to match normal packages
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
      const year = String(today.getFullYear()).slice(-2);
      const dateCreated = `${month}/${day}/${year}`;
      
      // Create the package
      const packageData = {
        items: importedPackageItems,
        dateCreated: dateCreated
      };
      
      // Save to storage
      packages[packageName] = packageData;
      await AsyncStorage.setItem('packages', JSON.stringify(packages));
      
      // Update state
      this.setState({ 
        packages,
        showPackageNamingModal: false,
        importedPackageItems: [],
        newImportedPackageName: ''
      });
      
      Alert.alert(
        'Success',
        `Package "${packageName}" has been created with ${importedPackageItems.length} items.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error saving imported package:', error);
      Alert.alert('Error', 'Failed to save package. Please try again.');
    }
  };
  
  downloadSampleCSV = async () => {
    try {
      const sampleData = [
        'name,length,width,height,quantity',
        'Small Box,10,8,6,2',
        'Medium Box,14,12,10,1',
        'Large Box,20,16,12,1',
        'Flat Mailer,12,9,0.5,3',
        'Tube Mailer,24,4,4,1'
      ].join('\n');
      
      const fileUri = `${FileSystem.documentDirectory}package_import_template.csv`;
      await FileSystem.writeAsStringAsync(fileUri, sampleData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Save Package Import Template'
        });
      } else {
        Alert.alert('Success', `Template saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error downloading sample CSV:', error);
      Alert.alert('Error', 'Failed to download sample template.');
    }
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
          // Close the FAB menu if it's open when tapping outside
          if (this.state.isFabMenuOpen) {
            this.toggleFabMenu();
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
                  style={{
                    backgroundColor: '#E5E5EA',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    marginLeft: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 80,
                  }}
                  onPress={this.cancelSelection}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FF3B30',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    marginLeft: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 80,
                    opacity: this.state.selectedPackages.length === 0 ? 0.5 : 1
                  }}
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
                  Save packages to view shipping costs and 3D packing in optimal boxes.
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
                  <View style={[
                    modalStyles.modalContent,
                    {
                      maxHeight: selectedPackage && this.getItemsArray(selectedPackage).length > 4 ? "75%" : "auto"
                    }
                  ]}>
                    {/* Header */}
                    <View style={modalStyles.modalHeader}>
                      <Text style={modalStyles.modalTitle}>
                        {selectedPackage}
                      </Text>
                    </View>
                    
                    {/* Bulk Selection Controls - Minimal inline approach */}
                    {this.state.packageItemsSelectionMode && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingVertical: 8,
                        backgroundColor: '#F8FAFC',
                        borderBottomWidth: 1,
                        borderBottomColor: '#E2E8F0',
                      }}>
                        <Text style={{
                          fontSize: 14,
                          color: '#64748B',
                          fontWeight: '500'
                        }}>
                          {this.state.selectedPackageItems.length} selected
                        </Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={this.selectAllPackageItems}
                            style={{ marginRight: 16 }}
                          >
                            <Text style={{ fontSize: 14, color: '#3B82F6', fontWeight: '600' }}>All</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={this.clearAllPackageItemsSelection}
                            style={{ marginRight: 16 }}
                          >
                            <Text style={{ fontSize: 14, color: '#3B82F6', fontWeight: '600' }}>None</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={this.exitPackageItemsBulkSelectionMode}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              backgroundColor: '#EF4444',
                              borderRadius: 6,
                            }}
                          >
                            <Ionicons name="close" size={16} color="white" />
                            <Text style={{
                              marginLeft: 4,
                              fontSize: 14,
                              fontWeight: '600',
                              color: 'white'
                            }}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    
                    {/* Scrollable content */}
                    <FlatList
                      data={selectedPackage ? this.getItemsArray(selectedPackage) : []}
                      style={styles.flatListStyle}
                      contentContainerStyle={styles.flatListContainer}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={selectedPackage && this.getItemsArray(selectedPackage).length > 4}
                      scrollEnabled={selectedPackage && this.getItemsArray(selectedPackage).length > 4}
                      renderItem={({ item }) => {
                        const isSelected = this.state.selectedPackageItems.some(selected => selected.id === item.id);
                        const isInBulkMode = this.state.packageItemsSelectionMode;
                        
                        return (
                          <TouchableOpacity
                            style={[
                              styles.itemContainer,
                              isSelected && {
                                backgroundColor: '#EBF4FF',
                                borderColor: '#3B82F6',
                                borderWidth: 1,
                              }
                            ]}
                            onPress={() => {
                              if (isInBulkMode) {
                                this.togglePackageItemSelection(item);
                              } else {
                                this.handleEditItem(item);
                              }
                            }}
                            onLongPress={() => {
                              if (!isInBulkMode) {
                                this.enterPackageItemsBulkSelectionMode(item);
                              }
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                              {/* Checkbox for bulk selection mode */}
                              {isInBulkMode && (
                                <View style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 4,
                                  borderWidth: 2,
                                  borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
                                  backgroundColor: isSelected ? '#3B82F6' : 'transparent',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: 12,
                                }}>
                                  {isSelected && (
                                    <Ionicons name="checkmark" size={16} color="white" />
                                  )}
                                </View>
                              )}
                              
                              <View style={{ flex: 1 }}>
                                <Text style={styles.itemText}>{item.itemName}</Text>
                                <Text style={styles.itemDimensions}>
                                  Quantity: {item.quantity}
                                </Text>
                                <Text style={styles.itemDimensions}>
                                  {item.itemLength}L x {item.itemWidth}W x {item.itemHeight}H
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />

                    {!this.state.packageItemsSelectionMode && (
                      <TouchableOpacity
                        style={[styles.addItemPlaceholder, { marginTop: 12, marginBottom: 12 }]}
                        onPress={() => {
                          console.log('Add from saved items button pressed');
                          this.showSavedItemsSelector();
                        }}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
                        <Text style={styles.addItemText}>Add from saved items</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Footer */}
                    <View style={styles.modalFooter}>
                      {this.state.packageItemsSelectionMode ? (
                        // Bulk selection mode footer
                        <TouchableOpacity
                          style={[
                            styles.footerButton,
                            {
                              backgroundColor: '#EF4444',
                              flex: 1,
                            }
                          ]}
                          onPress={this.bulkRemovePackageItems}
                          disabled={this.state.selectedPackageItems.length === 0}
                        >
                          <Ionicons name="trash" size={20} color="#fff" />
                          <Text style={styles.footerButtonText}>
                            Remove Items ({this.state.selectedPackageItems.length})
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        // Normal mode footer
                        <>
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
                        </>
                      )}
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

                    {/* Bulk Selection Controls - Only show when in bulk selection mode */}
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
                          <TouchableOpacity
                            onPress={this.selectAllSavedItems}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              backgroundColor: '#E2E8F0',
                              borderRadius: 6,
                              marginRight: 8,
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Select All</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={this.clearAllSavedItemsSelection}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              backgroundColor: '#E2E8F0',
                              borderRadius: 6,
                            }}
                          >
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
                          <Ionicons 
                            name="close" 
                            size={16} 
                            color="white" 
                          />
                          <Text style={{
                            marginLeft: 6,
                            fontSize: 14,
                            fontWeight: '600',
                            color: 'white'
                          }}>
                            Exit
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

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
                            
                            const isSelected = this.state.selectedSavedItems.some(selectedItem => selectedItem.id === item.id);
                            
                            return (
                              <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                  // Prevent individual adds during bulk operations
                                  if (this.state.isBulkAddInProgress) {
                                    console.log('🚫 Individual tap blocked - bulk add in progress');
                                    return;
                                  }
                                  
                                  if (this.state.savedItemsSelectionMode) {
                                    this.toggleSavedItemSelection(item);
                                  } else if (!alreadyAdded) {
                                    this.handleAddSavedItemToPackage(item);
                                  }
                                }}
                                onLongPress={() => {
                                  if (!alreadyAdded && !this.state.savedItemsSelectionMode) {
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
                                {this.state.savedItemsSelectionMode ? (
                                  alreadyAdded ? (
                                    <View style={{ padding: 4 }}>
                                      <Ionicons name="checkmark-circle" size={20} color="#94A3B8" />
                                    </View>
                                  ) : (
                                    <TouchableOpacity
                                      onPress={() => this.toggleSavedItemSelection(item)}
                                      style={{ padding: 4 }}
                                    >
                                      <Ionicons 
                                        name={isSelected ? "checkbox" : "square-outline"} 
                                        size={20} 
                                        color={isSelected ? "#3B82F6" : "#94A3B8"}
                                      />
                                    </TouchableOpacity>
                                  )
                                ) : alreadyAdded ? (
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
                              <Text style={{ fontSize: 15, color: '#64748B', marginTop: 8, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
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
                          backgroundColor: this.state.savedItemsSelectionMode ? '#22C55E' : '#3B82F6',
                          paddingVertical: 14,
                          paddingHorizontal: 24,
                          borderRadius: 12,
                          alignItems: 'center',
                          marginTop: 8,
                          marginHorizontal: 0,
                          marginBottom: 8,
                          opacity: this.state.savedItemsSelectionMode && this.state.selectedSavedItems.length === 0 ? 0.5 : 1,
                        }}
                        onPress={() => {
                          if (this.state.savedItemsSelectionMode) {
                            this.bulkAddSavedItemsToPackage();
                          } else {
                            this.setState({ showSavedItemsModal: false });
                            this.props.navigation.navigate('AI Item Search', { 
                              searchQuery: this.state.savedItemsSearchQuery,
                              fromPackagesPage: true, // Flag to indicate navigation from PackagesPage
                              selectedPackage: this.state.selectedPackage // Pass the selected package name
                            });
                          }
                        }}
                        disabled={this.state.savedItemsSelectionMode && this.state.selectedSavedItems.length === 0}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                          {this.state.savedItemsSelectionMode ? 
                            `Add Items (${this.state.selectedSavedItems.length})` : 
                            'Find with AI Search'
                          }
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
          
          {/* Create Package FAB (animated) */}
          <Animated.View
            style={{
              position: 'absolute',
              right: 20,
              bottom: 100,
              opacity: this.createPackageFabOpacity,
              transform: [{ scale: this.createPackageFabScale }],
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              style={styles.menuButton}
              onPress={(e) => {
                e.stopPropagation();
                this.handleCreatePackagePress();
              }}
            >
              <View style={[styles.menuButtonIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="cube-outline" size={20} color="white" />
              </View>
              <Text style={styles.menuButtonText}>Create Package</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Import Package FAB (animated) */}
          <Animated.View
            style={{
              position: 'absolute',
              right: 20,
              bottom: 160,
              opacity: this.importPackageFabOpacity,
              transform: [{ scale: this.importPackageFabScale }],
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              style={styles.menuButton}
              onPress={(e) => {
                e.stopPropagation();
                this.handleImportPackagePress();
              }}
            >
              <View style={[styles.menuButtonIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="cloud-upload-outline" size={20} color="white" />
              </View>
              <Text style={styles.menuButtonText}>Import Package</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Bulk edit FAB - only show if there are packages */}
          {Object.keys(packages).length > 0 && (
            <TouchableOpacity
              style={[styles.fab, styles.selectFab]}
              onPress={this.toggleSelectionMode}
            >
              <Ionicons name={this.state.selectionMode ? "close" : "list"} size={26} color="white" />
            </TouchableOpacity>
          )}
          
          {/* Import Package Modal */}
          <Modal
            visible={this.state.showImportModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => this.setState({ showImportModal: false, importPreview: [] })}
          >
            <TouchableWithoutFeedback onPress={() => this.setState({ showImportModal: false, importPreview: [] })}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.importModalContainer}>
                    <Text style={styles.importModalTitle}>Import Package</Text>
                    
                    {this.state.isImporting ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Processing CSV file...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.modalSubtitle}>
                          Import a package from a CSV file. The CSV should contain columns for: name, length, width, height, and quantity.
                        </Text>
                        
                        <Text style={styles.modalSubtitle}>
                          {this.state.importPreview.length > 0 
                            ? `Found ${this.state.importPreview.length} items to import.` 
                            : 'Preview of items to import will appear here.'}
                        </Text>
                      
                        {this.state.importPreview.length > 0 && (
                          <View style={styles.previewContainer}>
                            {this.state.importPreview.slice(0, 3).map((item, index) => (
                              <View key={`${item.itemName}-${index}`} style={styles.previewItem}>
                                <Text style={styles.previewItemName}>{item.itemName}</Text>
                                <Text style={styles.previewItemDimensions}>
                                  {item.itemLength}" × {item.itemWidth}" × {item.itemHeight}"
                                </Text>
                              </View>
                            ))}
                            {this.state.importPreview.length > 3 && (
                              <Text style={styles.moreItemsText}>
                                +{this.state.importPreview.length - 3} more items
                              </Text>
                            )}
                          </View>
                        )}
                        
                        <View style={styles.modalButtonsRow}>
                          <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => this.setState({ showImportModal: false, importPreview: [] })}
                          >
                            <Text style={styles.modalCancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.modalButton, styles.importButton, this.state.importPreview.length === 0 && styles.disabledButton]}
                            onPress={this.handleImportPackage}
                            disabled={this.state.importPreview.length === 0}
                          >
                            <Text style={styles.importButtonText}>Import {this.state.importPreview.length} {this.state.importPreview.length === 1 ? 'Item' : 'Items'}</Text>
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
          
          {/* Package Naming Modal */}
          <Modal
            visible={this.state.showPackageNamingModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => this.setState({ showPackageNamingModal: false, importedPackageItems: [], newImportedPackageName: '' })}
          >
            <KeyboardAvoidingView 
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <TouchableWithoutFeedback onPress={() => this.setState({ showPackageNamingModal: false, importedPackageItems: [], newImportedPackageName: '' })}>
                <View style={modalStyles.centeredView}>
                  <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <View style={modalStyles.modalContent}>
                      <View style={modalStyles.modalHeader}>
                        <Text style={modalStyles.modalTitle}>Name Your Package</Text>
                      </View>
                      
                      <Text style={modalStyles.modalSubtitle}>
                        You've successfully imported {this.state.importedPackageItems.length} items. Please give your package a name to save it.
                      </Text>
                      
                      <TextInput
                        style={modalStyles.fieldInput}
                        placeholder="Enter package name"
                        value={this.state.newImportedPackageName}
                        onChangeText={(text) => this.setState({ newImportedPackageName: text })}
                        autoFocus={true}
                        returnKeyType="done"
                        onSubmitEditing={this.handleSaveImportedPackage}
                      />
                      
                      <View style={modalStyles.modalButtonContainer}>
                        <TouchableOpacity
                          style={[modalStyles.button, modalStyles.cancelButton]}
                          onPress={() => this.setState({ showPackageNamingModal: false, importedPackageItems: [], newImportedPackageName: '' })}
                        >
                          <Text style={modalStyles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[modalStyles.button, modalStyles.saveButton]}
                          onPress={this.handleSaveImportedPackage}
                        >
                          <Text style={modalStyles.buttonText}>Save Package</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
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
    // Check if item is already added to package
    const { selectedPackage, packages } = this.state;
    const packageItems = packages[selectedPackage]?.items || [];
    const itemName = item.name || item.itemName || 'Unknown Item';
    
    const alreadyAdded = packageItems.some(addedItem => 
      (addedItem.name || '').toLowerCase() === itemName.toLowerCase() ||
      (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
    );
    
    // Don't allow selection of already added items
    if (alreadyAdded) {
      return;
    }
    
    const { selectedSavedItems } = this.state;
    const isSelected = selectedSavedItems.some(selectedItem => selectedItem.id === item.id);
    
    if (isSelected) {
      this.setState({
        selectedSavedItems: selectedSavedItems.filter(selectedItem => selectedItem.id !== item.id)
      });
    } else {
      this.setState({
        selectedSavedItems: [...selectedSavedItems, item]
      });
    }
  };

  selectAllSavedItems = () => {
    const { selectedPackage, packages } = this.state;
    const packageItems = packages[selectedPackage]?.items || [];
    
    const filteredItems = this.state.allSavedItems.filter(item => {
      const itemName = item.name || item.itemName || 'Unknown Item';
      
      // Check if item matches search query
      const matchesSearch = itemName.toLowerCase().includes(this.state.savedItemsSearchQuery.toLowerCase());
      
      // Check if item is already added to package
      const alreadyAdded = packageItems.some(addedItem => 
        (addedItem.name || '').toLowerCase() === itemName.toLowerCase() ||
        (addedItem.itemName || '').toLowerCase() === itemName.toLowerCase()
      );
      
      return matchesSearch && !alreadyAdded;
    });
    
    this.setState({ selectedSavedItems: [...filteredItems] });
  };

  clearAllSavedItemsSelection = () => {
    this.setState({ selectedSavedItems: [] });
  };

  // Add saved item to package without showing individual alerts (for bulk operations)
  addSavedItemToPackageQuietly = async (savedItem) => {
    try {
      console.log('🔇 QUIET ADD - Starting quiet add for:', savedItem.name);
      console.log('🔇 QUIET ADD - Call stack:', new Error().stack);
      const { selectedPackage, packages } = this.state;
      
      if (!selectedPackage) {
        throw new Error("No package selected.");
      }
      
      // Make sure the package exists and has an items array
      if (!packages[selectedPackage]) {
        throw new Error("The selected package could not be found.");
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
        // Skip this item if it already exists
        return { success: false, reason: 'already_exists', itemName: savedItem.name };
      }
      
      // Extract dimensions based on the nested structure
      let dimensions = {};
      if (savedItem.items && savedItem.items.length > 0 && savedItem.items[0].dimensions) {
        dimensions = savedItem.items[0].dimensions;
      } else if (savedItem.dimensions) {
        dimensions = savedItem.dimensions;
      } else {
        dimensions = { length: '0', width: '0', height: '0' };
      }
      
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
      
      // Add the item to the package
      const updatedPackages = { ...packages };
      
      if (!updatedPackages[selectedPackage].items) {
        updatedPackages[selectedPackage].items = [];
      }
      
      updatedPackages[selectedPackage].items.push(newItem);
      
      // Update state without modal manipulation
      this.setState({ packages: updatedPackages });
      
      console.log('🔇 QUIET ADD - Successfully added:', savedItem.name);
      return { success: true, itemName: savedItem.name };
    } catch (error) {
      console.error("🔇 QUIET ADD - Error adding saved item to package quietly:", error);
      return { success: false, reason: 'error', itemName: savedItem.name, error: error.message };
    }
  };

  bulkAddSavedItemsToPackage = async () => {
    console.log('🔥 BULK ADD - Starting bulk add operation');
    const { selectedSavedItems, selectedPackage } = this.state;
    if (selectedSavedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select items to add to the package.");
      return;
    }

    // Set flag to prevent individual alerts
    this.setState({ isBulkAddInProgress: true });

    try {
      const results = [];
      let successCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      console.log('🔥 BULK ADD - Processing', selectedSavedItems.length, 'items');
      for (const item of selectedSavedItems) {
        console.log('🔥 BULK ADD - Processing item:', item.name);
        const result = await this.addSavedItemToPackageQuietly(item);
        results.push(result);
        
        if (result.success) {
          successCount++;
        } else if (result.reason === 'already_exists') {
          skippedCount++;
        } else {
          errorCount++;
        }
      }
      
      // Save all changes to AsyncStorage at once
      await AsyncStorage.setItem("packages", JSON.stringify(this.state.packages));
      
      // Clear selection, exit bulk mode, close modal, and reset bulk flag
      this.setState({
        selectedSavedItems: [],
        savedItemsSelectionMode: false,
        showSavedItemsModal: false,
        isBulkAddInProgress: false
      }, () => {
        // Show the package modal again after a short delay
        setTimeout(() => {
          this.setState({ showPackageModal: true });
        }, 300);
      });
      
      // Show a single summary alert
      let message = '';
      if (successCount > 0) {
        message += `Added ${successCount} item${successCount > 1 ? 's' : ''} to ${selectedPackage}.`;
      }
      if (skippedCount > 0) {
        message += `${message ? ' ' : ''}${skippedCount} item${skippedCount > 1 ? 's were' : ' was'} already in the package.`;
      }
      if (errorCount > 0) {
        message += `${message ? ' ' : ''}${errorCount} item${errorCount > 1 ? 's' : ''} failed to add.`;
      }
      
      console.log('🔥 BULK ADD - Showing final summary alert:', message);
      Alert.alert("Bulk Add Complete", message);
    } catch (error) {
      console.error('Error bulk adding items:', error);
      // Reset bulk flag on error
      this.setState({ isBulkAddInProgress: false });
      Alert.alert("Error", "Failed to add items to the package.");
    }
  };

  // Bulk selection methods for package items
  enterPackageItemsBulkSelectionMode = (item) => {
    this.setState({
      packageItemsSelectionMode: true,
      selectedPackageItems: [item]
    });
  };

  exitPackageItemsBulkSelectionMode = () => {
    this.setState({
      packageItemsSelectionMode: false,
      selectedPackageItems: []
    });
  };

  togglePackageItemSelection = (item) => {
    const { selectedPackageItems } = this.state;
    const isSelected = selectedPackageItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      // Remove from selection
      this.setState({
        selectedPackageItems: selectedPackageItems.filter(selected => selected.id !== item.id)
      });
    } else {
      // Add to selection
      this.setState({
        selectedPackageItems: [...selectedPackageItems, item]
      });
    }
  };

  selectAllPackageItems = () => {
    const { selectedPackage, packages } = this.state;
    if (selectedPackage && packages[selectedPackage] && packages[selectedPackage].items) {
      this.setState({
        selectedPackageItems: [...packages[selectedPackage].items]
      });
    }
  };

  clearAllPackageItemsSelection = () => {
    this.setState({ selectedPackageItems: [] });
  };

  bulkRemovePackageItems = async () => {
    console.log('🗑️ BULK REMOVE - Starting bulk remove operation');
    const { selectedPackageItems, selectedPackage } = this.state;
    
    if (selectedPackageItems.length === 0) {
      Alert.alert("No Items Selected", "Please select at least one item to remove.");
      return;
    }

    // Set bulk remove flag to suppress individual alerts
    this.setState({ isBulkRemoveInProgress: true });

    try {
      const itemCount = selectedPackageItems.length;
      let packageDeleted = false;
      
      // Remove each selected item using the existing handleDeleteItem method
      for (const item of selectedPackageItems) {
        await new Promise((resolve) => {
          // Use handleDeleteItem with suppressAlert=true to avoid individual alerts
          this.handleDeleteItem(item, true);
          // Small delay to ensure state updates are processed
          setTimeout(resolve, 50);
        });
      }
      
      // Check if package still exists after all deletions
      const { packages } = this.state;
      packageDeleted = !packages[selectedPackage];
      
      // Reset bulk selection state
      this.setState({
        packageItemsSelectionMode: false,
        selectedPackageItems: [],
        isBulkRemoveInProgress: false,
        selectedPackage: packageDeleted ? null : selectedPackage,
        showPackageModal: !packageDeleted
      });
      
      // Show consolidated success message
      if (packageDeleted) {
        Alert.alert("Success", `${itemCount} item(s) removed. Package was empty and has been deleted.`);
      } else {
        Alert.alert("Success", `${itemCount} item(s) removed from ${selectedPackage}.`);
      }
      
    } catch (error) {
      console.error('Error bulk removing items:', error);
      // Reset bulk flag on error
      this.setState({ isBulkRemoveInProgress: false });
      Alert.alert("Error", "Failed to remove items from the package.");
    }
  };

  handleAddSavedItemToPackage = async (savedItem, suppressAlert = false) => {
    try {
      // Auto-suppress alerts if bulk add is in progress
      const shouldSuppressAlert = suppressAlert || this.state.isBulkAddInProgress;
      console.log('🔊 REGULAR ADD - Starting regular add for:', savedItem.name, 'suppressAlert:', suppressAlert, 'isBulkAddInProgress:', this.state.isBulkAddInProgress, 'shouldSuppressAlert:', shouldSuppressAlert);
      console.log('🔊 REGULAR ADD - Call stack:', new Error().stack);
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
      
      if (!shouldSuppressAlert) {
        console.log('🔊 REGULAR ADD - Showing success alert for:', savedItem.name);
        Alert.alert("Success", `${savedItem.name} added to ${selectedPackage}.`);
      } else {
        console.log('🔊 REGULAR ADD - Alert suppressed for:', savedItem.name, '(suppressAlert:', suppressAlert, 'isBulkAddInProgress:', this.state.isBulkAddInProgress, ')');
      }
    } catch (error) {
      console.error("🔊 REGULAR ADD - Error adding saved item to package:", error);
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
    backgroundColor: "#F2F2F7", // iOS system background color
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
  package: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 16,
    minHeight: 60, // Consistent height for iOS list items
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
    fontSize: 13, // iOS secondary text size
    color: '#8E8E93', // iOS secondary text color
    marginTop: 2,
  },
  packageIcon: {
    marginRight: 12,
    marginLeft: 2,
  },
  packageName: {
    fontSize: 17, // iOS standard font size
    fontWeight: "600",
    color: "#000000", // iOS text color
    letterSpacing: 0.3,
    flex: 1,
  },
  itemCountContainer: {
    alignItems: 'flex-end',
  },
  itemCount: {
    fontSize: 15, // iOS secondary text size
    color: "#8E8E93", // iOS secondary text color
    fontWeight: "500",
  },
  totalItemCount: {
    fontSize: 13, // iOS small text size
    color: "#8E8E93", // iOS secondary text color
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
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    } : {
      elevation: 2,
    }),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 14, // iOS modal radius
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    width: "90%",
    display: "flex",
    flexDirection: "column",
    ...(Platform.OS === 'ios' ? {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    } : {
      elevation: 5,
    }),
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
    borderRadius: 10, // iOS card radius
    marginBottom: 12,
    borderWidth: 0.5, // Thinner border for iOS
    borderColor: "#C6C6C8", // iOS border color
    ...(Platform.OS === 'ios' ? {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    } : {
      elevation: 2,
    }),
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
    bottom: 100, // Positioned above bottom tab navigation
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
    bottom: 20,   // Match SavedItemsPage positioning
  },
  mainFab: {
    // Inherits from fab style
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 160,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    } : {
      elevation: 6,
    }),
  },
  menuButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
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
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
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
    fontSize: 15,
    color: '#8E8E93',
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
  modalCancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  importButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  fileButtonsContainer: {
    width: '100%',
    marginTop: 15,
    gap: 12,
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
  packageNameInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
    color: '#334155',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
    backgroundColor: '#F2F2F7', // iOS system background
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5, // Thinner iOS border
    borderBottomColor: '#C6C6C8', // iOS border color
    marginBottom: 8,
    marginTop: 0,
    zIndex: 1,
  },
  selectedCountText: {
    fontSize: 17, // iOS text size
    color: '#000000', // iOS text color
    fontWeight: '500',
    flex: 1, // Allow text to shrink if needed
    marginRight: 16, // Add margin to separate from buttons
  },
  selectionActionButtons: {
    flexDirection: 'row',
    flexShrink: 0, // Prevent buttons from shrinking
  },
  cancelButton: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  deleteButton: {
    backgroundColor: '#FF9F9A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButtonText: {
    color: '#007AFF', // iOS blue - match SavedItemsPage
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 18, // Match SavedItemsPage
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 18, // Match SavedItemsPage
  },
  selectedPackage: {
    backgroundColor: '#E5F2FF', // iOS selection color
    borderWidth: 1, // Thinner border for iOS
    borderColor: '#007AFF', // iOS blue
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
    gap: 4,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
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
    bottom: 20, // Match SavedItemsPage positioning
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF', // iOS blue
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    } : {
      elevation: 8,
    }),
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F2FF', // iOS light blue background
    borderWidth: 0, // No border for iOS buttons
    borderRadius: 10, // iOS button radius
    padding: 12,
    marginVertical: 10,
    marginHorizontal: 16,
  },
  addItemButtonText: {
    fontSize: 17, // iOS button text size
    color: '#007AFF', // iOS blue
    fontWeight: '600', // iOS font weight
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
    alignSelf: 'stretch',
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
    backgroundColor: '#F2F2F7', // iOS system background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 3,
    }),
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000', // iOS text color
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17, // iOS text size
    lineHeight: 24,
    color: '#8E8E93', // iOS secondary text color
    textAlign: 'center',
    marginBottom: 32,
    width: '85%',
  },
  createPackageButton: {
    backgroundColor: '#E5F2FF', // iOS light blue background
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10, // iOS button radius
    overflow: 'hidden',
  },
  createPackageButtonText: {
    color: '#007AFF', // iOS blue
    fontSize: 17, // iOS button text size
    fontWeight: '600', // iOS button text weight
    textAlign: 'center',
  },
});