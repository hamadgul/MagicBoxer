import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useFirstTime = () => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        setIsFirstTime(true);
      } else {
        setIsFirstTime(false);
      }
    } catch (error) {
      console.warn('Error checking first time status:', error);
      setIsFirstTime(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isFirstTime, isLoading };
};

export default useFirstTime;
