import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { carrierBoxes } from '../packing_algo/carrierBoxes';

const TestPage = ({ navigation, route }) => {
  // Get all carrier boxes
  const allCarriers = ['No Carrier', 'USPS', 'FedEx', 'UPS'];
  
  // Function to generate dummy items that fit in the box
  const generateDummyItems = (box) => {
    const [length, width, height] = box;
    console.log('Generating dummy items for box:', { length, width, height });
    // Create items that will fit nicely in the box
    const items = [
      // Create a few smaller items to show distribution
      [length/2, width/2, height/2, "item1", "No Carrier", "Small Item 1"],
      [length/3, width/3, height/3, "item2", "No Carrier", "Small Item 2"],
      [length/4, width/4, height/4, "item3", "No Carrier", "Small Item 3"],
      // Add one larger item
      [length*0.6, width*0.6, height*0.6, "item4", "No Carrier", "Large Item"],
    ];
    console.log('Generated dummy items:', items);
    return items;
  };

  // Function to find carriers that have a box with the same dimensions
  const findCarriersWithBox = (targetBox) => {
    const [length, width, height] = targetBox;
    const carriersWithBox = [];

    allCarriers.forEach(carrier => {
      const boxes = carrierBoxes(carrier);
      const hasBox = boxes.some(([l, w, h]) => 
        Math.abs(l - length) < 0.01 && 
        Math.abs(w - width) < 0.01 && 
        Math.abs(h - height) < 0.01
      );
      if (hasBox) {
        carriersWithBox.push(carrier);
      }
    });

    return carriersWithBox;
  };

  const handleBoxPress = (box, carrier) => {
    const carriersWithBox = findCarriersWithBox(box);
    
    // If only one carrier has this box size, navigate directly
    if (carriersWithBox.length === 1) {
      navigateToDisplay3D(box, carrier);
    } else {
      // Show carrier selection modal
      setSelectedBox(box);
      setAvailableCarriers(carriersWithBox);
      setModalVisible(true);
    }
  };

  const navigateToDisplay3D = (box, carrier) => {
    console.log('Navigating to TestDisplay3D with box:', box, 'carrier:', carrier);
    const dummyItems = generateDummyItems(box);
    const boxDetails = carrierBoxes(carrier).find(([l, w, h]) => 
      Math.abs(l - box[0]) < 0.01 && 
      Math.abs(w - box[1]) < 0.01 && 
      Math.abs(h - box[2]) < 0.01
    );
    console.log('Box details:', boxDetails);

    const params = {
      box: {
        x: box[0],
        y: box[1],
        z: box[2],
        type: boxDetails[3],
        priceText: boxDetails[4]
      },
      itemsTotal: dummyItems,
      selectedBox: {
        dimensions: [box[0], box[1], box[2]],
        priceText: boxDetails[4],
        finalBoxType: boxDetails[3]
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
    };
    console.log('Navigation params:', params);
    navigation.navigate('TestDisplay3D', params);
  };

  const renderBox = (box, carrier) => {
    const [length, width, height, type, price] = box;
    const carriersWithBox = findCarriersWithBox([length, width, height]);
    const carrierText = carriersWithBox.length > 1 ? 
      `Available in ${carriersWithBox.length} carriers` : 
      carrier;

    return (
      <TouchableOpacity
        key={`${carrier}-${type}-${length}-${width}-${height}`}
        style={styles.boxCard}
        onPress={() => handleBoxPress([length, width, height], carrier)}
      >
        <Text style={styles.boxTitle}>{type}</Text>
        <Text style={styles.dimensions}>
          {length}" × {width}" × {height}"
        </Text>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.carrierInfo}>{carrierText}</Text>
      </TouchableOpacity>
    );
  };

  // Get all unique box sizes across all carriers
  const getAllUniqueBoxes = () => {
    const uniqueBoxes = new Map();
    
    allCarriers.forEach(carrier => {
      const boxes = carrierBoxes(carrier);
      boxes.forEach(box => {
        const [length, width, height] = box;
        const key = `${length}-${width}-${height}`;
        if (!uniqueBoxes.has(key)) {
          uniqueBoxes.set(key, { box, carrier });
        }
      });
    });

    return Array.from(uniqueBoxes.values());
  };

  // State for carrier selection modal
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedBox, setSelectedBox] = React.useState(null);
  const [availableCarriers, setAvailableCarriers] = React.useState([]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Box Sizes</Text>
        <View style={styles.boxesGrid}>
          {getAllUniqueBoxes()
            .sort((a, b) => (a.box[0] * a.box[1] * a.box[2]) - (b.box[0] * b.box[1] * b.box[2]))
            .map(({ box, carrier }) => renderBox(box, carrier))}
        </View>
      </ScrollView>

      {/* Carrier Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Carrier</Text>
            {availableCarriers.map(carrier => (
              <TouchableOpacity
                key={carrier}
                style={styles.carrierButton}
                onPress={() => {
                  setModalVisible(false);
                  navigateToDisplay3D(selectedBox, carrier);
                }}
              >
                <Text style={styles.carrierButtonText}>{carrier}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  carrierInfo: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#64748B', // Updated to match the item name text color
  },
  carrierButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  carrierButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginTop: 5,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TestPage;
