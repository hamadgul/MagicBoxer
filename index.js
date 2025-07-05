import 'react-native-gesture-handler';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { Platform, LogBox } from 'react-native';

// Disable yellow box warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}

// Track startup time for performance monitoring
const startupTime = Date.now();
console.log('App startup initiated at:', new Date().toISOString());

// Set up global error handler before importing the app
const errorHandler = (error, isFatal) => {
  const errorTime = new Date().toISOString();
  const startupDuration = Date.now() - startupTime;
  
  console.log(`[${errorTime}] Global error caught after ${startupDuration}ms:`, error);
  
  // Log the error details to help with debugging
  if (error.message) {
    console.log('Error message:', error.message);
  }
  if (error.stack) {
    console.log('Error stack:', error.stack);
  }
  
  // Log additional device information
  console.log('Platform:', Platform.OS);
  console.log('Version:', Platform.Version);
  console.log('Is Hermes enabled:', !!global.HermesInternal);
  
  // You can add additional error reporting here if needed
};

// Register the global error handler
if (global.ErrorUtils) {
  const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    errorHandler(error, isFatal);
    originalGlobalHandler(error, isFatal);
  });
}

// Add unhandled promise rejection handler
if (typeof global.Promise !== 'undefined') {
  const originalUnhandledRejection = global.Promise._unhandledRejectionTracker;
  global.Promise._unhandledRejectionTracker = (id, error) => {
    console.log('Unhandled Promise Rejection:', error);
    if (originalUnhandledRejection) {
      originalUnhandledRejection(id, error);
    }
  };
}

// Import the app after setting up error handling
import { registerRootComponent } from 'expo';
import App from './App';

// Log successful import
console.log('App component successfully imported after', Date.now() - startupTime, 'ms');

// Register the root component
registerRootComponent(App);

// Log registration
console.log('Root component registered after', Date.now() - startupTime, 'ms');

