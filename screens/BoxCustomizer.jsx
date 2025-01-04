import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { GLView } from 'expo-gl';
import { carrierBoxes } from '../packing_algo/carrierBoxes';
import Box3DRenderer from '../components/Box3DRenderer';
import { createDisplay } from '../packing_algo/packing';
import { getScale } from '../utils/boxSizes';

const carrierData = [
  { label: 'No Carrier', value: 'No Carrier' },
  { label: 'UPS', value: 'UPS' },
  { label: 'USPS', value: 'USPS' },
  { label: 'FedEx', value: 'FedEx' },
];

const BoxCustomizer = ({ navigation }) => {
  const [boxType, setBoxType] = useState('predefined'); // 'predefined' or 'custom'
  const [selectedCarrier, setSelectedCarrier] = useState('No Carrier');
  const [selectedBox, setSelectedBox] = useState(null);
  const [customDimensions, setCustomDimensions] = useState({
    length: '',
    width: '',
    height: '',
  });
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    length: '',
    width: '',
    height: '',
  });
  const [boxVolume, setBoxVolume] = useState(0);
  const [usedVolume, setUsedVolume] = useState(0);

  // Get available boxes based on selected carrier
  const availableBoxes = carrierBoxes(selectedCarrier);

  const validateBoxDimensions = (dimensions) => {
    const { length, width, height } = dimensions;
    return !isNaN(length) && !isNaN(width) && !isNaN(height) &&
           length > 0 && width > 0 && height > 0;
  };

  const validateItemDimensions = (item) => {
    const { length, width, height } = item;
    if (!validateBoxDimensions({ length, width, height })) {
      Alert.alert('Invalid Dimensions', 'Please enter valid dimensions for the item.');
      return false;
    }
    
    const box = boxType === 'predefined' ? selectedBox : 
      [Number(customDimensions.length), Number(customDimensions.width), Number(customDimensions.height)];
    
    if (!box) {
      Alert.alert('No Box Selected', 'Please select or create a box first.');
      return false;
    }

    // Check if item fits in the box
    if (length > box[0] || width > box[1] || height > box[2]) {
      Alert.alert('Item Too Large', 'The item dimensions exceed the box dimensions.');
      return false;
    }

    return true;
  };

  const calculateVolume = (l, w, h) => l * w * h;

  const addItem = () => {
    if (!validateItemDimensions(currentItem)) return;

    const newItem = {
      ...currentItem,
      length: Number(currentItem.length),
      width: Number(currentItem.width),
      height: Number(currentItem.height),
    };

    const itemVolume = calculateVolume(newItem.length, newItem.width, newItem.height);
    const newUsedVolume = usedVolume + itemVolume;

    if (newUsedVolume > boxVolume) {
      Alert.alert('Box Full', 'This item would exceed the box volume. Please select a larger box.');
      return;
    }

    setItems([...items, newItem]);
    setUsedVolume(newUsedVolume);
    setCurrentItem({ name: '', length: '', width: '', height: '' });
  };

  useEffect(() => {
    if (boxType === 'predefined' && selectedBox) {
      setBoxVolume(calculateVolume(selectedBox[0], selectedBox[1], selectedBox[2]));
    } else if (boxType === 'custom' && validateBoxDimensions(customDimensions)) {
      setBoxVolume(calculateVolume(
        Number(customDimensions.length),
        Number(customDimensions.width),
        Number(customDimensions.height)
      ));
    }
  }, [boxType, selectedBox, customDimensions]);

  const getBoxForRendering = () => {
    if (boxType === 'predefined' && selectedBox) {
      return {
        x: selectedBox[0],
        y: selectedBox[1],
        z: selectedBox[2],
        type: selectedBox[3] || 'Custom Box',
        priceText: selectedBox[4] || '',
      };
    } else if (boxType === 'custom' && validateBoxDimensions(customDimensions)) {
      return {
        x: Number(customDimensions.length),
        y: Number(customDimensions.width),
        z: Number(customDimensions.height),
        type: 'Custom Box',
        priceText: '',
      };
    }
    return null;
  };

  const isBoxSelected = (box) => {
    if (!selectedBox || !box) return false;
    return box[0] === selectedBox[0] && 
           box[1] === selectedBox[1] && 
           box[2] === selectedBox[2] && 
           box[3] === selectedBox[3];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Box Type</Text>
        </View>
        <View style={styles.boxTypeContainer}>
          <TouchableOpacity
            style={[styles.boxTypeButton, boxType === 'predefined' && styles.selectedButton]}
            onPress={() => setBoxType('predefined')}
          >
            <Text style={styles.buttonText}>Predefined Box</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boxTypeButton, boxType === 'custom' && styles.selectedButton]}
            onPress={() => setBoxType('custom')}
          >
            <Text style={styles.buttonText}>Custom Box</Text>
          </TouchableOpacity>
        </View>
      </View>

      {boxType === 'predefined' ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Carrier</Text>
          </View>
          <Dropdown
            style={styles.dropdown}
            data={carrierData}
            labelField="label"
            valueField="value"
            value={selectedCarrier}
            onChange={item => {
              setSelectedCarrier(item.value);
              setSelectedBox(null);
            }}
          />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Box Size</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableBoxes.map((box, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.boxOption,
                  isBoxSelected(box) && styles.selectedBoxOption
                ]}
                onPress={() => setSelectedBox(box)}
              >
                <Text style={[
                  styles.boxDimensions,
                  isBoxSelected(box) && styles.selectedBoxDimensions
                ]}>{`${box[0]}" × ${box[1]}" × ${box[2]}"`}</Text>
                <Text style={[
                  styles.boxType,
                  isBoxSelected(box) && styles.selectedBoxType
                ]}>{box[3]}</Text>
                <Text style={[
                  styles.boxPrice,
                  isBoxSelected(box) && styles.selectedBoxPrice
                ]}>{box[4]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Custom Box Dimensions</Text>
          </View>
          <View style={styles.dimensionsContainer}>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Length</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customDimensions.length}
                onChangeText={text => setCustomDimensions({...customDimensions, length: text})}
                placeholder="L"
                placeholderTextColor="#666666"
              />
            </View>
            <View style={styles.dimensionSeparatorContainer}>
              <Text style={styles.dimensionSeparator}>×</Text>
            </View>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Width</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customDimensions.width}
                onChangeText={text => setCustomDimensions({...customDimensions, width: text})}
                placeholder="W"
                placeholderTextColor="#666666"
              />
            </View>
            <View style={styles.dimensionSeparatorContainer}>
              <Text style={styles.dimensionSeparator}>×</Text>
            </View>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Height</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customDimensions.height}
                onChangeText={text => setCustomDimensions({...customDimensions, height: text})}
                placeholder="H"
                placeholderTextColor="#666666"
              />
            </View>
          </View>
        </View>
      )}

      {(selectedBox || (boxType === 'custom' && validateBoxDimensions(customDimensions))) && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Add Items</Text>
            </View>
            <View style={styles.itemInputContainer}>
              <TextInput
                style={styles.itemNameInput}
                value={currentItem.name}
                onChangeText={text => setCurrentItem({...currentItem, name: text})}
                placeholder="Item Name"
                placeholderTextColor="#666666"
              />
              <View style={styles.itemDimensionsRow}>
                <View style={styles.dimensionInput}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentItem.length}
                    onChangeText={text => setCurrentItem({...currentItem, length: text})}
                    placeholder="L"
                    placeholderTextColor="#666666"
                  />
                </View>
                <Text style={styles.itemDimensionSeparator}>×</Text>
                <View style={styles.dimensionInput}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentItem.width}
                    onChangeText={text => setCurrentItem({...currentItem, width: text})}
                    placeholder="W"
                    placeholderTextColor="#666666"
                  />
                </View>
                <Text style={styles.itemDimensionSeparator}>×</Text>
                <View style={styles.dimensionInput}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentItem.height}
                    onChangeText={text => setCurrentItem({...currentItem, height: text})}
                    placeholder="H"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <Text style={styles.buttonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Box Preview</Text>
            </View>
            <View style={styles.previewContainer}>
              {getBoxForRendering() && (
                <Box3DRenderer
                  box={getBoxForRendering()}
                  items={items.map((item, index) => ([
                    item.length,
                    item.width,
                    item.height,
                    item.name || `Item ${index + 1}`,
                    '',
                    item.name || `Item ${index + 1}`
                  ]))}
                  style={styles.preview}
                />
              )}
            </View>
            <View style={styles.volumeInfo}>
              <Text style={styles.volumeText}>
                Box Volume: {boxVolume.toFixed(2)} cubic inches
              </Text>
              <Text style={styles.volumeText}>
                Used Volume: {usedVolume.toFixed(2)} cubic inches ({((usedVolume/boxVolume) * 100).toFixed(1)}%)
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  boxTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  boxTypeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dropdown: {
    height: 50,
    borderColor: '#c0c0c0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  boxOption: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBoxOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  boxDimensions: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedBoxDimensions: {
    color: '#1565C0',
  },
  boxType: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  selectedBoxType: {
    color: '#1976D2',
    fontWeight: '500',
  },
  boxPrice: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  selectedBoxPrice: {
    color: '#1976D2',
    fontWeight: '500',
  },
  dimensionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dimensionInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  dimensionSeparatorContainer: {
    paddingBottom: 10,
    width: 20,
    alignItems: 'center',
  },
  dimensionSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
  },
  itemDimensionSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginHorizontal: 4,
    height: 40,
    textAlignVertical: 'center',
    lineHeight: 40,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderColor: '#c0c0c0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333333',
  },
  itemNameInput: {
    height: 40,
    borderColor: '#c0c0c0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#333333',
  },
  itemInputContainer: {
    marginBottom: 16,
  },
  itemDimensionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dimensionInputWithLabel: {
    flex: 1,
    marginHorizontal: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  previewContainer: {
    height: 300,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  preview: {
    flex: 1,
  },
  volumeInfo: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  volumeText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default BoxCustomizer;
