import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { carrierBoxes } from '../packing_algo/packing';

const TestPage = ({ navigation }) => {
  // Get all carrier boxes
  const allCarriers = ['No Carrier', 'USPS', 'FedEx', 'UPS'];
  
  // Function to generate dummy items that fit in the box
  const generateDummyItems = (box) => {
    const [length, width, height] = box;
    // Create items that will fit nicely in the box
    const items = [
      // Create a few smaller items to show distribution
      [length/2, width/2, height/2, "item1", "No Carrier", "Small Item 1"],
      [length/3, width/3, height/3, "item2", "No Carrier", "Small Item 2"],
      [length/4, width/4, height/4, "item3", "No Carrier", "Small Item 3"],
      // Add one larger item
      [length*0.6, width*0.6, height*0.6, "item4", "No Carrier", "Large Item"],
    ];
    return items;
  };

  // Function to scale specific box dimensions
  const scaleBoxDimensions = (box) => {
    const [length, width, height, type, price] = box;
    
    // List of boxes that need scaling (original dimensions)
    const boxesToScale = [
      [6.25, 3.125, 0.5],
      [6, 4, 2],
      [16, 12, 12],
      [20, 12, 12],
      [8, 6, 4],
      [8.75, 5.5625, 0.875],
      [9, 6, 3],
      [10.875, 1.5, 12.375],
      [8.75, 4.375, 11.25]
    ];

    // Check if current box dimensions match any in the list
    const needsScaling = boxesToScale.some(scaledBox => 
      Math.abs(scaledBox[0] - length) < 0.01 && 
      Math.abs(scaledBox[1] - width) < 0.01 && 
      Math.abs(scaledBox[2] - height) < 0.01
    );

    if (needsScaling) {
      // Apply a scaling factor of 3 to make boxes appear larger
      const scaleFactor = 3;
      return [
        length * scaleFactor,
        width * scaleFactor,
        height * scaleFactor,
        type,
        price
      ];
    }

    return box;
  };

  const handleBoxPress = (box, carrier) => {
    const scaledBox = scaleBoxDimensions(box);
    const dummyItems = generateDummyItems(scaledBox);
    navigation.navigate('Display3D', {
      box: {
        x: scaledBox[0],
        y: scaledBox[1],
        z: scaledBox[2],
        type: scaledBox[3],
        priceText: scaledBox[4]
      },
      itemsTotal: dummyItems,
      selectedBox: {
        dimensions: [scaledBox[0], scaledBox[1], scaledBox[2]],
        priceText: scaledBox[4],
        finalBoxType: scaledBox[3]
      },
      selectedCarrier: carrier,
      items: dummyItems.map(item => ({
        itemLength: item[0],
        itemWidth: item[1],
        itemHeight: item[2],
        id: item[3],
        itemName: item[5],
        quantity: 1,
        replicatedNames: [item[5]]
      }))
    });
  };

  const renderBox = (box, carrier) => {
    const [length, width, height, type, price] = box;
    // For display purposes, show original dimensions but use scaled ones for visualization
    return (
      <TouchableOpacity
        key={`${carrier}-${type}-${length}-${width}-${height}`}
        style={styles.boxCard}
        onPress={() => handleBoxPress(box, carrier)}
      >
        <Text style={styles.boxTitle}>{type}</Text>
        <Text style={styles.dimensions}>
          {length}" × {width}" × {height}"
        </Text>
        <Text style={styles.price}>{price}</Text>
      </TouchableOpacity>
    );
  };

  const renderCarrierSection = (carrier) => {
    const boxes = carrierBoxes(carrier);
    // Sort boxes by volume (L×W×H)
    const sortedBoxes = [...boxes].sort((a, b) => 
      (a[0] * a[1] * a[2]) - (b[0] * b[1] * b[2])
    );

    return (
      <View key={carrier} style={styles.carrierSection}>
        <Text style={styles.carrierTitle}>{carrier}</Text>
        <View style={styles.boxesGrid}>
          {sortedBoxes.map(box => renderBox(box, carrier))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Box Visualization Test Page</Text>
      {allCarriers.map(renderCarrierSection)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50',
  },
  carrierSection: {
    marginBottom: 20,
  },
  carrierTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#34495e',
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 5,
  },
  boxesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  boxCard: {
    width: Dimensions.get('window').width / 2 - 20,
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  dimensions: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
});

export default TestPage;
