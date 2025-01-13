import axios from 'axios';

const FEDEX_CONFIG = {
  apiKey: 'l79b1b174bc2334477a883a08cdfdbdcae',
  secretKey: 'a2b2e19da8f64c958cd858ff296185f9',
  baseURL: 'https://apis-sandbox.fedex.com',
};

export const getFedExAccessToken = async () => {
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', FEDEX_CONFIG.apiKey);
    formData.append('client_secret', FEDEX_CONFIG.secretKey);

    const response = await axios.post(
      `${FEDEX_CONFIG.baseURL}/oauth/token`,
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

    // Always use a FedEx box type
    const getFedExBox = (length, width, height) => {
      // FedEx box dimensions from smallest to largest
      const fedexBoxes = [
        { type: 'FEDEX_SMALL_BOX', dimensions: [10.875, 12.375, 1.5] },
        { type: 'FEDEX_MEDIUM_BOX', dimensions: [11.5, 13.25, 2.375] },
        { type: 'FEDEX_LARGE_BOX', dimensions: [17.5, 12, 3] },
        { type: 'FEDEX_EXTRA_LARGE_BOX', dimensions: [20, 20, 12] }
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

    const packagingType = getFedExBox(
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
      selectedBox: packagingType
    });

    const payload = {
      accountNumber: {
        value: "740561073"
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
            residential: true
          }
        },
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
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
          }
        }],
        packagingType: "YOUR_PACKAGING",
        rateRequestType: ["LIST", "ACCOUNT"],
        variableOptions: ["FREIGHT_GUARANTEE"],
        carrierCodes: ["FDXE", "FDXG"],
        requestedCurrency: "USD"
      }
    };

    console.log('\n=== FedEx API Request ===\n', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${FEDEX_CONFIG.baseURL}/rate/v1/rates/quotes`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-locale': 'en_US'
        }
      }
    );

    if (response.data.output.rateReplyDetails) {
      const rates = response.data.output.rateReplyDetails
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
                case "FEDEX_2_DAY":
                  estimatedDays = "2";
                  break;
                case "PRIORITY_OVERNIGHT":
                case "STANDARD_OVERNIGHT":
                  estimatedDays = "1";
                  break;
                default:
                  estimatedDays = "3-7";
              }
            }

            return {
              carrier: 'FedEx',
              service: serviceName,
              price: parseFloat(price),
              currency: 'USD',
              estimatedDays,
              dimensions: {
                length: dimensions.x,
                width: dimensions.y,
                height: dimensions.z,
                boxType: dimensions.type
              }
            };
          } catch (error) {
            console.error('Error processing FedEx rate:', error);
            return null;
          }
        })
        .filter(rate => rate !== null)
        .sort((a, b) => a.price - b.price);

      return rates;
    }

    return [];
  } catch (error) {
    console.error('Error in calculateFedExRates:', error);
    return [];
  }
};
