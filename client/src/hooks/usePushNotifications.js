import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updatePushToken } from '@/redux/slices/authSlice';
import { registerForPushNotifications, setupNotificationHandler } from '@/utils/pushNotificationService';

/**
 * Custom hook to register for push notifications
 * Gets push token and sends it to backend for storage
 * Runs after auth is restored
 */
export const usePushNotifications = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state?.auth || {});
  const { token: authToken } = authState;

  useEffect(() => {
    // Only register if user is authenticated
    if (!authToken) return;

    const registerPushToken = async () => {
      try {
        console.log('🔔 Initializing push notifications...');

        // Get push token from Expo
        const pushToken = await registerForPushNotifications();

        if (pushToken) {
          // Store token locally
          await AsyncStorage.setItem('pushToken', pushToken);
          console.log('✅ Push token saved locally');

          // Send token to backend
          console.log('📤 Sending push token to backend...');
          await dispatch(updatePushToken(pushToken)).unwrap();
          console.log('✅ Push token sent to backend');
        }

        // Set up notification handlers
        setupNotificationHandler();
      } catch (error) {
        console.error('❌ Error during push notification setup:', error);
      }
    };

    registerPushToken();
  }, [authToken, dispatch]);
};
