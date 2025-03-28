import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { getShippingEstimates } from '../services/shipping/shippingService';
import { Ionicons } from '@expo/vector-icons';
import { pack } from '../packing_algo/packing';

export default function ShipPackagePage({ route, navigation }) {
  const scrollViewRef = useRef(null);
  const estimatesSectionRef = useRef(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [shippingEstimates, setShippingEstimates] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [packageDetails, setPackageDetails] = useState({
    weight: '',
    length: '',
    width: '',
    height: ''
  });
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');

  useEffect(() => {
    if (route.params?.package) {
      setSelectedPackage(route.params.package);
      setPackageDetails(prev => ({
        ...prev,
        weight: route.params.package.weight?.toString() || '',
        length: route.params.package.length?.toString() || '',
        width: route.params.package.width?.toString() || '',
        height: route.params.package.height?.toString() || ''
      }));
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
    setErrors([]);
    setApiDebugData(null);
    
    try {
      // Create itemList for packing algorithm
      const itemList = selectedPackage.items.flatMap(item =>
        Array(item.quantity || 1).fill().map(() => [
          item.itemLength,
          item.itemWidth,
          item.itemHeight,
          item.id,
          null,
          item.itemName || 'Unnamed Item'
        ])
      );

      // Get optimal box dimensions using packing algorithm for each carrier
      const upsResult = pack(itemList, 'UPS');
      const fedexResult = pack(itemList, 'FedEx');
      
      // Get shipping estimates directly

      const result = await getShippingEstimates(
        {
          ...packageDetails,
          upsResult,
          fedexResult
        },
        fromZip,
        toZip
      );
      
      // Process shipping estimate results

      if (result.estimates && result.estimates.length > 0) {
        setShippingEstimates(result.estimates);
        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors);
        }
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
        const errorMessage = result.errors && result.errors.length > 0
          ? result.errors.map(err => `${err.carrier}: ${err.message}`).join('\n')
          : result.error || 'Failed to get shipping estimates';
        Alert.alert('Error', errorMessage);
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

  const renderEstimate = ({ item }) => {
    const isUSPSMock = item.carrier === 'USPS' && item.isMockRate;
  
    return (
      <TouchableOpacity style={styles.estimateItem}>
        <View style={styles.estimateHeader}>
          <View style={styles.carrierInfo}>
            <Text style={styles.carrierName}>{item.carrier}</Text>
            {isUSPSMock && (
              <Text style={styles.mockLabel}>(Estimated)</Text>
            )}
          </View>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.estimateDetails}>
          <Text style={styles.serviceName}>{item.service}</Text>
          <Text style={styles.deliveryTime}>
            Est. Delivery: {
              typeof item.estimatedDays === 'string' 
                ? `${item.estimatedDays} days` 
                : `${item.estimatedDays} ${item.estimatedDays === 1 ? 'day' : 'days'}`
            }
          </Text>
        </View>
      </TouchableOpacity>
    );
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
              <View key={index}>
                {renderEstimate({ item: estimate })}
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
          
          {apiDebugData && (
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={() => {
                Alert.alert(
                  'API Debug Data', 
                  'View detailed API request and response data for each carrier?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'View UPS Data', 
                      onPress: () => {
                        Alert.alert(
                          'UPS API Data',
                          JSON.stringify({
                            requests: apiDebugData.requests['UPS'] || [],
                            responses: apiDebugData.responses['UPS'] || [],
                            errors: apiDebugData.errors['UPS'] || []
                          }, null, 2)
                        );
                      }
                    },
                    { 
                      text: 'View FedEx Data', 
                      onPress: () => {
                        Alert.alert(
                          'FedEx API Data',
                          JSON.stringify({
                            requests: apiDebugData.requests['FedEx'] || [],
                            responses: apiDebugData.responses['FedEx'] || [],
                            errors: apiDebugData.errors['FedEx'] || []
                          }, null, 2)
                        );
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="bug" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.calculateButtonText}>
                Show API Debug Data
              </Text>
            </TouchableOpacity>
          )}

          {errors.length > 0 && (
            <View style={styles.errorContainer}>
              {errors.map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Ionicons name="warning" size={20} color="#ef4444" />
                  <Text style={styles.errorText}>
                    {error.carrier}: {error.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

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
  estimateItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carrierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carrierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  mockLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  estimateDetails: {
    marginTop: 4,
  },
  serviceName: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 4,
  },
  deliveryTime: {
    fontSize: 14,
    color: '#6b7280',
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
  },
  debugButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  errorText: {
    marginLeft: 8,
    color: '#b91c1c',
    flex: 1,
  },
});
