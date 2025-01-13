import { getUPSRates } from './carriers/upsService';
import { calculateFedExRates } from './carriers/fedexService';
import { calculateUSPSRates } from './carriers/uspsService';

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
