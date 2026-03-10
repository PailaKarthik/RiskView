import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { toggleTravelMode } from '@/redux/slices/travelSlice';
import { summarizeAll, askRAG } from '@/redux/slices/mlSlice';
import { upvoteReport, downvoteReport, updateReportVotes, fetchNearbyReports } from '@/redux/slices/reportSlice';
import { useTravelMode } from '@/hooks/useTravelMode';
import { locationService } from '@/utils/locationService';
import MapSection from '@/components/MapSection';
import VisualizationView from '@/components/VisualizationView';

export default function HomeScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { user } = useSelector((state) => state?.auth || {});
  const { list: reports, loadingNearby, voting } = useSelector((state) => state?.report || {});
  const { travelMode } = useSelector((state) => state?.travel || {});
  const { summary, ragAnswer, summarizing, ragLoading, error: mlError } = useSelector((state) => state?.ml || {});

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('map');
  const [ragQuestion, setRagQuestion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [userVotes, setUserVotes] = useState({}); // Track user votes: { reportId: 'upvote' | 'downvote' }
  const [summaryModalVisible, setSummaryModalVisible] = useState(false); // Control summary modal visibility
  const [dismissedRagAnswer, setDismissedRagAnswer] = useState(false); // Track if RAG answer was dismissed
  const [locationSearchQuery, setLocationSearchQuery] = useState(''); // Location search input
  const [selectedLocation, setSelectedLocation] = useState(null); // Selected location with lat/lng
  const [locationError, setLocationError] = useState(null); // Error message if location not found
  const [locationLoading, setLocationLoading] = useState(false); // Loading state while searching location

  // Travel mode polling - skip when custom location is selected
  useTravelMode(selectedLocation);

  /**
   * Clear location selection when travel mode is turned off
   */
  useEffect(() => {
    if (!travelMode) {
      if (selectedLocation) {
        console.log('🛑 Travel mode OFF - clearing selected location and search query');
        setSelectedLocation(null);
        setLocationSearchQuery('');
        setLocationError(null);
      }
    }
  }, [travelMode]);

  /**
   * Fetch reports for selected location
   */
  useEffect(() => {
    if (!travelMode) return; // Only fetch when in travel mode
    
    if (selectedLocation) {
      console.log('📍 Fetching reports for selected location:', {
        name: selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      dispatch(
        fetchNearbyReports({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        })
      );
    }
  }, [selectedLocation, travelMode, dispatch]);

  const handleFetchSummary = async () => {
    setSummaryModalVisible(true);
    try {
      const coords = selectedLocation
        ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
        : undefined;
      await dispatch(summarizeAll(coords)).unwrap();
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!ragQuestion.trim()) return;
    setDismissedRagAnswer(false); // Reset dismissed state when asking a new question
    try {
      const payload = selectedLocation
        ? { question: ragQuestion, latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
        : ragQuestion;
      await dispatch(askRAG(payload)).unwrap();
    } catch (error) {
      console.error('Failed to get answer:', error);
    }
  };

  const handleDismissRagAnswer = () => {
    setDismissedRagAnswer(true);
  };

  const handleToggleTravelMode = () => {
    dispatch(toggleTravelMode());
    // Clear location selection when turning off travel mode
    if (travelMode) {
      // If travel mode is currently ON, it will be turned OFF
      setSelectedLocation(null);
      setLocationSearchQuery('');
      setLocationError(null);
      console.log('📍 Travel mode disabled - cleared location selection');
    }
  };

  /**
   * Search for location using Nominatim API (OpenStreetMap)
   */
  const handleSearchLocation = async () => {
    if (!locationSearchQuery.trim()) {
      setLocationError('Please enter a location name');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    try {
      console.log('🔍 Searching location:', locationSearchQuery);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearchQuery)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        console.log('✅ Location found:', { name: location.display_name, lat, lng });
        setSelectedLocation({
          name: location.display_name,
          latitude: lat,
          longitude: lng,
        });
        setLocationError(null);
      } else {
        console.warn('❌ Location not found');
        setLocationError('Location not found. Please try another search.');
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error('❌ Error searching location:', error);
      setLocationError('Error searching location. Please try again.');
      setSelectedLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  /**
   * Clear location search and return to current location
   */
  const handleClearLocation = async () => {
    console.log('🔄 Clearing location search, reverting to current location reports');
    setLocationSearchQuery('');
    setSelectedLocation(null);
    setLocationError(null);

    // Fetch reports for current location immediately
    if (travelMode) {
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          console.log('📍 Refetching reports for current location:', {
            latitude: location.latitude,
            longitude: location.longitude,
          });
          dispatch(
            fetchNearbyReports({
              latitude: location.latitude,
              longitude: location.longitude,
            })
          );
        }
      } catch (error) {
        console.error('❌ Failed to refetch current location:', error);
        // useTravelMode hook will handle refetching on next poll
      }
    }
  };

  const getReportId = (report) => report?._id || report?.id;

  const handleUpvote = (report) => {
    const id = getReportId(report);
    const currentUpvotes = Array.isArray(report.upvotes) ? report.upvotes.length : (report.upvotes || 0);
    const currentDownvotes = Array.isArray(report.downvotes) ? report.downvotes.length : (report.downvotes || 0);
    setUserVotes((prev) => ({
      ...prev,
      [id]: prev[id] === 'upvote' ? null : 'upvote', // Toggle or set to upvote
    }));
    dispatch(updateReportVotes({ reportId: id, upvotes: currentUpvotes + 1, downvotes: currentDownvotes }));
    dispatch(upvoteReport(id));
  };

  const handleDownvote = (report) => {
    const id = getReportId(report);
    const currentUpvotes = Array.isArray(report.upvotes) ? report.upvotes.length : (report.upvotes || 0);
    const currentDownvotes = Array.isArray(report.downvotes) ? report.downvotes.length : (report.downvotes || 0);
    setUserVotes((prev) => ({
      ...prev,
      [id]: prev[id] === 'downvote' ? null : 'downvote', // Toggle or set to downvote
    }));
    dispatch(updateReportVotes({ reportId: id, upvotes: currentUpvotes, downvotes: currentDownvotes + 1 }));
    dispatch(downvoteReport(id));
  };

  const toggleExpand = (postId) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = [...(reports || [])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (r) => r.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    if (sortBy === 'votes') {
      filtered.sort((a, b) => {
        const aUp = Array.isArray(a.upvotes) ? a.upvotes.length : (a.upvotes || 0);
        const aDown = Array.isArray(a.downvotes) ? a.downvotes.length : (a.downvotes || 0);
        const bUp = Array.isArray(b.upvotes) ? b.upvotes.length : (b.upvotes || 0);
        const bDown = Array.isArray(b.downvotes) ? b.downvotes.length : (b.downvotes || 0);
        return (bUp - bDown) - (aUp - aDown);
      });
    } else {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return filtered;
  }, [reports, searchQuery, selectedCategory, sortBy]);

  const getCategoryBadge = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('scam') || cat.includes('fraud')) return { bg: '#FFF7ED', text: '#EA580C', label: 'Scam' };
    if (cat.includes('danger') || cat.includes('robbery') || cat.includes('theft') || cat.includes('assault'))
      return { bg: '#FEF2F2', text: '#DC2626', label: 'Danger' };
    if (cat.includes('weather')) return { bg: '#FEFCE8', text: '#CA8A04', label: 'Weather' };
    return { bg: '#F3E8FF', text: '#7C3AED', label: category || 'Other' };
  };

  const tabs = [
    { key: 'map', label: 'Map' },
    { key: 'reports', label: 'Reports' },
    { key: 'overview', label: 'Overview' },
  ];

  // ─── Report Card ───
  const renderReportCard = (report) => {
    console.log(report , "homescreen")
    const id = getReportId(report);
    const isExpanded = expandedPosts.has(id);
    const badge = getCategoryBadge(report.category);
    const authorInitial = (report.user?.fullName || 'U')[0]?.toUpperCase();
    const authorName = report.user?.fullName || 'Anonymous';
    const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recently';

    return (
      <View key={id || Math.random()} className="bg-white rounded-2xl p-4 mb-3" style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
        {/* Header: Avatar + Author + Category */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#6C5CE7' }}>
              <Text className="text-sm font-outfit-semibold text-white">{authorInitial}</Text>
            </View>
            <View className="ml-2 flex-1">
              <Text className="text-sm font-outfit-semibold text-gray-900">{authorName}</Text>
              <Text className="text-xs font-outfit-regular text-gray-400">{dateStr}</Text>
            </View>
          </View>
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: badge.bg }}>
            <Text className="text-xs font-outfit-semibold" style={{ color: badge.text }}>{badge.label}</Text>
          </View>
        </View>

        {/* Title */}
        <Text className="font-outfit-semibold text-gray-900 text-base mb-2">{report.title}</Text>

        {/* Location */}
        {report.location && (
          <View className="flex-row items-start mb-3">
            <Ionicons name="location" size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
            <Text className="text-sm font-outfit-regular text-gray-500 ml-1 flex-1">
              {typeof report.location === 'string' 
                ? report.location 
                : report.location?.coordinates 
                  ? `${report.location.coordinates[1]?.toFixed(4)}, ${report.location.coordinates[0]?.toFixed(4)}` 
                  : 'Location data available'}
            </Text>
          </View>
        )}

        {/* Description */}
        {report.description && (
          <Text
            className="text-sm font-outfit-regular text-gray-500 mb-3 leading-5"
            numberOfLines={isExpanded ? undefined : 3}>
            {report.description}
          </Text>
        )}

        {/* Expand/Collapse */}
        {report.description && report.description.length > 120 && (
          <Pressable onPress={() => toggleExpand(id)} className="flex-row items-center mb-3">
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#6C5CE7" />
            <Text className="text-sm font-outfit-medium ml-1" style={{ color: '#6C5CE7' }}>
              {isExpanded ? 'Show less' : 'Read more'}
            </Text>
          </Pressable>
        )}

        {/* Risk Level */}
        {report.riskLevel && (
          <View className="flex-row items-center mb-3">
            <View
              className="rounded-full px-2.5 py-1"
              style={{
                backgroundColor:
                  report.riskLevel === 'high' ? '#FEE2E2' : report.riskLevel === 'medium' ? '#FEF3C7' : '#ECFDF5',
              }}>
              <Text
                className="text-xs font-outfit-semibold capitalize"
                style={{
                  color:
                    report.riskLevel === 'high' ? '#DC2626' : report.riskLevel === 'medium' ? '#D97706' : '#059669',
                }}>
                {report.riskLevel} risk
              </Text>
            </View>
          </View>
        )}

        {/* Votes */}
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => handleUpvote(report)} disabled={voting} className="flex-row items-center active:opacity-60">
            <Ionicons name="arrow-up" size={18} color={userVotes[id] === 'upvote' ? '#A855F7' : '#6B7280'} />
            <Text className={`text-sm font-outfit-medium ml-1 ${userVotes[id] === 'upvote' ? 'text-purple-600' : 'text-gray-600'}`}>{Array.isArray(report.upvotes) ? report.upvotes.length : (report.upvotes || 0)}</Text>
          </Pressable>
          <Pressable onPress={() => handleDownvote(report)} disabled={voting} className="flex-row items-center active:opacity-60">
            <Ionicons name="arrow-down" size={18} color={userVotes[id] === 'downvote' ? '#A855F7' : '#6B7280'} />
            <Text className={`text-sm font-outfit-medium ml-1 ${userVotes[id] === 'downvote' ? 'text-purple-600' : 'text-gray-600'}`}>{Array.isArray(report.downvotes) ? report.downvotes.length : (report.downvotes || 0)}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // ─── Reports Tab Content ───
  const renderReportsTab = () => (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Overall Summarize Button - Only show if travel mode is on */}
        {travelMode && (
          <View className="bg-white border-b border-gray-200 px-4 py-4">
            <Pressable
              onPress={handleFetchSummary}
              disabled={summarizing}
              className="w-full py-3.5 rounded-2xl items-center justify-center flex-row"
              style={{
                backgroundColor: '#6C5CE7',
                shadowColor: '#6C5CE7',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}>
              {summarizing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="sparkles" size={20} color="#fff" />
              )}
              <Text className="text-white font-outfit-semibold text-base ml-2">
                {summarizing ? 'Analyzing...' : 'Overall Summarize'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Summary Result - Displayed in Modal */}

        {travelMode && mlError && !summary && (
          <View className="mx-4 mt-4 rounded-2xl p-4" style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}>
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text className="font-outfit-regular text-sm ml-2 flex-1 text-red-700">{mlError}</Text>
            </View>
          </View>
        )}

        {/* Filters */}
        <View className="bg-white border-b border-gray-200 px-4 py-3 mt-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'scam', 'danger'].map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className="mr-2 px-4 py-2 rounded-xl"
                style={{
                  borderWidth: 2,
                  borderColor: selectedCategory === cat ? '#6C5CE7' : '#E5E7EB',
                  backgroundColor: selectedCategory === cat ? '#F3E8FF' : '#FFF',
                }}>
                <Text
                  className="text-sm font-outfit-semibold"
                  style={{ color: selectedCategory === cat ? '#6C5CE7' : '#6B7280' }}>
                  {cat === 'all' ? 'All Reports' : cat === 'scam' ? 'Scam Alerts' : 'Danger Alerts'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Sort */}
          <View className="flex-row gap-2 mt-3">
            {[
              { key: 'recent', label: 'Most Recent', icon: 'time' },
              { key: 'votes', label: 'Most Voted', icon: 'thumbs-up' },
            ].map((option) => (
              <Pressable
                key={option.key}
                onPress={() => setSortBy(option.key)}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                style={{
                  borderWidth: 2,
                  borderColor: sortBy === option.key ? '#6C5CE7' : '#E5E7EB',
                  backgroundColor: sortBy === option.key ? '#F3E8FF' : '#FFF',
                }}>
                <Ionicons name={option.icon} size={14} color={sortBy === option.key ? '#6C5CE7' : '#9CA3AF'} />
                <Text
                  className="ml-1.5 text-sm font-outfit-semibold"
                  style={{ color: sortBy === option.key ? '#6C5CE7' : '#6B7280' }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Reports */}
        <View className="px-4 pt-4 pb-4">
          {!travelMode ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-full bg-yellow-100 items-center justify-center mb-4">
                <Ionicons name="airplane" size={32} color="#FBBF24" />
              </View>
              <Text className="text-gray-900 font-semibold text-center font-outfit-semibold">
                Turn on Travel Mode
              </Text>
              <Text className="text-gray-600 text-sm text-center mt-2 font-outfit-regular">
                Enable travel mode to view nearby reports and stay safe.
              </Text>
            </View>
          ) : loadingNearby ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text className="text-gray-500 font-outfit-regular mt-3">Loading reports...</Text>
            </View>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => renderReportCard(report))
          ) : (
            <View className="items-center py-12">
              <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-600 font-outfit-semibold mt-4">
                {searchQuery || selectedCategory !== 'all' ? 'No matching reports' : 'No reports yet'}
              </Text>
              <Text className="text-gray-400 font-outfit-regular text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Be the first to report a risk'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacer for RAG input */}
        <View className="h-40" />
      </ScrollView>

      {/* RAG Chat Input - Fixed at bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 px-4 py-3"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}>
        <View className="flex-row gap-2 items-center">
          <View className="flex-1 bg-gray-50 rounded-2xl flex-row items-center px-3" style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
            <TextInput
              placeholder="Ask questions about this place..."
              placeholderTextColor="#9CA3AF"
              value={ragQuestion}
              onChangeText={setRagQuestion}
              onSubmitEditing={handleAskQuestion}
              className="flex-1 py-3 text-gray-900 font-outfit-regular focus:outline-none"
            />
            {ragLoading && <ActivityIndicator size="small" color="#6C5CE7" />}
          </View>
          <Pressable
            onPress={handleAskQuestion}
            disabled={ragLoading || !ragQuestion.trim()}
            className="py-3 px-5 rounded-2xl items-center justify-center"
            style={{ backgroundColor: ragLoading || !ragQuestion.trim() ? '#D1D5DB' : '#6C5CE7' }}>
            <Text className="text-white font-outfit-semibold">Ask</Text>
          </Pressable>
        </View>

        {/* RAG Answer */}
        {ragAnswer && !dismissedRagAnswer && (
          <View className="mt-3 rounded-2xl p-4" style={{ backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#DDD6FE' }}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <Ionicons name="sparkles" size={14} color="#6C5CE7" />
                <Text className="font-outfit-bold text-xs ml-1" style={{ color: '#4C1D95' }}>AI Answer</Text>
              </View>
              <Pressable onPress={handleDismissRagAnswer} className="active:opacity-60">
                <Ionicons name="close" size={18} color="#A855F7" />
              </Pressable>
            </View>
            <Text className="font-outfit-regular text-sm leading-5 text-gray-800">
              {ragAnswer.answer || ragAnswer}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* ─── Top Bar ─── */}
      <View className="bg-white border-b border-gray-200 px-4 pt-10 pb-3">
        <View className="flex-row items-center gap-3">
          {/* Location Search - Only visible in Travel Mode */}
          {travelMode ? (
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                {/* Location Search Input */}
                <View className="flex-1 bg-gray-50 rounded-xl flex-row items-center px-3 h-11" style={{ borderWidth: 2, borderColor: selectedLocation ? '#A855F7' : '#E5E7EB' }}>
                  <Ionicons name="location" size={18} color="#6C5CE7" />
                  <TextInput
                    placeholder="Search location..."
                    placeholderTextColor="#9CA3AF"
                    value={locationSearchQuery}
                    onChangeText={setLocationSearchQuery}
                    className="flex-1 ml-2 text-gray-900 font-outfit-regular focus:outline-none"
                  />
                  {locationSearchQuery ? (
                    <Pressable onPress={handleClearLocation} className="active:opacity-60">
                      <Ionicons name="close-circle" size={18} color="#A855F7" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Send Button */}
                <Pressable
                  onPress={handleSearchLocation}
                  disabled={locationLoading || !locationSearchQuery.trim()}
                  className="py-2.5 px-4 rounded-xl items-center justify-center"
                  style={{ backgroundColor: locationLoading || !locationSearchQuery.trim() ? '#D1D5DB' : '#6C5CE7' }}>
                  {locationLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </Pressable>
              </View>

              {/* Location Error Message */}
              {locationError && (
                <View className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex-row items-start mb-2">
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text className="text-red-700 text-xs font-semibold ml-2 flex-1 font-outfit-semibold">
                    {locationError}
                  </Text>
                </View>
              )}

              {/* Location Details Display */}
              {selectedLocation && (
                <View className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-2">
                  <Text className="text-sm font-semibold text-purple-900 font-outfit-semibold mb-1">
                    📍 {selectedLocation.name}
                  </Text>
                  <View className="flex-row gap-4">
                    <Text className="text-xs text-purple-700 font-outfit-regular">
                      Lat: {selectedLocation.latitude.toFixed(4)}
                    </Text>
                    <Text className="text-xs text-purple-700 font-outfit-regular">
                      Lng: {selectedLocation.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* Regular Search - When Travel Mode OFF */
            <>
              <View className="flex-1 bg-gray-50 rounded-xl flex-row items-center px-3 h-11" style={{ borderWidth: 2, borderColor: '#E5E7EB' }}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Search location..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-2 text-gray-900 font-outfit-regular focus:outline-none"
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                  </Pressable>
                ) : null}
              </View>
            </>
          )}

          {/* Travel Mode Toggle */}
          <View className="items-center">
            <Pressable
              onPress={handleToggleTravelMode}
              className="w-12 h-5 rounded-full justify-center"
              style={{ backgroundColor: travelMode ? '#6C5CE7' : '#D1D5DB' }}>
              <View
                className="w-4 h-4 bg-white rounded-full"
                style={{
                  marginLeft: travelMode ? 30 : 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              />
            </Pressable>
            <Text className="text-xs font-outfit-medium text-gray-800 mt-1">Travel Mode</Text>
          </View>
        </View>
      </View>

      {/* ─── Tab Bar ─── */}
      <View className="flex-row bg-white border-b border-gray-200">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className="flex-1 py-3.5 items-center"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.key ? '#6C5CE7' : 'transparent',
            }}>
            <Text
              className="font-outfit-semibold text-sm"
              style={{ color: activeTab === tab.key ? '#6C5CE7' : '#9CA3AF' }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ─── Tab Content ─── */}
      <View className="flex-1">
        {activeTab === 'map' && !travelMode ? (
          <View className="flex-1 items-center justify-center bg-gray-50">
            <View className="w-16 h-16 rounded-full bg-yellow-100 items-center justify-center mb-4">
              <Ionicons name="airplane" size={32} color="#FBBF24" />
            </View>
            <Text className="text-gray-900 font-semibold text-center font-outfit-semibold">
              Turn on Travel Mode
            </Text>
            <Text className="text-gray-600 text-sm text-center mt-2 font-outfit-regular">
              Enable travel mode to view the map and nearby reports.
            </Text>
          </View>
        ) : (
          activeTab === 'map' && <MapSection selectedLocation={selectedLocation} />
        )}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'overview' && !travelMode ? (
          <View className="flex-1 items-center justify-center bg-gray-50">
            <View className="w-16 h-16 rounded-full bg-yellow-100 items-center justify-center mb-4">
              <Ionicons name="airplane" size={32} color="#FBBF24" />
            </View>
            <Text className="text-gray-900 font-semibold text-center font-outfit-semibold">
              Turn on Travel Mode
            </Text>
            <Text className="text-gray-600 text-sm text-center mt-2 font-outfit-regular">
              Enable travel mode to view location insights and analysis.
            </Text>
          </View>
        ) : (
          activeTab === 'overview' && <VisualizationView reports={reports} selectedLocation={selectedLocation} />
        )}
      </View>

      {/* ─── Summary Modal ─── */}
      <Modal
        visible={summaryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSummaryModalVisible(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <View className="bg-gradient-to-r" style={{ backgroundColor: '#F3E8FF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View className="flex-row items-center flex-1">
                <Ionicons name="sparkles" size={20} color="#6C5CE7" />
                <Text className="font-outfit-bold text-lg ml-2" style={{ color: '#4C1D95' }}>Safety Summary</Text>
              </View>
              <Pressable onPress={() => setSummaryModalVisible(false)} className="active:opacity-60">
                <Ionicons name="close" size={24} color="#6C5CE7" />
              </Pressable>
            </View>

            {/* Modal Content */}
            <ScrollView className="max-h-96 px-6 py-6">
              {summarizing ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#6C5CE7" />
                  <Text className="text-gray-600 font-outfit-regular mt-3">Analyzing reports...</Text>
                </View>
              ) : summary ? (
                <View>
                  <Text className="font-outfit-regular text-sm leading-6 text-gray-700 mb-4">
                    {typeof summary.summary === 'string' ? summary.summary : summary.summary || 'No summary available'}
                  </Text>

                  {summary.statistics && (
                    <View className="gap-3">
                      <Text className="font-outfit-semibold text-sm text-gray-900 mb-2">Statistics:</Text>
                      <View className="bg-gradient-to-r rounded-xl p-4" style={{ backgroundColor: '#F3E8FF' }}>
                        <Text className="text-xs text-gray-500 font-outfit-regular">Total Reports</Text>
                        <Text className="font-outfit-bold text-2xl" style={{ color: '#4C1D95' }}>
                          {summary.statistics.total_reports || 0}
                        </Text>
                      </View>

                      <View className="flex-row gap-2">
                        <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: '#FEF2F2' }}>
                          <Text className="text-xs text-gray-500 font-outfit-regular">Danger</Text>
                          <Text className="font-outfit-bold text-lg text-red-600">
                            {summary.statistics.danger_reports || 0}
                          </Text>
                        </View>
                        <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: '#FFF7ED' }}>
                          <Text className="text-xs text-gray-500 font-outfit-regular">Scams</Text>
                          <Text className="font-outfit-bold text-lg text-orange-600">
                            {summary.statistics.scam_reports || 0}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ) : mlError ? (
                <View className="items-center py-8">
                  <Ionicons name="alert-circle" size={32} color="#DC2626" />
                  <Text className="text-red-700 font-outfit-semibold text-center mt-3">Error</Text>
                  <Text className="text-red-600 font-outfit-regular text-sm text-center mt-1">{mlError}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
