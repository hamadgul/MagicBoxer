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
    const errors = [];

    // Get USPS mock rates
    console.log('\n=== Getting USPS Mock Rates ===');
    const uspsRates = calculateUSPSRates(packageDetails, fromZip, toZip);
    estimates.push(...uspsRates);

    // Get real UPS rates from API
    console.log('\n=== Getting UPS API Rates ===');
    try {
      const upsRates = await getUPSRates(packageDetails, fromZip, toZip);
      if (Array.isArray(upsRates)) {
        estimates.push(...upsRates);
      }
    } catch (upsError) {
      console.error("UPS API Error:", upsError);
      errors.push({
        carrier: 'UPS',
        message: upsError.message || 'Failed to get UPS rates'
      });
    }

    // Get real FedEx rates from API
    console.log('\n=== Getting FedEx API Rates ===');
    try {
      const fedexRates = await calculateFedExRates({...packageDetails}, fromZip, toZip);
      if (Array.isArray(fedexRates)) {
        estimates.push(...fedexRates);
      }
    } catch (fedexError) {
      console.error("FedEx API Error:", fedexError);
      errors.push({
        carrier: 'FedEx',
        message: fedexError.message || 'Failed to get FedEx rates'
      });
    }

    // Sort all estimates by price
    const sortedEstimates = estimates.sort((a, b) => a.price - b.price);

    console.log('\n=== Final Estimates ===');
    console.log('Total estimates:', sortedEstimates.length);
    console.log('All estimates:', sortedEstimates);
    console.log('Errors:', errors);

    return {
      success: estimates.length > 0,
      estimates: sortedEstimates,
      errors: errors
    };
  } catch (error) {
    console.error("Error calculating shipping estimates:", error);
    return {
      success: false,
      error: "Failed to calculate shipping estimates",
      errors: [{
        carrier: 'General',
        message: error.message || 'An unexpected error occurred'
      }]
    };
  }
};
