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
import { Ionicons } from "@expo/vector-icons"; // Assuming you're using Expo or replace with appropriate icon library
import { ItemDetailsModal } from "./FormPage"; // Ensure correct import
import { pack, createDisplay } from "../packing_algo/packing";

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
  }

  componentDidMount() {
    this.fetchPackages();
    this.focusListener = this.props.navigation.addListener(
      "focus",
      this.fetchPackages
    );
  }

  componentWillUnmount() {
    if (this.focusListener) {
      this.focusListener();
    }
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
    this.setState({
      showPackageModal: false,
      selectedPackage: null,
      showDetailsModal: false,
      selectedItem: null,
    });
  };

  handleEditItem = (item) => {
    this.setState({ showPackageModal: false }, () => {
      this.setState({ selectedItem: item, showDetailsModal: true });
    });
  };

  handleSaveEditedItem = (updatedItem) => {
    const { selectedPackage, packages } = this.state;

    // If quantity is 0, treat it as a delete operation
    if (updatedItem.quantity === 0) {
      this.handleDeleteItem(updatedItem);
      return;
    }

    const replicatedNames = Array.from({ length: updatedItem.quantity }, (_, i) =>
      i === 0 ? updatedItem.itemName : `${updatedItem.itemName}${i + 1}`
    );

    const updatedItemWithReplications = {
      ...updatedItem,
      replicatedNames: replicatedNames,
    };

    const updatedPackage = packages[selectedPackage].map((item) =>
      item.id === updatedItem.id ? updatedItemWithReplications : item
    );

    const updatedPackages = { ...packages, [selectedPackage]: updatedPackage };

    this.setState(
      { packages: updatedPackages, showDetailsModal: false },
      async () => {
        try {
          await AsyncStorage.setItem(
            "packages",
            JSON.stringify(updatedPackages)
          );
          Alert.alert("Success", "Item updated.");
        } catch (error) {
          Alert.alert("Error", "Failed to save edited item.");
        }
      }
    );
  };

  handleDeleteItem = (itemToDelete) => {
    const { selectedPackage, packages } = this.state;
    const updatedPackage = packages[selectedPackage].filter(
      (item) => item.id !== itemToDelete.id
    );

    // If the updated package is empty, delete the entire package
    if (updatedPackage.length === 0) {
      delete packages[selectedPackage];
    } else {
      // Otherwise, update the package with the remaining items
      packages[selectedPackage] = updatedPackage;
    }

    this.setState({ packages, showDetailsModal: false }, async () => {
      try {
        await AsyncStorage.setItem("packages", JSON.stringify(packages));
        if (updatedPackage.length === 0) {
          Alert.alert(
            "Package Deleted",
            "The package was successfully deleted."
          );
          this.closePackageModal();
        } else {
          Alert.alert("Item Deleted", "Item was successfully deleted.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to delete item or package.");
      }
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
        throw new Error("Failed to pack items");
      }

      const scale =
        Math.max(packedResult.x, packedResult.y, packedResult.z) > 15 ? 20 : 10;
      const itemsDisplay = createDisplay(packedResult, scale);

      const selectedBox = {
        dimensions: [packedResult.x, packedResult.y, packedResult.z],
        price: packedResult.price,
        finalBoxType: packedResult.type,
      };

      // Navigate to Display3D screen with necessary parameters
      this.props.navigation.navigate("Display3D", {
        box: packedResult,
        itemsTotal: itemsDisplay,
        selectedBox,
        selectedCarrier: "No Carrier",
        items: updatedPackage,
      });

      // Close the package modal
      this.closePackageModal();
    } catch (error) {
      Alert.alert("Error", "An error occurred while preparing the package.");
    }
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
      selectedPackage,
      showPackageModal,
      showDetailsModal,
      showOptionsModal,
      renamePackageModal,
      newPackageName,
      isEditMode,
      editingPackage,
      selectedItem,
    } = this.state;

    const renderPackage = (packageName) => {
      const isEditing = isEditMode && editingPackage === packageName;
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
                <Ionicons name="cube" size={20} color="#3B5998" style={styles.packageIcon} />
                <Text style={styles.packageName}>{packageName}</Text>
              </View>
              <Text style={styles.itemCount}>
                {packages[packageName].length} items
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
    };

    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback 
          onPress={() => {
            if (isEditMode) {
              this.setState({ isEditMode: false, editingPackage: null });
            }
          }}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Ionicons name="cube-outline" size={24} color="white" />
              <Text style={styles.headerText}>Saved Packages</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
              {Object.keys(packages).map(renderPackage)}
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
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={[styles.modalContent, { alignItems: 'center' }]}>
                      <Text style={styles.modalTitle}>Edit Package Name:</Text>
                      <TextInput
                        style={[styles.input, { textAlign: 'center', width: '80%' }]}
                        value={newPackageName}
                        onChangeText={(text) => this.setState({ newPackageName: text })}
                        placeholder="Package Name"
                        autoFocus={true}
                        selectTextOnFocus={true}
                      />
                      <TouchableOpacity
                        style={[styles.buttonApply1, { 
                          width: 100,
                          height: 40,
                          alignItems: 'center', 
                          justifyContent: 'center'
                        }]}
                        onPress={() => {
                          Keyboard.dismiss();
                          this.handleRenamePackage();
                        }}
                      >
                        <Text style={[styles.buttonText, { textAlign: 'center' }]}>Save</Text>
                      </TouchableOpacity>
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
                      <Text style={styles.modalTitle}>
                        {selectedPackage} Items
                      </Text>
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
                      <View style={styles.modalButtonContainer}>
                        <TouchableOpacity
                          style={styles.packButton}
                          onPress={this.handlePackItems}
                        >
                          <Text style={styles.buttonText}>Pack Items</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            {showDetailsModal && selectedItem && (
              <ItemDetailsModal
                visible={showDetailsModal}
                item={selectedItem}
                closeModal={() => this.setState({ showDetailsModal: false })}
                handleDeleteAndClose={() => this.handleDeleteItem(selectedItem)}
                handleUpdateItem={this.handleSaveEditedItem}
              />
            )}

            <TouchableOpacity
              style={styles.fab}
              onPress={() => this.props.navigation.navigate("FormPage")}
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B5998",
    padding: 15,
  },
  headerText: {
    color: "white",
    fontSize: 18,
    marginLeft: 10,
  },
  scrollViewContainer: {
    padding: 10,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flatListStyle: {
    maxHeight: "70%",
    width: "100%",
  },
  itemContainer: {
    padding: 15,
    backgroundColor: "#4A90E2",
    marginVertical: 8,
    borderRadius: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  itemText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  itemDimensions: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    textAlign: "center",
  },
  modalButtonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  closeButton: {
    backgroundColor: "#E74C3C",
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  packButton: {
    backgroundColor: '#2ECC71',
    padding: 15,
    borderRadius: 8,
    width: '50%',
    alignItems: 'center',
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  flatListContainer: {
    flexGrow: 0,
    width: "100%",
    paddingBottom: 10,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B5998',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoFab: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B5998',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  noPackagesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
});