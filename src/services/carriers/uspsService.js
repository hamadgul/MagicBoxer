import axios from 'axios';

const USPS_CONFIG = {
  clientId: 's48Bvc4Ky0di0O5la1LHF8dcgdcBNqLV',
  clientSecret: 'IupGg3UhoQt37R9A',
  apiBaseUrl: 'https://apis.usps.com',
  tokenEndpoint: '/oauth2/v3/token',
  ratesEndpoint: '/prices/v3/base-rates/search',
  dimDivisor: 166
};

// USPS Mail Class Constants
const USPS_MAIL_CLASSES = {
  PRIORITY_MAIL: 'PRIORITY_MAIL',
  PRIORITY_MAIL_EXPRESS: 'PRIORITY_MAIL_EXPRESS',
  FIRST_CLASS_PACKAGE: 'FIRST-CLASS_PACKAGE_SERVICE',
  GROUND_ADVANTAGE: 'USPS_GROUND_ADVANTAGE'
};

// USPS Container Types
const CONTAINER_TYPES = {
  VARIABLE: 'VARIABLE',
  FLAT_RATE_ENVELOPE: 'FLAT_RATE_ENVELOPE',
  FLAT_RATE_LEGAL_ENVELOPE: 'FLAT_RATE_LEGAL_ENVELOPE',
  FLAT_RATE_PADDED_ENVELOPE: 'FLAT_RATE_PADDED_ENVELOPE',
  SM_FLAT_RATE_BOX: 'SM_FLAT_RATE_BOX',
  MD_FLAT_RATE_BOX: 'MD_FLAT_RATE_BOX',
  LG_FLAT_RATE_BOX: 'LG_FLAT_RATE_BOX',
  REGIONAL_RATE_BOX_A: 'REGIONAL_RATE_BOX_A',
  REGIONAL_RATE_BOX_B: 'REGIONAL_RATE_BOX_B'
};

// USPS Processing Categories
const PROCESSING_CATEGORIES = {
  MACHINABLE: 'MACHINABLE',
  IRREGULAR: 'IRREGULAR',
  NONMACHINABLE: 'NONMACHINABLE'
};

// USPS Content Types
const CONTENT_TYPES = {
  HAZMAT: 'HAZMAT',
  LIVES: 'LIVES',
  PERISHABLE: 'PERISHABLE',
  FRAGILE: 'FRAGILE',
  MERCHANDISE: 'MERCHANDISE'
};

