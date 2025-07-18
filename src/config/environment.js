// Environment configuration
export const DEV_BUILD_APP = false;

// Carrier API Configuration
// For React Native, environment variables need special handling
// These fallback to sandbox credentials for development
export const CARRIER_CONFIG = {
  FEDEX: {
    API_KEY: __DEV__ ? 'l79b1b174bc2334477a883a08cdfdbdcae' : (process.env.FEDEX_API_KEY || 'l79b1b174bc2334477a883a08cdfdbdcae'),
    SECRET_KEY: __DEV__ ? 'a2b2e19da8f64c958cd858ff296185f9' : (process.env.FEDEX_SECRET_KEY || 'a2b2e19da8f64c958cd858ff296185f9'),
    BASE_URL: __DEV__ ? 'https://apis-sandbox.fedex.com' : (process.env.FEDEX_BASE_URL || 'https://apis-sandbox.fedex.com'),
    ACCOUNT_NUMBER: __DEV__ ? '740561073' : (process.env.FEDEX_ACCOUNT_NUMBER || '740561073')
  },
  USPS: {
    CLIENT_ID: __DEV__ ? 's48Bvc4Ky0di0O5la1LHF8dcgdcBNqLV' : (process.env.USPS_CLIENT_ID || 's48Bvc4Ky0di0O5la1LHF8dcgdcBNqLV'),
    CLIENT_SECRET: __DEV__ ? 'IupGg3UhoQt37R9A' : (process.env.USPS_CLIENT_SECRET || 'IupGg3UhoQt37R9A'),
    API_BASE_URL: __DEV__ ? 'https://apis.usps.com' : (process.env.USPS_API_BASE_URL || 'https://apis.usps.com'),
    TOKEN_ENDPOINT: '/oauth2/v3/token',
    RATES_ENDPOINT: '/prices/v3/base-rates/search',
    DIM_DIVISOR: 166
  },
  UPS: {
    CLIENT_ID: __DEV__ ? 'reUV3PzybRlMT0iX9GQPnwlTKweX9Wytfzk3q5ZxiQQeWrLv' : (process.env.UPS_CLIENT_ID || 'reUV3PzybRlMT0iX9GQPnwlTKweX9Wytfzk3q5ZxiQQeWrLv'),
    CLIENT_SECRET: __DEV__ ? 'hJmxM48BOykCR8xtXjffYQUKQIRqdxExG6o2vV0FlkD8GkuuFHjl7QIdaGHyAkYg' : (process.env.UPS_CLIENT_SECRET || 'hJmxM48BOykCR8xtXjffYQUKQIRqdxExG6o2vV0FlkD8GkuuFHjl7QIdaGHyAkYg'),
    BASE_URL: __DEV__ ? 'https://onlinetools.ups.com/api' : (process.env.UPS_BASE_URL || 'https://onlinetools.ups.com/api')
  }
};
