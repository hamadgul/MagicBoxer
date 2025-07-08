const USPS_CONFIG = {
  services: {
    "Priority Mail Express": { baseRate: 31.55, daysFactor: 0.3 },
    "Priority Mail": { baseRate: 9.65, daysFactor: 0.6 },
    "Ground Advantage": { baseRate: 5.40, daysFactor: 1.0 },
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

export const calculateUSPSRates = (packageDetails, fromZip, toZip) => {
  try {
    console.log('USPS Service - Package Details:', packageDetails);
    console.log('USPS Service - From ZIP:', fromZip);
    console.log('USPS Service - To ZIP:', toZip);
    
    // Check if packageDetails is defined
    if (!packageDetails) {
      console.error('USPS Service - packageDetails is undefined');
      throw new Error('Missing package details');
    }
    
    // Extract dimensions from either packageDetails directly or from upsResult/fedexResult
    let length, width, height;
    
    // Try to get dimensions from upsResult first (which comes from the packing algorithm)
    if (packageDetails.upsResult && packageDetails.upsResult.x && 
        packageDetails.upsResult.y && packageDetails.upsResult.z) {
      length = parseFloat(packageDetails.upsResult.x);
      width = parseFloat(packageDetails.upsResult.y);
      height = parseFloat(packageDetails.upsResult.z);
      console.log('USPS Service - Using dimensions from upsResult:', { length, width, height });
    } 
    // Try fedexResult next
    else if (packageDetails.fedexResult && packageDetails.fedexResult.x && 
             packageDetails.fedexResult.y && packageDetails.fedexResult.z) {
      length = parseFloat(packageDetails.fedexResult.x);
      width = parseFloat(packageDetails.fedexResult.y);
      height = parseFloat(packageDetails.fedexResult.z);
      console.log('USPS Service - Using dimensions from fedexResult:', { length, width, height });
    } 
    // Fall back to packageDetails
    else {
      length = parseFloat(packageDetails.length || 0);
      width = parseFloat(packageDetails.width || 0);
      height = parseFloat(packageDetails.height || 0);
      console.log('USPS Service - Using dimensions from packageDetails:', { length, width, height });
    }
    
    // Get weight
    const weight = parseFloat(packageDetails.weight || 0);
    const { isResidential, insuranceValue, signatureRequired } = packageDetails;
    
    console.log('USPS Service - Final dimensions and weight:', { length, width, height, weight });
    
    if (!fromZip || !toZip) {
      console.error('USPS Service - Missing ZIP codes:', { fromZip, toZip });
      throw new Error('Missing ZIP codes');
    }
    
    if (length <= 0 || width <= 0 || height <= 0 || weight <= 0) {
      console.error('USPS Service - Invalid dimensions or weight:', { length, width, height, weight });
      throw new Error('Invalid dimensions or weight');
    }
    
    // Log the new fields
    console.log('USPS Address Type:', isResidential ? 'Residential' : 'Commercial');
    if (insuranceValue) console.log('USPS Insurance Value:', insuranceValue);
    if (signatureRequired) console.log('USPS Signature Required:', signatureRequired);

    const zone = calculateZone(fromZip, toZip);
    const dimWeight = calculateDimWeight(
      length * width * height,
      USPS_CONFIG.dimDivisor
    );
    const billableWeight = Math.max(weight, dimWeight);

    return Object.entries(USPS_CONFIG.services).map(([serviceName, serviceDetails]) => {
      const price = calculatePrice(serviceDetails.baseRate, billableWeight, zone);
      const estimatedDays = calculateEstimatedDays(zone, serviceDetails.daysFactor);

      // Add a small surcharge for signature required
      const finalPrice = signatureRequired ? price + 2.75 : price;
      
      // Add insurance cost if applicable (USPS charges $0.80 per $100 of insurance)
      const insuranceCost = insuranceValue ? Math.ceil(insuranceValue / 100) * 0.8 : 0;
      
      return {
        carrier: 'USPS',
        service: serviceName,
        price: parseFloat((finalPrice + insuranceCost).toFixed(2)),
        estimatedDays: estimatedDays,
        isMockRate: true,
        dimensions: {
          length: length,
          width: width,
          height: height
        }
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};
