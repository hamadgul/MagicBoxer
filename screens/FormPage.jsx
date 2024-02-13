import React, { useState, Component } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { Form, Row } from "native-base";
import { Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { ThemeProvider } from "react-native-paper";

var Buffer = require("@craftzdog/react-native-buffer").Buffer;

export default class FormPage extends React.Component {
  static ItemDetailsModal = (props) => {
    return (
      <View style={styles.centeredView}>
        <Modal visible={props.visible} animationType="slide" transparent={true}>
          <View style={styles.centeredView}>
            <View style={styles.modalContent}>
              <Text>Item Name: {props.item.itemName}</Text>
              <Text>Width: {props.item.itemWidth}</Text>
              <Text>Height: {props.item.itemHeight}</Text>
              <Text>Length: {props.item.itemLength}</Text>
              <Button
                onPress={() => props.handleDeleteAndClose(props.item)}
                title="Delete"
              />
              <Button onPress={props.closeModal} title="Close" />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  static ItemDetailsName = (props) => {
    return (
      // <View style={styles.itemBorder}>
      <View>
        <Text>Item: {props.item.itemName}</Text>
      </View>
    );
  };
  constructor(props) {
    super(props);
    this.state = {
      itemName: "",
      itemWidth: 0,
      itemHeight: 0,
      itemLength: 0,
      items: [],
      showDetails: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.handleVisualize = this.handleVisualize.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  resetForm = () => {
    this.setState({
      itemName: "",
      itemWidth: "",
      itemHeight: "",
      itemLength: "",
    });
  };

  handleDeleteAndClose = (itemToDelete) => {
    // Find the index of the item to delete
    const index = this.state.items.findIndex(
      (item) => item.itemName === itemToDelete.itemName
    );
    if (index > -1) {
      this.deleteItem(index);
    }
    this.closeModal();
  };
  deleteItem = async (index) => {
    const updatedItems = this.state.items.filter(
      (_, itemIndex) => index !== itemIndex
    );
    this.setState({ items: updatedItems });

    try {
      const serializedItems = Buffer.from(
        JSON.stringify(updatedItems)
      ).toString("base64");
      await AsyncStorage.setItem("itemList", serializedItems);
      Alert.alert("Item Deleted");
    } catch (error) {
      Alert.alert("Error deleting item");
    }
  };

  handleChange = (itemName) => {
    this.setState({ itemName });
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

  handleVisualize = async (e) => {
    // Retrieve the item list from AsyncStorage
    AsyncStorage.getItem("itemList")
      .then((itemListString) => {
        let itemList;
        if (itemListString) {
          const deserializedItems = JSON.parse(
            Buffer.from(itemListString, "base64").toString("utf8")
          );
          itemList = deserializedItems;
        } else {
          itemList = [];
        }
        // alert(JSON.stringify(itemList));
      })
      .catch((error) => {
        // handle error
        console.error(error);
      });
    this.props.navigation.navigate("Display3D", {
      items: this.state.items,
    });
  };

  handleSubmit = (e) => {
    if (
      this.state.itemLength === "" ||
      this.state.itemWidth === "" ||
      this.state.itemHeight === "" ||
      this.state.itemName === ""
    ) {
      Alert.alert(
        "Error",
        "Item name, length , width, and height can not be empty."
      );
      return;
    }
    if (
      isNaN(this.state.itemLength) ||
      isNaN(this.state.itemWidth) ||
      isNaN(this.state.itemHeight)
    ) {
      // Display an error message
      Alert.alert(
        "Error",
        "Item length, width, and height must be numeric values."
      );
      // prevent the form from being submitted
      return;
    }
    const newItem = {
      itemName: this.state.itemName,
      itemWidth: this.state.itemWidth,
      itemHeight: this.state.itemHeight,
      itemLength: this.state.itemLength,
    };
    this.setState({ items: [...this.state.items, newItem] }, () => {
      this._storeData();
    });

    alert("An item was submitted: " + this.state.itemName);
    alert(`Number of items submitted so far: ${this.state.items.length + 1}`);
    this.resetForm();
    Keyboard.dismiss();
  };

  selectItem = (item) => {
    this.setState({ selectedItem: item });
  };

  closeModal = () => {
    this.setState({ showDetails: false });
  };

  render() {
    return (
      <View style={styles.container}>
        <Form onSubmit={this.handleSubmit}>
          <Text style={styles.label}>Item Name:</Text>
          <TextInput
            style={styles.input}
            value={this.state.itemName}
            onChangeText={this.handleChange}
          />
          <Text style={styles.label}>Width:</Text>
          <TextInput
            style={styles.input}
            value={this.state.itemWidth}
            onChangeText={(text) => this.setState({ itemWidth: text })}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Height:</Text>
          <TextInput
            style={styles.input}
            value={this.state.itemHeight}
            onChangeText={(text) => this.setState({ itemHeight: text })}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Length:</Text>
          <TextInput
            style={styles.input}
            value={this.state.itemLength}
            onChangeText={(text) => this.setState({ itemLength: text })}
            keyboardType="numeric"
          />
          <View style={styles.buttonContainer}>
            <Button
              block
              style={styles.submitButton}
              onPress={() => {
                this.handleSubmit();
              }}
              title="Add Item"
            >
              <Text>Add Item</Text>
            </Button>
            <Button
              block
              style={styles.visualizeButton}
              onPress={() => {
                this.handleVisualize();
              }}
              title="Visualize"
            >
              <Text>Visualize</Text>
            </Button>
          </View>
          <View>
            <View style={styles.modalButtonContainer}>
              {this.state.items.map((item, index) => (
                <View
                  style={[styles.button, styles.buttonOpen]}
                  key={item.itemName}
                >
                  <Button
                    key={index}
                    onPress={() =>
                      this.setState({ showDetails: true, selectedItem: item })
                    }
                    title={item.itemName}
                  />
                </View>
              ))}
              {this.state.showDetails && (
                <FormPage.ItemDetailsModal
                  visible={this.state.showDetails}
                  item={this.state.selectedItem}
                  closeModal={this.closeModal}
                  handleDeleteAndClose={this.handleDeleteAndClose}
                />
              )}
            </View>
          </View>
        </Form>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "bold",
    color: "#1C6EA4",
  },
  input: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
    fontSize: 14,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitButton: {
    flex: 1,
    marginRight: 5,
  },
  visualizeButton: {
    flex: 1,
    marginLeft: 5,
  },
  itemBorder: {
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "#1C6EA4",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalContent: {
    margin: 20,
    backgroundColor: "#32a8a4",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#27ab1b",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
  },
  modalButtonContainer: {
    justifyContent: "space-evenly",
    flexDirection: "row",
    alignContent: "flex-start",
    flexWrap: "wrap",
  },
});
