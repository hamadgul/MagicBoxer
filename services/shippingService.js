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
  },
  UPS: {
    name: "UPS",
    services: {
      Ground: { baseRate: 8.5, daysFactor: 1.0 },
      "3 Day Select": { baseRate: 12.75, daysFactor: 0.7 },
      "2nd Day Air": { baseRate: 18.5, daysFactor: 0.5 },
      "Next Day Air": { baseRate: 29.99, daysFactor: 0.3 },
    },
  },
  FEDEX: {
    name: "FedEx",
    services: {
      Ground: { baseRate: 8.75, daysFactor: 1.0 },
      "Express Saver": { baseRate: 13.5, daysFactor: 0.7 },
      "2Day": { baseRate: 19.25, daysFactor: 0.5 },
      "Priority Overnight": { baseRate: 31.5, daysFactor: 0.3 },
    },
  },
};

const UPS_CONFIG = {
  clientId: 'reUV3PzybRlMT0iX9GQPnwlTKweX9Wytfzk3q5ZxiQQeWrLv',
  clientSecret: 'hJmxM48BOykCR8xtXjffYQUKQIRqdxExG6o2vV0FlkD8GkuuFHjl7QIdaGHyAkYg',
  baseURL: 'https://onlinetools.ups.com/api',
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

const getUPSRates = async (packageDetails, fromZip, toZip) => {
  try {
    const accessToken = await getUPSAccessToken();
    
    // Use the same box dimensions that were calculated in Display3D
    let dimensions = { x: 12, y: 12, z: 12, type: "Standard Box" }; // Default dimensions
    
    if (packageDetails.length && packageDetails.width && packageDetails.height) {
      dimensions = {
        x: packageDetails.length,
        y: packageDetails.width,
        z: packageDetails.height,
        type: "UPS Box"
      };
    }

    // List of UPS service codes to request
    const serviceOptions = [
      { Code: "01", Description: "Next Day Air" },
      { Code: "02", Description: "2nd Day Air" },
      { Code: "03", Description: "Ground" },
      { Code: "12", Description: "3 Day Select" },
      { Code: "13", Description: "Next Day Air Saver" },
      { Code: "14", Description: "UPS Next Day Air Early" },
      { Code: "59", Description: "2nd Day Air A.M." }
    ];

    // Make parallel requests for all service types
    const ratePromises = serviceOptions.map(service => {
      const rateRequest = {
        RateRequest: {
          Request: {
            RequestOption: "Rate",
            TransactionReference: {
              CustomerContext: `Rating for ${service.Description}`
            }
          },
          Shipment: {
            Shipper: {
              Name: "Shipper Name",
              Address: {
                PostalCode: fromZip,
                CountryCode: "US"
              }
            },
            ShipTo: {
              Name: "Ship To Name",
              Address: {
                PostalCode: toZip,
                CountryCode: "US"
              }
            },
            ShipFrom: {
              Name: "Ship From Name",
              Address: {
                PostalCode: fromZip,
                CountryCode: "US"
              }
            },
            Service: {
              Code: service.Code,
              Description: service.Description
            },
            Package: {
              PackagingType: {
                Code: "02",
                Description: "Package"
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: "IN",
                  Description: "Inches"
                },
                Length: String(Math.ceil(dimensions.x)),
                Width: String(Math.ceil(dimensions.y)),
                Height: String(Math.ceil(dimensions.z))
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: "LBS",
                  Description: "Pounds"
                },
                Weight: String(Math.max(Math.ceil(packageDetails.weight), 1))
              }
            }
          }
        }
      };

      return axios.post(
        `${UPS_CONFIG.baseURL}/rating/v1/rate`,
        rateRequest,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'transId': `trans_${Date.now()}_${service.Code}`,
            'transactionSrc': 'MagicBoxer'
          }
        }
      ).then(response => {
        if (response.data.RateResponse?.RatedShipment) {
          const rate = response.data.RateResponse.RatedShipment;
          return {
            carrier: 'UPS',
            service: service.Description,
            price: parseFloat(rate.TotalCharges?.MonetaryValue || '0'),
            estimatedDays: rate.GuaranteedDelivery?.BusinessDaysInTransit || 
                          getDefaultEstimatedDays(service.Code),
            dimensions: {
              length: dimensions.x,
              width: dimensions.y,
              height: dimensions.z,
              boxType: dimensions.type
            }
          };
        }
        return null;
      }).catch(error => {
        console.error(`Error getting UPS rate for ${service.Description}:`, error.response?.data || error.message);
        return null;
      });
    });

    const results = await Promise.all(ratePromises);
    const validRates = results.filter(rate => rate !== null);

    if (validRates.length > 0) {
      return validRates.sort((a, b) => a.price - b.price);
    }
    
    // If we can't get any real rates, fall back to estimates
    console.log('No rates returned from UPS API, falling back to estimates');
    return getFallbackUPSRates(packageDetails, fromZip, toZip);
  } catch (error) {
    console.error('Error getting UPS rates:', error.response?.data || error.message);
    return getFallbackUPSRates(packageDetails, fromZip, toZip);
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

export const getShippingEstimates = async (packageDetails, fromZip, toZip) => {
  try {
    if (!packageDetails || !fromZip || !toZip) {
      return { success: false, error: "Missing required shipping information" };
    }

    const { weight, length, width, height } = packageDetails;
    const actualWeight = parseFloat(weight);

    if (isNaN(actualWeight) || actualWeight <= 0) {
      return { success: false, error: "Invalid package weight" };
    }

    const dimWeights = calculateDimensionalWeight(length, width, height);
    const zone = calculateZone(fromZip, toZip);

    const estimates = [];
    
    // Get real UPS rates
    const upsRates = await getUPSRates(packageDetails, fromZip, toZip);
    estimates.push(...upsRates);

    // Calculate rates for other carriers using existing logic
    Object.entries(CARRIERS).forEach(([carrierId, carrier]) => {
      if (carrierId === 'UPS') return; // Skip UPS since we're using real rates
      
      const dimWeight = dimWeights[carrierId];
      const billableWeight = Math.max(actualWeight, dimWeight);

      Object.entries(carrier.services).forEach(
        ([serviceName, serviceDetails]) => {
          const price = calculatePrice(
            serviceDetails.baseRate,
            billableWeight,
            zone,
            carrierId
          );
          const estimatedDays = calculateEstimatedDays(
            zone,
            serviceDetails.daysFactor
          );

          estimates.push({
            carrier: carrier.name,
            service: serviceName,
            price,
            estimatedDays: `${estimatedDays} business day${
              estimatedDays > 1 ? "s" : ""
            }`,
          });
        }
      );
    });

    return {
      success: true,
      estimates: estimates.sort((a, b) => a.price - b.price),
    };
  } catch (error) {
    console.error("Error calculating shipping estimates:", error);
    return {
      success: false,
      error: "Failed to calculate shipping estimates",
    };
  }
};
