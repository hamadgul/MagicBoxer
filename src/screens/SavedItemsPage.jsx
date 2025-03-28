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
import { modalStyles } from "../theme/ModalStyles";
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

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
  };

  constructor(props) {
    super(props);
    
    this.props.navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Ionicons name="bookmark-outline" size={24} color="white" />
          <Text style={styles.headerTitle}>My Saved Items</Text>
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
    console.log('SavedItemsPage mounted');
    this.fetchSavedItems();
    
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
            }
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
        }
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

;





  openEditModal = (item) => {
    // Extract numeric values from dimensions
    const lengthValue = parseFloat(item.dimensions.length.split(' ')[0]);
    const widthValue = parseFloat(item.dimensions.width.split(' ')[0]);
    const heightValue = parseFloat(item.dimensions.height.split(' ')[0]);
    
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
  formatDimension = (dimension) => {
    if (!dimension) return "0";
    
    // Extract the numeric part
    const numericPart = dimension.split(' ')[0];
    
    // Convert to number and check if it's an integer
    const value = parseFloat(numericPart);
    
    // If it's a whole number, return without decimal places
    if (value % 1 === 0) {
      return Math.floor(value).toString();
    }
    
    // Otherwise return with decimal places (trim trailing zeros)
    return value.toString().replace(/\.?0+$/, '');
  };
  
  renderItem = (item) => {
    return (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.itemContainer}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => this.openEditModal(item)}
          >
            <View style={styles.itemLeftContent}>
              <Ionicons name="bookmark" size={20} color="#3B82F6" style={styles.itemIcon} />
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <Text style={styles.itemDimensions}>
              {this.formatDimension(item.dimensions.length)}L × {this.formatDimension(item.dimensions.width)}W × {this.formatDimension(item.dimensions.height)}H
            </Text>
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
      itemHeight
    } = this.state;

    return (
      <TouchableWithoutFeedback 
        onPress={() => {
          Keyboard.dismiss();
        }}>
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            {savedItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyText}>
                  Your saved items will appear here and can be accessed on the Add Items page.
                </Text>
              </View>
            ) : (
              savedItems.map(item => this.renderItem(item))
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
                        placeholder="Enter item name"
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
          </Modal>



          <TouchableOpacity
            style={styles.fab}
            onPress={() => this.setState({ showAddItemModal: true })}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
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
    padding: 16,
    paddingBottom: 96,
  },
  scrollViewContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    fontSize: 16,
    fontWeight: '500',
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
    right: 20,
    bottom: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
});
