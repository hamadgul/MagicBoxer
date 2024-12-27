// Mock shipping service that provides realistic estimates
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
  // Simple mock zone calculation based on zip code difference
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
  // Standard dimensional weight divisor (varies by carrier)
  const dimensionalDivisor = {
    USPS: 166,
    UPS: 139,
    FEDEX: 139
  };
  
  const weights = {};
  Object.keys(dimensionalDivisor).forEach(carrier => {
    weights[carrier] = (length * width * height) / dimensionalDivisor[carrier];
  });
  return weights;
};

const calculateEstimatedDays = (zone, serviceDaysFactor) => {
  // Base delivery days by zone
  const baseDeliveryDays = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7
  };
  
  // Apply service speed factor and round up
  return Math.ceil(baseDeliveryDays[zone] * serviceDaysFactor);
};

export const getShippingEstimates = async (packageDetails, fromZip, toZip) => {
  try {
    console.log('Getting shipping estimates for:', { packageDetails, fromZip, toZip });
    
    if (!packageDetails || !fromZip || !toZip) {
      return { success: false, error: 'Missing required shipping information' };
    }

    const { weight, length, width, height } = packageDetails;
    const actualWeight = parseFloat(weight);
    
    if (isNaN(actualWeight) || actualWeight <= 0) {
      return { success: false, error: 'Invalid package weight' };
    }

    // Calculate dimensional weight for each carrier
    const dimWeights = calculateDimensionalWeight(length, width, height);

    // Calculate shipping zone
    const zone = calculateZone(fromZip, toZip);

    // Generate estimates for each carrier and service
    const estimates = [];
    Object.entries(CARRIERS).forEach(([carrierId, carrier]) => {
      // Use carrier-specific dimensional weight
      const dimWeight = dimWeights[carrierId];
      const billableWeight = Math.max(actualWeight, dimWeight);

      Object.entries(carrier.services).forEach(([serviceName, serviceDetails]) => {
        // Base price calculation
        let price = serviceDetails.baseRate;

        // Add weight charge (varies by carrier)
        const weightRate = carrierId === 'USPS' ? 0.55 : 0.75;
        price += billableWeight * weightRate;

        // Zone multiplier (varies by carrier)
        const zoneMultiplier = carrierId === 'USPS' ? 0.08 : 0.1;
        price *= (1 + (zone * zoneMultiplier));

        // Fuel surcharge (varies by carrier and service)
        const fuelSurcharge = carrierId === 'USPS' ? 1.1 : 1.12;
        price *= fuelSurcharge;

        // Add handling fee
        const handlingFee = carrierId === 'USPS' ? 2.50 : 3.50;
        price += handlingFee;

        // Calculate estimated delivery days
        const estimatedDays = calculateEstimatedDays(zone, serviceDetails.daysFactor);

        estimates.push({
          carrier: carrier.name,
          service: serviceName,
          price: parseFloat(price.toFixed(2)),
          estimatedDays: `${estimatedDays} business day${estimatedDays > 1 ? 's' : ''}`
        });
      });
    });

    // Sort by price
    estimates.sort((a, b) => a.price - b.price);

    return {
      success: true,
      estimates
    };
  } catch (error) {
    console.error('Error in getShippingEstimates:', error);
    return {
      success: false,
      error: 'Failed to calculate shipping estimates'
    };
  }
};
