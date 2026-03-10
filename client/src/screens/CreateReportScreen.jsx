import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, ToastAndroid } from 'react-native';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { createReport } from '@/redux/slices/reportSlice';
import { locationService } from '@/utils/locationService';
import axiosClient from '@/api/axiosClient';
import Feather from '@expo/vector-icons/Feather';

const CATEGORIES = [
  { id: 'scam', label: 'Scam', icon: 'alert-circle' },
  { id: 'danger', label: 'Danger', icon: 'warning' },
];

/**
 * CreateReportScreen Component
 * Comprehensive form for creating risk reports with 3 location selection methods:
 * 1. Use Current Location - Auto-fetch with permission request
 * 2. Search Place Name - Nominatim API geocoding
 * 3. Map Selection - Future feature placeholder
 */
export default function CreateReportScreen() {
  const dispatch = useDispatch();
  const reportState = useSelector((state) => state?.report || {});
  const { creating } = reportState;

  const [locationType, setLocationType] = useState('current');
  const [location, setLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('Downtown Bangkok, Thailand');
  const [placeSearchInput, setPlaceSearchInput] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validating, setValidating] = useState(false);

  const [errors, setErrors] = useState({});

  const clearFormFields = () => {
    setSelectedCategory(null);
    setTitle('');
    setDescription('');
    setErrors({});
  };

  const handleUpdateCurrentLocation = async () => {
    try {
      const permitted = await locationService.requestLocationPermission();
      if (!permitted) {
        setErrors({ location: 'Location permission required to fetch your current location.' });
        return;
      }
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setCurrentLocation(`${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        setLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          placeName: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
        });
        setErrors((prev) => ({ ...prev, location: undefined }));
      }
    } catch (error) {
      setErrors({ location: 'Failed to fetch location. Please try again.' });
    }
  };

  const handleSearchPlace = async () => {
    if (!placeSearchInput.trim()) {
      setErrors((prev) => ({ ...prev, placeSearch: 'Please enter a place name.' }));
      return;
    }
    try {
      setSearchingPlace(true);
      setErrors((prev) => ({ ...prev, placeSearch: undefined }));
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeSearchInput)}&format=json&limit=1`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      if (!data || data.length === 0) {
        setErrors((prev) => ({ ...prev, placeSearch: 'Place not found. Please try a different search.' }));
        return;
      }
      const result = data[0];
      console.log('Nominatim result:', result);
      setLocation({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        placeName: result.display_name,
      });
      clearFormFields();
    } catch (error) {
      setErrors((prev) => ({ ...prev, placeSearch: 'Failed to search place. Please check your connection.' }));
    } finally {
      setSearchingPlace(false);
    }
  };

  const handleMapSelection = () => {
    Alert.alert('Currently Implementing', 'Map location selection is currently being implemented and will be available soon.');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!location) newErrors.location = 'Please select a location';
    if (!selectedCategory) newErrors.category = 'Please select a category';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setValidating(true);
      const validationResponse = await axiosClient.post('/api/ml/validate-category', {
        text: description,
        category: selectedCategory,
      });

      // Extract validation result from response
      const validationResult = validationResponse?.data?.data;
      
      // Check if validation response has expected structure
      if (!validationResult) {
        setErrors((prev) => ({
          ...prev,
          validation: 'Validation service error. Please try again.',
        }));
        setValidating(false);
        return;
      }

      // Check if description is valid for category
      if (!validationResult.valid) {
        setErrors((prev) => ({
          ...prev,
          validation: validationResult.message || `Description doesn't match "${selectedCategory}" category. Please revise.`,
        }));
        setValidating(false);
        return;
      }

      // Log validation confidence for debugging
      console.log(`✅ [Validation] Passed with confidence: ${((validationResult.confidence || 0) * 100).toFixed(1)}%`);

      const reportData = {
        latitude: location.latitude,
        longitude: location.longitude,
        category: selectedCategory,
        title: title.trim(),
        description: description.trim(),
      };
      
      // Submit report
      await dispatch(createReport(reportData)).unwrap();
      
      // Only clear form fields and show success message if submission succeeds
      setLocation(null);
      setLocationType('current');
      setCurrentLocation('Downtown Bangkok, Thailand');
      setSelectedCategory(null);
      setTitle('');
      setDescription('');
      setPlaceSearchInput('');
      setErrors({});
      
      // Show success message - safely handle ToastAndroid
      try {
        if (ToastAndroid && ToastAndroid.show) {
          ToastAndroid.show('Report created successfully! ✅', ToastAndroid.LONG);
        } else {
          Alert.alert('Success', 'Report created successfully! ✅');
        }
      } catch (toastError) {
        console.warn('Toast notification failed:', toastError.message);
        Alert.alert('Success', 'Report created successfully! ✅');
      }
    } catch (error) {
      console.error('Submit error:', error);
      const errorMsg = error?.message || 'Failed to create report. Please try again.';
      setErrors((prev) => ({ ...prev, submit: errorMsg }));
    } finally {
      setValidating(false);
    }
  };

  const ErrorBox = ({ message }) =>
    message ? (
      <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
        <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
        <Text className="text-red-600 text-sm flex-1 font-outfit-regular">{message}</Text>
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HEADER */}
        <View className="px-6 py-6 bg-gray-50">
          <Text className="text-2xl font-bold text-gray-900 mb-2 font-outfit-bold">Create a Report</Text>
          <Text className="text-gray-600 text-sm font-outfit-regular">Help others stay safe by sharing your experience</Text>
        </View>

        <View className="px-6">

          {/* LOCATION SECTION */}
          <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-200 shadow-sm">
            <Text className="text-sm font-bold text-gray-900 mb-4 font-outfit-semibold">
              Location <Text className="text-red-600">*</Text>
            </Text>

            {/* If location is selected, show it with Change Location button */}
            {location ? (
              <View>
                <View className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-3 flex-row gap-3">
                  <Ionicons name="location" size={18} color="#7C3AED" style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-medium text-purple-700 mb-1 font-outfit-medium">Selected Location</Text>
                    <Text className="text-sm text-gray-700 font-medium font-outfit-medium">{location.placeName}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    setLocation(null);
                    setLocationType('current');
                    setPlaceSearchInput('');
                    setErrors((prev) => ({ ...prev, placeSearch: undefined }));
                  }}
                  className="bg-purple-100 border border-purple-300 rounded-2xl py-3 flex-row items-center justify-center">
                  <Ionicons name="reload" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                  <Text className="text-purple-700 font-bold text-sm font-outfit-semibold">Change Location</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Location Type Buttons */}
                <View className="flex-row gap-2 mb-4">
                  <Pressable
                    onPress={() => setLocationType('current')}
                    className={`flex-1 py-3 px-2 items-center rounded-2xl border-2 ${
                      locationType === 'current'
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-gray-200'
                    }`}>
                    <Ionicons
                      name="navigate"
                      size={18}
                      color={locationType === 'current' ? 'white' : '#7C3AED'}
                      style={{ marginBottom: 4 }}
                    />
                    <Text className={`text-xs font-medium font-outfit-medium ${locationType === 'current' ? 'text-white' : 'text-gray-900'}`}>
                      Current
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setLocationType('manual');
                      setPlaceSearchInput('');
                      setErrors((prev) => ({ ...prev, placeSearch: undefined }));
                    }}
                    className={`flex-1 py-3 px-2 items-center rounded-2xl border-2 ${
                      locationType === 'manual'
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-gray-200'
                    }`}>
                    <Ionicons
                      name="create"
                      size={18}
                      color={locationType === 'manual' ? 'white' : '#7C3AED'}
                      style={{ marginBottom: 4 }}
                    />
                    <Text className={`text-xs font-medium font-outfit-medium ${locationType === 'manual' ? 'text-white' : 'text-gray-900'}`}>
                      Enter
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setLocationType('map')}
                    className={`flex-1 py-3 px-2 items-center rounded-2xl border-2 ${
                      locationType === 'map'
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-gray-200'
                    }`}>
                    <Ionicons
                      name="map"
                      size={18}
                      color={locationType === 'map' ? 'white' : '#7C3AED'}
                      style={{ marginBottom: 4 }}
                    />
                    <Text className={`text-xs font-medium font-outfit-medium ${locationType === 'map' ? 'text-white' : 'text-gray-900'}`}>
                      Map
                    </Text>
                  </Pressable>
                </View>

                {/* Current Location View */}
                {locationType === 'current' && (
                  <View>
                    <View className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-3 flex-row gap-3">
                      <Ionicons name="location" size={18} color="#7C3AED" style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="text-xs font-medium text-purple-700 mb-1 font-outfit-medium">Using Current Location</Text>
                        <Text className="text-sm text-gray-700 font-medium font-outfit-medium">{currentLocation}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={handleUpdateCurrentLocation}
                      className="bg-gray-100 border border-gray-300 rounded-2xl py-3 flex-row items-center justify-center">
                      <Ionicons name="navigate" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                      <Text className="text-gray-700 font-bold text-sm font-outfit-semibold">Update Current Location</Text>
                    </Pressable>
                  </View>
                )}

                {/* Manual Entry View */}
                {locationType === 'manual' && (
                  <View>
                    <View className="flex-row items-center gap-2 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-3 mb-2">
                      <Ionicons name="location" size={18} color="#7C3AED" />
                      <TextInput
                        placeholder="Enter location (e.g., Suvarnabhumi Airport)"
                        value={placeSearchInput}
                        onChangeText={(text) => {
                          setPlaceSearchInput(text);
                          setErrors((prev) => ({ ...prev, placeSearch: undefined }));
                        }}
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 text-sm text-gray-900 focus:outline-none p-1 rounded-lg"
                      />
                    </View>
                    <Text className="text-xs text-gray-500 mb-3 font-outfit-regular">Be as specific as possible for better accuracy</Text>
                    <Pressable
                      onPress={handleSearchPlace}
                      disabled={searchingPlace || !placeSearchInput.trim()}
                      className={`py-3 px-4 rounded-2xl flex-row items-center justify-center ${
                        searchingPlace || !placeSearchInput.trim()
                          ? 'bg-gray-200'
                          : 'bg-purple-600'
                      }`}>
                      {searchingPlace ? (
                        <>
                          <ActivityIndicator color="white" size="small" />
                          <Text className="text-white font-bold text-sm ml-2">Searching...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="search" size={16} color="white" style={{ marginRight: 6 }} />
                          <Text className="text-white font-bold text-sm font-outfit-semibold">Search Location</Text>
                        </>
                      )}
                    </Pressable>
                    <ErrorBox message={errors.placeSearch} />
                  </View>
                )}

                {/* Map Selection View */}
                {locationType === 'map' && (
                  <View>
                    <View className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-3 flex-row gap-3 items-start">
                      <Ionicons name="information-circle" size={20} color="#FBBF24" style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-yellow-900 font-outfit-semibold">Currently Implementing</Text>
                        <Text className="text-xs text-yellow-800 mt-1 font-outfit-regular">Map-based location selection is currently under development and will be available soon.</Text>
                      </View>
                    </View>
                    <Pressable
                      disabled={true}
                      className="bg-gray-200 border border-gray-300 rounded-2xl py-3 flex-row items-center justify-center opacity-50">
                      <Ionicons name="map" size={16} color="#999" style={{ marginRight: 6 }} />
                      <Text className="text-gray-500 font-bold text-sm">Coming Soon</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}

            <ErrorBox message={errors.location} />
          </View>

          {/* CATEGORY SECTION */}
          <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-200 shadow-sm">
            <Text className="text-sm font-bold text-gray-900 mb-3 font-outfit-semibold">
              Category <Text className="text-red-600">*</Text>
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setSelectedCategory('scam')}
                className={`flex-1 py-4 px-4 rounded-2xl border-2 items-center transform ${
                  selectedCategory === 'scam'
                    ? 'bg-orange-500 border-orange-500 scale-105 shadow-lg'
                    : 'bg-white border-gray-200'
                }`}>
                <Feather name="alert-triangle" size={24} className={`${selectedCategory === 'scam' ? 'text-white' : 'text-gray-900'}`} />
                <Text className={`text-sm font-bold font-outfit-bold ${selectedCategory === 'scam' ? 'text-white' : 'text-gray-900'}`}>
                  Scam Alert
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedCategory('danger')}
                className={`flex-1 py-4 px-4 rounded-2xl border-2 items-center transform ${
                  selectedCategory === 'danger'
                    ? 'bg-red-500 border-red-500 scale-105 shadow-lg'
                    : 'bg-white border-gray-200'
                }`}>
                <Feather name="alert-triangle" size={24} className={`${selectedCategory === 'danger' ? 'text-white' : 'text-gray-900'}`} />
                <Text className={`text-sm font-bold font-outfit-bold ${selectedCategory === 'danger' ? 'text-white' : 'text-gray-900'}`}>
                  Danger Alert
                </Text>
              </Pressable>
            </View>
            <ErrorBox message={errors.category} />
          </View>

          {/* TITLE SECTION */}
          <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-200 shadow-sm">
            <Text className="text-sm font-bold text-gray-900 mb-3 font-outfit-semibold">
              Title <Text className="text-red-600">*</Text>
            </Text>
            <TextInput
              placeholder="Give me a short title for the report (eg : Fake Taxi) "
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 bg-gray-50 rounded-2xl px-4 py-3.5 text-sm text-gray-900 font-outfit-regular"
            />
            <Text className="text-xs text-gray-500 mt-2 font-outfit-regular">
              Keep it clear and concise for others to understand quickly
            </Text>
            <ErrorBox message={errors.title} />
          </View>

          {/* DESCRIPTION SECTION */}
          <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-200 shadow-sm">
            <Text className="text-sm font-bold text-gray-900 mb-3 font-outfit-semibold">
              Description <Text className="text-red-600">*</Text>
            </Text>
            <TextInput
              placeholder={`Provide details about what happened...

Include:
• What happened
• When it occurred
• Who was involved
• How to avoid it`}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setErrors((prev) => ({ ...prev, validation: undefined }));
              }}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="border border-gray-300 bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-900 min-h-40 font-outfit-regular"
            />
            <Text className="text-xs text-gray-500 mt-2 font-outfit-regular">
              The more details you provide, the more helpful your report will be
            </Text>
            <ErrorBox message={errors.description} />
            <ErrorBox message={errors.validation} />
            <ErrorBox message={errors.submit} />
          </View>

          

          {/* ADDITIONAL TIPS SECTION */}
          <View className="bg-purple-50 rounded-3xl p-5 mb-6 border border-purple-200">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="alert-triangle" size={16} color="#7C3AED" />
              <Text className="text-sm font-bold text-gray-900 font-outfit-semibold">Reporting Guidelines</Text>
            </View>
            <View className="space-y-2">
              {[
                "Only report incidents you've personally witnessed or experienced",
                'Be honest and factual in your description',
                'Avoid including personal information of others',
                'If it\'s an emergency, call local authorities first (191)',
              ].map((text, idx) => (
                <View key={idx} className="flex-row gap-2">
                  <Text className="text-gray-500 text-xs font-outfit-regular">•</Text>
                  <Text className="text-gray-600 text-xs flex-1 font-outfit-regular">{text}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* SUBMIT BUTTON */}
          <Pressable
            onPress={handleSubmit}
            disabled={creating || validating}
            className={`rounded-2xl py-4 flex-row items-center justify-center mb-6 ${
              creating || validating ? 'bg-purple-300' : 'bg-purple-600 active:bg-purple-700'
            }`}>
            {validating ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-base ml-2 font-outfit-semibold">Validating...</Text>
              </>
            ) : creating ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-base ml-2 font-outfit-semibold">Submitting...</Text>
              </>
            ) : (
              <Text className="text-white font-bold text-base font-outfit-semibold">Submit Report</Text>
            )}
          </Pressable>

        </View>
      </ScrollView>
    </View>
  );
}