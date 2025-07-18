# API Security Configuration

## Overview

MagicBoxer integrates with multiple shipping carrier APIs (FedEx, USPS, UPS) to provide real-time shipping rates. This document outlines how to securely configure these API credentials for production deployment.

## Security Implementation

### Centralized Configuration

All carrier API credentials are now centralized in `/src/config/environment.js` with environment variable support:

```javascript
export const CARRIER_CONFIG = {
  FEDEX: {
    API_KEY: process.env.FEDEX_API_KEY || 'sandbox_fallback',
    SECRET_KEY: process.env.FEDEX_SECRET_KEY || 'sandbox_fallback',
    BASE_URL: process.env.FEDEX_BASE_URL || 'https://apis-sandbox.fedex.com',
    ACCOUNT_NUMBER: process.env.FEDEX_ACCOUNT_NUMBER || 'sandbox_account'
  },
  // ... similar for USPS and UPS
};
```

### Environment Variables

Production deployments should set these environment variables:

#### FedEx
- `FEDEX_API_KEY` - Your production FedEx API key
- `FEDEX_SECRET_KEY` - Your production FedEx secret key  
- `FEDEX_BASE_URL` - Production URL: `https://apis.fedex.com`
- `FEDEX_ACCOUNT_NUMBER` - Your FedEx account number

#### USPS
- `USPS_CLIENT_ID` - Your production USPS client ID
- `USPS_CLIENT_SECRET` - Your production USPS client secret
- `USPS_API_BASE_URL` - Production URL: `https://apis.usps.com`

#### UPS
- `UPS_CLIENT_ID` - Your production UPS client ID
- `UPS_CLIENT_SECRET` - Your production UPS client secret
- `UPS_BASE_URL` - Production URL: `https://onlinetools.ups.com/api`

## Development vs Production

### Development (Current)
- Uses sandbox/test credentials as fallbacks
- Safe for development and testing
- No real charges or shipments

### Production Setup
1. **Obtain Production Credentials**
   - FedEx: https://developer.fedex.com/
   - USPS: https://developer.usps.com/
   - UPS: https://developer.ups.com/

2. **Set Environment Variables**
   - In your deployment platform (Expo, Netlify, etc.)
   - Never commit production credentials to version control
   - Use different credentials for staging vs production

3. **Update Base URLs**
   - Ensure production URLs are used (not sandbox)
   - Test thoroughly before going live

## Security Best Practices

### ✅ Implemented
- [x] Centralized configuration management
- [x] Environment variable support with fallbacks
- [x] Separation of sandbox vs production credentials
- [x] No hardcoded credentials in service files

### 🔒 Additional Recommendations
- [ ] Implement credential rotation schedule
- [ ] Add API rate limiting and monitoring
- [ ] Set up alerts for API failures or suspicious usage
- [ ] Use secrets management service for enterprise deployments
- [ ] Implement API key validation on app startup

## File Structure

```
src/
├── config/
│   └── environment.js          # Centralized API configuration
├── services/
│   └── carriers/
│       ├── fedexService.js     # Uses CARRIER_CONFIG.FEDEX
│       ├── uspsService.js      # Uses CARRIER_CONFIG.USPS
│       └── upsService.js       # Uses CARRIER_CONFIG.UPS
└── docs/
    └── API_SECURITY.md         # This documentation
```

## Deployment Checklist

- [ ] Set all required environment variables in deployment platform
- [ ] Verify production API URLs are configured
- [ ] Test API connectivity with production credentials
- [ ] Monitor API usage and costs
- [ ] Set up error alerting for API failures
- [ ] Document credential rotation procedures

## Troubleshooting

### Common Issues
1. **API Authentication Errors**
   - Verify environment variables are set correctly
   - Check if using sandbox vs production URLs
   - Ensure credentials haven't expired

2. **Missing Environment Variables**
   - App falls back to sandbox credentials
   - Check deployment platform configuration
   - Verify variable names match exactly

3. **CORS or Network Errors**
   - Verify API base URLs are correct
   - Check if IP whitelisting is required
   - Ensure network connectivity from deployment environment

## Support

For API-specific issues:
- **FedEx**: https://developer.fedex.com/support
- **USPS**: https://developer.usps.com/support  
- **UPS**: https://developer.ups.com/support

For MagicBoxer configuration issues, check the deployment logs and verify environment variable configuration.
