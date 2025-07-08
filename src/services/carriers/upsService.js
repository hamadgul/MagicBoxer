import axios from 'axios';

const UPS_CONFIG = {
  clientId: 'reUV3PzybRlMT0iX9GQPnwlTKweX9Wytfzk3q5ZxiQQeWrLv',
  clientSecret: 'hJmxM48BOykCR8xtXjffYQUKQIRqdxExG6o2vV0FlkD8GkuuFHjl7QIdaGHyAkYg',
  baseURL: 'https://onlinetools.ups.com/api',
};

export const getUPSAccessToken = async () => {
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

export const getUPSRates = async (packageDetails, fromZip, toZip) => {
  try {
    const result = packageDetails.upsResult;

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

    // UPS packaging types mapping - these are the official UPS packaging codes
    // Only using the codes that are supported by the UPS API
    const upsPackagingMap = {
      'UPS Express Box - Small': '01',
      'UPS Express Box - Medium': '01',
      'UPS Express Box - Large': '01',
      'UPS Express Box': '01',
      'UPS Express Tube': '03',
      'UPS Pak': '04',
      'UPS 10KG Box': '01',
      'UPS 25KG Box': '01'
    };

    // Determine if we can use UPS packaging
    // These dimensions are from UPS's official specifications
    const upsBoxSizes = {
      '01': { name: 'UPS Express Box', dimensions: [18, 13, 3] },      // UPS Express Box
      '03': { name: 'UPS Express Tube', dimensions: [38, 6, 6] },       // UPS Express Tube
      '04': { name: 'UPS Pak', dimensions: [17.5, 14, 1] }             // UPS Pak
    };

    // Find suitable UPS boxes
    const findSuitableUPSBox = () => {
      // Sort dimensions from smallest to largest
      const itemDims = [dimensions.x, dimensions.y, dimensions.z].sort((a, b) => a - b);
      
      // First try to find an exact fit
      for (const [code, box] of Object.entries(upsBoxSizes)) {
        const boxDims = [...box.dimensions].sort((a, b) => a - b);
        if (itemDims[0] <= boxDims[0] && 
            itemDims[1] <= boxDims[1] && 
            itemDims[2] <= boxDims[2]) {
          return { code, name: box.name };
        }
      }
      
      // If no exact fit, find the best fit (smallest box that can contain the item)
      let bestFitBox = null;
      let minExcessVolume = Infinity;
      
      for (const [code, box] of Object.entries(upsBoxSizes)) {
        // Skip boxes that are too small in any dimension
        const boxDims = [...box.dimensions];
        
        // Try all possible orientations of the item
        const orientations = [
          [itemDims[0], itemDims[1], itemDims[2]],
          [itemDims[0], itemDims[2], itemDims[1]],
          [itemDims[1], itemDims[0], itemDims[2]],
          [itemDims[1], itemDims[2], itemDims[0]],
          [itemDims[2], itemDims[0], itemDims[1]],
          [itemDims[2], itemDims[1], itemDims[0]]
        ];
        
        for (const orientation of orientations) {
          if (orientation[0] <= boxDims[0] && 
              orientation[1] <= boxDims[1] && 
              orientation[2] <= boxDims[2]) {
            
            // Calculate excess volume (wasted space)
            const itemVolume = orientation[0] * orientation[1] * orientation[2];
            const boxVolume = boxDims[0] * boxDims[1] * boxDims[2];
            const excessVolume = boxVolume - itemVolume;
            
            if (excessVolume < minExcessVolume) {
              minExcessVolume = excessVolume;
              bestFitBox = { code, name: box.name };
            }
            
            // Found a fit for this orientation, no need to check others
            break;
          }
        }
      }
      
      // If we still don't have a fit, just return the largest box
      if (!bestFitBox) {
        // Default to Express Box - Large if nothing fits
        return { code: '23', name: 'UPS Express Box - Large' };
      }
      
      return bestFitBox;
    };

    const suitableUPSBox = findSuitableUPSBox();
    const customerPackagingType = '02'; // Customer Packaging
    
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

    // Create a request for a specific service and packaging type
    const createRequest = (service, packagingType, isCarrierBox, boxName) => {
      // Format date for UPS API (YYYYMMDD format)
      const formattedDate = packageDetails.shipmentDate ? 
        packageDetails.shipmentDate.toISOString().split('T')[0].replace(/-/g, '') : 
        new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      // For carrier boxes, always use the supported UPS packaging codes
      // 01 = UPS Express Box
      // 03 = UPS Express Tube
      // 04 = UPS Pak
      let actualPackagingType = isCarrierBox ? '01' : packagingType;
      
      // Special case for Express Tube
      if (isCarrierBox && boxName && boxName.includes('Tube')) {
        actualPackagingType = '03';
      }
      // Special case for UPS Pak
      else if (isCarrierBox && boxName && boxName.includes('Pak')) {
        actualPackagingType = '04';
      }
        
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
                ResidentialAddressIndicator: packageDetails.isResidential === false ? undefined : "true"
              }
            },
            ShipmentRatingOptions: {
              PickupDate: formattedDate,
              RateChartIndicator: "true",
              UserLevelDiscountIndicator: "true"
            },
            Service: {
              Code: service.Code,
              Description: service.Description
            },
            Package: {
              PackagingType: {
                Code: actualPackagingType,
                Description: boxName || "Package"
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: "IN"
                },
                Length: Math.ceil(dimensions.x).toString(),
                Width: Math.ceil(dimensions.y).toString(),
                Height: Math.ceil(dimensions.z).toString()
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: "LBS"
                },
                Weight: Math.max(Math.ceil(packageDetails.weight), 1).toString()
              },
              // Add insurance value if provided
              ...(packageDetails.insuranceValue ? {
                PackageServiceOptions: {
                  DeclaredValue: {
                    CurrencyCode: "USD",
                    MonetaryValue: packageDetails.insuranceValue.toString()
                  },
                  ...(packageDetails.signatureRequired ? {
                    DeliveryConfirmation: {
                      DCISType: "2", // Signature Required
                    }
                  } : {})
                }
              } : packageDetails.signatureRequired ? {
                PackageServiceOptions: {
                  DeliveryConfirmation: {
                    DCISType: "2", // Signature Required
                  }
                }
              } : {})
            }
          }
        }
      };

      console.log(`UPS Request for ${service.Description} with ${isCarrierBox ? 'UPS Box' : 'Customer Box'} (PackagingType: ${actualPackagingType}):`, JSON.stringify(payload, null, 2));

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
          const estimatedDays = rate.GuaranteedDelivery?.BusinessDaysInTransit || 
                              (service.Code === "03" ? "3-5" : 
                               service.Code === "02" ? "2" :
                               service.Code === "01" ? "1" :
                               service.Code === "12" ? "3" :
                               service.Code === "13" ? "1" :
                               service.Code === "14" ? "> 1" :
                               service.Code === "59" ? "2" : "Unknown");

          // Use the exact price from the API without any modifications
          const price = parseFloat(rate.TotalCharges.MonetaryValue);
          
          // Log the response to debug pricing
          console.log(`UPS Rate for ${service.Description} with ${isCarrierBox ? boxName : 'Customer Box'}: $${price}`);
          
          return {
            carrier: 'UPS',
            service: service.Description,
            price: price,
            currency: rate.TotalCharges.CurrencyCode,
            estimatedDays,
            dimensions: {
              length: dimensions.x,
              width: dimensions.y,
              height: dimensions.z,
              boxType: isCarrierBox ? boxName : 'YOUR_PACKAGING'
            },
            isCarrierBox: isCarrierBox
          };
        }
        return null;
      }).catch(error => {
        console.log('Error getting UPS rate for', service.Description, ':', JSON.stringify({
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        }, null, 2));
        
        // Return an error object instead of null
        const errorMessage = error.response?.data?.response?.errors?.[0]?.message || 
                           'Service unavailable';
        
        return {
          carrier: 'UPS',
          service: service.Description,
          price: null,
          currency: 'USD',
          estimatedDays: null,
          dimensions: {
            length: dimensions.x,
            width: dimensions.y,
            height: dimensions.z,
            boxType: isCarrierBox ? boxName : 'YOUR_PACKAGING'
          },
          isCarrierBox: isCarrierBox,
          error: errorMessage
        };
      });
    };

    // Create all requests
    let allRequests = [];

    // Always try customer packaging for all services
    const customerRequests = serviceOptions.map(service => 
      createRequest(service, customerPackagingType, false, null)
    );
    allRequests.push(...customerRequests);

    // Always include UPS packaging options
    // If we found a suitable box, use it; otherwise use the Express Box
    const boxToUse = suitableUPSBox || { code: '01', name: 'UPS Express Box' };
    
    // Only create carrier box requests for Express services (they're more likely to work)
    const expressServices = serviceOptions.filter(service => 
      service.Description.includes('Next Day') || 
      service.Description.includes('2nd Day')
    );
    
    if (expressServices.length > 0) {
      const carrierRequests = expressServices.map(service => 
        createRequest(service, boxToUse.code, true, boxToUse.name)
      );
      allRequests.push(...carrierRequests);
    } else {
      // If no express services, try with all services
      const carrierRequests = serviceOptions.map(service => 
        createRequest(service, boxToUse.code, true, boxToUse.name)
      );
      allRequests.push(...carrierRequests);
    }

    const responses = await Promise.all(allRequests);
    const validRates = responses.filter(rate => rate !== null);

    if (validRates.length > 0) {
      return validRates.sort((a, b) => a.price - b.price);
    }
    return [];
  } catch (error) {
    console.error('Error in getUPSRates:', error);
    return [];
  }
};
