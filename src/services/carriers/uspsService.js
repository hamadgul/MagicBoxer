import axios from 'axios';

const USPS_CONFIG = {
  clientId: 's48Bvc4Ky0di0O5la1LHF8dcgdcBNqLV',
  clientSecret: 'IupGg3UhoQt37R9A',
  apiBaseUrl: 'https://apis.usps.com',
  tokenEndpoint: '/oauth2/v3/token',
  ratesEndpoint: '/prices/v3/base-rates/search',
  dimDivisor: 166
};

// USPS mail classes
const USPS_MAIL_CLASSES = {
  PRIORITY_MAIL_EXPRESS: 'PRIORITY_MAIL_EXPRESS',
  PRIORITY_MAIL: 'PRIORITY_MAIL',
  FIRST_CLASS_PACKAGE: 'FIRST-CLASS_PACKAGE_SERVICE',
  GROUND_ADVANTAGE: 'USPS_GROUND_ADVANTAGE',
  PARCEL_SELECT: 'PARCEL_SELECT',
  LIBRARY_MAIL: 'LIBRARY_MAIL',
  MEDIA_MAIL: 'MEDIA_MAIL',
  BOUND_PRINTED_MATTER: 'BOUND_PRINTED_MATTER',
  USPS_CONNECT_LOCAL: 'USPS_CONNECT_LOCAL',
  USPS_CONNECT_MAIL: 'USPS_CONNECT_MAIL',
  USPS_CONNECT_REGIONAL: 'USPS_CONNECT_REGIONAL'
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
  // Simple price calculation - in reality this would be more complex
  // based on USPS pricing tables
  const zoneMultiplier = 1 + ((zone - 1) * 0.1); // Zone 1 = 1.0, Zone 2 = 1.1, etc.
  const weightMultiplier = Math.max(1, billableWeight);
  
  return baseRate * zoneMultiplier * weightMultiplier;
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
  // Sort dimensions to get the smallest dimension
  const dimensions = [length, width, height].sort((a, b) => a - b);
  const [smallest, middle, largest] = dimensions;
  
  // Check if the package is machinable based on USPS guidelines
  // USPS machinable parcels must:
  // - Weigh 16 ounces or less
  // - Measure at least 6 inches long, 3 inches high, and 0.25 inch thick
  // - Measure no more than 27 inches long, 17 inches wide, and 17 inches high
  if (
    weight <= 16 && // 16 ounces or less
    smallest >= 0.25 && // At least 0.25 inch thick
    middle >= 3 && // At least 3 inches high
    largest >= 6 && // At least 6 inches long
    length <= 27 && // No more than 27 inches long
    width <= 17 && // No more than 17 inches wide
    height <= 17 // No more than 17 inches high
  ) {
    return PROCESSING_CATEGORIES.MACHINABLE;
  }
  
  // Check if the package is irregular
  // USPS irregular parcels are those that:
  // - Exceed one or more of the maximum dimensions for machinable parcels
  // - Have unusual shapes (tubes, rolls, triangles, etc.)
  if (
    length > 27 || // Longer than 27 inches
    width > 17 || // Wider than 17 inches
    height > 17 || // Higher than 17 inches
    length + 2 * (width + height) > 108 // Length + girth > 108 inches
  ) {
    return PROCESSING_CATEGORIES.IRREGULAR;
  }
  
  // Default to nonmachinable for anything else
  return PROCESSING_CATEGORIES.NONMACHINABLE;
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
export const determineRateIndicator = (mailClass, length, width, height, weight, containerType) => {
  // USPS API v3 uses specific rate indicator codes from the enum list
  // Valid values include: 3D, 3N, 3R, 5D, BA, BB, BM, C1, C2, C3, C4, C5, CP, CM, etc.
  
  // Check if using a flat rate box
  if ([CONTAINER_TYPES.SM_FLAT_RATE_BOX, 
       CONTAINER_TYPES.MD_FLAT_RATE_BOX, 
       CONTAINER_TYPES.LG_FLAT_RATE_BOX].includes(containerType)) {
    // Use valid rate indicators from the enum
    if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL) {
      return 'FR'; // Flat Rate for Priority Mail
    } else if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS) {
      return 'PA'; // Priority Mail Express
    }
    return 'FR'; // Default to FR for flat rate
  }
  
  // Check if using a flat rate envelope
  if ([CONTAINER_TYPES.FLAT_RATE_ENVELOPE, 
       CONTAINER_TYPES.FLAT_RATE_LEGAL_ENVELOPE, 
       CONTAINER_TYPES.FLAT_RATE_PADDED_ENVELOPE].includes(containerType)) {
    // Use valid rate indicators from the enum
    if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL) {
      return 'FR'; // Flat Rate for Priority Mail
    } else if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS) {
      return 'PA'; // Priority Mail Express
    }
    return 'FR'; // Default to FR for flat rate
  }
  
  // Check if using a regional rate box
  if ([CONTAINER_TYPES.REGIONAL_RATE_BOX_A, 
       CONTAINER_TYPES.REGIONAL_RATE_BOX_B].includes(containerType)) {
    return 'RP'; // Regional Priority (valid in enum)
  }
  
  // For variable containers, determine based on dimensions
  if (containerType === CONTAINER_TYPES.VARIABLE) {
    // Calculate dimensional weight
    const volume = length * width * height;
    
    // Check if package qualifies for cubic pricing
    // Cubic pricing applies to packages up to 0.5 cubic feet
    if (volume <= 864 && mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL) { // 0.5 cubic feet = 864 cubic inches
      // Use cubic tier based on volume - these are valid in the enum
      if (volume <= 216) { // 0.125 cubic feet
        return 'C1'; // Cubic Tier 1 - valid in enum
      } else if (volume <= 432) { // 0.25 cubic feet
        return 'C2'; // Cubic Tier 2 - valid in enum
      } else {
        return 'C3'; // Cubic Tier 3 - valid in enum (up to 0.5 cubic feet)
      }
    }
  }
  
  // Default to a valid retail pricing code from the USPS API v3 enum list
  // Valid values include: 3D,3N,3R,5D,BA,BB,BM,C1,C2,C3,C4,C5,CP,CM,DC,DE,DF,DN,DR,E4,E6,E7,FA,FB,FE,FP,FS,LC,LF,LL,LO,LS,NP,O1,O2,O3,O4,O5,O6,O7,OS,P5,P6,P7,P8,P9,Q6,Q7,Q8,Q9,Q0,PA,PL,PM,PR,SB,SN,SP,SR
  if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL) {
    return 'PR'; // Priority Mail (PR is valid in the enum)
  } else if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS) {
    return 'PA'; // Priority Mail Express (PA is valid in the enum)
  } else if (mailClass === USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE) {
    return 'FS'; // First Class Service (FS is valid in the enum)
  } else if (mailClass === USPS_MAIL_CLASSES.GROUND_ADVANTAGE) {
    return 'CP'; // Commercial Plus (CP is valid in the enum)
  }
  
  // Fallback to Commercial Plus pricing
  return 'CP';
};