// USPS Extra Services
const EXTRA_SERVICES = {
  SIGNATURE_CONFIRMATION: 'SIGNATURE_CONFIRMATION',
  INSURANCE: 'INSURANCE',
  REGISTERED_MAIL: 'REGISTERED_MAIL',
  CERTIFIED_MAIL: 'CERTIFIED_MAIL',
  RETURN_RECEIPT: 'RETURN_RECEIPT'
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

/**
 * Calculate dimensional weight based on volume and dimensional divisor
 * @param {number} volume Volume in cubic inches
 * @param {number} dimDivisor Dimensional divisor (166 for USPS)
 * @returns {number} Dimensional weight in pounds
 */
const calculateDimWeight = (volume, dimDivisor) => {
  return (volume / dimDivisor);
};

/**
 * Calculate estimated delivery days based on zone and service type
 * @param {number} zone Shipping zone
 * @param {number} serviceDaysFactor Factor to adjust delivery days by service type
 * @returns {number} Estimated delivery days
 */
const calculateEstimatedDays = (zone, serviceDaysFactor) => {
  const baseDeliveryDays = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
  return Math.ceil(baseDeliveryDays[zone] * serviceDaysFactor);
};

/**
 * Calculate shipping price based on base rate, weight, and zone
 * @param {number} baseRate Base shipping rate
 * @param {number} billableWeight Billable weight in pounds
 * @param {number} zone Shipping zone
 * @returns {number} Calculated shipping price
 */
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
 * Determine the appropriate processing category based on package dimensions
 * @param {number} length Length in inches
 * @param {number} width Width in inches
 * @param {number} height Height in inches
 * @param {number} weight Weight in ounces
 * @returns {string} Processing category value for USPS API
 */
const determineProcessingCategory = (length, width, height, weight) => {
  // Convert dimensions to ensure they are numbers
  length = parseFloat(length);
  width = parseFloat(width);
  height = parseFloat(height);
  weight = parseFloat(weight);
  
  // Sort dimensions from largest to smallest
  const dimensions = [length, width, height].sort((a, b) => b - a);
  const [longest, middle, shortest] = dimensions;
  
  // Check if it's letter-sized (based on USPS DMM standards)
  if (longest <= 11.5 && middle <= 6.125 && shortest <= 0.25 && 
      longest >= 5 && middle >= 3.5 && shortest >= 0.007) {
    // Check aspect ratio for letters (length divided by height between 1.3 and 2.5)
    const aspectRatio = longest / middle;
    if (aspectRatio >= 1.3 && aspectRatio <= 2.5) {
      return PROCESSING_CATEGORIES.MACHINABLE;
    }
  }
  
  // Check if it's flat-sized
  if ((longest > 11.5 || middle > 6.125 || shortest > 0.25) && 
      longest <= 15 && middle <= 12 && shortest <= 0.75) {
    return PROCESSING_CATEGORIES.FLATS;
  }
  
  // Check if it's machinable parcel
  // Machinable parcels must:
  // - Not exceed 27 inches in length, or 17 inches in width, or 17 inches in height
  // - Not less than 6 inches long, 3 inches high, 1/4 inch thick
  // - Not exceed 25 pounds
  if (longest <= 27 && middle <= 17 && shortest >= 0.25 && 
      longest >= 6 && middle >= 3 && weight <= 400) { // 25 pounds = 400 oz
    return PROCESSING_CATEGORIES.MACHINABLE;
  }
  
  // If it doesn't meet machinable criteria, it's nonstandard
  return PROCESSING_CATEGORIES.NONSTANDARD;
};

/**
 * Determine the appropriate rate indicator based on mail class and package dimensions
 * @param {string} mailClass USPS mail class
 * @param {number} length Length in inches
 * @param {number} width Width in inches
 * @param {number} height Height in inches
 * @param {number} weight Weight in ounces
 * @param {string} containerType Container type
 * @returns {string} Rate indicator value for USPS API
 */
const determineRateIndicator = (mailClass, length, width, height, weight, containerType) => {
  // Convert dimensions to ensure they are numbers
  length = parseFloat(length);
  width = parseFloat(width);
  height = parseFloat(height);
  weight = parseFloat(weight);
  
  // Calculate cubic size (length × width × height / 1728)
  const cubicSize = (length * width * height) / 1728;
  
  // For Priority Mail Express
  if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS) {
    // Flat Rate Envelope
    if (containerType === CONTAINER_TYPES.FLAT_RATE_ENVELOPE) {
      return 'E4';
    }
    // Legal Flat Rate Envelope
    if (containerType === CONTAINER_TYPES.FLAT_RATE_LEGAL_ENVELOPE) {
      return 'E6';
    }
    // Default for Priority Mail Express
    return 'PA';
  }
  
  // For Priority Mail
  if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL) {
    // Small Flat Rate Box
    if (containerType === CONTAINER_TYPES.SM_FLAT_RATE_BOX) {
      return 'FS';
    }
    // Medium Flat Rate Box
    if (containerType === CONTAINER_TYPES.MD_FLAT_RATE_BOX) {
      return 'FB';
    }
    // Large Flat Rate Box
    if (containerType === CONTAINER_TYPES.LG_FLAT_RATE_BOX) {
      return 'PL';
    }
    // Flat Rate Envelope
    if (containerType === CONTAINER_TYPES.FLAT_RATE_ENVELOPE) {
      return 'FE';
    }
    // Legal Flat Rate Envelope
    if (containerType === CONTAINER_TYPES.FLAT_RATE_LEGAL_ENVELOPE) {
      return 'FA';
    }
    // Padded Flat Rate Envelope
    if (containerType === CONTAINER_TYPES.FLAT_RATE_PADDED_ENVELOPE) {
      return 'FP';
    }
    
    // Cubic pricing tiers for Priority Mail
    if (cubicSize <= 0.1) {
      return 'C1';
    } else if (cubicSize <= 0.2) {
      return 'C2';
    } else if (cubicSize <= 0.3) {
      return 'C3';
    } else if (cubicSize <= 0.4) {
      return 'C4';
    } else if (cubicSize <= 0.5) {
      return 'C5';
    }
    
    // Oversized
    if (length > 22 || width > 18 || height > 15 || weight > 320) { // 20 pounds = 320 oz
      return 'OS';
    }
    
    // Default for Priority Mail
    return 'CP';
  }
  
  // For First-Class Package Service
  if (mailClass === USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE) {
    return 'SP'; // Single Piece
  }
  
  // For USPS Ground Advantage
  if (mailClass === USPS_MAIL_CLASSES.GROUND_ADVANTAGE) {
    // Oversized
    if (length > 22 || width > 18 || height > 15 || weight > 320) { // 20 pounds = 320 oz
      return 'OS';
    }
    return 'SP'; // Single Piece
  }
  
  // Default fallback
  return 'SP';
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
    
    if (packageDetails.length && packageDetails.width && packageDetails.height) {
      // Use dimensions from packageDetails
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
    
    // Get weight and convert to ounces if needed
    let packageWeight = parseFloat(packageDetails.weight || 0);
    if (packageDetails.weightUnit === 'lb') {
      packageWeight = packageWeight * 16; // Convert pounds to ounces
    }
    
    // Log additional fields
    if (packageDetails.isResidential !== undefined) {
      console.log('USPS Address Type:', packageDetails.isResidential ? 'Residential' : 'Commercial');
    }
    
    // Get OAuth access token
    const accessToken = await getUSPSAccessToken();
    
    // Format date for API request (YYYY-MM-DD format)
    const formattedDate = packageDetails.shipmentDate ? 
      packageDetails.shipmentDate.toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    // Determine the appropriate processing category based on package dimensions
    const processingCategory = determineProcessingCategory(
      length, 
      width, 
      height, 
      packageWeight
    );
    
    // Determine the appropriate container type based on package dimensions
    // USPS Small Flat Rate Box dimensions: 8.625" × 5.375" × 1.625"
    // USPS Medium Flat Rate Box dimensions: 11" × 8.5" × 5.5" or 13.625" × 11.875" × 3.375"
    // USPS Large Flat Rate Box dimensions: 12" × 12" × 5.5" or 23.6875" × 11.75" × 3"
    let containerType = CONTAINER_TYPES.VARIABLE;
    
    // For larger packages, always use VARIABLE container type to avoid size errors
    if (length > 13.625 || width > 11.875 || height > 5.5) {
      containerType = CONTAINER_TYPES.VARIABLE;
      console.log('Package requires variable sizing - using customer packaging');
    }
    // Otherwise, check if package fits in standard USPS boxes
    else {
      console.log('Package may fit in a USPS standard box - will use VARIABLE container type for safety');
      containerType = CONTAINER_TYPES.VARIABLE;
    }
    
    // Create the initial payload with all required fields
    const payload = {
      originZIPCode: fromZip,
      destinationZIPCode: toZip,
      length: length,
      width: width,
      height: height,
      weight: packageWeight,
      mailClass: '', // Will be set for each mail class
      containerType: containerType,
      processingCategory: processingCategory,
      contentType: CONTENT_TYPES.MERCHANDISE,
      destinationEntryFacilityType: 'NONE',
      entryFacility: 'OTHER',
      surchargeFlagsString: '',
      priceType: 'RETAIL',
      includePostage: true,
      includeExtraServices: true,
      includeAllRateCategories: false,
      includeCommitments: true
    };
    
    // Ensure dimensions are within USPS limits
    const girth = 2 * (payload.width + payload.height);
    const lengthPlusGirth = payload.length + girth;
    
    // USPS has a maximum length + girth of 130 inches for most mail classes
    if (lengthPlusGirth > 130) {
      console.log(`Package exceeds USPS maximum size (length + girth = ${lengthPlusGirth}")`);
      return [{
        carrier: 'USPS',
        service: 'USPS Shipping',
        error: 'Package exceeds USPS maximum size limits.'
      }];
    }
    
    // Use simplified approach with most reliable USPS mail classes
    const mailClasses = [
      USPS_MAIL_CLASSES.PRIORITY_MAIL,
      USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS,
      USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE,
      USPS_MAIL_CLASSES.GROUND_ADVANTAGE
    ];
    // Add special services if needed
    if (packageDetails.signatureRequired || packageDetails.insuranceValue) {
      payload.extraServices = [];
      
      if (packageDetails.signatureRequired) {
        payload.extraServices.push({
          extraServiceCode: 'SIGNATURE_CONFIRMATION'
        });
      }
      
      if (packageDetails.insuranceValue) {
        payload.extraServices.push({
          extraServiceCode: 'INSURANCE',
          declaredValue: parseFloat(packageDetails.insuranceValue)
        });
      }
    }
    
    // Try each mail class and collect valid rates
    const allRates = [];
    const errors = [];
    
    // Store the original payload to use as a template
    const basePayload = { ...payload };
    
    for (const mailClass of mailClasses) {
      try {
        // Create a tailored payload for each mail class
        let mailClassPayload = { 
          ...basePayload,
          mailClass
        };
        
        // Add specific mail class configurations required for SKU creation
        switch(mailClass) {
          case USPS_MAIL_CLASSES.PRIORITY_MAIL:
            // Try both variable and flat rate options for Priority Mail
            if (mailClassPayload.length <= 11 && mailClassPayload.width <= 8.5 && mailClassPayload.height <= 5.5 && mailClassPayload.weight <= 70) {
              // Try small flat rate box if package fits
              mailClassPayload.containerType = CONTAINER_TYPES.SM_FLAT_RATE_BOX;
            } else if (mailClassPayload.length <= 13.625 && mailClassPayload.width <= 11.875 && mailClassPayload.height <= 3.375 && mailClassPayload.weight <= 70) {
              // Try medium flat rate box if package fits
              mailClassPayload.containerType = CONTAINER_TYPES.MD_FLAT_RATE_BOX;
            } else {
              // Otherwise use variable
              mailClassPayload.containerType = CONTAINER_TYPES.VARIABLE;
            }
            break;
            
          case USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS:
            mailClassPayload.containerType = CONTAINER_TYPES.VARIABLE;
            break;
            
          case USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE:
            mailClassPayload.containerType = CONTAINER_TYPES.VARIABLE;
            // First-Class Package Service has a weight limit of 13 oz
            if (mailClassPayload.weight > 13) {
              mailClassPayload.weight = 13;
              console.log(`Adjusted weight to 13oz for ${mailClass}`);
            }
            break;
            
          case USPS_MAIL_CLASSES.GROUND_ADVANTAGE:
            mailClassPayload.containerType = CONTAINER_TYPES.VARIABLE;
            break;
        }
        
        // Add rate indicator based on mail class and container type
        mailClassPayload.rateIndicator = determineRateIndicator(
          mailClass,
          mailClassPayload.length,
          mailClassPayload.width,
          mailClassPayload.height,
          mailClassPayload.weight,
          mailClassPayload.containerType
        );
        
        console.log(`Trying USPS mail class: ${mailClass}`);
        console.log(`Sending request to USPS API for ${mailClass}:`, JSON.stringify(mailClassPayload, null, 2));
        
        // Make the API call to USPS Rates API
        const response = await axios.post(
          `${USPS_CONFIG.apiBaseUrl}/prices/v3/base-rates/search`,
          mailClassPayload,
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
        // The API returns rates in the 'rates' array, not 'baseRates'
        if (response.data && response.data.rates && response.data.rates.length > 0) {
          console.log(`Found ${response.data.rates.length} rates for ${mailClass}`);
          
          // Map response to our standard format
          const rates = response.data.rates.map(rate => {
            // Store current payload for reference in this scope
            const currentPayload = mailClassPayload;
            
            // Map mail class to service name
            let serviceName;
            switch (mailClass) {
              case USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS:
                serviceName = 'USPS Priority Mail Express';
                break;
              case USPS_MAIL_CLASSES.PRIORITY_MAIL:
                serviceName = 'USPS Priority Mail';
                break;
              case USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE:
                serviceName = 'USPS First-Class Package';
                break;
              case USPS_MAIL_CLASSES.GROUND_ADVANTAGE:
                serviceName = 'USPS Ground Advantage';
                break;
              default:
                serviceName = `USPS ${mailClass.replace(/_/g, ' ')}`;
            }
            
            // Estimate delivery days based on mail class
            let estimatedDays;
            switch (mailClass) {
              case USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS:
                estimatedDays = '1-2';
                break;
              case USPS_MAIL_CLASSES.PRIORITY_MAIL:
                estimatedDays = '2-3';
                break;
              case USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE:
                estimatedDays = '2-5';
                break;
              case USPS_MAIL_CLASSES.GROUND_ADVANTAGE:
                estimatedDays = '3-5';
                break;
              default:
                estimatedDays = '3-7';
            }
            
            // Determine if this is a carrier-provided box
            const isCarrierBox = currentPayload.containerType !== CONTAINER_TYPES.VARIABLE;
            
            // Get box type name for display
            let boxType = currentPayload.containerType;
            
            // Map container type to a user-friendly name
            let boxTypeName = '';
            switch (currentPayload.containerType) {
              case CONTAINER_TYPES.SM_FLAT_RATE_BOX:
                boxTypeName = 'USPS Small Flat Rate Box';
                break;
              case CONTAINER_TYPES.MD_FLAT_RATE_BOX:
                boxTypeName = 'USPS Medium Flat Rate Box';
                break;
              case CONTAINER_TYPES.LG_FLAT_RATE_BOX:
                boxTypeName = 'USPS Large Flat Rate Box';
                break;
              case CONTAINER_TYPES.FLAT_RATE_ENVELOPE:
                boxTypeName = 'USPS Flat Rate Envelope';
                break;
              case CONTAINER_TYPES.FLAT_RATE_LEGAL_ENVELOPE:
                boxTypeName = 'USPS Legal Flat Rate Envelope';
                break;
              case CONTAINER_TYPES.FLAT_RATE_PADDED_ENVELOPE:
                boxTypeName = 'USPS Padded Flat Rate Envelope';
                break;
              case CONTAINER_TYPES.REGIONAL_RATE_BOX_A:
                boxTypeName = 'USPS Regional Rate Box A';
                break;
              case CONTAINER_TYPES.REGIONAL_RATE_BOX_B:
                boxTypeName = 'USPS Regional Rate Box B';
                break;
              default:
                boxTypeName = 'Your Packaging';
            }
            
            return {
              carrier: 'USPS',
              service: serviceName,
              price: parseFloat(rate.price),
              estimatedDays: estimatedDays,
              dimensions: {
                length: currentPayload.length,
                width: currentPayload.width,
                height: currentPayload.height,
                boxType: boxType,
                boxTypeName: boxTypeName
              },
              isCarrierBox: isCarrierBox,
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
          
          // Check if this is a specific error we can handle
          const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message;
          
          // For Priority Mail with Small Flat Rate Box, if we get a size error, try again with VARIABLE container
          if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL && 
              errorMessage.includes('Package size exceeds maximum')) {
            
            console.log('Retrying Priority Mail with variable container type');
            
            try {
              // Create a new payload with VARIABLE container type
              const retryPayload = { 
                ...basePayload,
                mailClass: mailClass,
                containerType: CONTAINER_TYPES.VARIABLE
              };
              
              // Update rate indicator for the new container type
              retryPayload.rateIndicator = determineRateIndicator(
                mailClass,
                retryPayload.length,
                retryPayload.width,
                retryPayload.height,
                retryPayload.weight,
                CONTAINER_TYPES.VARIABLE
              );
              
              console.log(`Sending retry request to USPS API for ${mailClass} with VARIABLE container:`, 
                JSON.stringify(retryPayload, null, 2));
              
              // Make the API call to USPS Rates API
              const retryResponse = await axios.post(
                `${USPS_CONFIG.apiBaseUrl}/prices/v3/base-rates/search`,
                retryPayload,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                }
              );
              
              // Process the retry response
              if (retryResponse.data && retryResponse.data.rates && retryResponse.data.rates.length > 0) {
                console.log(`Retry successful! Found ${retryResponse.data.rates.length} rates for ${mailClass}`);
                
                // Map response to our standard format (same as the main response handling)
                const rates = retryResponse.data.rates.map(rate => {
                  // Use the same service name mapping as above
                  let serviceName;
                  switch (mailClass) {
                    case USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS:
                      serviceName = 'USPS Priority Mail Express';
                      break;
                    case USPS_MAIL_CLASSES.PRIORITY_MAIL:
                      serviceName = 'USPS Priority Mail';
                      break;
                    case USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE:
                      serviceName = 'USPS First-Class Package';
                      break;
                    case USPS_MAIL_CLASSES.GROUND_ADVANTAGE:
                      serviceName = 'USPS Ground Advantage';
                      break;
                    default:
                      serviceName = `USPS ${mailClass.replace(/_/g, ' ')}`;
                  }
                  
                  // Use the same estimated days mapping as above
                  let estimatedDays;
                  switch (mailClass) {
                    case USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS:
                      estimatedDays = '1-2';
                      break;
                    case USPS_MAIL_CLASSES.PRIORITY_MAIL:
                      estimatedDays = '2-3';
                      break;
                    case USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE:
                      estimatedDays = '2-5';
                      break;
                    case USPS_MAIL_CLASSES.GROUND_ADVANTAGE:
                      estimatedDays = '3-5';
                      break;
                    default:
                      estimatedDays = '3-7';
                  }
                  
                  // Store current payload reference for this scope
                  const currentRetryPayload = retryPayload;
                  
                  return {
                    carrier: 'USPS',
                    service: serviceName,
                    price: parseFloat(rate.price),
                    estimatedDays: estimatedDays,
                    dimensions: {
                      length: currentRetryPayload.length,
                      width: currentRetryPayload.width,
                      height: currentRetryPayload.height,
                      boxType: 'VARIABLE',
                      boxTypeName: 'Your Packaging'
                    },
                    isCarrierBox: false,
                    specialServices: {
                      insurance: !!packageDetails.insuranceValue,
                      signature: !!packageDetails.signatureRequired
                    }
                  };
                });
                
                allRates.push(...rates);
                return; // Skip adding to errors since we recovered
              }
            } catch (retryError) {
              console.log(`Retry for ${mailClass} failed:`, retryError.message);
            }
          }
        } else {
          console.log(`Error getting rates for ${mailClass}:`, error.message);
        }
        
        errors.push({
          mailClass,
          error: error.response?.data?.error?.message || error.response?.data?.message || error.message
        });
      }
    }
    
    // Log the collected rates for debugging
    console.log(`Collected ${allRates.length} USPS rates total`);
    
    if (allRates.length > 0) {
      console.log(`Successfully retrieved ${allRates.length} USPS rates across ${mailClasses.length} mail classes`);
      
      // Sort rates by price (lowest first)
      allRates.sort((a, b) => a.price - b.price);
      
      // Log the rates we're returning
      console.log('Returning USPS rates:', JSON.stringify(allRates.map(r => ({ 
        service: r.service, 
        price: r.price,
        estimatedDays: r.estimatedDays,
        isCarrierBox: r.isCarrierBox
      })), null, 2));
      
      return allRates;
    } else {
      console.log('No valid USPS rates found for any mail class');
      if (errors.length > 0) {
        console.error('USPS rate errors:', JSON.stringify(errors, null, 2));
      }
      
      // Return an error message instead of fallback rates
      return [{
        carrier: 'USPS',
        service: 'USPS Shipping',
        error: errors.length > 0 
          ? `USPS API Error: ${errors[0].error}` 
          : 'No USPS shipping rates available for this package.'
      }];
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
