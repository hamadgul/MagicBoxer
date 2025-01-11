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
    services: {
      Ground: { baseRate: 8.5, daysFactor: 1.0 },
      "3 Day Select": { baseRate: 12.75, daysFactor: 0.7 },
      "2nd Day Air": { baseRate: 18.5, daysFactor: 0.5 },
      "Next Day Air": { baseRate: 29.99, daysFactor: 0.3 },
    },
    dimDivisor: 139
  },
  FEDEX: {
    name: "FedEx",
    services: {
      Ground: { baseRate: 8.75, daysFactor: 1.0 },
      "Express Saver": { baseRate: 13.5, daysFactor: 0.7 },
      "2Day": { baseRate: 19.25, daysFactor: 0.5 },
      "Priority Overnight": { baseRate: 31.5, daysFactor: 0.3 },
    },
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

      const packagingTypeMap = {
        'Small Box': '21',
        'Medium Box': '01',
        'Large Box': '01',
        'Extra Large Box': '01',
        'Standard': '02'
      };
      packagingType = packagingTypeMap[result.type] || '02';
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
                Code: "02",  // Customer Supplied Package
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

    const result = packageDetails.fedexResult;

    console.log('Debug - FedEx Result:', result); // Debug log

    let dimensions;
    let packagingType;

    if (!result || result.type === 'No Box Found') {
      dimensions = {
        x: packageDetails.length,
        y: packageDetails.width,
        z: packageDetails.height,
        type: 'Standard'
      };
      packagingType = 'YOUR_PACKAGING';
    } else {
      dimensions = {
        x: result.x,
        y: result.y,
        z: result.z,
        type: result.type
      };

      // Map the box type to FedEx API packaging type
      const packagingTypeMap = {
        'FedEx Small Box': 'FEDEX_SMALL_BOX',
        'FedEx Medium Box': 'FEDEX_MEDIUM_BOX',
        'FedEx Large Box': 'FEDEX_LARGE_BOX',
        'FedEx Extra Large Box': 'FEDEX_EXTRA_LARGE_BOX',
        'FedEx Tube': 'FEDEX_TUBE',
        'FedEx Envelope': 'FEDEX_ENVELOPE',
        'FedEx Pak': 'FEDEX_PAK',
        'FedEx Pak Padded': 'FEDEX_PAK',
        'Standard': 'YOUR_PACKAGING',
        'Heavy-duty Double-Walled Box': 'YOUR_PACKAGING',
        'FedEx Box': 'FEDEX_BOX',
        'FedEx Pak Padded': 'FEDEX_PAK_PADDED',
        'FedEx Envelope': 'FEDEX_ENVELOPE',
        'FedEx Tube': 'FEDEX_TUBE',
        'FedEx 10kg Box': 'FEDEX_10KG_BOX',
        'FedEx 25kg Box': 'FEDEX_25KG_BOX',
        'FedEx Extra Large Box': 'FEDEX_EXTRA_LARGE_BOX',
        'FedEx Large Box': 'FEDEX_LARGE_BOX',
        'FedEx Medium Box': 'FEDEX_MEDIUM_BOX',
        'FedEx Padded Pak': 'FEDEX_PADDED_PAK',
        'FedEx Small Box': 'FEDEX_SMALL_BOX',
      };

      console.log('Debug - FedEx box type before mapping:', result.type); // Debug log
      packagingType = packagingTypeMap[result.type];
      console.log('Debug - FedEx box type after mapping:', packagingType); // Debug log

      // If mapping returns undefined, default to YOUR_PACKAGING
      if (!packagingType) {
        console.log('Warning: No matching FedEx packaging type found for:', result.type);
        packagingType = 'YOUR_PACKAGING';
      }
    }

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
            countryCode: "US"
          }
        },
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        rateRequestType: ["LIST", "ACCOUNT"],
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
          packageSpecialServices: {
            specialServiceTypes: ["SIGNATURE_OPTION"],
            signatureOptionType: "DIRECT"
          }
        }],
        packagingType: packagingType,
        totalPackageCount: "1",
        preferredCurrency: "USD"
      },
      carrierCodes: ["FDXE", "FDXG"],
      returnTransitTimes: true
    };

    console.log('\n=== FedEx API Request ===\n', {
      boxDimensions: {
        length: Math.ceil(dimensions.x),
        width: Math.ceil(dimensions.y),
        height: Math.ceil(dimensions.z),
        originalBoxType: dimensions.type,
        apiPackagingType: packagingType
      },
      weight: Math.max(Math.ceil(packageDetails.weight), 1)
    });

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

    if (response.data?.output?.rateReplyDetails) {
      const rates = response.data.output.rateReplyDetails.map(rate => ({
        carrier: 'FedEx',
        service: rate.serviceType.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0) + word.slice(1).toLowerCase())
          .join(' ')
          .replace('Fedex', 'FedEx'),
        price: parseFloat(rate.ratedShipmentDetails[0].totalNetCharge),
        currency: 'USD',
        estimatedDays: rate.transitTime || 'Unknown',
        dimensions: {
          length: dimensions.x,
          width: dimensions.y,
          height: dimensions.z,
          boxType: dimensions.type
        }
      }));
      return rates;
    }
    return [];
  } catch (error) {
    return [];
  }
};

