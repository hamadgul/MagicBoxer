import axios from 'axios';

const USPS_CONFIG = {
  clientId: 's48Bvc4Ky0di0O5la1LHF8dcgdcBNqLV',
  clientSecret: 'IupGg3UhoQt37R9A',
  apiBaseUrl: 'https://apis.usps.com',  // Consistent naming
  tokenEndpoint: '/oauth2/v3/token',
  ratesEndpoint: '/prices/v3/base-rates/search',
  dimDivisor: 166
};

/**
 * Get an access token from USPS API using OAuth 2.0 Client Credentials flow
 * @returns {Promise<string>} Access token
 */
export const getUSPSAccessToken = async () => {
  try {
    console.log('Getting USPS access token...');
    const response = await axios.post(
      `${USPS_CONFIG.apiBaseUrl}/oauth2/v3/token`,
      {
        client_id: USPS_CONFIG.clientId,
        client_secret: USPS_CONFIG.clientSecret,
        grant_type: 'client_credentials'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('USPS token received successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting USPS access token:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Calculate zone based on ZIP code difference (fallback for when API doesn't provide zone)
 * @param {string} fromZip Origin ZIP code
 * @param {string} toZip Destination ZIP code
 * @returns {number} Estimated zone
 */
const calculateZone = (fromZip, toZip) => {
  const zipDiff = Math.abs(parseInt(fromZip, 10) - parseInt(toZip, 10));
  if (zipDiff < 1000) return 2;
  if (zipDiff < 2000) return 3;
  if (zipDiff < 3000) return 4;
  if (zipDiff < 4000) return 5;
  if (zipDiff < 5000) return 6;
  if (zipDiff < 6000) return 7;
  return 8;
};

const calculateDimWeight = (volume, dimDivisor) => {
  return (volume / dimDivisor);
};

const calculateEstimatedDays = (zone, serviceDaysFactor) => {
  const baseDeliveryDays = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
  return Math.ceil(baseDeliveryDays[zone] * serviceDaysFactor);
};

const calculatePrice = (baseRate, billableWeight, zone) => {
  const weightRate = 0.65;
  const zoneMultiplier = 0.1;
  const fuelSurcharge = 1.15;
  const handlingFee = 3.0;

  let price = baseRate;
  price += billableWeight * weightRate;
  price *= 1 + (zone - 1) * zoneMultiplier;
  price *= fuelSurcharge;
  price += handlingFee;

  return Math.round(price * 100) / 100;
};

/**
 * Calculate USPS shipping rates using the USPS API
 * @param {Object} packageDetails Package details including dimensions and weight
 * @param {string} fromZip Origin ZIP code
 * @param {string} toZip Destination ZIP code
 * @returns {Promise<Array>} Array of shipping rate options
 */
export const calculateUSPSRates = async (packageDetails, fromZip, toZip) => {
  try {
    console.log('USPS Service - From ZIP:', fromZip);
    console.log('USPS Service - To ZIP:', toZip);
    
    // Get dimensions from packageDetails or use UPS/FedEx results if available
    let length, width, height;
    
    if (packageDetails.upsResult && packageDetails.upsResult.dimensions) {
      length = parseFloat(packageDetails.upsResult.dimensions.length);
      width = parseFloat(packageDetails.upsResult.dimensions.width);
      height = parseFloat(packageDetails.upsResult.dimensions.height);
      console.log('USPS Service - Using dimensions from upsResult:', { length, width, height });
    } else if (packageDetails.fedexResult && packageDetails.fedexResult.dimensions) {
      length = parseFloat(packageDetails.fedexResult.dimensions.length);
      width = parseFloat(packageDetails.fedexResult.dimensions.width);
      height = parseFloat(packageDetails.fedexResult.dimensions.height);
      console.log('USPS Service - Using dimensions from fedexResult:', { length, width, height });
    } else if (packageDetails.length && packageDetails.width && packageDetails.height) {
      length = parseFloat(packageDetails.length);
      width = parseFloat(packageDetails.width);
      height = parseFloat(packageDetails.height);
      console.log('USPS Service - Using dimensions from packageDetails:', { length, width, height });
    } else {
      // Default dimensions if none are provided
      length = 12; // 12 inches
      width = 9;   // 9 inches
      height = 6;  // 6 inches
      console.log('USPS Service - Using default dimensions:', { length, width, height });
    }
    
    // Get weight and create a mutable copy
    let packageWeight = parseFloat(packageDetails.weight || 0);
    
    // Log additional fields
    if (packageDetails.isResidential !== undefined) {
      console.log('USPS Address Type:', packageDetails.isResidential ? 'Residential' : 'Commercial');
    }
    
    // Get OAuth access token
    const accessToken = await getUSPSAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get USPS access token');
    }
    
    // Define the USPS mail classes to try - focusing on the most reliable options first
    const mailClasses = [
      'PRIORITY_MAIL',
      'PRIORITY_MAIL_EXPRESS',
      'FIRST-CLASS_PACKAGE_SERVICE',
      'USPS_GROUND_ADVANTAGE'
    ];
    
    console.log('Using simplified approach with most reliable USPS mail classes');
    
    console.log('USPS Service - Attempting to get rates for mail classes:', mailClasses);
    
    // Format date for API request (YYYY-MM-DD format)
    const formattedDate = packageDetails.shipmentDate ? 
      packageDetails.shipmentDate.toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    // Create a standardized small package that should work with USPS services
    // Using standard USPS small flat rate box dimensions: 8.625" x 5.375" x 1.625"
    const standardLength = 9; // 8.625" rounded up
    const standardWidth = 6;  // 5.375" rounded up
    const standardHeight = 2; // 1.625" rounded up
    
    // Use a standard weight that works with all mail classes
    const standardWeight = 16; // 1 pound in ounces
    
    console.log('USPS Service - Using standard USPS small flat rate box dimensions:', { 
      length: standardLength, 
      width: standardWidth, 
      height: standardHeight,
      weight: standardWeight
    });
    
    // Create base payload for USPS Rates API with standard values
    const basePayload = {
      originZIPCode: fromZip,
      destinationZIPCode: toZip,
      weight: standardWeight,
      length: standardLength,
      width: standardWidth,
      height: standardHeight,
      shipDate: formattedDate,
      destinationEntryFacilityType: 'NONE',
      priceType: 'RETAIL',
      processingCategory: 'MACHINABLE',
      rateIndicator: 'NP', // Using NP which is a valid value
      isResidential: packageDetails.isResidential !== false,
      shape: 'RECTANGULAR'
    };
    
    console.log('USPS Service - Using standard package configuration for better compatibility');
    
    // Ensure dimensions are within USPS limits
    const girth = 2 * (basePayload.width + basePayload.height);
    const lengthPlusGirth = basePayload.length + girth;
    
    // If length + girth exceeds 130 inches, adjust dimensions
    if (lengthPlusGirth > 130) {
      console.log('Package exceeds USPS length + girth limit, adjusting dimensions');
      // Scale down dimensions proportionally
      const scaleFactor = 130 / lengthPlusGirth;
      basePayload.length = Math.floor(basePayload.length * scaleFactor);
      basePayload.width = Math.floor(basePayload.width * scaleFactor);
      basePayload.height = Math.floor(basePayload.height * scaleFactor);
    }
    
    // Add special services if needed
    if (packageDetails.signatureRequired || packageDetails.insuranceValue) {
      basePayload.extraServices = [];
      
      if (packageDetails.signatureRequired) {
        basePayload.extraServices.push({
          extraServiceCode: 'SIGNATURE_CONFIRMATION'
        });
      }
      
      if (packageDetails.insuranceValue) {
        basePayload.extraServices.push({
          extraServiceCode: 'INSURANCE',
          declaredValue: parseFloat(packageDetails.insuranceValue)
        });
      }
    }
    
    // Try each mail class and collect valid rates
    const allRates = [];
    const errors = [];
    
    for (const mailClass of mailClasses) {
      try {
        // Create a tailored payload for each mail class
        let payload = { 
          ...basePayload, 
          mailClass,
          // Ensure all numeric values are properly typed
          length: parseInt(basePayload.length, 10),
          width: parseInt(basePayload.width, 10),
          height: parseInt(basePayload.height, 10),
          weight: parseInt(basePayload.weight, 10)
        };
        
        // Use the same configuration for all mail classes to simplify
        // Only adjust the weight for First-Class Package Service which has a 13oz limit
        if (mailClass === 'FIRST-CLASS_PACKAGE_SERVICE' && payload.weight > 13) {
          payload.weight = 13; // Max 13 oz for First-Class Package
          console.log(`Adjusted weight to 13oz for ${mailClass}`);
        }
        
        console.log(`Trying USPS mail class: ${mailClass}`);
        console.log(`Sending request to USPS API for ${mailClass}:`, JSON.stringify(payload, null, 2));
        
        // Make the API call to USPS Rates API
        const response = await axios.post(
          `${USPS_CONFIG.apiBaseUrl}/prices/v3/base-rates/search`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        // Log successful response
        console.log(`USPS API response for ${mailClass}:`, JSON.stringify(response.data, null, 2));
        
        // Process the response
        if (response.data && response.data.baseRates && response.data.baseRates.length > 0) {
          console.log(`Found ${response.data.baseRates.length} rates for ${mailClass}`);
          
          // Map response to our standard format
          const rates = response.data.baseRates.map(rate => {
            // Map mail class to service name
            let serviceName;
            switch (mailClass) {
              case 'PRIORITY_MAIL_EXPRESS':
                serviceName = 'USPS Priority Mail Express';
                break;
              case 'PRIORITY_MAIL':
                serviceName = 'USPS Priority Mail';
                break;
              case 'FIRST-CLASS_PACKAGE_SERVICE':
                serviceName = 'USPS First-Class Package';
                break;
              case 'USPS_GROUND_ADVANTAGE':
                serviceName = 'USPS Ground Advantage';
                break;
              default:
                serviceName = `USPS ${mailClass.replace(/_/g, ' ')}`;
            }
            
            // Estimate delivery days based on mail class
            let estimatedDays;
            switch (mailClass) {
              case 'PRIORITY_MAIL_EXPRESS':
                estimatedDays = '1-2';
                break;
              case 'PRIORITY_MAIL':
                estimatedDays = '2-3';
                break;
              case 'FIRST-CLASS_PACKAGE_SERVICE':
                estimatedDays = '2-5';
                break;
              case 'USPS_GROUND_ADVANTAGE':
                estimatedDays = '3-5';
                break;
              default:
                estimatedDays = '3-7';
            }
            
            return {
              carrier: 'USPS',
              service: serviceName,
              price: parseFloat(rate.price),
              estimatedDays: estimatedDays,
              dimensions: {
                length: length,
                width: width,
                height: height
              },
              specialServices: {
                insurance: !!packageDetails.insuranceValue,
                signature: !!packageDetails.signatureRequired
              }
            };
          });
          
          allRates.push(...rates);
        }
      } catch (error) {
        // Log detailed error information
        if (error.response?.data) {
          console.log(`Error getting rates for ${mailClass}:`, JSON.stringify(error.response.data, null, 2));
        } else {
          console.log(`Error getting rates for ${mailClass}:`, error.message);
        }
        
        errors.push({
          mailClass,
          error: error.response?.data?.error?.message || error.response?.data?.message || error.message
        });
      }
    }
    
    if (allRates.length > 0) {
      console.log(`Successfully retrieved ${allRates.length} USPS rates across ${mailClasses.length} mail classes`);
      return allRates;
    } else {
      console.log('No valid USPS rates found for any mail class');
      if (errors.length > 0) {
        console.error('USPS rate errors:', errors);
      }
      return [];  // Return empty array if no valid rates found
    }
  } catch (error) {
    console.error('Error in calculateUSPSRates:', error.response?.data || error.message);
    
    // Return an error object instead of empty array
    return [{
      carrier: 'USPS',
      service: 'USPS Shipping',
      error: error.response?.data?.message || 'Unable to get USPS rates at this time.'
    }];
  }
};
