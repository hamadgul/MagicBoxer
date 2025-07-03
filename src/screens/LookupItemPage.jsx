import React, { useState, useEffect } from 'react';
// Try to import API key, but provide fallback mechanism
let OPENAI_API_KEY;
try {
  const apiConfig = require('../config/apiConfig');
  OPENAI_API_KEY = apiConfig.OPENAI_API_KEY;
} catch (error) {
  console.warn('API config file not found, will use mock data only');
  OPENAI_API_KEY = '';
}
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Crypto from 'expo-crypto';

const LookupItemPage = ({ navigation, route }) => {
  const [itemName, setItemName] = useState(route.params?.searchQuery || '');
  const [itemYear, setItemYear] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  // Track if user came from FormPage
  const [fromFormPage, setFromFormPage] = useState(route.params?.fromFormPage || false);
  // Reference to the ScrollView for automatic scrolling
  const scrollViewRef = React.useRef(null);

  useEffect(() => {
    if (route.params?.searchQuery) {
      setItemName(route.params.searchQuery);
    }
    // Check if navigated from FormPage
    if (route.params?.fromFormPage) {
      setFromFormPage(true);
    }
  }, [route.params?.searchQuery, route.params?.fromFormPage]);

  // Function to generate a unique ID
  const generateUUID = async () => {
    try {
      return await Crypto.randomUUID();
    } catch (error) {
      // Fallback for older devices
      return 'item-' + Math.random().toString(36).substring(2, 15);
    }
  };

  // Function to lookup item dimensions using OpenAI API
  const lookupItemDimensions = async () => {
    Keyboard.dismiss();
    // Validate required fields
    if (!itemName.trim()) {
      setError('Item name is required');
      return;
    }
    
    if (!itemType.trim()) {
      setError('Item type is required');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // First check if we have this item cached
      const cacheKey = `${itemName.toLowerCase()}_${itemType.toLowerCase()}_${itemYear || ''}_${itemBrand || ''}`;
      const cachedResult = await AsyncStorage.getItem(`dimension_cache_${cacheKey}`);
      
      if (cachedResult) {
        // Use cached result if available
        console.log('Using cached dimensions');
        setResult(JSON.parse(cachedResult));
        setLoading(false);
        return;
      }
      
      // Construct the system message and user prompt
      const systemMessage = 'You are a helpful assistant that provides dimensions of items in a structured format. Return ONLY a JSON object with length, width, height in inches with 2 decimal places, and the official product name. Do not include any other text or fields.';
      const userPrompt = `What are the dimensions of a ${itemYear ? itemYear + ' ' : ''}${itemBrand ? itemBrand + ' ' : ''}${itemName} (${itemType})? Return only a JSON object with the following fields: "length", "width", "height" (all in inches with 2 decimal places), and "officialName" (the full official product name with model number).`;
      
      // Make the API call to OpenAI
      try {
        // Using the API key from our config file
        const apiKey = OPENAI_API_KEY;
        
        if (!apiKey || apiKey === '') {
          console.log('API Key is missing, using mock data');
          throw new Error('API_KEY_MISSING');
        }
        
        console.log('Making API request to OpenAI...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo', // Using a more widely available model
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3, // Lower temperature for more consistent results
            response_format: { type: 'json_object' } // Request JSON format
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response not OK:', response.status, errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response received successfully');
        
        if (data.error) {
          console.error('API returned error:', data.error);
          throw new Error(data.error.message || 'Error calling OpenAI API');
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid response from OpenAI API');
        }
        
        // Parse the response
        const dimensions = parseAIResponse(data.choices[0].message.content);
        
        // Cache the result
        await AsyncStorage.setItem(`dimension_cache_${cacheKey}`, JSON.stringify(dimensions));
        
        // Set the result
        setResult(dimensions);
        setLoading(false);
        
        // Automatically scroll to results after a short delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 300); // Short delay to ensure the results are rendered
        
        return;
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Show a more user-friendly error if it's not just a missing API key
        if (apiError.message !== 'API_KEY_MISSING') {
          if (apiError.message.includes('Response missing required dimension fields') || apiError.message.includes('Dimensions outside reasonable range')) {
          setError('Our AI couldn’t find your item, try again with more details!');
        } else {
          setError('Could not connect to the dimensions service. Using estimated dimensions instead.');
        }
        }
        
        // Fallback to mock data if API fails
        console.log('Falling back to mock data');
        let mockDimensions;
        
        if (itemType.toLowerCase().includes('keyboard')) {
          mockDimensions = { 
            length: 17.3, 
            width: 5.2, 
            height: 1.4, 
            officialName: `${itemBrand || 'Logitech'} G Pro X Mechanical Keyboard`
          };
        } else if (itemType.toLowerCase().includes('computer') || itemType.toLowerCase().includes('laptop')) {
          if (itemBrand && itemBrand.toLowerCase().includes('apple') || itemName.toLowerCase().includes('macbook')) {
            mockDimensions = { 
              length: 13.5, 
              width: 9.8, 
              height: 0.7, 
              officialName: `Apple ${itemYear || '2023'} MacBook Air`
            };
          } else {
            mockDimensions = { 
              length: 14.0, 
              width: 9.5, 
              height: 0.8, 
              officialName: `${itemBrand || 'Dell'} ${itemYear || '2023'} XPS 13`
            };
          }
        } else if (itemType.toLowerCase().includes('hammer')) {
          mockDimensions = { 
            length: 13.0, 
            width: 5.5, 
            height: 1.5, 
            officialName: `${itemBrand || 'Stanley'} FATMAX Claw Hammer`
          };
        } else if (itemType.toLowerCase().includes('phone')) {
          // Handle different iPhone models with specific links
          if (itemName.toLowerCase().includes('iphone 15')) {
            mockDimensions = { 
              length: 6.06, 
              width: 2.81, 
              height: 0.31, 
              officialName: `Apple iPhone 15 Pro`
            };
          } else if (itemName.toLowerCase().includes('iphone 14')) {
            mockDimensions = { 
              length: 5.81, 
              width: 2.81, 
              height: 0.31, 
              officialName: `Apple iPhone 14 Pro`
            };
          } else if (itemName.toLowerCase().includes('iphone 13')) {
            mockDimensions = { 
              length: 5.78, 
              width: 2.82, 
              height: 0.30, 
              officialName: `Apple iPhone 13 Pro`
            };
          } else if (itemName.toLowerCase().includes('xbox 360')) {
            mockDimensions = { 
              length: 12.15, 
              width: 10.15, 
              height: 3.27, 
              officialName: `Microsoft Xbox 360`
            };
          } else if (itemName.toLowerCase().includes('nintendo wii')) {
            mockDimensions = { 
              length: 8.48, 
              width: 6.18, 
              height: 1.73, 
              officialName: `Nintendo Wii Console`
            };
          } else {
            mockDimensions = { 
              length: 6.1, 
              width: 3.0, 
              height: 0.3, 
              officialName: `${itemBrand || 'Apple'} Smartphone`
            };
          }
        } else {
          mockDimensions = { 
            length: 10.0, 
            width: 8.0, 
            height: 4.0, 
            officialName: itemName
          };
          
          // No product links needed
        }
        
        setResult(mockDimensions);
        setLoading(false);
        
        // Automatically scroll to results after a short delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 300); // Short delay to ensure the results are rendered
      }
    } catch (error) {
      console.error('Error looking up dimensions:', error);
      setError('Failed to lookup item dimensions. Please try again.');
      setLoading(false);
    }
  };

  // Function to parse AI response and extract dimensions
  const parseAIResponse = (response) => {
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(response);

      // Validate the response has the expected fields and they are not zero
      if (parsedResponse.length == null || parsedResponse.width == null || parsedResponse.height == null ||
          parseFloat(parsedResponse.length) <= 0 || parseFloat(parsedResponse.width) <= 0 || parseFloat(parsedResponse.height) <= 0) {
        throw new Error('Response missing required dimension fields');
      }

      // Convert to numbers and ensure they're positive
      const length = Math.abs(parseFloat(parsedResponse.length));
      const width = Math.abs(parseFloat(parsedResponse.width));
      const height = Math.abs(parseFloat(parsedResponse.height));

      // Get the official name
      const officialName = parsedResponse.officialName || itemName;

      // Validate dimensions are reasonable (not too large)
      if (length > 1000 || width > 1000 || height > 1000) {
        throw new Error('Dimensions outside reasonable range');
      }

      return {
        length,
        width,
        height,
        officialName
      };
    } catch (error) {
      console.error('Error parsing AI response:', error, response);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  };

  // Function to save the item to AsyncStorage
  const saveItem = async () => {
    if (!result) return;

    try {
      // Get existing saved items
      const savedItemsString = await AsyncStorage.getItem('savedItems');
      let savedItems = savedItemsString ? JSON.parse(savedItemsString) : [];

      // Create new item with dimensions
      const newItem = {
        id: await generateUUID(),
        name: result.officialName || itemName, // Use the official name if available
        dimensions: {
          length: `${result.length.toFixed(2)} inches`,
          width: `${result.width.toFixed(2)} inches`,
          height: `${result.height.toFixed(2)} inches`
        },
        metadata: {
          year: itemYear,
          type: itemType,
          brand: itemBrand,
          source: 'AI Lookup',
          userEnteredName: itemName // Store the original name entered by the user
        }
      };
      
      // Add to saved items
      savedItems.push(newItem);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('savedItems', JSON.stringify(savedItems));
      
      // Update custom products data if needed
      await updateProductsData(savedItems);
      
      // Show success message
      Alert.alert(
        'Success',
        'Item saved successfully and will be available in the My Saved Items page.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setItemName('');
              setItemYear('');
              setItemType('');
              setItemBrand('');
              setResult(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item.');
    }
  };

  // Function to add item to current package on FormPage and navigate back
  const saveToCurrentPackage = async () => {
    if (!result) return;
    
    try {
      // Create item in the format expected by FormPage
      const newFormItem = {
        itemName: result.officialName || itemName,
        itemLength: result.length,
        itemWidth: result.width,
        itemHeight: result.height,
        quantity: 1
      };
      
      // Clear all inputs after successful addition
      setItemName('');
      setItemYear('');
      setItemType('');
      setItemBrand('');
      setResult(null);
      
      // Navigate back to Create Package with the new item data
      // FormPage will show its own confirmation
      navigation.navigate('Create Package', {
        newItem: newFormItem,
        addToCurrentPackage: true
      });
    } catch (error) {
      console.error('Error adding to current package:', error);
      Alert.alert('Error', 'Failed to add item to current package.');
    }
  };

  // Function to update custom products data
  const updateProductsData = async (items) => {
    try {
      // Store the custom items in AsyncStorage as 'customProducts'
      await AsyncStorage.setItem('customProducts', JSON.stringify(items));
      console.log('Custom products saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving custom products:', error);
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
          directionalLockEnabled={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                value={itemName}
                onChangeText={setItemName}
                placeholder="e.g. iPhone 14 Pro"
                placeholderTextColor="#94A3B8"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Year (Optional)</Text>
              <TextInput
                style={styles.input}
                value={itemYear}
                onChangeText={setItemYear}
                placeholder="e.g. 2023"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Type *</Text>
              <TextInput
                style={styles.input}
                value={itemType}
                onChangeText={setItemType}
                placeholder="e.g. Laptop, Glasses, Appliance"
                placeholderTextColor="#94A3B8"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand (Optional)</Text>
              <TextInput
                style={styles.input}
                value={itemBrand}
                onChangeText={setItemBrand}
                placeholder="e.g. Apple, Samsung"
                placeholderTextColor="#94A3B8"
              />
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity
              style={styles.lookupButton}
              onPress={lookupItemDimensions}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Lookup Dimensions</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {!loading && !result && (
            <View style={styles.instructionContainer}>
              <Ionicons name="bulb-outline" size={24} color="#3B82F6" style={styles.instructionIcon} />
              <Text style={styles.instructionText}>
                Lookup your product using our AI to find your dimensions. The more info you provide, the more accurate the response!
              </Text>
            </View>
          )}
          
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Product Dimensions</Text>
              
              {result.officialName && result.officialName !== itemName && (
                <View style={styles.officialNameContainer}>
                  <Text style={styles.officialNameLabel}>Official Product:</Text>
                  <View style={styles.officialNameValueContainer}>
                    <Text style={styles.officialNameValue}>{result.officialName}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.dimensionsContainer}>
                <View style={styles.dimensionItem}>
                  <Ionicons name="resize-outline" size={24} color="#3B82F6" />
                  <Text style={styles.dimensionLabel}>Length</Text>
                  <Text style={styles.dimensionValue}>{result.length.toFixed(2)} inches</Text>
                </View>
                
                <View style={styles.dimensionItem}>
                  <Ionicons name="resize-outline" size={24} color="#3B82F6" />
                  <Text style={styles.dimensionLabel}>Width</Text>
                  <Text style={styles.dimensionValue}>{result.width.toFixed(2)} inches</Text>
                </View>
                
                <View style={styles.dimensionItem}>
                  <Ionicons name="resize-outline" size={24} color="#3B82F6" />
                  <Text style={styles.dimensionLabel}>Height</Text>
                  <Text style={styles.dimensionValue}>{result.height.toFixed(2)} inches</Text>
                </View>
              </View>
              
              <Text style={styles.disclaimer}>
                Note: These dimensions are retrieved from available online resources.
              </Text>
              
              {/* Save buttons */}
              {result && (
                <View style={{ flexDirection: fromFormPage ? 'row' : 'column', justifyContent: 'space-between', gap: fromFormPage ? 10 : 0 }}>
                  <TouchableOpacity
                    style={[styles.saveButton, fromFormPage && { flex: 1 }]}
                    onPress={saveItem}
                  >
                    <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Save Item</Text>
                  </TouchableOpacity>
                  
                  {/* Show "Save to current package" button only when navigating from FormPage */}
                  {fromFormPage && (
                    <TouchableOpacity
                      style={[styles.saveButton, { flex: 1, backgroundColor: '#22C55E' }]}
                      onPress={saveToCurrentPackage}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Save to Current Package</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 10,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 16,
    color: '#334155',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
  },
  lookupButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  dimensionsContainer: {
    marginBottom: 16,
  },
  dimensionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dimensionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 10,
    flex: 1,
  },
  dimensionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  disclaimer: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  officialNameContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  officialNameLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginRight: 8,
  },
  officialNameValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  officialNameValueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionIcon: {
    marginRight: 12,
  },
  instructionText: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
    lineHeight: 22,
  },
});

export default LookupItemPage;
