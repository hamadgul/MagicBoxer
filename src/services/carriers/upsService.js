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

      const upsPackagingMap = {
        'UPS Small Box': '21',
        'UPS Medium Box': '22',
        'UPS Large Box': '23',
        'UPS Extra Large Box': '24',
        'UPS Pak': '04',
        'UPS Express Box': '25',
        'UPS Express Box - Small': '21',
        'UPS Express Box - Medium': '22',
        'UPS Express Box - Large': '23',
        'UPS Express Tube': '24'
      };

      packagingType = upsPackagingMap[dimensions.type] || "02";
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
      // Format date for UPS API (YYYYMMDD format)
      const formattedDate = packageDetails.shipmentDate ? 
        packageDetails.shipmentDate.toISOString().split('T')[0].replace(/-/g, '') : 
        new Date().toISOString().split('T')[0].replace(/-/g, '');
        
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
            ShipmentRatingOptions: {
              PickupDate: formattedDate
            },
            Service: {
              Code: service.Code,
              Description: service.Description
            },
            Package: {
              PackagingType: {
                Code: packagingType,
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
        return null;
      }).catch(error => {
        console.log('Error getting UPS rate for', service.Description, ':', error.response?.data || error.message);
        return null;
      });
    });

    const responses = await Promise.all(requests);
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