const getDefaultEstimatedDays = (serviceCode) => {
  const estimatedDays = {
    '01': 1,  // Next Day Air
    '02': 2,  // 2nd Day Air
    '03': 5,  // Ground
    '12': 3,  // 3 Day Select
    '13': 1,  // Next Day Air Saver
    '14': 1,  // Next Day Air Early
    '59': 2   // 2nd Day Air A.M.
  };
  return estimatedDays[serviceCode] || 5;
};

const getFallbackUPSRates = (packageDetails, fromZip, toZip) => {
  return Object.entries(CARRIERS.UPS.services).map(([serviceName, serviceDetails]) => {
    const zone = calculateZone(fromZip, toZip);
    const billableWeight = Math.max(
      packageDetails.weight,
      calculateDimensionalWeight(
        packageDetails.length || 1,
        packageDetails.width || 1,
        packageDetails.height || 1
      ).UPS
    );
    
    return {
      carrier: 'UPS',
      service: serviceName,
      price: calculatePrice(serviceDetails.baseRate, billableWeight, zone, 'UPS'),
      estimatedDays: calculateEstimatedDays(zone, serviceDetails.daysFactor),
      isEstimate: true
    };
  });
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

const calculateDimensionalWeight = (length, width, height) => {
  const dimensionalDivisor = { USPS: 166, UPS: 139, FEDEX: 139 };
  const weights = {};
  Object.keys(dimensionalDivisor).forEach((carrier) => {
    weights[carrier] = (length * width * height) / dimensionalDivisor[carrier];
  });
  return weights;
};

const calculateEstimatedDays = (zone, serviceDaysFactor) => {
  const baseDeliveryDays = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
  return Math.ceil(baseDeliveryDays[zone] * serviceDaysFactor);
};

const calculatePrice = (baseRate, billableWeight, zone, carrierId) => {
  const weightRate = carrierId === "USPS" ? 0.55 : 0.75;
  const zoneMultiplier = carrierId === "USPS" ? 0.08 : 0.1;
  const fuelSurcharge = carrierId === "USPS" ? 1.1 : 1.12;
  const handlingFee = carrierId === "USPS" ? 2.5 : 3.5;

  let price = baseRate;
  price += billableWeight * weightRate;
  price *= 1 + zone * zoneMultiplier;
  price *= fuelSurcharge;
  price += handlingFee;

  return parseFloat(price.toFixed(2));
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

    console.log('\n=== Getting UPS Rates ===');
    const upsRates = await getUPSRates(packageDetails, fromZip, toZip);
    console.log('UPS Rates received:', upsRates);
    if (Array.isArray(upsRates)) {
      estimates.push(...upsRates);
    }

    console.log('\n=== Getting FedEx Rates ===');
    const fedexRates = await calculateFedExRates({...packageDetails}, fromZip, toZip);
    if (Array.isArray(fedexRates)) {
      estimates.push(...fedexRates);
    }

    console.log('\n=== Final Estimates ===');
    console.log('Total estimates:', estimates.length);
    console.log('All estimates:', estimates);

    return {
      success: true,
      estimates: estimates.sort((a, b) => a.price - b.price)
    };
  } catch (error) {
    console.error("Error calculating shipping estimates:", error);
    return {
      success: false,
      error: "Failed to calculate shipping estimates",
    };
  }
};
