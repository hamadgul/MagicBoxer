import { Dimensions, Platform } from 'react-native';
import { useMemo } from 'react';

// Base dimensions for iPhone 14 Pro
export const IPHONE_14_PRO = {
  width: 393,
  height: 852
};

// Memoized scale factors
let memoizedScaleFactors = null;
let lastWindowDimensions = null;

// Get scale factors based on device screen size
export const getScaleFactors = () => {
  const windowDimensions = Dimensions.get('window');
  
  // Check if dimensions have changed
  if (
    !memoizedScaleFactors ||
    !lastWindowDimensions ||
    lastWindowDimensions.width !== windowDimensions.width ||
    lastWindowDimensions.height !== windowDimensions.height
  ) {
    lastWindowDimensions = windowDimensions;
    memoizedScaleFactors = {
      scaleX: windowDimensions.width / IPHONE_14_PRO.width,
      scaleY: windowDimensions.height / IPHONE_14_PRO.height
    };
  }
  
  return memoizedScaleFactors;
};

// Hook for reactive scaling factors
export const useScaleFactors = () => {
  return useMemo(() => getScaleFactors(), []);
};

// Scale a value based on screen width
export const scaleWidth = (value) => {
  const { scaleX } = getScaleFactors();
  return value * scaleX;
};

// Scale a value based on screen height
export const scaleHeight = (value) => {
  const { scaleY } = getScaleFactors();
  return value * scaleY;
};

// Scale both width and height
export const scale = (width, height) => {
  const factors = getScaleFactors();
  return {
    width: width * factors.scaleX,
    height: height * factors.scaleY
  };
};

// Scale maintaining aspect ratio based on width
export const scaleAspectRatio = (width, height) => {
  const scaledWidth = scaleWidth(width);
  const aspectRatio = height / width;
  return {
    width: scaledWidth,
    height: scaledWidth * aspectRatio
  };
};

// Detect if the current device is an iPad
export const isIpad = () => {
  const { width, height } = Dimensions.get('window');
  return Platform.OS === 'ios' && Math.min(width, height) >= 768;
};
