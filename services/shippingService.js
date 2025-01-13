import axios from 'axios';
import { pack } from '../packing_algo/packing';

const CARRIERS = {
  USPS: {
    name: "USPS",
    services: {
      "Priority Mail Express": { baseRate: 26.35, daysFactor: 0.3 },
      "Priority Mail": { baseRate: 8.7, daysFactor: 0.6 },
      "Ground Advantage": { baseRate: 7.5, daysFactor: 1.0 },
    },
    dimDivisor: 166
  },
  UPS: {
    name: "UPS",
    dimDivisor: 139
  },
  FEDEX: {
    name: "FedEx",
    dimDivisor: 139
  },
};

const UPS_CONFIG = {
  clientId: 'reUV3PzybRlMT0iX9GQPnwlTKweX9Wytfzk3q5ZxiQQeWrLv',
  clientSecret: 'hJmxM48BOykCR8xtXjffYQUKQIRqdxExG6o2vV0FlkD8GkuuFHjl7QIdaGHyAkYg',
  baseURL: 'https://onlinetools.ups.com/api',
};

const FEDEX_CONFIG = {
  apiKey: 'l79b1b174bc2334477a883a08cdfdbdcae',
  secretKey: 'a2b2e19da8f64c958cd858ff296185f9',
  baseURL: 'https://apis-sandbox.fedex.com'
};

const getUPSAccessToken = async () => {
  try {
    const response = await axios.post(
      'https://onlinetools.ups.com/security/v1/oauth/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-merchant-id': UPS_CONFIG.clientId,
        },
        auth: {
          username: UPS_CONFIG.clientId,
          password: UPS_CONFIG.clientSecret,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting UPS access token:', error);
    throw error;
  }
};

const getFedExAccessToken = async () => {
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
    console.error('Error getting FedEx access token:', error.response?.data || error.message);
    throw error;
  }
};

