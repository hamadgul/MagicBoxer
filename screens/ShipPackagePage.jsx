import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { getShippingEstimates } from '../services/shippingService';
import { Ionicons } from '@expo/vector-icons';
import { pack } from '../packing_algo/packing'; // Import the packing algorithm function

export default function ShipPackagePage({ route, navigation }) {
  const scrollViewRef = useRef(null);
  const estimatesSectionRef = useRef(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [shippingEstimates, setShippingEstimates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [packageDetails, setPackageDetails] = useState({
    weight: '',
  });
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');

  useEffect(() => {
    if (route.params?.package) {
      setSelectedPackage(route.params.package);
      if (route.params.package.weight) {
        setPackageDetails(prev => ({
          ...prev,
          weight: route.params.package.weight.toString(),
        }));
      }
    }
  }, [route.params]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateZipCode = (zip) => {
    return /^\d{5}$/.test(zip);
  };

  const handleGetEstimates = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'No package selected');
      return;
    }
    if (!packageDetails.weight) {
      Alert.alert('Error', 'Please enter package weight');
      return;
    }
    if (!validateZipCode(fromZip) || !validateZipCode(toZip)) {
      Alert.alert('Error', 'Please enter valid ZIP codes (5 digits)');
      return;
    }

    setIsLoading(true);
    try {
      // Create itemList for packing algorithm
      const itemList = selectedPackage.items.flatMap(item =>
        Array(item.quantity || 1).fill().map(() => [
          item.itemLength,
          item.itemWidth,
          item.itemHeight,
          item.id,
          'UPS',
          item.itemName || 'Unnamed Item'
        ])
      );

      // Get optimal box dimensions using packing algorithm
      const packedResult = pack(itemList, 'UPS');
      const dimensions = {
        length: packedResult.x,
        width: packedResult.y,
        height: packedResult.z
      };

      const result = await getShippingEstimates(
        {
          ...packageDetails,
          ...dimensions
        },
        fromZip,
        toZip
      );

      if (result.success) {
        setShippingEstimates(result.estimates);
        setTimeout(() => {
          if (estimatesSectionRef.current) {
            estimatesSectionRef.current.measureLayout(
              scrollViewRef.current,
              (x, y) => {
                scrollViewRef.current?.scrollTo({ y: y, animated: true });
              }
            );
          }
        }, 100);
      } else {
        Alert.alert('Error', result.error || 'Failed to get shipping estimates');
      }
    } catch (error) {
      console.error('Error getting shipping estimates:', error);
      Alert.alert('Error', 'Failed to get shipping estimates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePackageDimensions = (items) => {
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    items.forEach(item => {
      maxLength = Math.max(maxLength, item.itemLength || 0);
      maxWidth = Math.max(maxWidth, item.itemWidth || 0);
      maxHeight = Math.max(maxHeight, item.itemHeight || 0);
    });

    return {
      length: maxLength,
      width: maxWidth,
      height: maxHeight
    };
  };

  const renderEstimates = () => {
    if (isLoading) {
      return (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.messageText}>Getting shipping estimates...</Text>
        </View>
      );
    }

    if (shippingEstimates.length > 0) {
      return (
        <View style={styles.estimatesContainer} ref={estimatesSectionRef}>
          <Text style={styles.sectionTitle}>Shipping Estimates</Text>
          <View style={styles.estimatesList}>
            {shippingEstimates.map((estimate, index) => (
              <View key={index} style={styles.estimateCard}>
                <View style={styles.estimateHeader}>
                  <Text style={styles.carrierName}>{estimate.carrier}</Text>
                  <Text style={styles.estimatePrice}>${estimate.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.serviceType}>{estimate.service}</Text>
                <Text style={styles.estimatedDays}>
                  Estimated delivery: {estimate.estimatedDays} {estimate.estimatedDays === 1 ? 'day' : 'days'}
                  {estimate.isEstimate && ' (estimated)'}
                </Text>
                {estimate.dimensions && (
                  <Text style={styles.boxDimensions}>
                    Box: {estimate.dimensions.boxType} ({Math.ceil(estimate.dimensions.length)}" × {Math.ceil(estimate.dimensions.width)}" × {Math.ceil(estimate.dimensions.height)}")
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {selectedPackage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Package Details</Text>
              <Text style={styles.packageName}>{selectedPackage.name}</Text>
              <Text style={styles.itemCount}>
                Items: {selectedPackage.items.length}
              </Text>
              
              <View style={styles.weightInput}>
                <Text style={styles.label}>Weight (lbs) *</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={(text) => 
                    setPackageDetails(prev => ({ ...prev, weight: text }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Enter package weight"
                  placeholderTextColor="#64748b"
                  returnKeyType="next"
                />
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>
            <View style={styles.zipContainer}>
              <View style={styles.zipInput}>
                <Text style={styles.label}>From ZIP Code *</Text>
                <TextInput
                  style={styles.input}
                  value={fromZip}
                  onChangeText={setFromZip}
                  placeholder="From ZIP"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  maxLength={5}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.zipInput}>
                <Text style={styles.label}>To ZIP Code *</Text>
                <TextInput
                  style={styles.input}
                  value={toZip}
                  onChangeText={setToZip}
                  placeholder="To ZIP"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  maxLength={5}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.calculateButton}
            onPress={handleGetEstimates}
          >
            <Ionicons name="calculator-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.calculateButtonText}>
              Calculate Shipping Rates
            </Text>
          </TouchableOpacity>

          {renderEstimates()}
          
          {/* Add extra padding at the bottom */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  content: {
    gap: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  weightInput: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1e293b',
  },
  zipContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  zipInput: {
    flex: 1,
  },
  messageContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  messageText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
  estimatesContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  estimatesList: {
    gap: 12,
  },
  estimateCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carrierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  estimatePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  serviceType: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  estimatedDays: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  boxDimensions: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic'
  },
  calculateButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
