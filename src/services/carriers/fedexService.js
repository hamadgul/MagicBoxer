import axios from 'axios';
import { CARRIER_CONFIG } from '../../config/environment.js';

const FEDEX_CONFIG = CARRIER_CONFIG.FEDEX;

export const getFedExAccessToken = async () => {
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', FEDEX_CONFIG.API_KEY);
    formData.append('client_secret', FEDEX_CONFIG.SECRET_KEY);

    const response = await axios.post(
      `${FEDEX_CONFIG.BASE_URL}/oauth/token`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting FedEx access token:', error);
    throw error;
  }
};

export const calculateFedExRates = async (packageDetails, fromZip, toZip) => {
  try {
    const accessToken = await getFedExAccessToken();
    if (!accessToken) {
      console.error('Failed to get FedEx access token');
      return [];
    }

    console.log('\n=== FedEx Request Details ===');
    console.log('Package Weight:', Math.max(Math.ceil(packageDetails.weight), 1), 'LB');
    console.log('From ZIP:', fromZip);
    console.log('To ZIP:', toZip);

    const result = packageDetails.fedexResult;
    console.log('Debug - FedEx Result:', result);

    let dimensions;
    if (!result || result.type === 'No Box Found') {
      dimensions = {
        x: packageDetails.length,
        y: packageDetails.width,
        z: packageDetails.height,
        type: 'Custom'
      };
    } else {
      dimensions = {
        x: result.x,
        y: result.y,
        z: result.z,
        type: result.type
      };
    }

    // Get FedEx box type that fits the dimensions
    const getFedExBox = (length, width, height) => {
      // FedEx box dimensions from smallest to largest (length, width, height in inches)
      const fedexBoxes = [
        { type: 'FEDEX_SMALL_BOX', dimensions: [12.375, 10.875, 8.375] }, // FedEx Small Box
        { type: 'FEDEX_MEDIUM_BOX', dimensions: [13.25, 11.5, 10.9] },      // FedEx Medium Box
        { type: 'FEDEX_LARGE_BOX', dimensions: [17.5, 12.375, 10.9] },      // FedEx Large Box
        { type: 'FEDEX_EXTRA_LARGE_BOX', dimensions: [23.625, 17.375, 12.5] } // FedEx Extra Large Box
      ];

      // Sort dimensions from smallest to largest
      const itemDims = [length, width, height].sort((a, b) => a - b);
      
      // Find the smallest box that fits the item
      for (const box of fedexBoxes) {
        const boxDims = box.dimensions.sort((a, b) => a - b);
        if (itemDims[0] <= boxDims[0] && 
            itemDims[1] <= boxDims[1] && 
            itemDims[2] <= boxDims[2]) {
          return box.type;
        }
      }
      
      // If no box fits, use the largest box
      return 'FEDEX_EXTRA_LARGE_BOX';
    };

    const fedexBoxType = getFedExBox(
      Math.ceil(dimensions.x),
      Math.ceil(dimensions.y),
      Math.ceil(dimensions.z)
    );

    console.log('Debug - FedEx packaging:', {
      dimensions: {
        length: Math.ceil(dimensions.x),
        width: Math.ceil(dimensions.y),
        height: Math.ceil(dimensions.z)
      },
      selectedBox: fedexBoxType
    });

    // Format date for FedEx API (YYYY-MM-DD format)
    const formattedDate = packageDetails.shipmentDate ? 
      packageDetails.shipmentDate.toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    // Create base request payload
    const createPayload = (packagingType, boxType = null) => ({
      accountNumber: {
        value: FEDEX_CONFIG.ACCOUNT_NUMBER
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: fromZip,
            countryCode: "US"
          }
        },
        recipient: {
          address: {
            postalCode: toZip,
            countryCode: "US",
            residential: packageDetails.isResidential !== false
          }
        },
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        shipDatestamp: formattedDate,
        requestedPackageLineItems: [{
          weight: {
            value: Math.max(Math.ceil(packageDetails.weight), 1),
            units: "LB"
          },
          dimensions: {
            length: Math.ceil(dimensions.x),
            width: Math.ceil(dimensions.y),
            height: Math.ceil(dimensions.z),
            units: "IN"
          },
          // Add insurance value if provided
          ...(packageDetails.insuranceValue ? {
            declaredValue: {
              amount: packageDetails.insuranceValue,
              currency: "USD"
            }
          } : {}),
          // Add signature option if required
          ...(packageDetails.signatureRequired ? {
            specialServicesRequested: {
              specialServiceTypes: ["SIGNATURE_OPTION"],
              signatureOptionDetail: {
                optionType: "DIRECT"
              }
            }
          } : {})
        }],
        packagingType: packagingType,
        rateRequestType: ["LIST", "ACCOUNT"],
        variableOptions: ["FREIGHT_GUARANTEE"],
        carrierCodes: ["FDXE", "FDXG"],
        requestedCurrency: "USD"
      }
    });

    // Try both customer packaging and FedEx packaging
    const customerPackagingPayload = createPayload("YOUR_PACKAGING");
    const fedexPackagingPayload = createPayload(fedexBoxType);
    
    console.log('\n=== FedEx Customer Packaging Request ===\n', JSON.stringify(customerPackagingPayload, null, 2));
    
    // Make requests for both packaging types
    const makeRequest = async (payload, isCarrierBox) => {
      try {
        console.log(`Making FedEx request for ${isCarrierBox ? 'carrier' : 'customer'} packaging...`);
        
        const response = await axios.post(
          `${FEDEX_CONFIG.BASE_URL}/rate/v1/rates/quotes`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'X-locale': 'en_US'
            },
            timeout: 30000 // Increase timeout to 30 seconds
          }
        );

        if (response.data && response.data.output && response.data.output.rateReplyDetails) {
          return response.data.output.rateReplyDetails
            .map(rate => {
              try {
                const serviceName = rate.serviceName;
                const price = rate.ratedShipmentDetails[0].totalNetFedExCharge;
                
                // Handle transit time more safely
                let estimatedDays;
                if (rate.commit?.transitTime) {
                  estimatedDays = rate.commit.transitTime.includes("DAY") ? 
                    parseInt(rate.commit.transitTime.split("_")[0]) : 
                    rate.commit.transitTime;
                } else {
                  // Default estimated days based on service type
                  switch(serviceName) {
                    case "FEDEX_GROUND":
                      estimatedDays = "3-5";
                      break;
                    case "FedEx 2Day®":
                    case "FedEx 2Day® AM":
                      estimatedDays = "2";
                      break;
                    case "FedEx Priority Overnight®":
                    case "FedEx Standard Overnight®":
                    case "FedEx First Overnight®":
                      estimatedDays = "> 1";
                      break;
                    default:
                      estimatedDays = "3-7";
                  }
                }

                // Use the exact price from the API without any modifications
                const finalPrice = parseFloat(price);
                
                // Log the response to debug pricing
                console.log(`FedEx Rate for ${serviceName} with ${isCarrierBox ? 'FedEx Box' : 'Customer Box'}: $${finalPrice}`);
                
                return {
                  carrier: 'FedEx',
                  service: serviceName,
                  price: finalPrice,
                  currency: 'USD',
                  estimatedDays,
                  dimensions: {
                    length: dimensions.x,
                    width: dimensions.y,
                    height: dimensions.z,
                    boxType: isCarrierBox ? fedexBoxType : 'YOUR_PACKAGING'
                  },
                  isCarrierBox: isCarrierBox
                };
              } catch (error) {
                console.error('Error processing FedEx rate:', error);
                return null;
              }
            })
            .filter(rate => rate !== null);
        }
        return [];
      } catch (error) {
        console.error(`Error in FedEx ${isCarrierBox ? 'carrier' : 'customer'} packaging request:`, error);
        
        // Return an error object instead of empty array
        return [{
          carrier: 'FedEx',
          service: payload.requestedShipment.packagingType === 'YOUR_PACKAGING' ? 
                  'Customer Packaging' : 'FedEx Packaging',
          error: error.response && error.response.status === 503 ? 
                 'FedEx service temporarily unavailable. Please try again later.' : 
                 'Unable to get FedEx rates at this time.'
        }];
      }
    };
    
    // Get rates for both packaging types
    const customerPackagingRates = await makeRequest(customerPackagingPayload, false);
    let fedexPackagingRates = [];
    
    // Only try FedEx packaging if the dimensions fit in a FedEx box
    if (fedexBoxType) {
      console.log('\n=== FedEx Carrier Packaging Request ===\n', JSON.stringify(fedexPackagingPayload, null, 2));
      fedexPackagingRates = await makeRequest(fedexPackagingPayload, true);
    }

    // Combine and sort all rates
    const allRates = [...customerPackagingRates, ...fedexPackagingRates]
      .sort((a, b) => a.price - b.price);

    return allRates;
  } catch (error) {
    console.error('Error in calculateFedExRates:', error);
    return [];
  }
};
