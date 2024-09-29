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
      this.setState({ packages });
      Alert.alert("Success", "Package deleted.");
    } catch (error) {
      Alert.alert("Error", "Failed to delete package.");
    }
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

      this.props.navigation.navigate("Display3D", {
        box: packedResult,
        itemsTotal: itemsDisplay,
        selectedBox,
        selectedCarrier: "No Carrier",
        items: updatedPackage,
      });
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
                onLongPress={() => this.handleDeletePackage(packageName)}
              >
                <Ionicons name="cube" size={20} color="#3B5998" />
                <Text style={styles.packageCardText}>{packageName}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
                />
              )}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={this.closePackageModal}
              >
                <Ionicons name="close-circle" size={24} color="#FF6347" />
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
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

        <TouchableOpacity style={styles.fab} onPress={() => {}}>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  flatListContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    padding: 10,
    backgroundColor: "#FF8C00",
    marginVertical: 5,
    borderRadius: 5,
    width: "90%",
    alignSelf: "center",
  },
  itemText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  itemDimensions: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  modalCloseButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  modalCloseButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#FF6347",
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
});
