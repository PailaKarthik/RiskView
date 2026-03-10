import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let store;
export const injectStore = (_store) => {
  store = _store;
};

// const BASE_URL = import.meta.env.EXPO_PUBLIC_BASE_URL || 'http://localhost:8000'; // Default to localhost if not set
const BASE_URL ='http://localhost:8000'; // Default to localhost if not set

// Create axios instance with base configuration
const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * - Logs outgoing requests
 * - Attaches JWT token from Redux state or AsyncStorage to Authorization header
 */
axiosClient.interceptors.request.use(
  async (config) => {
    // Log request details
    console.log(`🔵 [API Request] ${config.method.toUpperCase()} ${config.url}`);

    // Get JWT token from Redux auth state first
    let token = store.getState()?.auth?.token;

    // Fallback to AsyncStorage if not in Redux
    if (!token) {
      try {
        token = await AsyncStorage.getItem('authToken');
        if (token) {
          console.log('⚠️ Token retrieved from AsyncStorage (not in Redux yet)');
        }
      } catch (error) {
        console.error('❌ Error retrieving token from AsyncStorage:', error);
      }
    }

    // Attach token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ JWT token attached to request');
    } else {
      console.log('⚠️ No JWT token found in Redux state or AsyncStorage');
    }

    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Logs successful responses and errors
 * - Handles error responses (401, 403, 500, etc.)
 * - On 401 Unauthorized: Clear auth state and dispatch logout
 */
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log(`✅ [API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const { status, data, config } = error.response || {};

    // Handle different error statuses
    if (status === 401) {
      console.error('🔴 [API Error 401] Unauthorized - JWT token expired or invalid');
      
      // Clear auth state from Redux and AsyncStorage
      try {
        if (store) {
          const { auth } = store.getState();
          // Only dispatch logout if user was actually logged in
          if (auth?.token) {
            const { logoutUser } = await import('@/redux/slices/authSlice');
            store.dispatch(logoutUser());
          }
        }
      } catch (err) {
        console.error('Error during 401 cleanup:', err);
      }
    } else if (status === 403) {
      console.error('🔴 [API Error 403] Forbidden - Access denied');
    } else if (status === 404) {
      console.error('🔴 [API Error 404] Not Found - Resource not found');
    } else if (status === 500) {
      console.error('🔴 [API Error 500] Server Error - Internal server error');
    } else if (!status) {
      console.error('🔴 [API Error] Network Error - No response from server');
    } else {
      console.error(`🔴 [API Error ${status}] ${data?.message || 'Unknown error'}`);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
