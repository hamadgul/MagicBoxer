const USPS_CONFIG = {
  services: {
    "Priority Mail Express": { baseRate: 26.35, daysFactor: 0.3 },
    "Priority Mail": { baseRate: 8.7, daysFactor: 0.6 },
    "Ground Advantage": { baseRate: 7.5, daysFactor: 1.0 },
  },
  dimDivisor: 166
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

const calculateDimWeight = (volume, dimDivisor) => {
  return (volume / dimDivisor);
};

const calculateEstimatedDays = (zone, serviceDaysFactor) => {
  const baseDeliveryDays = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
  return Math.ceil(baseDeliveryDays[zone] * serviceDaysFactor);
};

const calculatePrice = (baseRate, billableWeight, zone) => {
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

export const calculateUSPSRates = (packageDetails, fromZip, toZip) => {
  const zone = calculateZone(fromZip, toZip);
  const dimWeight = calculateDimWeight(
    packageDetails.length * packageDetails.width * packageDetails.height,
    USPS_CONFIG.dimDivisor
  );
  const billableWeight = Math.max(packageDetails.weight, dimWeight);

  return Object.entries(USPS_CONFIG.services).map(([serviceName, serviceDetails]) => {
    const price = calculatePrice(serviceDetails.baseRate, billableWeight, zone);
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