/**
 * Find the most suitable USPS box for the given package dimensions
 * @param {number} length Package length in inches
 * @param {number} width Package width in inches
 * @param {number} height Package height in inches
 * @returns {Object} The best-fit box information with type, name, and dimensions
 */
const findSuitableUSPSBox = (length, width, height) => {
  console.log('Finding suitable USPS box for dimensions:', length, width, height);
  
  // Sort dimensions from largest to smallest
  const sortedDimensions = [length, width, height].sort((a, b) => b - a);
  const [maxLength, midWidth, minHeight] = sortedDimensions;
  
  // Calculate girth (2 * width + 2 * height)
  const girth = 2 * midWidth + 2 * minHeight;
  
  // Check if package exceeds USPS maximum size limit (130 inches length + girth)
  if (maxLength + girth > 130) {
    console.log('Package exceeds USPS maximum size limit (130 inches length + girth)');
    return { type: 'OVERSIZED', name: 'Oversized Package', dimensions: sortedDimensions };
  }
  
  // Define USPS flat rate boxes and their dimensions (length, width, height) in inches
  const uspsBoxes = [
    // Flat Rate Envelopes
    { type: CONTAINER_TYPES.FLAT_RATE_ENVELOPE, name: 'Flat Rate Envelope', dimensions: [12.5, 9.5, 0.5] },
    { type: CONTAINER_TYPES.FLAT_RATE_LEGAL_ENVELOPE, name: 'Flat Rate Legal Envelope', dimensions: [15, 9.5, 0.5] },
    { type: CONTAINER_TYPES.FLAT_RATE_PADDED_ENVELOPE, name: 'Flat Rate Padded Envelope', dimensions: [12.5, 9.5, 1] },
    
    // Flat Rate Boxes
    { type: CONTAINER_TYPES.SM_FLAT_RATE_BOX, name: 'Small Flat Rate Box', dimensions: [8.625, 5.375, 1.625] },
    { type: CONTAINER_TYPES.MD_FLAT_RATE_BOX, name: 'Medium Flat Rate Box 1', dimensions: [11, 8.5, 5.5] },
    { type: CONTAINER_TYPES.MD_FLAT_RATE_BOX, name: 'Medium Flat Rate Box 2', dimensions: [13.625, 11.875, 3.375] },
    { type: CONTAINER_TYPES.LG_FLAT_RATE_BOX, name: 'Large Flat Rate Box', dimensions: [12, 12, 5.5] },
    
    // Regional Rate Boxes
    { type: CONTAINER_TYPES.REGIONAL_RATE_BOX_A, name: 'Regional Rate Box A1', dimensions: [10, 7, 4.75] },
    { type: CONTAINER_TYPES.REGIONAL_RATE_BOX_A, name: 'Regional Rate Box A2', dimensions: [10.9375, 2.375, 12.8125] },
    { type: CONTAINER_TYPES.REGIONAL_RATE_BOX_B, name: 'Regional Rate Box B1', dimensions: [12, 10.25, 5] },
    { type: CONTAINER_TYPES.REGIONAL_RATE_BOX_B, name: 'Regional Rate Box B2', dimensions: [14.875, 2.75, 12] }
  ];
  
  // Find the smallest box that fits the package
  for (const box of uspsBoxes) {
    // Sort box dimensions from largest to smallest
    const boxDimensions = [...box.dimensions].sort((a, b) => b - a);
    const [boxMaxLength, boxMidWidth, boxMinHeight] = boxDimensions;
    
    // Check if package fits in this box in any orientation
    if (maxLength <= boxMaxLength && midWidth <= boxMidWidth && minHeight <= boxMinHeight) {
      console.log(`Package fits in ${box.name}`);
      return { ...box };
    }
  }
  
  // If no standard box fits, use variable container type
  console.log('No standard USPS box fits, using variable container type');
  return { type: CONTAINER_TYPES.VARIABLE, name: 'Your Packaging', dimensions: sortedDimensions };
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
    
    // Get dimensions from packageDetails or use USPS result dimensions if available
    let length, width, height;
    
    // Debug the entire packageDetails object
    console.log('USPS Service - Full packageDetails:', JSON.stringify(packageDetails, null, 2));
    
    const result = packageDetails.uspsResult;
    console.log('USPS Service - uspsResult:', result ? JSON.stringify(result, null, 2) : 'undefined');
    
    if (result && result.type !== 'No Box Found') {
      // Use dimensions from the 3D packing algorithm result
      length = result.x;
      width = result.y;
      height = result.z;
      console.log('USPS Service - Using dimensions from uspsResult:', { length, width, height, type: result.type });
    } else if (packageDetails.length && packageDetails.width && packageDetails.height) {
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
    
    // Find the best-fit USPS box for the package dimensions
    const bestFitBox = findSuitableUSPSBox(length, width, height);
    const containerType = bestFitBox.type;
    
    console.log(`Selected container type: ${containerType} (${bestFitBox.name})`);
    console.log(`Best fit box dimensions: ${bestFitBox.dimensions[0]}" x ${bestFitBox.dimensions[1]}" x ${bestFitBox.dimensions[2]}"`);
    
    // Update dimensions to use the best-fit box dimensions if using a carrier box
    if (containerType !== CONTAINER_TYPES.VARIABLE) {
      length = bestFitBox.dimensions[0];
      width = bestFitBox.dimensions[1];
      height = bestFitBox.dimensions[2];
      console.log('Using dimensions from best-fit USPS box:', { length, width, height });
    } else {
      console.log('Package requires variable sizing - using customer packaging');
    }
    
    // Ensure dimensions are within USPS limits
    const girth = 2 * (width + height);
    const lengthPlusGirth = length + girth;

    // Check size limits for each mail class
    const mailClassSizeLimits = {
      [USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.PRIORITY_MAIL]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE]: {
        maxLength: 22,
        maxLengthPlusGirth: 108,
        maxWeight: 13 // ounces (0.8125 pounds)
      },
      [USPS_MAIL_CLASSES.GROUND_ADVANTAGE]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.PARCEL_SELECT]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.MEDIA_MAIL]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.LIBRARY_MAIL]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.BOUND_PRINTED_MATTER]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 15 // pounds
      },
      [USPS_MAIL_CLASSES.USPS_CONNECT_LOCAL]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.USPS_CONNECT_REGIONAL]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      },
      [USPS_MAIL_CLASSES.USPS_CONNECT_MAIL]: {
        maxLength: 108,
        maxLengthPlusGirth: 130,
        maxWeight: 70 // pounds
      }
    };
    
    // Track which mail classes exceed size limits
    const oversizedMailClasses = [];
    
    // Check if package exceeds overall USPS maximum size
    if (lengthPlusGirth > 130) {
      console.log(`Package exceeds USPS maximum size (length + girth = ${lengthPlusGirth}")`);      
      return [{
        carrier: 'USPS',
        service: 'USPS Shipping',
        error: 'Package exceeds USPS maximum size limits (130" length + girth).'
      }];
    }
    
    // Check each mail class for size limits
    Object.keys(mailClassSizeLimits).forEach(mailClass => {
      const limits = mailClassSizeLimits[mailClass];
      if (length > limits.maxLength) {
        console.log(`Package length ${length}" exceeds ${mailClass} maximum length ${limits.maxLength}".`);
        oversizedMailClasses.push(mailClass);
      }
      if (lengthPlusGirth > limits.maxLengthPlusGirth) {
        console.log(`Package length + girth ${lengthPlusGirth}" exceeds ${mailClass} maximum length + girth ${limits.maxLengthPlusGirth}".`);
        if (!oversizedMailClasses.includes(mailClass)) {
          oversizedMailClasses.push(mailClass);
        }
      }
      if (packageWeight > limits.maxWeight) {
        console.log(`Package weight ${packageWeight} lbs exceeds ${mailClass} maximum weight ${limits.maxWeight} lbs.`);
        if (!oversizedMailClasses.includes(mailClass)) {
          oversizedMailClasses.push(mailClass);
        }
      }
    });
    
    // Log oversized mail classes
    if (oversizedMailClasses.length > 0) {
      console.log('Oversized mail classes:', oversizedMailClasses);
    }

    // Add special services if needed
    const extraServices = [];
    if (packageDetails.signatureRequired || packageDetails.insuranceValue) {
      if (packageDetails.signatureRequired) {
        extraServices.push({
          extraServiceCode: EXTRA_SERVICES.SIGNATURE_CONFIRMATION
        });
        console.log('Added signature confirmation service');
      }
      
      if (packageDetails.insuranceValue) {
        const insuranceValue = parseFloat(packageDetails.insuranceValue);
        if (!isNaN(insuranceValue) && insuranceValue > 0) {
          extraServices.push({
            extraServiceCode: EXTRA_SERVICES.INSURANCE,
            extraServiceValue: insuranceValue.toFixed(2)
          });
          console.log(`Added insurance service for $${insuranceValue.toFixed(2)}`);
        }
      }
    }
    
    // Define mail classes to check
    const mailClasses = [
      USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS,
      USPS_MAIL_CLASSES.PRIORITY_MAIL,
      USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE,
      USPS_MAIL_CLASSES.GROUND_ADVANTAGE,
      USPS_MAIL_CLASSES.PARCEL_SELECT,
      USPS_MAIL_CLASSES.MEDIA_MAIL,
      USPS_MAIL_CLASSES.LIBRARY_MAIL,
      USPS_MAIL_CLASSES.BOUND_PRINTED_MATTER,
      USPS_MAIL_CLASSES.USPS_CONNECT_LOCAL,
      USPS_MAIL_CLASSES.USPS_CONNECT_REGIONAL
    ];
    
    // Array to store all valid rates
    const allRates = [];
    
    // Array to store errors by mail class
    const errors = [];
    
    // Process each mail class
    for (const mailClass of mailClasses) {
      try {
        console.log(`Processing mail class: ${mailClass}`);
        
        // Skip mail classes that exceed size limits
        if (oversizedMailClasses.includes(mailClass)) {
          console.log(`Skipping ${mailClass} due to size limits`);
          errors.push({
            mailClass,
            error: "Package size exceeds maximum allowed for mail class"
          });
          continue;
        }
        
        // Determine container type based on mail class and package dimensions
        let mailClassContainerType = containerType;
        
        // For most mail classes, always use variable container to avoid SKU errors
        // The "Could not find working sku from SSF ingredients" error occurs when trying to use specific container types
        if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL || 
            mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL_EXPRESS ||
            mailClass === USPS_MAIL_CLASSES.FIRST_CLASS_PACKAGE || 
            mailClass === USPS_MAIL_CLASSES.GROUND_ADVANTAGE ||
            mailClass === USPS_MAIL_CLASSES.PARCEL_SELECT ||
            mailClass === USPS_MAIL_CLASSES.MEDIA_MAIL ||
            mailClass === USPS_MAIL_CLASSES.LIBRARY_MAIL ||
            mailClass === USPS_MAIL_CLASSES.BOUND_PRINTED_MATTER ||
            mailClass === USPS_MAIL_CLASSES.USPS_CONNECT_LOCAL ||
            mailClass === USPS_MAIL_CLASSES.USPS_CONNECT_REGIONAL ||
            mailClass === USPS_MAIL_CLASSES.USPS_CONNECT_MAIL) {
          mailClassContainerType = CONTAINER_TYPES.VARIABLE;
          console.log(`Using variable container for ${mailClass} to avoid SKU errors`);
        }
        
        // For Ground Advantage, check if dimensions exceed cubic volume limits
        // The cubic volume limit for Ground Advantage is 0.50 cubic feet or 864 cubic inches
        if (mailClass === USPS_MAIL_CLASSES.GROUND_ADVANTAGE) {
          const cubicVolume = length * width * height;
          const maxCubicVolume = 864; // 0.50 cubic feet = 864 cubic inches
          
          if (cubicVolume > maxCubicVolume) {
            console.log(`Package cubic volume (${cubicVolume} in³) exceeds Ground Advantage maximum (${maxCubicVolume} in³)`);
            errors.push({
              mailClass,
              error: "Package dimensions exceed the maximum volume for Ground Advantage"
            });
            continue;
          }
        }
        
        // Determine rate indicator based on mail class and dimensions
        const rateIndicator = determineRateIndicator(
          mailClass,
          length,
          width,
          height,
          packageWeight,
          mailClassContainerType
        );
        
        // Create payload for this mail class
        // Use the appropriate dimensions based on container type
        let payloadLength, payloadWidth, payloadHeight;
        
        if (mailClassContainerType === CONTAINER_TYPES.VARIABLE) {
          // For variable containers, use the original package dimensions
          payloadLength = length;
          payloadWidth = width;
          payloadHeight = height;
        } else {
          // For carrier boxes, use the dimensions of the selected box
          payloadLength = bestFitBox.dimensions[0];
          payloadWidth = bestFitBox.dimensions[1];
          payloadHeight = bestFitBox.dimensions[2];
        }
        
        console.log(`Dimensions for ${mailClass}:`, { 
          length: payloadLength, 
          width: payloadWidth, 
          height: payloadHeight,
          containerType: mailClassContainerType 
        });
        
        const mailClassPayload = {
          mailClass: mailClass,
          originZIPCode: fromZip,
          destinationZIPCode: toZip,
          shipDate: formattedDate,
          processingCategory: processingCategory,
          rateIndicator: rateIndicator,
          containerType: mailClassContainerType,
          length: payloadLength,
          width: payloadWidth,
          height: payloadHeight,
          weight: packageWeight,
          contentType: CONTENT_TYPES.MERCHANDISE,
          destinationEntryFacilityType: 'NONE',
          priceType: 'COMMERCIAL',
          includePostage: true,
          includeExtraServices: true,
          includeAllRateCategories: false,
          includeCommitments: true
        };
        
        // Add extra services if any
        if (extraServices.length > 0) {
          mailClassPayload.extraServices = extraServices;
        }
        
        console.log(`USPS API request for ${mailClass}:`, JSON.stringify(mailClassPayload, null, 2));
        
        try {
          // Make API call to get rates
          const response = await axios.post(
            `${USPS_CONFIG.apiBaseUrl}${USPS_CONFIG.ratesEndpoint}`,
            mailClassPayload,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Process response
          if (response.data && response.data.rates && response.data.rates.length > 0) {
            console.log(`Found ${response.data.rates.length} rates for ${mailClass}`);
            
            // Map response to our standard format
            const rates = response.data.rates.map(rate => {
              // Determine service name based on mail class
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
              
              // Determine estimated delivery days based on mail class
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
              
              // Determine if this is a carrier box
              const isCarrierBox = mailClassContainerType !== CONTAINER_TYPES.VARIABLE;
              const boxTypeName = isCarrierBox ? bestFitBox.name : 'Your Packaging';
              
              // For response mapping, use the same dimensions that were sent to the API
              // This ensures consistency between what's displayed and what was used for rate calculation
              const responseDimensions = {
                length: payloadLength,
                width: payloadWidth,
                height: payloadHeight,
                boxType: mailClassContainerType,
                boxTypeName: boxTypeName,
                // Include the original 3D packing dimensions for reference
                originalDimensions: result && result.type !== 'No Box Found' ? {
                  length: result.x,
                  width: result.y,
                  height: result.z
                } : null
              };
              
              return {
                carrier: 'USPS',
                service: serviceName,
                price: parseFloat(rate.price),
                estimatedDays: estimatedDays,
                dimensions: responseDimensions,
                isCarrierBox: isCarrierBox,
                specialServices: {
                  insurance: !!packageDetails.insuranceValue,
                  signature: !!packageDetails.signatureRequired
                }
              };
            });
            
            allRates.push(...rates);
          } else {
            console.log(`No rates found for ${mailClass}`);
            
            // For Priority Mail, try again with variable container if using flat rate box failed
            if (mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL && 
                mailClassContainerType !== CONTAINER_TYPES.VARIABLE) {
              console.log('Retrying Priority Mail with variable container...');
              
              try {
                // Create retry payload with variable container
                const retryPayload = {
                  ...mailClassPayload,
                  containerType: CONTAINER_TYPES.VARIABLE,
                  length: length,
                  width: width,
                  height: height,
                  // Update rate indicator for variable container
                  rateIndicator: mailClass === USPS_MAIL_CLASSES.PRIORITY_MAIL ? 'PM' : 'CP'
                };
                
                // Store dimensions for response mapping
                payloadLength = length;
                payloadWidth = width;
                payloadHeight = height;
                
                console.log('Retry payload:', JSON.stringify(retryPayload, null, 2));
                
                // Make retry API call
                const retryResponse = await axios.post(
                  `${USPS_CONFIG.apiBaseUrl}${USPS_CONFIG.ratesEndpoint}`,
                  retryPayload,
                  {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
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
                    
                    // For response mapping, use the same dimensions that were sent to the API
                    // This ensures consistency between what's displayed and what was used for rate calculation
                    const responseDimensions = {
                      length: payloadLength,
                      width: payloadWidth,
                      height: payloadHeight,
                      boxType: CONTAINER_TYPES.VARIABLE,
                      boxTypeName: 'Your Packaging',
                      // Include the original 3D packing dimensions for reference
                      originalDimensions: result && result.type !== 'No Box Found' ? {
                        length: result.x,
                        width: result.y,
                        height: result.z
                      } : null
                    };
                    
                    return {
                      carrier: 'USPS',
                      service: serviceName,
                      price: parseFloat(rate.price),
                      estimatedDays: estimatedDays,
                      dimensions: responseDimensions,
                      isCarrierBox: false,
                      specialServices: {
                        insurance: !!packageDetails.insuranceValue,
                        signature: !!packageDetails.signatureRequired
                      }
                    };
                  });
                  
                  allRates.push(...rates);
                } else {
                  console.log(`Retry for ${mailClass} failed: No rates returned`);
                  errors.push({
                    mailClass,
                    error: 'No rates available for this mail class with variable container'
                  });
                }
              } catch (retryError) {
                console.log(`Retry for ${mailClass} failed:`, retryError.message);
                errors.push({
                  mailClass,
                  error: `Retry failed: ${retryError.message}`
                });
              }
            } else {
              // Add error for this mail class
              errors.push({
                mailClass,
                error: 'No rates available for this mail class'
              });
            }
          }
        } catch (error) {
          console.log(`Error getting rates for ${mailClass}:`, error.message);
          
          // Add error to the collection
          errors.push({
            mailClass,
            error: error.response?.data?.error?.message || error.response?.data?.message || error.message
          });
        }
      } catch (classError) {
        console.error(`Error processing mail class ${mailClass}:`, classError.message);
        errors.push({
          mailClass,
          error: classError.message
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