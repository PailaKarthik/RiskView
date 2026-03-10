import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

/**
 * Location Service - Handles all location-related operations
 * Includes foreground and background location tracking
 */
export const locationService = {
  /**
   * Request location permissions
   * @returns {Promise<boolean>} - Permission granted status
   */
  requestLocationPermission: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ [Location Permission Error]', error);
      return false;
    }
  },

  /**
   * Request background location permissions
   * @returns {Promise<boolean>} - Permission granted status
   */
  requestBackgroundLocationPermission: async () => {
    try {
      const { status } =
        await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ [Background Location Permission Error]', error);
      return false;
    }
  },

  /**
   * Get current user location
   * @returns {Promise<object>} - Location object {latitude, longitude, accuracy}
   */
  getCurrentLocation: async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('✅ [Location Fetched]', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
      };
    } catch (error) {
      console.error('❌ [Get Location Error]', error);
      throw error;
    }
  },

  /**
   * Watch location updates (foreground)
   * @param {Function} callback - Function called on location update
   * @returns {Function} - Unsubscribe function
   */
  watchLocation: (callback) => {
    try {
      const subscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or 10 meters
        },
        (location) => {
          console.log('🔄 [Location Updated]', {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });

          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('❌ [Watch Location Error]', error);
      return null;
    }
  },

  /**
   * Start background location tracking
   * For continuous tracking even when app is in background
   */
  startBackgroundLocationTracking: async () => {
    try {
      // Check if task is already defined
      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        TaskManager.defineTask(
          LOCATION_TASK_NAME,
          ({ data, error }) => {
            if (error) {
              console.error('❌ [Background Task Error]', error);
              return;
            }

            if (data) {
              const { locations } = data;
              const location = locations[locations.length - 1];
              console.log('🔄 [Background Location Updated]', {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
              });
            }
          }
        );
      }

      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 20, // Or 20 meters
        showsBackgroundLocationIndicator: true,
      });

      console.log('✅ [Background location tracking started]');
    } catch (error) {
      console.error('❌ [Start Background Tracking Error]', error);
    }
  },

  /**
   * Stop background location tracking
   */
  stopBackgroundLocationTracking: async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('✅ [Background location tracking stopped]');
    } catch (error) {
      console.error('❌ [Stop Background Tracking Error]', error);
    }
  },

  /**
   * Check if background location is available
   * @returns {Promise<boolean>} - Availability status
   */
  isBackgroundLocationAvailable: async () => {
    try {
      const isAvailable =
        await Location.isBackgroundLocationAvailableAsync();
      return isAvailable;
    } catch (error) {
      console.error('❌ [Check Background Availability Error]', error);
      return false;
    }
  },

  /**
   * Calculate distance between two coordinates (in kilometers)
   * Uses Haversine formula
   * @param {object} from - Starting point {latitude, longitude}
   * @param {object} to - Ending point {latitude, longitude}
   * @returns {number} - Distance in kilometers
   */
  calculateDistance: (from, to) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return parseFloat(distance.toFixed(2));
  },

  /**
   * Get reverse geocoding (coordinates to address)
   * @param {object} coords - Coordinates {latitude, longitude}
   * @returns {Promise<string>} - Address string
   */
  reverseGeocode: async (coords) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (result && result.length > 0) {
        const address = result[0];
        const fullAddress = `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.postalCode || ''}`.trim();
        console.log('✅ [Reverse Geocoding Success]', fullAddress);
        return fullAddress;
      }

      return null;
    } catch (error) {
      console.error('❌ [Reverse Geocoding Error]', error);
      return null;
    }
  },

  /**
   * Get geocoding (address to coordinates)
   * @param {string} address - Address string
   * @returns {Promise<object>} - Coordinates {latitude, longitude}
   */
  geocode: async (address) => {
    try {
      const result = await Location.geocodeAsync(address);

      if (result && result.length > 0) {
        const coords = result[0];
        console.log('✅ [Geocoding Success]', {
          lat: coords.latitude,
          lng: coords.longitude,
        });

        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [Geocoding Error]', error);
      return null;
    }
  },
};

export default locationService;
