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
  };

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
    try {
      const packagesString = await AsyncStorage.getItem("packages");
      const packages = packagesString ? JSON.parse(packagesString) : {};
      delete packages[packageName];
      await AsyncStorage.setItem("packages", JSON.stringify(packages));
      this.setState({ packages, showOptionsModal: false });
      Alert.alert("Success", "Package deleted.");
    } catch (error) {
      Alert.alert("Error", "Failed to delete package.");
    }
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

    const quantity = parseInt(updatedItem.quantity) || 1;
    const replicatedNames = Array.from({ length: quantity }, (_, i) =>
      i === 0 ? updatedItem.itemName : `${updatedItem.itemName}${i + 1}`
    );

    const updatedItemWithReplications = {
      ...updatedItem,
      quantity: quantity,
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

  render() {
    const {
      packages,
      selectedPackage,
      showPackageModal,
      showDetailsModal,
      selectedItem,
      showOptionsModal,
      renamePackageModal,
      newPackageName,
    } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="cube-outline" size={24} color="white" />
          <Text style={styles.headerText}>Saved Packages</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          {Object.keys(packages).length === 0 ? (
            <Text style={styles.noPackagesText}>No saved packages found.</Text>
          ) : (
            Object.keys(packages).map((packageName) => (
              <TouchableOpacity
                key={packageName}
                style={styles.packageCard}
                onPress={() => this.openPackageDetails(packageName)}
                onLongPress={() =>
                  this.setState({
                    selectedPackage: packageName,
                    showOptionsModal: true,
                  })
                }
              >
                <Ionicons name="cube" size={20} color="#3B5998" />
                <Text style={styles.packageCardText}>{packageName}</Text>
              </TouchableOpacity>
            ))
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

        {/* Rename Package Modal */}
        <Modal
          visible={renamePackageModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => this.setState({ renamePackageModal: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rename Package</Text>
              <TextInput
                style={styles.input}
                value={newPackageName}
                onChangeText={(text) => this.setState({ newPackageName: text })}
                placeholder="Enter new package name"
              />
              <TouchableOpacity
                style={styles.buttonApply}
                onPress={this.handleRenamePackage}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonClose1}
                onPress={() => this.setState({ renamePackageModal: false })}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Package Details Modal */}
        <Modal
          visible={showPackageModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Items in {selectedPackage}</Text>
              {selectedPackage && packages[selectedPackage] && (
                <FlatList
                  data={packages[selectedPackage]}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemContainer}
                      onPress={() => this.handleEditItem(item)}
                    >
                      <Text style={styles.itemText}>
                        {item.itemName} - {item.quantity}x
                      </Text>
                      <Text style={styles.itemDimensions}>
                        Dimensions: {item.itemLength} x {item.itemWidth} x{" "}
                        {item.itemHeight}
                      </Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.flatListContainer}
                  style={styles.flatListStyle}
                />
              )}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={this.closePackageModal}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.packButton}
                  onPress={this.handlePackItems}
                >
                  <Text style={styles.buttonText}>Pack!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  packageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  packageCardText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#3B5998",
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
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "auto",
    paddingTop: 15,
    paddingHorizontal: 10,
  },
  closeButton: {
    backgroundColor: "#E74C3C",
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  packButton: {
    backgroundColor: "#2ECC71",
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
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
  buttonApply: {
    backgroundColor: "#3B5998",
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
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3B5998",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  noPackagesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
});