const getUPSRates = async (packageDetails, fromZip, toZip) => {
  try {
    const result = packageDetails.upsResult;

    let dimensions;
    let packagingType;

    if (!result || result.type === 'No Box Found') {
      dimensions = {
        x: packageDetails.length,
        y: packageDetails.width,
        z: packageDetails.height,
        type: 'Standard'
      };
      packagingType = '02'; // Customer Packaging
    } else {
      dimensions = {
        x: result.x,
        y: result.y,
        z: result.z,
        type: result.type
      };

      const upsPackagingMap = {
        'UPS Small Box': '21',
        'UPS Medium Box': '22',
        'UPS Large Box': '23',
        'UPS Extra Large Box': '24',
        'UPS Pak': '04',
        'UPS Express Box': '25',
        'UPS Express Box - Small': '21',
        'UPS Express Box - Medium': '22',
        'UPS Express Box - Large': '23',
        'UPS Express Tube': '24'
      };

      packagingType = upsPackagingMap[dimensions.type] || "02"; // Use UPS packaging if available, otherwise customer supplied
    }

    const accessToken = await getUPSAccessToken();
    
    const serviceOptions = [
      { Code: "01", Description: "Next Day Air" },
      { Code: "02", Description: "2nd Day Air" },
      { Code: "03", Description: "Ground" },
      { Code: "12", Description: "3 Day Select" },
      { Code: "13", Description: "Next Day Air Saver" },
      { Code: "14", Description: "UPS Next Day Air Early" },
      { Code: "59", Description: "2nd Day Air A.M." }
    ];

    const requests = serviceOptions.map(service => {
      const payload = {
        RateRequest: {
          Request: {
            TransactionReference: {
              CustomerContext: "Rate Request",
            }
          },
          Shipment: {
            Shipper: {
              Address: {
                PostalCode: fromZip,
                CountryCode: "US"
              }
            },
            ShipTo: {
              Address: {
                PostalCode: toZip,
                CountryCode: "US",
                ResidentialAddressIndicator: service.Code === "03" || service.Code === "12" ? "true" : undefined
              }
            },
            Service: {
              Code: service.Code,
              Description: service.Description
            },
            Package: {
              PackagingType: {
                Code: packagingType,
                Description: "Package"
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: "IN",
                  Description: "Inches"
                },
                Length: Math.ceil(dimensions.x).toString(),
                Width: Math.ceil(dimensions.y).toString(),
                Height: Math.ceil(dimensions.z).toString()
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: "LBS",
                  Description: "Pounds"
                },
                Weight: Math.max(Math.ceil(packageDetails.weight), 1).toString()
              }
            }
          }
        }
      };

      console.log('\n=== UPS API Request ===\n', {
        service: service.Description,
        boxDimensions: {
          length: Math.ceil(dimensions.x),
          width: Math.ceil(dimensions.y),
          height: Math.ceil(dimensions.z),
          originalBoxType: dimensions.type,
          apiPackagingType: packagingType
        },
        weight: Math.max(Math.ceil(packageDetails.weight), 1)
      });

      return axios.post(
        `${UPS_CONFIG.baseURL}/rating/v1/rate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'transId': 'string',
            'transactionSrc': 'testing'
          }
        }
      ).then(response => {
        if (response.data.RateResponse?.RatedShipment) {
          const rate = response.data.RateResponse.RatedShipment;
          console.log('Processing UPS rate:', {
            service: service.Description,
            code: service.Code,
            price: rate.TotalCharges?.MonetaryValue,
            days: rate.GuaranteedDelivery?.BusinessDaysInTransit
          });

          const estimatedDays = rate.GuaranteedDelivery?.BusinessDaysInTransit || 
                              (service.Code === "03" ? "3-5" : 
                               service.Code === "02" ? "2" :
                               service.Code === "01" ? "1" :
                               service.Code === "12" ? "3" :
                               service.Code === "13" ? "1" :
                               service.Code === "14" ? "1" :
                               service.Code === "59" ? "2" : "Unknown");

          return {
            carrier: 'UPS',
            service: service.Description,
            price: parseFloat(rate.TotalCharges.MonetaryValue),
            currency: rate.TotalCharges.CurrencyCode,
            estimatedDays,
            dimensions: {
              length: dimensions.x,
              width: dimensions.y,
              height: dimensions.z,
              boxType: dimensions.type
            }
          };
        }
        console.log('No rate found for UPS service:', service.Description);
        return null;
      }).catch(error => {
        console.log('Error getting UPS rate for', service.Description, ':', error.response?.data || error.message);
        return null;
      });
    });

    const responses = await Promise.all(requests);
    const validRates = responses.filter(rate => rate !== null);
    console.log('Valid UPS rates:', validRates);

    if (validRates.length > 0) {
      return validRates.sort((a, b) => a.price - b.price);
    }
    return [];
  } catch (error) {
    return [];
  }
};

const calculateFedExRates = async (packageDetails, fromZip, toZip) => {
  try {
    const accessToken = await getFedExAccessToken();
    if (!accessToken) {
      console.error('Failed to get FedEx access token');
      return [];
    }

    console.log('\n=== FedEx Request Details ===');
    console.log('Package Weight:', Math.max(Math.ceil(packageDetails.weight), 1), 'LB');
    console.log('Dimensions:', {
      length: Math.ceil(packageDetails.length),
      width: Math.ceil(packageDetails.width),
      height: Math.ceil(packageDetails.height),
      units: 'IN'
    });
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

    try {
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

      console.log('\n=== FedEx API Response Status ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      if (response.data?.output?.alerts) {
        console.log('\n=== FedEx API Alerts ===');
        console.log(JSON.stringify(response.data.output.alerts, null, 2));
      }

      if (response.data?.output?.rateReplyDetails) {
        console.log('\n=== FedEx Rate Details ===');
        response.data.output.rateReplyDetails.forEach(rate => {
          console.log('\nService:', rate.serviceType);
          console.log('Price:', rate.ratedShipmentDetails[0].totalNetCharge);
          console.log('Transit Time:', rate.transitTime);
        });

        const getFedExEstimatedDays = (serviceType) => {
          const estimates = {
            'FIRST_OVERNIGHT': '1',
            'PRIORITY_OVERNIGHT': '1',
            'STANDARD_OVERNIGHT': '1',
            'FEDEX_2_DAY_AM': '2',
            'FEDEX_2_DAY': '2',
            'FEDEX_EXPRESS_SAVER': '3',
            'FEDEX_GROUND': '3-5',
            'GROUND_HOME_DELIVERY': '3-5'
          };
          return estimates[serviceType] || 'Unknown';
        };

        const rates = response.data.output.rateReplyDetails.map(rate => {
          const service = rate.serviceType.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ')
            .replace('Fedex', 'FedEx')
            .replace('Ground Home Delivery', 'Ground');

          return {
            carrier: 'FedEx',
            service,
            price: parseFloat(rate.ratedShipmentDetails[0].totalNetCharge),
            currency: 'USD',
            estimatedDays: getFedExEstimatedDays(rate.serviceType),
            dimensions: {
              length: dimensions.x,
              width: dimensions.y,
              height: dimensions.z,
              boxType: dimensions.type
            }
          };
        });

        console.log('\n=== Final FedEx Rates ===');
        console.log(JSON.stringify(rates, null, 2));
        return rates;
      }

      console.log('\nNo FedEx rates found in response');
      return [];
    } catch (error) {
      console.error('\n=== FedEx API Error ===');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Request made but no response received');
        console.error(error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      return [];
    }
  } catch (error) {
    return [];
  }
};

const calculateUSPSRates = (packageDetails, fromZip, toZip) => {
  const zone = calculateZone(fromZip, toZip);
  const dimWeight = calculateDimWeight(
    packageDetails.length * packageDetails.width * packageDetails.height,
    CARRIERS.USPS.dimDivisor
  );
  const billableWeight = Math.max(packageDetails.weight, dimWeight);

  return Object.entries(CARRIERS.USPS.services).map(([serviceName, serviceDetails]) => {
    const price = calculatePrice(serviceDetails.baseRate, billableWeight, zone, 'USPS');
    const estimatedDays = calculateEstimatedDays(zone, serviceDetails.daysFactor);

    return {
      carrier: 'USPS',
      service: serviceName,
      price: parseFloat(price.toFixed(2)),
      estimatedDays: estimatedDays,
      isMockRate: true,
      dimensions: {
        length: packageDetails.length,
        width: packageDetails.width,
        height: packageDetails.height
      }
    };
  });
};

const calculatePrice = (baseRate, billableWeight, zone, carrierId) => {
  const weightRate = 0.55;
  const zoneMultiplier = 0.08;
  const fuelSurcharge = 1.1;
  const handlingFee = 2.5;

  let price = baseRate;
  price += billableWeight * weightRate;
  price *= 1 + zone * zoneMultiplier;
  price *= fuelSurcharge;
  price += handlingFee;

  return price;
};

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

const calculateEstimatedDays = (zone, serviceDaysFactor) => {
  const baseDeliveryDays = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
  return Math.ceil(baseDeliveryDays[zone] * serviceDaysFactor);
};

const calculateDimWeight = (volume, dimDivisor) => {
  return (volume / dimDivisor);
};

export const getShippingEstimates = async (packageDetails, fromZip, toZip) => {
  try {
    console.log('\n=== Getting Shipping Estimates ===');
    console.log('Package Details:', packageDetails);
    console.log('From ZIP:', fromZip);
    console.log('To ZIP:', toZip);

    if (!packageDetails || !fromZip || !toZip) {
      throw new Error('Missing required shipping details');
    }

    const estimates = [];

    // Get USPS mock rates
    console.log('\n=== Getting USPS Mock Rates ===');
    const uspsRates = calculateUSPSRates(packageDetails, fromZip, toZip);
    estimates.push(...uspsRates);

    // Get real UPS rates from API
    console.log('\n=== Getting UPS API Rates ===');
    const upsRates = await getUPSRates(packageDetails, fromZip, toZip);
    if (Array.isArray(upsRates)) {
      estimates.push(...upsRates);
    }

    // Get real FedEx rates from API
    console.log('\n=== Getting FedEx API Rates ===');
    const fedexRates = await calculateFedExRates({...packageDetails}, fromZip, toZip);
    if (Array.isArray(fedexRates)) {
      estimates.push(...fedexRates);
    }

    // Sort all estimates by price
    const sortedEstimates = estimates.sort((a, b) => a.price - b.price);

    console.log('\n=== Final Estimates ===');
    console.log('Total estimates:', sortedEstimates.length);
    console.log('All estimates:', sortedEstimates);

    return {
      success: true,
      estimates: sortedEstimates
    };
  } catch (error) {
    console.error("Error calculating shipping estimates:", error);
    return {
      success: false,
      error: "Failed to calculate shipping estimates",
    };
  }
};
