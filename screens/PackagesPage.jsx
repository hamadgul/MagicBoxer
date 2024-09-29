import React, { Component } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../components/Styles";
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
      this.setState({ showDetailsModal: true, selectedItem: item });
    });
  };

  handleSaveEditedItem = (updatedItem) => {
    const { selectedPackage, packages } = this.state;

    // Regenerate replicated names based on the updated quantity
    const quantity = parseInt(updatedItem.quantity) || 1;
    const replicatedNames = Array.from({ length: quantity }, (_, i) =>
      i === 0 ? updatedItem.itemName : `${updatedItem.itemName}${i + 1}`
    );

    const updatedItemWithReplications = {
      ...updatedItem,
      quantity: quantity,
      replicatedNames: replicatedNames,
    };

    // Update the package with the updated item
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

    const updatedPackages = { ...packages, [selectedPackage]: updatedPackage };

    this.setState(
      { packages: updatedPackages, showDetailsModal: false },
      async () => {
        try {
          await AsyncStorage.setItem(
            "packages",
            JSON.stringify(updatedPackages)
          );
          Alert.alert("Item Deleted", "Item was successfully deleted.");
        } catch (error) {
          Alert.alert("Error", "Failed to delete item.");
        }
      }
    );
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
        items: updatedPackage, // Pass the latest updated package
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
        <ScrollView contentContainerStyle={localStyles.scrollViewContainer}>
          {Object.keys(packages).length === 0 ? (
            <Text style={styles.noPackagesText}>No saved packages found.</Text>
          ) : (
            Object.keys(packages).map((packageName) => (
              <TouchableOpacity
                key={packageName}
                style={localStyles.packageButton}
                onPress={() => this.openPackageDetails(packageName)}
                onLongPress={() => this.handleDeletePackage(packageName)}
              >
                <Text style={localStyles.buttonText}>{packageName}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <Modal
          visible={showPackageModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Package Details</Text>
              {selectedPackage && packages[selectedPackage] && (
                <ScrollView>
                  {packages[selectedPackage].map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={localStyles.itemContainer}
                      onPress={() => this.handleEditItem(item)}
                    >
                      <Text style={localStyles.label}>
                        {item.itemName} - {item.quantity}x
                      </Text>
                      <Text style={localStyles.label}>
                        Dimensions: {item.itemLength} x {item.itemWidth} x{" "}
                        {item.itemHeight}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity
                style={styles.buttonClose}
                onPress={this.closePackageModal}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={localStyles.packButton}
                onPress={this.handlePackItems}
              >
                <Text style={styles.buttonText}>Pack</Text>
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
      </View>
    );
  }
}

const localStyles = StyleSheet.create({
  scrollViewContainer: {
    padding: 10,
    paddingBottom: 20,
    backgroundColor: "#f0f0f0",
  },
  packageButton: {
    backgroundColor: "#3B5998",
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
  },
  itemContainer: {
    padding: 10,
    backgroundColor: "#FF8C00",
    marginVertical: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  packButton: {
    backgroundColor: "#008B8B",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
});
