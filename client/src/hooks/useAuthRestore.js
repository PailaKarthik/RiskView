import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken, setUserId, setIsRestoring, clearAuth } from '@/redux/slices/authSlice';
import { fetchCurrentUser } from '@/redux/slices/authSlice';

/**
 * Custom hook to restore authentication state from AsyncStorage on app startup
 * 
 * Process:
 * 1. Restore token from AsyncStorage
 * 2. Restore userId from AsyncStorage
 * 3. Validate token by fetching current user from backend
 * 4. If validation succeeds: user stays logged in
 * 5. If validation fails (401): clear auth state and redirect to login
 * 
 * This ensures the user remains logged in after reopening the app
 * and properly handles token expiration
 */
export const useAuthRestore = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        // Step 1: Restore token from AsyncStorage
        const token = await AsyncStorage.getItem('authToken');
        const userId = await AsyncStorage.getItem('userId');

        if (token && userId) {
          console.log('🔄 Restoring auth from AsyncStorage - Token:', token.substring(0, 20) + '...');
          console.log('🔄 User ID:', userId);
          
          // Set token and userId in Redux
          dispatch(setToken(token));
          dispatch(setUserId(userId));

          // Step 2: Validate token by fetching current user from backend
          console.log('🔐 Validating token with backend...');
          const resultAction = await dispatch(fetchCurrentUser());
          
          if (fetchCurrentUser.fulfilled.match(resultAction)) {
            console.log('✅ Token validation successful - User restored');
          } else {
            console.error('❌ Token validation failed - Clearing auth state');
            dispatch(clearAuth());
          }
        } else {
          console.log('⚠️ No auth token or userId found in AsyncStorage');
          dispatch(setIsRestoring(false));
        }
      } catch (error) {
        console.error('❌ Error restoring auth:', error);
        dispatch(clearAuth());
      }
    };

    restoreAuth();
  }, [dispatch]);
};

export default useAuthRestore;
