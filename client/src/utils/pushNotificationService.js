import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Push Notification Service
 * Handles push token registration via Expo Notifications
 */

/**
 * Register for push notifications and get token
 * @returns {Promise<string>} - Push token
 */
export const registerForPushNotifications = async () => {
  try {
    console.log('📱 Registering for push notifications...');

    // Skip on web platform - push notifications not supported
    if (Platform.OS === 'web') {
      console.log('⚠️ Push notifications not available on web platform');
      return null;
    }

    // Check if device is physical (push notifications require physical device)
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications not available on emulator/simulator');
      return null;
    }

    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      console.log('📱 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('⚠️ Failed to get notification permissions');
      return null;
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.projectId,
    });

    console.log('✅ Push token obtained:', token.data);
    return token.data;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Set up notification response handler
 * Called when user taps a notification
 */
export const setupNotificationHandler = () => {
  try {
    // Skip on web platform
    if (Platform.OS === 'web') {
      console.log('⚠️ Notification handler not available on web platform');
      return null;
    }

    // Handle notifications when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Handle notification response (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('📲 Notification tapped:', response.notification.request.content.body);
        // TODO: Handle notification tap (navigate to relevant screen)
      }
    );

    return subscription;
  } catch (error) {
    console.error('❌ Error setting up notification handler:', error);
    return null;
  }
};
