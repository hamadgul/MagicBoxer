// Mock shipping service with refined structure for accuracy
const CARRIERS = {
  USPS: {
    name: 'USPS',
    services: {
      'Priority Mail Express': { baseRate: 26.35, daysFactor: 0.3 },
      'Priority Mail': { baseRate: 8.70, daysFactor: 0.6 },
      'Ground Advantage': { baseRate: 7.50, daysFactor: 1.0 }
    }
  },
  UPS: {
    name: 'UPS',
    services: {
      'Ground': { baseRate: 8.50, daysFactor: 1.0 },
      '3 Day Select': { baseRate: 12.75, daysFactor: 0.7 },
      '2nd Day Air': { baseRate: 18.50, daysFactor: 0.5 },
      'Next Day Air': { baseRate: 29.99, daysFactor: 0.3 }
    }
  },
  FEDEX: {
    name: 'FedEx',
    services: {
      'Ground': { baseRate: 8.75, daysFactor: 1.0 },
      'Express Saver': { baseRate: 13.50, daysFactor: 0.7 },
      '2Day': { baseRate: 19.25, daysFactor: 0.5 },
      'Priority Overnight': { baseRate: 31.50, daysFactor: 0.3 }
    }
  }
};

const calculateZone = (fromZip, toZip) => {
  const zipDiff = Math.abs(parseInt(fromZip) - parseInt(toZip));
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
  Object.keys(dimensionalDivisor).forEach(carrier => {
    weights[carrier] = (length * width * height) / dimensionalDivisor[carrier];
  });
  return weights;
};

const calculateEstimatedDays = (zone, serviceDaysFactor) => {
  const baseDeliveryDays = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
  return Math.ceil(baseDeliveryDays[zone] * serviceDaysFactor);
};

const calculatePrice = (baseRate, billableWeight, zone, carrierId) => {
  const weightRate = carrierId === 'USPS' ? 0.55 : 0.75;
  const zoneMultiplier = carrierId === 'USPS' ? 0.08 : 0.1;
  const fuelSurcharge = carrierId === 'USPS' ? 1.1 : 1.12;
  const handlingFee = carrierId === 'USPS' ? 2.50 : 3.50;

  let price = baseRate;
  price += billableWeight * weightRate;
  price *= (1 + (zone * zoneMultiplier));
  price *= fuelSurcharge;
  price += handlingFee;

  return parseFloat(price.toFixed(2));
};

export const getShippingEstimates = async (packageDetails, fromZip, toZip) => {
  try {
    if (!packageDetails || !fromZip || !toZip) {
      return { success: false, error: 'Missing required shipping information' };
    }

    const { weight, length, width, height } = packageDetails;
    const actualWeight = parseFloat(weight);

    if (isNaN(actualWeight) || actualWeight <= 0) {
      return { success: false, error: 'Invalid package weight' };
    }

    const dimWeights = calculateDimensionalWeight(length, width, height);
    const zone = calculateZone(fromZip, toZip);

    const estimates = [];
    Object.entries(CARRIERS).forEach(([carrierId, carrier]) => {
      const dimWeight = dimWeights[carrierId];
      const billableWeight = Math.max(actualWeight, dimWeight);

      Object.entries(carrier.services).forEach(([serviceName, serviceDetails]) => {
        const price = calculatePrice(serviceDetails.baseRate, billableWeight, zone, carrierId);
        const estimatedDays = calculateEstimatedDays(zone, serviceDetails.daysFactor);

        estimates.push({
          carrier: carrier.name,
          service: serviceName,
          price,
          estimatedDays: `${estimatedDays} business day${estimatedDays > 1 ? 's' : ''}`
        });
      });
    });

    estimates.sort((a, b) => a.price - b.price);

    return { success: true, estimates };
  } catch (error) {
    console.error('Error in getShippingEstimates:', error);
    return { success: false, error: 'Failed to calculate shipping estimates' };
  }
};
