import { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Linking, Pressable, ScrollView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { locationService } from '@/utils/locationService';
import { useTravelMode } from '@/hooks/useTravelMode';

let MapView, Marker, WebMapView;
if (Platform.OS === 'web') {
  WebMapView = require('@/components/WebMapView').default;
} else {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

const safetyTips = [
  {
    icon: 'shield-checkmark',
    title: 'Stay Alert',
    description: 'Be aware of your surroundings, especially in crowded areas',
  },
  {
    icon: 'flash',
    title: 'Quick Actions',
    description: 'Save emergency numbers and know nearest safe locations',
  },
  {
    icon: 'call',
    title: 'Stay Connected',
    description: 'Keep your phone charged and share location with trusted contacts',
  },
];

export default function MapSection({ selectedLocation }) {
  const reportState = useSelector((state) => state?.report || {});
  const { list: nearbyReports } = reportState;
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);
  const [fetchingEmergency, setFetchingEmergency] = useState(false);
  const [locationName, setLocationName] = useState('Current Location');
  const [locationAddress, setLocationAddress] = useState('Detecting location...');
  const initializationRef = useRef(false);
  const locationCacheRef = useRef(null);

  // Travel mode auto-fetch nearby reports
  useTravelMode();

  useEffect(() => {
    const initializeMap = async () => {
      // Prevent multiple initializations
      if (initializationRef.current && !selectedLocation) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let latitude, longitude;

        if (selectedLocation) {
          // Use selected location from search
          console.log('📍 Using selected location for map:', selectedLocation.name);
          latitude = selectedLocation.latitude;
          longitude = selectedLocation.longitude;
          setUserLocation({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setLocationName(selectedLocation.name);
          setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } else {
          // Use current location (with caching to prevent re-fetching)
          if (locationCacheRef.current) {
            console.log('📍 Using cached location');
            latitude = locationCacheRef.current.latitude;
            longitude = locationCacheRef.current.longitude;
            setUserLocation(locationCacheRef.current);
            setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            const permissionGranted = await locationService.requestLocationPermission();
            if (!permissionGranted) {
              setError('Location permission denied');
              setLoading(false);
              initializationRef.current = true;
              return;
            }

            const location = await locationService.getCurrentLocation();
            if (location) {
              latitude = location.latitude;
              longitude = location.longitude;
              const cachedLocation = {
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              };
              locationCacheRef.current = cachedLocation;
              setUserLocation(cachedLocation);
              setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          }
        }

        if (latitude && longitude) {
          fetchEmergencyServices(latitude, longitude);
        }
      } catch (err) {
        console.error('Location error:', err);
        setError('Could not retrieve location');
      } finally {
        setLoading(false);
        if (!selectedLocation) {
          initializationRef.current = true;
        }
      }
    };

    initializeMap();
  }, [selectedLocation]);

  const fetchEmergencyServices = async (latitude, longitude) => {
    try {
      setFetchingEmergency(true);

      // Fetch hospitals using Nominatim
      const hospitalsResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=hospital&format=json&lat=${latitude}&lon=${longitude}&limit=50&countrycodes=IN`
      );
      const hospitalsData = await hospitalsResponse.json();
      
      const hospitalsList = (hospitalsData || [])
        .filter((h) => h.lat && h.lon)
        .map((h) => ({
          name: h.name || h.display_name || 'Hospital',
          latitude: parseFloat(h.lat),
          longitude: parseFloat(h.lon),
          type: 'hospital',
        }));

      setHospitals(hospitalsList);

      // Fetch police stations using Nominatim
      const policeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=police&format=json&lat=${latitude}&lon=${longitude}&limit=50&countrycodes=IN`
      );
      const policeData = await policeResponse.json();
      
      const policeList = (policeData || [])
        .filter((p) => p.lat && p.lon)
        .map((p) => ({
          name: p.name || p.display_name || 'Police Station',
          latitude: parseFloat(p.lat),
          longitude: parseFloat(p.lon),
          type: 'police',
        }));

      setPoliceStations(policeList);
      
      console.log('Found hospitals:', hospitalsList.length);
      console.log('Found police stations:', policeList.length);
    } catch (err) {
      console.error('Failed to fetch emergency services:', err);
      // Fallback: Try alternate method
      try {
        await fetchEmergencyServicesAlternate(latitude, longitude);
      } catch (altErr) {
        console.error('Fallback fetch also failed:', altErr);
      }
    } finally {
      setFetchingEmergency(false);
    }
  };

  const fetchEmergencyServicesAlternate = async (latitude, longitude) => {
    // Using OpenStreetMap Geocoding as fallback
    try {
      // Try to fetch with different search terms
      const hospitalsResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=healthcare&format=json&lat=${latitude}&lon=${longitude}&limit=50`
      );
      const hospitalsData = await hospitalsResponse.json();
      
      const hospitalsList = (hospitalsData || [])
        .filter((h) => h.lat && h.lon && 
          (h.type?.includes('hospital') || h.type?.includes('clinic') || 
           h.display_name?.toLowerCase().includes('hospital') ||
           h.display_name?.toLowerCase().includes('clinic')))
        .map((h) => ({
          name: h.name || h.display_name || 'Hospital',
          latitude: parseFloat(h.lat),
          longitude: parseFloat(h.lon),
          type: 'hospital',
        }));

      if (hospitalsList.length > 0) {
        setHospitals(hospitalsList);
      }

      // For police, try different search
      const policeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=police%20station&format=json&lat=${latitude}&lon=${longitude}&limit=50`
      );
      const policeData = await policeResponse.json();
      
      const policeList = (policeData || [])
        .filter((p) => p.lat && p.lon)
        .map((p) => ({
          name: p.name || p.display_name || 'Police Station',
          latitude: parseFloat(p.lat),
          longitude: parseFloat(p.lon),
          type: 'police',
        }));

      if (policeList.length > 0) {
        setPoliceStations(policeList);
      }
    } catch (err) {
      console.error('Alternate fetch failed:', err);
    }
  };

  const getMarkerColor = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('danger') || categoryLower.includes('robbery') || categoryLower.includes('assault') || categoryLower.includes('theft'))
      return '#EF4444';
    if (categoryLower.includes('scam') || categoryLower.includes('fraud') || categoryLower.includes('fake'))
      return '#F97316';
    return '#A855F7';
  };

  const handleEmergencyCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const calculateDistance = (item) => {
    if (!userLocation) return Infinity;
    const R = 6371;
    const dLat = ((item.latitude - userLocation.latitude) * Math.PI) / 180;
    const dLon = ((item.longitude - userLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.latitude * Math.PI) / 180) *
        Math.cos((item.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Return distance in km
  };

  const getDistanceText = (item) => {
    const d = calculateDistance(item);
    if (d === Infinity) return '';
    return d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
  };

  // Danger / Scam counts from reports
  const dangerCount = (nearbyReports || []).filter(
    (r) => r.category?.toLowerCase().includes('danger') || r.category?.toLowerCase().includes('theft') || r.category?.toLowerCase().includes('robbery')
  ).length;
  const scamCount = (nearbyReports || []).filter(
    (r) => r.category?.toLowerCase().includes('scam') || r.category?.toLowerCase().includes('fraud')
  ).length;

  const getRiskLevel = () => {
    const total = (nearbyReports || []).length;
    if (total >= 10) return { label: 'High Risk', bg: '#FEE2E2', dot: '#EF4444', text: '#991B1B' };
    if (total >= 3) return { label: 'Medium Risk', bg: '#FEF3C7', dot: '#EAB308', text: '#92400E' };
    return { label: 'Low Risk', bg: '#ECFDF5', dot: '#10B981', text: '#065F46' };
  };

  const riskInfo = getRiskLevel();

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text className="text-gray-500 font-outfit-regular mt-3">Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="text-red-600 font-outfit-semibold mt-3 text-center">{error}</Text>
        <Text className="text-gray-500 font-outfit-regular text-sm mt-2 text-center">
          Please enable location permissions in settings
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* ─── Map ─── */}
      <View className="relative" style={{ height: Platform.OS === 'web' ? 520 : 320 }}>
        {Platform.OS === 'web' ? (
          <div style={{ width: '100%', height: '100%', display: 'flex' }}>
            <WebMapView
              userLocation={userLocation}
              nearbyReports={nearbyReports || []}
              hospitals={hospitals}
              policeStations={policeStations}
              getMarkerColor={getMarkerColor}
            />
          </div>
        ) : userLocation ? (
          <MapView
            style={{ width: '100%', height: '100%' }}
            initialRegion={userLocation}
            showsUserLocation={true}
            followsUserLocation={false}>
            {/* Report Markers */}
            {nearbyReports &&
              nearbyReports.length > 0 &&
              nearbyReports.map((report, index) => (
                <Marker
                  key={`report-${index}`}
                  coordinate={{
                    latitude: report.latitude || userLocation.latitude + (Math.random() - 0.5) * 0.01,
                    longitude: report.longitude || userLocation.longitude + (Math.random() - 0.5) * 0.01,
                  }}
                  title={report.title}
                  description={report.category}>
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: getMarkerColor(report.category),
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}>
                    <Ionicons name="alert" size={18} color="#fff" />
                  </View>
                </Marker>
              ))}

            {/* Hospital Markers */}
            {hospitals.map((hospital, index) => (
              <Marker
                key={`hospital-${index}`}
                coordinate={{ latitude: hospital.latitude, longitude: hospital.longitude }}
                title={hospital.name}
                description="Hospital">
                <View
                  className="items-center justify-center rounded-full"
                  style={{ width: 32, height: 32, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#fff' }}>
                  <Ionicons name="medical" size={16} color="#fff" />
                </View>
              </Marker>
            ))}

            {/* Police Markers */}
            {policeStations.map((police, index) => (
              <Marker
                key={`police-${index}`}
                coordinate={{ latitude: police.latitude, longitude: police.longitude }}
                title={police.name}
                description="Police Station">
                <View
                  className="items-center justify-center rounded-full"
                  style={{ width: 32, height: 32, backgroundColor: '#1E3A8A', borderWidth: 2, borderColor: '#fff' }}>
                  <Ionicons name="shield" size={16} color="#fff" />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View className="flex-1 bg-gray-100 items-center justify-center">
            <Ionicons name="location-sharp" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 font-outfit-regular mt-3">Location unavailable</Text>
          </View>
        )}

        {/* Reports Count Badge */}
        {nearbyReports && nearbyReports.length > 0 && (
          <View className="absolute top-4 right-4 bg-white rounded-xl px-3 py-2" style={{ marginTop: 0 }}>
            <Text className="text-gray-900 font-outfit-semibold text-sm">{nearbyReports.length} nearby</Text>
          </View>
        )}
      </View>

      {/* ─── Current Location Card ─── */}
      <View className="px-4 py-3">
        <View
          className="bg-white rounded-2xl px-4 py-3 flex-row items-center"
          style={{ borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, backgroundColor: 'rgba(255,255,255,0.98)' }}>
          <Ionicons name="navigate" size={18} color="#6C5CE7" />
          <View className="ml-2 flex-1">
            <Text className="text-sm font-outfit-semibold text-gray-900">{locationName}</Text>
            <Text className="text-xs font-outfit-regular text-gray-500">{locationAddress}</Text>
          </View>
        </View>
      </View>

      {/* ─── Location Info Card ─── */}
      <View className="px-4 py-2">
        <View
          className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}>
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-lg font-outfit-semibold text-gray-900">Nearby Area</Text>
              <Text className="text-sm font-outfit-regular text-gray-500">{locationAddress}</Text>
            </View>
            <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: riskInfo.bg }}>
              <View className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: riskInfo.dot }} />
              <Text className="text-sm font-outfit-medium" style={{ color: riskInfo.text }}>{riskInfo.label}</Text>
            </View>
          </View>
          <View className="flex-row gap-6 mt-2">
            <View className="flex-row items-center">
              <Ionicons name="location" size={16} color="#EF4444" />
              <Text className="font-outfit-medium text-gray-900 ml-1">{dangerCount} Dangers</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="location" size={16} color="#F97316" />
              <Text className="font-outfit-medium text-gray-900 ml-1">{scamCount} Scams</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Emergency Services ─── */}
      <View className="px-4 pb-4">
        <Text className="text-lg font-outfit-semibold text-gray-900 mb-3">Emergency Services</Text>

        {/* SOS Button */}
        <Pressable
          onPress={() => handleEmergencyCall('112')}
          className="w-full py-4 rounded-2xl items-center justify-center flex-row mb-4"
          style={{
            backgroundColor: '#DC2626',
            shadowColor: '#DC2626',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}>
          <Ionicons name="alert-circle" size={24} color="#fff" />
          <Text className="text-white font-outfit-semibold text-base ml-2">SOS - Emergency Call 112</Text>
        </Pressable>

        {/* Quick Contact Grid */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => handleEmergencyCall('100')}
            className="flex-1 bg-white rounded-2xl p-4 items-center"
            style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
            <Ionicons name="shield" size={28} color="#6C5CE7" />
            <Text className="text-xs font-outfit-semibold text-gray-900 mt-2">Police</Text>
            <Text className="text-xs font-outfit-regular text-gray-400 mt-0.5">100</Text>
          </Pressable>
          <Pressable
            onPress={() => handleEmergencyCall('108')}
            className="flex-1 bg-white rounded-2xl p-4 items-center"
            style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
            <Ionicons name="medical" size={28} color="#DC2626" />
            <Text className="text-xs font-outfit-semibold text-gray-900 mt-2">Ambulance</Text>
            <Text className="text-xs font-outfit-regular text-gray-400 mt-0.5">108</Text>
          </Pressable>
          <Pressable
            onPress={() => handleEmergencyCall('101')}
            className="flex-1 bg-white rounded-2xl p-4 items-center"
            style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
            <Ionicons name="call" size={28} color="#F97316" />
            <Text className="text-xs font-outfit-semibold text-gray-900 mt-2">Fire Dept</Text>
            <Text className="text-xs font-outfit-regular text-gray-400 mt-0.5">101</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── Nearby Hospitals ─── */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="medical" size={18} color="#DC2626" />
            <Text className="text-lg font-outfit-semibold text-gray-900 ml-2">Nearby Hospitals</Text>
          </View>
          <Text className="text-sm font-outfit-medium" style={{ color: '#6C5CE7' }}>
            {fetchingEmergency ? 'Loading...' : `${hospitals.length} found`}
          </Text>
        </View>

        {fetchingEmergency && hospitals.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
            <ActivityIndicator size="small" color="#6C5CE7" />
            <Text className="text-gray-500 font-outfit-regular text-sm mt-2">Searching nearby...</Text>
          </View>
        ) : hospitals.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Ionicons name="medical-outline" size={32} color="#D1D5DB" />
            <Text className="text-gray-500 font-outfit-regular text-sm mt-2">No hospitals found nearby</Text>
          </View>
        ) : (
          <>
            {/* First 3 Hospitals */}
            {hospitals
              .map(h => ({ ...h, distance: calculateDistance(h) }))
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 3)
              .map((hospital, index) => (
              <View
                key={`hospital-card-${index}`}
                className="bg-white rounded-2xl p-4 mb-3"
                style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="font-outfit-semibold text-gray-900 mb-1">{hospital.name}</Text>
                    <Text className="text-xs font-outfit-regular text-gray-500">{getDistanceText(hospital)}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleEmergencyCall('108')}
                    className="flex-1 py-2 rounded-xl flex-row items-center justify-center"
                    style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Ionicons name="call" size={14} color="#6B7280" />
                    <Text className="text-xs font-outfit-semibold text-gray-600 ml-1">Call</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (hospital.latitude && hospital.longitude) {
                        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl flex-row items-center justify-center"
                    style={{ backgroundColor: '#6C5CE7' }}>
                    <Ionicons name="navigate" size={14} color="#fff" />
                    <Text className="text-xs font-outfit-semibold text-white ml-1">Map</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Remaining Hospitals in Horizontal ScrollView */}
            {hospitals.filter((_, i) => i >= 3).length > 0 && (
              <View>
                <Text className="text-sm font-outfit-semibold text-gray-600 mb-2">More Hospitals</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pb-2">
                  {hospitals
                    .map(h => ({ ...h, distance: calculateDistance(h) }))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(3)
                    .map((hospital, index) => (
                    <Pressable
                      key={`hospital-scroll-${index}`}
                      onPress={() => {
                        if (hospital.latitude && hospital.longitude) {
                          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`);
                        }
                      }}
                      className="bg-white rounded-xl p-3 mr-3"
                      style={{ borderWidth: 1, borderColor: '#E5E7EB', minWidth: 160 }}>
                      <Text className="font-outfit-semibold text-gray-900 text-sm mb-1" numberOfLines={2}>{hospital.name}</Text>
                      <View className="flex-row items-center">
                        <Ionicons name="navigate" size={12} color="#9CA3AF" />
                        <Text className="text-xs font-outfit-regular text-gray-500 ml-1">{getDistanceText(hospital)}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>

      {/* ─── Nearby Police Stations ─── */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="shield" size={18} color="#6C5CE7" />
            <Text className="text-lg font-outfit-semibold text-gray-900 ml-2">Nearby Police Stations</Text>
          </View>
          <Text className="text-sm font-outfit-medium" style={{ color: '#6C5CE7' }}>
            {fetchingEmergency ? 'Loading...' : `${policeStations.length} found`}
          </Text>
        </View>

        {fetchingEmergency && policeStations.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
            <ActivityIndicator size="small" color="#6C5CE7" />
            <Text className="text-gray-500 font-outfit-regular text-sm mt-2">Searching nearby...</Text>
          </View>
        ) : policeStations.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Ionicons name="shield-outline" size={32} color="#D1D5DB" />
            <Text className="text-gray-500 font-outfit-regular text-sm mt-2">No police stations found nearby</Text>
          </View>
        ) : (
          <>
            {/* First 3 Police Stations */}
            {policeStations
              .map(s => ({ ...s, distance: calculateDistance(s) }))
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 3)
              .map((station, index) => (
              <View
                key={`police-card-${index}`}
                className="bg-white rounded-2xl p-4 mb-3"
                style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="font-outfit-semibold text-gray-900 mb-1">{station.name}</Text>
                    <Text className="text-xs font-outfit-regular text-gray-500">{getDistanceText(station)}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleEmergencyCall('100')}
                    className="flex-1 py-2 rounded-xl flex-row items-center justify-center"
                    style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Ionicons name="call" size={14} color="#6B7280" />
                    <Text className="text-xs font-outfit-semibold text-gray-600 ml-1">Call</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (station.latitude && station.longitude) {
                        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl flex-row items-center justify-center"
                    style={{ backgroundColor: '#6C5CE7' }}>
                    <Ionicons name="navigate" size={14} color="#fff" />
                    <Text className="text-xs font-outfit-semibold text-white ml-1">Map</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Remaining Police Stations in Horizontal ScrollView */}
            {policeStations.filter((_, i) => i >= 3).length > 0 && (
              <View>
                <Text className="text-sm font-outfit-semibold text-gray-600 mb-2">More Police Stations</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="pb-2">
                  {policeStations
                    .map(s => ({ ...s, distance: calculateDistance(s) }))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(3)
                    .map((station, index) => (
                    <Pressable
                      key={`police-scroll-${index}`}
                      onPress={() => {
                        if (station.latitude && station.longitude) {
                          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`);
                        }
                      }}
                      className="bg-white rounded-xl p-3 mr-3"
                      style={{ borderWidth: 1, borderColor: '#E5E7EB', minWidth: 160 }}>
                      <Text className="font-outfit-semibold text-gray-900 text-sm mb-1" numberOfLines={2}>{station.name}</Text>
                      <View className="flex-row items-center">
                        <Ionicons name="navigate" size={12} color="#9CA3AF" />
                        <Text className="text-xs font-outfit-regular text-gray-500 ml-1">{getDistanceText(station)}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>

      {/* ─── Safety Tips ─── */}
      <View className="px-4 pb-8">
        <Text className="text-lg font-outfit-semibold text-gray-900 mb-3">Safety Tips</Text>
        {safetyTips.map((tip, index) => (
          <View
            key={index}
            className="rounded-2xl p-4 mb-3 flex-row"
            style={{
              backgroundColor: 'rgba(108, 92, 231, 0.04)',
              borderWidth: 1,
              borderColor: 'rgba(108, 92, 231, 0.15)',
            }}>
            <View className="rounded-xl p-2.5" style={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}>
              <Ionicons name={tip.icon} size={20} color="#6C5CE7" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-outfit-semibold text-gray-900 mb-1">{tip.title}</Text>
              <Text className="text-sm font-outfit-regular text-gray-500">{tip.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
