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
  Keyboard,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [showUnavailableOptions, setShowUnavailableOptions] = useState(false);
  const [showSavingsInfo, setShowSavingsInfo] = useState(false);
  const [packageDetails, setPackageDetails] = useState({
    weight: '',
    length: '',
    width: '',
    height: ''
  });
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [shipmentDate, setShipmentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  
  // New optional fields
  const [isResidential, setIsResidential] = useState(true);
  const [insuranceValue, setInsuranceValue] = useState('');
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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

  // Format date for display
  useEffect(() => {
    const formatDate = (date) => {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };
    setFormattedDate(formatDate(shipmentDate));
  }, [shipmentDate]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setShipmentDate(selectedDate);
    }
  };

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
      const uspsResult = pack(itemList, 'USPS');
      
      // Detailed logging for packing results
      console.log('UPS packing result:', JSON.stringify(upsResult, null, 2));
      console.log('FedEx packing result:', JSON.stringify(fedexResult, null, 2));
      console.log('USPS packing result:', JSON.stringify(uspsResult, null, 2));
      
      // Get shipping estimates directly

      const result = await getShippingEstimates(
        {
          ...packageDetails,
          upsResult,
          fedexResult,
          uspsResult,
          shipmentDate: shipmentDate,
          isResidential: isResidential,
          insuranceValue: insuranceValue ? parseFloat(insuranceValue) : undefined,
          signatureRequired: signatureRequired
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
    // Check if this is an error entry
    const hasError = item.error !== undefined;
    const isUSPSMock = item.carrier === 'USPS' && item.isMockRate;

    // Format dimensions for display
    const dimensions = item.dimensions || {};
    let formattedDimensions;
    if (item.carrier === 'USPS' && dimensions.originalDimensions) {
      // Show the actual dimensions used for the API request
      formattedDimensions = dimensions.length && dimensions.width && dimensions.height
        ? `${dimensions.length}" × ${dimensions.width}" × ${dimensions.height}"`
        : 'Dimensions not available';
        
      // Log both sets of dimensions for debugging
      console.log('USPS shipping card - API dimensions:', { length: dimensions.length, width: dimensions.width, height: dimensions.height });
      console.log('USPS shipping card - Original packing dimensions:', dimensions.originalDimensions);
    } else {
      // For other carriers or if no original dimensions, just show the dimensions
      formattedDimensions = dimensions.length && dimensions.width && dimensions.height
        ? `${dimensions.length}" × ${dimensions.width}" × ${dimensions.height}"`
        : 'Dimensions not available';
    }

    // Determine if box is provided by carrier or customer using isCarrierBox flag
    let isCarrierBox = item.isCarrierBox;
    let boxTypeLabel = 'Customer Box';
    
    // Check if this estimate has both packaging options available
    const hasBothOptions = item.bothPackagingOptions === true;
    
    // Debug log to check if bothPackagingOptions is being set correctly
    if (item.bothPackagingOptions) {
      console.log(`Found item with both packaging options: ${item.carrier} ${item.service}`);
    }

    if (isCarrierBox === undefined && !hasBothOptions) {
      // Fall back to checking box type if isCarrierBox flag is not available
      if (item.carrier === 'UPS') {
        // UPS packaging codes: 21-25 are UPS boxes, 02 is customer packaging
        if (dimensions.boxType && dimensions.boxType.includes('UPS')) {
          isCarrierBox = true;
        }
      } else if (item.carrier === 'FedEx') {
        // FedEx boxes have specific types
        const fedExBoxTypes = ['FEDEX_SMALL_BOX', 'FEDEX_MEDIUM_BOX', 'FEDEX_LARGE_BOX', 'FEDEX_EXTRA_LARGE_BOX'];
        if (dimensions.boxType && (fedExBoxTypes.includes(dimensions.boxType) || dimensions.boxType.includes('FedEx'))) {
          isCarrierBox = true;
        }
      } else if (item.carrier === 'USPS') {
        // USPS boxes have specific types
        if (dimensions.boxType && dimensions.boxType.includes('USPS')) {
          isCarrierBox = true;
        }
      }
    }

    // Set box type label based on carrier and isCarrierBox flag
    if (hasBothOptions) {
      boxTypeLabel = 'Both packaging options available';
    } else if (isCarrierBox) {
      if (item.carrier === 'UPS') {
        // Format UPS box type
        if (dimensions.boxType === '21') boxTypeLabel = 'Carrier Provides: UPS Express Box - Small';
        else if (dimensions.boxType === '22') boxTypeLabel = 'Carrier Provides: UPS Express Box - Medium';
        else if (dimensions.boxType === '23') boxTypeLabel = 'Carrier Provides: UPS Express Box - Large';
        else if (dimensions.boxType === '24') boxTypeLabel = 'Carrier Provides: UPS Express Box';
        else if (dimensions.boxType === '25') boxTypeLabel = 'Carrier Provides: UPS Express Tube';
        else boxTypeLabel = 'Carrier Provides: UPS Box';
      } else if (item.carrier === 'FedEx') {
        // Format FedEx box type
        if (dimensions.boxType === 'FEDEX_SMALL_BOX') boxTypeLabel = 'Carrier Provides: FedEx Small Box';
        else if (dimensions.boxType === 'FEDEX_MEDIUM_BOX') boxTypeLabel = 'Carrier Provides: FedEx Medium Box';
        else if (dimensions.boxType === 'FEDEX_LARGE_BOX') boxTypeLabel = 'Carrier Provides: FedEx Large Box';
        else if (dimensions.boxType === 'FEDEX_EXTRA_LARGE_BOX') boxTypeLabel = 'Carrier Provides: FedEx Extra Large Box';
        else boxTypeLabel = 'Carrier Provides: FedEx Box';
      } else if (item.carrier === 'USPS') {
        boxTypeLabel = 'Carrier Provides: USPS Box';
      }
    }

    // For consolidated estimates with both options, get the carrier box type
    if (hasBothOptions && item.carrierBoxType) {
      // Format carrier box type for display
      let carrierBoxTypeDisplay = item.carrierBoxType;
      
      if (item.carrier === 'FedEx') {
        if (item.carrierBoxType === 'FEDEX_SMALL_BOX') carrierBoxTypeDisplay = 'FedEx Small Box';
        else if (item.carrierBoxType === 'FEDEX_MEDIUM_BOX') carrierBoxTypeDisplay = 'FedEx Medium Box';
        else if (item.carrierBoxType === 'FEDEX_LARGE_BOX') carrierBoxTypeDisplay = 'FedEx Large Box';
        else if (item.carrierBoxType === 'FEDEX_EXTRA_LARGE_BOX') carrierBoxTypeDisplay = 'FedEx Extra Large Box';
      } else if (item.carrier === 'UPS') {
        if (item.carrierBoxType === '21') carrierBoxTypeDisplay = 'UPS Express Box - Small';
        else if (item.carrierBoxType === '22') carrierBoxTypeDisplay = 'UPS Express Box - Medium';
        else if (item.carrierBoxType === '23') carrierBoxTypeDisplay = 'UPS Express Box - Large';
        else if (item.carrierBoxType === '24') carrierBoxTypeDisplay = 'UPS Express Box';
        else if (item.carrierBoxType === '25') carrierBoxTypeDisplay = 'UPS Express Tube';
      }
      
      boxTypeLabel = `Options: Your box or ${carrierBoxTypeDisplay}`;
    }

    return (
      <TouchableOpacity 
        style={[styles.estimateItem, hasError && styles.errorEstimateItem]} 
        disabled={hasError}
      >
        <View style={styles.estimateHeader}>
          <View style={styles.carrierInfo}>
            <Text style={styles.carrierName}>{item.carrier}</Text>
            {isUSPSMock && (
              <Text style={styles.mockLabel}>(Estimated)</Text>
            )}
          </View>
          {!hasError ? (
            <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
          ) : (
            <Text style={styles.unavailableText}>Unavailable</Text>
          )}
        </View>
        
        <View style={styles.estimateDetails}>
          <Text style={styles.serviceName}>{item.service}</Text>
          {!hasError ? (
            <Text style={styles.deliveryTime}>
              Est. Delivery: {typeof item.estimatedDays === 'string' 
                ? item.estimatedDays
                : `${item.estimatedDays} ${item.estimatedDays === 1 ? 'day' : 'days'}`}
            </Text>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" style={styles.errorIcon} />
              <Text style={styles.errorText}>
                {item.carrier === 'UPS' && item.error.includes('Package Type is unavailable') 
                  ? `This service is only available with your own packaging` 
                  : item.error}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.boxInfoContainer}>
          <View style={[styles.boxTypeTag, 
            hasBothOptions ? styles.bothOptionsTag : (isCarrierBox ? styles.carrierBoxTag : styles.customerBoxTag)
          ]}>
            <Text style={[styles.boxTypeText, hasBothOptions && styles.bothOptionsText]}>{boxTypeLabel}</Text>
          </View>
          
          {/* Show savings information for all estimates with both packaging options */}
          {item.bothPackagingOptions && (
            <TouchableOpacity 
              style={styles.savingsTag}
              onPress={() => {
                Alert.alert(
                  'Packaging Options Comparison',
                  `Using carrier-provided packaging typically saves 10-15% compared to your own packaging. Carrier boxes are pre-approved for their services and may qualify for special rates. Actual savings may vary by service and destination.`,
                  [{ text: 'Got it', style: 'default' }]
                );
              }}
            >
              <Text style={styles.savingsText}>
                Save $3-$5
              </Text>
              <Ionicons name="information-circle" size={12} color="white" style={{marginLeft: 2}} />
            </TouchableOpacity>
          )}
          
          {/* Show traditional savings message for non-consolidated carrier box estimates */}
          {!hasBothOptions && isCarrierBox && (
            <TouchableOpacity 
              style={styles.savingsTag}
              onPress={() => {
                Alert.alert(
                  'Carrier Box Savings',
                  'Using carrier-provided packaging typically saves 10-15% compared to your own packaging. Carrier boxes are pre-approved for their services and may qualify for special rates. Actual savings may vary by service and destination.',
                  [{ text: 'Got it', style: 'default' }]
                );
              }}
            >
              <Text style={styles.savingsText}>
                Save ${Math.round(item.price * 0.10)}-${Math.round(item.price * 0.15)}
              </Text>
              <Ionicons name="information-circle" size={12} color="white" style={{marginLeft: 2}} />
            </TouchableOpacity>
          )}
          
          <View style={styles.boxInfoItem}>
            <Ionicons name="cube-outline" size={16} color="#64748B" />
            <Text style={styles.boxInfoText}>{formattedDimensions}</Text>
          </View>
          
          {/* Original 3D packing dimensions removed as requested */}
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
      // Count how many unavailable options exist
      const unavailableOptions = shippingEstimates.filter(estimate => estimate.error).length;
      
      // Filter estimates based on showUnavailableOptions state
      const filteredEstimates = showUnavailableOptions 
        ? shippingEstimates 
        : shippingEstimates.filter(estimate => !estimate.error);
      
      return (
        <View style={styles.estimatesContainer} ref={estimatesSectionRef}>
          <View style={styles.estimatesHeader}>
            <Text style={styles.sectionTitle}>Shipping Estimates</Text>
          </View>
          {unavailableOptions > 0 && (
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setShowUnavailableOptions(!showUnavailableOptions)}
            >
              <Text style={styles.toggleButtonText}>
                {showUnavailableOptions ? 'Hide Unavailable Options' : `Show ${unavailableOptions} Unavailable Options`}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.estimatesList}>
            {filteredEstimates.map((estimate, index) => (
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
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.label}>Shipment Date *</Text>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={shipmentDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
            
            {/* Residential/Commercial Address Selection - Required */}
            <View style={styles.addressTypeContainer}>
              <Text style={styles.label}>Address Type *</Text>
              <View style={styles.addressTypeOptions}>
                <TouchableOpacity 
                  style={[styles.addressTypeOption, isResidential && styles.selectedAddressType]}
                  onPress={() => setIsResidential(true)}
                >
                  <Ionicons 
                    name={isResidential ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={isResidential ? "#3b82f6" : "#64748b"} 
                  />
                  <Text style={[styles.addressTypeText, isResidential && styles.selectedAddressTypeText]}>Residential</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.addressTypeOption, !isResidential && styles.selectedAddressType]}
                  onPress={() => setIsResidential(false)}
                >
                  <Ionicons 
                    name={!isResidential ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={!isResidential ? "#3b82f6" : "#64748b"} 
                  />
                  <Text style={[styles.addressTypeText, !isResidential && styles.selectedAddressTypeText]}>Commercial</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Advanced Options Toggle */}
            <TouchableOpacity 
              style={styles.advancedOptionsToggle}
              onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <Text style={styles.advancedOptionsText}>Advanced Options</Text>
              <Ionicons 
                name={showAdvancedOptions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
            
            {/* Advanced Options Section */}
            {showAdvancedOptions && (
              <View style={styles.advancedOptionsContainer}>
                <View style={styles.advancedOption}>
                  <Text style={styles.label}>Declared Value/Insurance ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={insuranceValue}
                    onChangeText={setInsuranceValue}
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    keyboardType="decimal-pad"
                  />
                </View>
                
                <View style={styles.advancedOption}>
                  <Text style={styles.label}>Delivery Options</Text>
                  <TouchableOpacity 
                    style={styles.signatureOption}
                    onPress={() => setSignatureRequired(!signatureRequired)}
                  >
                    <Ionicons 
                      name={signatureRequired ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={signatureRequired ? "#3b82f6" : "#64748b"} 
                    />
                    <Text style={styles.signatureText}>Signature Required</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
          
          {/* Debug button removed to fix ReferenceError with apiDebugData */}

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
  errorEstimateItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  unavailableText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  errorIcon: {
    marginRight: 6,
  },
  estimatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  toggleButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
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
    marginBottom: 8,
  },
  boxInfoContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  boxTypeContainer: {
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  boxInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  boxInfoText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  boxTypeTag: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  customerBoxTag: {
    backgroundColor: '#e2e8f0',
  },
  carrierBoxTag: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  bothOptionsTag: {
    backgroundColor: '#818cf8', // Indigo-400 - more visible background
    borderWidth: 1,
    borderColor: '#4f46e5', // Indigo-600 - stronger border
    paddingHorizontal: 8, // Add more padding for better visibility
  },
  boxTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  bothOptionsText: {
    color: '#ffffff', // White text for better contrast on darker background
    fontWeight: '600',
  },
  savingsTag: {
    backgroundColor: '#10b981',
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  datePickerContainer: {
    marginTop: 16,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  dateText: {
    color: '#1e293b',
    fontSize: 16,
  },
  addressTypeContainer: {
    marginTop: 16,
  },
  addressTypeOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  addressTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 12,
  },
  selectedAddressType: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  addressTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  selectedAddressTypeText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  advancedOptionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  advancedOptionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  advancedOptionsContainer: {
    marginTop: 16,
  },
  advancedOption: {
    marginBottom: 16,
  },
  signatureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  signatureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
  },
});
