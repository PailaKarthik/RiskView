import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNearbyReports } from '@/redux/slices/reportSlice';
import { locationService } from '@/utils/locationService';

/**
 * useTravelMode Hook
 * Automatically fetches nearby reports every 30 seconds when travel mode is enabled
 * 
 * Behavior:
 * - When travelMode is true: Polls location and fetches nearby reports every 30 seconds
 * - When travelMode is false: Clears the polling interval
 * - Cleans up interval on component unmount
 */
export const useTravelMode = (selectedLocation = null) => {
  const dispatch = useDispatch();
  const travelState = useSelector((state) => state?.travel || {});
  const { travelMode } = travelState;
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!travelMode) {
      // Clear interval when travel mode is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('✅ [Travel Mode] Polling stopped');
      }
      return;
    }

    // Skip polling when a custom location is selected (HomeScreen manages that fetch)
    if (selectedLocation) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('✅ [Travel Mode] Polling paused - using searched location');
      }
      return;
    }

    // Function to fetch nearby reports using current location
    const fetchNearbyReportsWithLocation = async () => {
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          dispatch(
            fetchNearbyReports({
              latitude: location.latitude,
              longitude: location.longitude
            })
          );
          console.log('🔄 [Travel Mode] Fetching nearby reports at', {
            lat: location.latitude,
            lng: location.longitude,
          });
        }
      } catch (error) {
        console.error('❌ [Travel Mode] Failed to fetch nearby reports', error);
      }
    };

    // Fetch immediately on travel mode activation
    fetchNearbyReportsWithLocation();

    // Set up interval to repeat every 1 minute
    intervalRef.current = setInterval(
      fetchNearbyReportsWithLocation,
      60000 // 1 minute
    );

    console.log('✅ [Travel Mode] Polling started - fetching every 1 minute');

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('✅ [Travel Mode] Polling cleaned up');
      }
    };
  }, [travelMode, selectedLocation, dispatch]);
};

export default useTravelMode;
