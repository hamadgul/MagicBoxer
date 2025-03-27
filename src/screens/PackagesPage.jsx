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
  };

  constructor(props) {
    super(props);
    this.shakeAnimation = new Animated.Value(0);

    this.props.navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Ionicons name="cube-outline" size={24} color="white" />
          <Text style={styles.headerTitle}>Saved Packages</Text>
        </View>
      ),
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#3B82F6',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: 'white',
    });
  }

  componentDidMount() {
    console.log('PackagesPage mounted');
    this.fetchPackages();
    
    // Reset any stuck state when the component mounts
    this.setState({
      showPackageModal: false,
      showDetailsModal: false,
      selectedItem: null,
      selectedPackage: null
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
          selectedItem: null
        });
      };
      
      // Set up error handler
      this.errorSubscription = global.ErrorUtils?.setGlobalHandler?.(this.errorHandler);
    }
    
    this.focusListener = this.props.navigation.addListener(
      "focus",
      this.fetchPackages
    );
  }

  componentWillUnmount() {
    console.log('PackagesPage unmounting');
    
    // Clean up listeners
    if (this.focusListener) {
      this.focusListener();
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
    if (packages[newPackageName]) {
      Alert.alert("Error", "A package with this name already exists.");
      return;
    }

    // Rename the package in the state and AsyncStorage
    packages[newPackageName] = packages[selectedPackage];
    delete packages[selectedPackage];

    this.setState(
      { packages, renamePackageModal: false, newPackageName: "" },
      async () => {
        try {
          await AsyncStorage.setItem("packages", JSON.stringify(packages));
          Alert.alert("Success", "Package renamed successfully.");
        } catch (error) {
          Alert.alert("Error", "Failed to rename package.");
        }
      }
    );
  };

  openPackageDetails = (packageName) => {
    this.setState({ selectedPackage: packageName, showPackageModal: true });
  };

  closePackageModal = () => {
    // Close modals one at a time to prevent state conflicts
    if (this.state.showDetailsModal) {
      this.setState({
        showDetailsModal: false,
        selectedItem: null
      }, () => {
        setTimeout(() => {
          this.setState({
            showPackageModal: false,
            selectedPackage: null
          });
        }, 100);
      });
    } else {
      this.setState({
        showPackageModal: false,
        selectedPackage: null
      });
    }
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
      
      // PRODUCTION-SAFE APPROACH: Use a simpler state update sequence
      // First close the package modal completely
      this.setState({ showPackageModal: false }, () => {
        console.log('Package modal closed');
        
        // Wait a moment before setting the item and opening the details modal
        setTimeout(() => {
          console.log('Setting selectedItem and opening details modal');
          this.setState({ 
            selectedItem: itemCopy,
            showDetailsModal: true 
          });
        }, 500); // Longer timeout for production builds
      });
    } catch (error) {
      console.error('Error in handleEditItem:', error);
      Alert.alert('Error', 'There was a problem opening the item details. Please try again.');
    }
  };

  handleSaveEditedItem = async (updatedItem) => {
    // First close the modal
    this.setState({ 
      showDetailsModal: false,
      selectedItem: null 
    }, async () => {
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

      const replicatedNames = await Promise.all(Array.from({ length: updatedItem.quantity }, async (_, i) => ({
        name: updatedItem.itemName,
        id: await Crypto.randomUUID(),
        parentId: updatedItem.id
      })));

      const updatedItemWithReplications = {
        ...updatedItem,
        replicatedNames: replicatedNames,
      };

      const updatedPackage = packages[packageName].map((item) =>
        item.id === updatedItem.id ? updatedItemWithReplications : item
      );

      const updatedPackages = { ...packages, [packageName]: updatedPackage };

      try {
        await AsyncStorage.setItem("packages", JSON.stringify(updatedPackages));
        
        // Update state after AsyncStorage is updated
        this.setState({ packages: updatedPackages }, () => {
          Alert.alert("Success", `${updatedItem.itemName} was successfully updated`, [
            {
              text: "OK",
              onPress: () => {
                // Show the package modal again with the correct package selected
                this.setState({ 
                  showPackageModal: true,
                  selectedPackage: packageName
                });
              }
            }
          ]);
        });
      } catch (error) {
        Alert.alert("Error", "Failed to save edited item.");
      }
    });
  };

  handleDeleteItem = (itemToDelete) => {
    // First close the modal
    this.setState({ 
      showDetailsModal: false,
      selectedItem: null 
    }, () => {
      // Use the stored package name if selectedPackage is null
      const packageName = this.state.selectedPackage || this.tempPackageName;
      const { packages } = this.state;
      
      if (!packageName || !packages[packageName]) {
        Alert.alert("Error", "Could not find the package to update.");
        return;
      }
      
      const updatedPackage = packages[packageName].filter(
        (item) => item.id !== itemToDelete.id
      );

      // Create a new packages object to ensure state updates properly
      const updatedPackages = { ...packages };
      
      // If the updated package is empty, delete the entire package
      if (updatedPackage.length === 0) {
        delete updatedPackages[packageName];
      } else {
        // Otherwise, update the package with the remaining items
        updatedPackages[packageName] = updatedPackage;
      }

      // Update AsyncStorage and state
      AsyncStorage.setItem("packages", JSON.stringify(updatedPackages))
        .then(() => {
          this.setState({ packages: updatedPackages }, () => {
            if (updatedPackage.length === 0) {
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
                    this.setState({ 
                      showPackageModal: true,
                      selectedPackage: packageName
                    });
                  }
                }
              ]);
            }
          });
        })
        .catch(error => {
          Alert.alert("Error", "Failed to delete item or package.");
        });
    });
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
      const updatedPackage = updatedPackages[selectedPackage];

      if (!updatedPackage || updatedPackage.length === 0) {
        throw new Error(
          "Selected package not found in updated packages or package is empty"
        );
      }

      let itemsTotal = [];
      updatedPackage.forEach((item) => {
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
        items: updatedPackage,
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
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            {Object.keys(packages).map(this.renderPackage)}
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
                      data={selectedPackage ? packages[selectedPackage] : []}
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
                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={[styles.footerButton, styles.packButton]}
                        onPress={this.handlePackItems}
                      >
                        <Ionicons name="cube" size={20} color="#fff" />
                        <Text style={styles.footerButtonText}>Pack Items</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.footerButton, styles.shipButton]}
                        onPress={() => this.handleShipPackage({ name: selectedPackage, items: packages[selectedPackage] })}
                      >
                        <Ionicons name="airplane" size={20} color="#fff" />
                        <Text style={styles.footerButtonText}>Shipping Estimate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Completely separate modal rendering from state updates */}
          <ItemDetailsModal
            visible={showDetailsModal && selectedItem !== null}
            item={selectedItem}
            closeModal={() => {
              // Just close this modal first
              this.setState({ showDetailsModal: false }, () => {
                // Clear the selected item after the modal is closed
                setTimeout(() => {
                  this.setState({ selectedItem: null });
                }, 100);
              });
            }}
            handleDeleteAndClose={() => selectedItem && this.handleDeleteItem(selectedItem)}
            handleUpdateItem={this.handleSaveEditedItem}
            showBackButton={true}
            onBackButtonPress={() => {
              console.log('Back button pressed in ItemDetailsModal');
              // First ensure we have the package name stored
              const packageName = this.state.selectedPackage || this.tempPackageName || Object.keys(this.state.packages)[0];
              
              // Use a more reliable approach for iOS IPA version
              // Close the details modal first
              this.setState({ 
                showDetailsModal: false 
              }, () => {
                // Clear the selected item
                this.setState({ selectedItem: null }, () => {
                  // Then show the package modal with the correct package
                  setTimeout(() => {
                    this.setState({ 
                      showPackageModal: true,
                      selectedPackage: packageName
                    });
                  }, 100); // Shorter delay to improve responsiveness
                });
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
            style={styles.infoFab}
            onPress={() => Alert.alert(
              "Package Options",
              "Long press on any package to rename or delete the entire package.",
              [{ text: "OK", onPress: () => {} }]
            )}
          >
            <Ionicons name="information-circle" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderPackage = (packageName) => {
    const isEditing = this.state.isEditMode && this.state.editingPackage === packageName;
    const animatedStyle = {
      transform: [{ translateX: isEditing ? this.shakeAnimation : 0 }],
    };

    return (
      <View key={packageName} style={styles.packageRow}>
        {isEditing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => this.handleDeletePackage(packageName)}
          >
            <Ionicons name="remove-circle" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )}
        
        <Animated.View style={[styles.packageContainer, animatedStyle]}>
          <TouchableOpacity
            style={styles.package}
            onPress={() => !isEditing && this.openPackageDetails(packageName)}
            onLongPress={() => this.toggleEditMode(packageName)}
          >
            <View style={styles.packageLeftContent}>
              <Ionicons name="cube" size={20} color="#3B82F6" style={styles.packageIcon} />
              <Text style={styles.packageName}>{packageName}</Text>
            </View>
            <Text style={styles.itemCount}>
              {this.state.packages[packageName].length} unique {this.state.packages[packageName].length === 1 ? 'item' : 'items'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isEditing && (
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 10,
    paddingBottom: 96, // Reduced padding since buttons are side by side
  },
  scrollViewContent: {
    paddingBottom: 96, // Add padding at the bottom of the ScrollView
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginHorizontal: 4,
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
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  itemCount: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
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
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
    backgroundColor: '#3B82F6',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1,
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
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 0,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1,
  },
});