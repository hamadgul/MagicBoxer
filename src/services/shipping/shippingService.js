import { getUPSRates } from '../carriers/upsService';
import { calculateFedExRates } from '../carriers/fedexService';
import { calculateUSPSRates } from '../carriers/uspsService';

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

    // Get real USPS rates from API
    console.log('\n=== Getting USPS API Rates ===');
    try {
      const uspsRates = await calculateUSPSRates(packageDetails, fromZip, toZip);
      if (Array.isArray(uspsRates)) {
        estimates.push(...uspsRates);
      }
    } catch (uspsError) {
      console.error("USPS API Error:", uspsError);
      errors.push({
        carrier: 'USPS',
        message: uspsError.message || 'Failed to get USPS rates'
      });
    }

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

    // Consolidate estimates for the same service with different packaging options
    const consolidatedEstimates = [];
    const serviceMap = {};
    
    estimates.forEach(estimate => {
      const serviceKey = `${estimate.carrier}-${estimate.service}`;
      
      if (!serviceMap[serviceKey]) {
        serviceMap[serviceKey] = [estimate];
      } else {
        serviceMap[serviceKey].push(estimate);
      }
    });
    
    // Process each service group
    Object.values(serviceMap).forEach(serviceEstimates => {
      if (serviceEstimates.length === 1) {
        // Only one packaging option, add as is
        consolidatedEstimates.push(serviceEstimates[0]);
      } else {
        // Multiple packaging options, consolidate
        // Sort by price to find the cheapest option
        serviceEstimates.sort((a, b) => a.price - b.price);
        
        const cheapestOption = serviceEstimates[0];
        const customerOption = serviceEstimates.find(est => !est.isCarrierBox);
        const carrierOption = serviceEstimates.find(est => est.isCarrierBox);
        
        if (customerOption && carrierOption) {
          // Both options available, use the cheapest as base and add info about the other
          const priceDifference = Math.abs(customerOption.price - carrierOption.price);
          const savingsPercentage = ((priceDifference / Math.max(customerOption.price, carrierOption.price)) * 100).toFixed(0);
          
          const consolidatedEstimate = { ...cheapestOption };
          consolidatedEstimate.bothPackagingOptions = true;
          consolidatedEstimate.customerBoxPrice = customerOption.price;
          consolidatedEstimate.carrierBoxPrice = carrierOption.price;
          consolidatedEstimate.carrierBoxType = carrierOption.dimensions.boxType;
          
          // Calculate savings
          if (carrierOption.price < customerOption.price) {
            consolidatedEstimate.savings = {
              amount: priceDifference.toFixed(2),
              percentage: savingsPercentage,
              message: `Save $${priceDifference.toFixed(2)} (${savingsPercentage}%) with ${carrierOption.carrier} packaging`
            };
          } else if (customerOption.price < carrierOption.price) {
            consolidatedEstimate.savings = {
              amount: priceDifference.toFixed(2),
              percentage: savingsPercentage,
              message: `Save $${priceDifference.toFixed(2)} (${savingsPercentage}%) with your own packaging`
            };
          }
          
          consolidatedEstimates.push(consolidatedEstimate);
        } else {
          // Only one type of packaging available despite multiple entries
          consolidatedEstimates.push(cheapestOption);
        }
      }
    });
    
    // Sort all consolidated estimates by price
    const sortedEstimates = consolidatedEstimates.sort((a, b) => a.price - b.price);

    console.log('\n=== Final Consolidated Estimates ===');
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
