import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser, fetchCurrentUser } from '@/redux/slices/authSlice';
import { fetchAllReports, deleteReport } from '@/redux/slices/reportSlice';

/**
 * ProfileScreen Component
 * Displays user profile information, stats, and user's reports
 * Allows logout and navigation to reports
 */
export default function ProfileScreen() {
  const dispatch = useDispatch();
  const router = useRouter();

  // Redux state
  const authState = useSelector((state) => state?.auth || {});
  const { user, token } = authState;
  const reportState = useSelector((state) => state?.report || {});
  const { list: allReports = [], loadingNearby: loading } = reportState;
  const travelState = useSelector((state) => state?.travel || {});
  const { travelMode } = travelState;

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
  });
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const currentUserId = user?.id || user?._id;
  const getReportId = (report) => report?._id || report?.id;

  /**
   * Custom alert functions
   */
  const showAlert = (title, message, buttons = []) => {
    const defaultButtons = buttons.length > 0 
      ? buttons 
      : [{ text: 'OK', onPress: () => setAlertVisible(false) }];
    
    setAlertData({ title, message, buttons: defaultButtons });
    setAlertVisible(true);
  };

  const handleAlertButton = (button) => {
    if (button.onPress) button.onPress();
    setAlertVisible(false);
  };

  /**
   * Calculate account age from user creation date
   */
  const getAccountAge = () => {
    if (!user?.createdAt) {
      console.warn('⚠️ User createdAt is missing:', user);
      return 'N/A';
    }
    console.log('📅 Calculating account age from:', user.createdAt);
    try {
      const createdDate = new Date(user.createdAt);
      if (isNaN(createdDate.getTime())) {
        console.error('❌ Invalid date format:', user.createdAt);
        return 'N/A';
      }
      const today = new Date();
      const days = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      console.log('✅ Account age calculated as:', days, 'days');
      if (days === 0) return 'Today';
      if (days === 1) return '1 day';
      if (days < 7) return `${days} days`;
      if (days < 30) return `${Math.floor(days / 7)} weeks`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} months`;
      return `${Math.floor(months / 12)} years`;
    } catch (err) {
      console.error('❌ Error calculating account age:', err);
      return 'N/A';
    }
  };

  /**
   * Get user's reports by filtering all reports
   */
  const userReports = allReports.filter((report) => {
    // Handle both cases: userId as object or string
    const reportUserId = typeof report.userId === 'object' ? report.userId?._id : report.userId;
    return reportUserId === currentUserId;
  });
  console.log('📄 Filtered User Reports:', userReports.length, 'out of', allReports.length);

  // Debug logging
  useEffect(() => {
    console.log('📊 Reports State:', {
      totalReports: allReports.length,
      userId: currentUserId,
      userReports: userReports.length,
      loading: loading,
    });
  }, [allReports, currentUserId, userReports, loading]);

  // Log user data when loaded
  useEffect(() => {
    if (user) {
      console.log('👤 User data loaded:', {
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        accountAge: getAccountAge(),
      });
    }
  }, [user]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setError(null);
      await dispatch(fetchAllReports()).unwrap();
      console.log('✅ Reports refreshed successfully');
    } catch (err) {
      console.error('❌ Refresh error:', err);
      setError('Failed to refresh reports');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              console.log('🚪 Logging out...');
              await AsyncStorage.removeItem('pushToken');
              await dispatch(logoutUser()).unwrap();
              console.log('✅ Logged out successfully');
              // Navigate to login screen
              router.replace('/auth/login');
            } catch (error) {
              console.error('❌ Logout error:', error);
              const errorMsg = typeof error === 'string' ? error : error?.message || 'Failed to logout';
              showAlert('Error', errorMsg, [{ text: 'OK', onPress: () => {} }]);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  /**
   * Navigate to report details
   */
  const handleReportPress = (report) => {
    setSelectedReport(report);
  };

  /**
   * Handle report deletion
   */
  const handleDeleteReport = (reportId) => {
    console.log('🗑️ Delete confirmation for report ID:', reportId);
    setDeleteError(null);

    showAlert(
      'Delete Report',
      'This action cannot be undone. Are you sure you want to delete this report?',
      [
        {
          text: 'Cancel',
          onPress: () => {
            console.log('❌ Delete cancelled');
            setDeletingReportId(null);
            setDeleteError(null);
          },
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              console.log('📤 Starting deletion for report ID:', reportId);
              setDeletingReportId(reportId);
              setDeleteError(null);

              // Perform deletion
              await dispatch(deleteReport(reportId)).unwrap();

              console.log('✅ Report deleted successfully');

              // Close modal after successful deletion
              setSelectedReport(null);
              setDeletingReportId(null);

              // Show success message
              showAlert(
                'Success',
                'Report deleted successfully',
                [{ text: 'OK', onPress: () => {} }]
              );
            } catch (err) {
              console.error('❌ Deletion error:', err);
              const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to delete report';
              setDeleteError(errorMsg);
              setDeletingReportId(null);

              // Show error but keep modal open to try again
              showAlert(
                'Deletion Failed',
                errorMsg,
                [{ text: 'Try Again', onPress: () => {} }]
              );
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  /**
   * Format date to relative time
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  // Fetch user profile and reports on mount
  useEffect(() => {
    console.log('👤 Profile screen loaded, fetching current user data...');
    dispatch(fetchCurrentUser());
    if (currentUserId) {
      console.log('📥 Fetching all reports for user:', currentUserId);
      dispatch(fetchAllReports());
    }
  }, [dispatch, currentUserId]);

  // If user not loaded
  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  // Get first letter of name for avatar
  const avatarLetter = user.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#A855F7"
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-6">
          {/* Profile Header Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-6">
            <View className="items-center">
              {/* Avatar with Gradient Background */}
              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 items-center justify-center mb-4">
                <Text className="text-white text-3xl font-bold font-outfit-bold">
                  {avatarLetter}
                </Text>
              </View>

              {/* User Name */}
              <Text className="text-xl font-semibold text-gray-900 mb-1 font-outfit-semibold">
                {user.fullName || 'User'}
              </Text>

              {/* User Email */}
              <Text className="text-sm text-gray-600 mb-4 font-outfit-regular">
                {user.email || 'No email'}
              </Text>

              {/* User Info Row - Location and Language */}
              <View className="flex-row gap-4 flex-wrap justify-center">
            
                <View className="flex-row items-center gap-1">
                  <Ionicons name="globe" size={16} color="#9CA3AF" />
                  <Text className="text-xs text-gray-600 font-outfit-regular">
                    {user.language || 'English'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* My Reports Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-6">
            {/* Header */}
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="document-text" size={20} color="#A855F7" />
              <Text className="text-lg font-semibold text-gray-900 font-outfit-semibold">
                My Reports
              </Text>
            </View>

            {/* Travel Mode Disabled Message */}
            {!travelMode ? (
              <View className="py-12 items-center">
                <View className="w-16 h-16 rounded-full bg-yellow-100 items-center justify-center mb-4">
                  <Ionicons name="airplane" size={32} color="#FBBF24" />
                </View>
                <Text className="text-gray-900 font-semibold text-center mb-2 font-outfit-semibold">
                  Turn on Travel Mode
                </Text>
                <Text className="text-gray-600 text-sm text-center font-outfit-regular">
                  Enable travel mode to view your reports and report details.
                </Text>
              </View>
            ) : (
              <>
                {/* Loading State */}
                {loading && (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="large" color="#A855F7" />
                    <Text className="text-gray-600 mt-2 font-outfit-regular">Loading reports...</Text>
                  </View>
                )}

                {/* Error State */}
                {error && !loading && (
                  <View className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <View className="flex-row items-start gap-3">
                      <Ionicons name="alert-circle" size={20} color="#EF4444" />
                      <View className="flex-1">
                        <Text className="text-red-900 font-semibold font-outfit-semibold">Error</Text>
                        <Text className="text-red-700 text-sm mt-1 font-outfit-regular">{error}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Reports List with Scrollable Titles */}
                {!loading && userReports.length > 0 ? (
                  <View className="space-y-0 max-h-96">
                    <ScrollView
                      scrollEnabled={userReports.length > 2}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {userReports.map((report, idx) => (
                        <Pressable
                          key={getReportId(report)}
                          onPress={() => handleReportPress(report)}
                          className="active:bg-purple-50"
                        >
                          <View
                            className={`flex-row justify-between items-start py-3 px-1 ${
                              idx < userReports.length - 1 ? 'border-b border-gray-200' : ''
                            }`}
                          >
                            <View className="flex-1 pr-3">
                              {/* Scrollable Title */}
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                scrollEnabled={true}
                                className="mb-1"
                              >
                                <Text className="text-sm font-medium text-gray-900 font-outfit-semibold">
                                  {report.title || 'Untitled Report'}
                                </Text>
                              </ScrollView>
                          <Text className="text-xs text-gray-500 font-outfit-regular">
                            {formatDate(report.createdAt)}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {/* Category Badge */}
                          <View
                            className={`px-2 py-1 rounded-full ${
                              report.category === 'scam'
                                ? 'bg-orange-100'
                                : report.category === 'danger'
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold font-outfit-semibold ${
                                report.category === 'scam'
                                  ? 'text-orange-700'
                                  : report.category === 'danger'
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                              }`}
                            >
                              {report.category || 'Other'}
                            </Text>
                          </View>

                          {/* Delete Button - Only show if report is owned by current user */}
                          {(() => {
                            const reportUserId = typeof report.userId === 'object' ? report.userId?._id : report.userId;
                            return reportUserId === currentUserId ? (
                              <Pressable
                                onPress={(event) => {
                                  event.stopPropagation?.();
                                  handleDeleteReport(getReportId(report));
                                }}
                                className="p-2 rounded-lg active:bg-red-50"
                              >
                                <Ionicons name="trash" size={16} color="#EF4444" />
                              </Pressable>
                            ) : null;
                          })()}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
                  </View>
                ) : !loading && userReports.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="document-outline" size={40} color="#D1D5DB" />
                    <Text className="text-gray-600 font-medium mt-4 font-outfit-semibold">
                      No reports yet
                    </Text>
                    <Text className="text-gray-500 text-xs mt-2 text-center font-outfit-regular">
                      Create your first report to help keep travelers safe
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-3 mb-6">
            {/* Reports Count */}
            <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-gray-200 items-center">
              <Text className="text-2xl font-semibold text-purple-600 mb-1 font-outfit-bold">
                {userReports.length}
              </Text>
              <Text className="text-xs text-gray-600 font-outfit-regular">Reports</Text>
            </View>

            {/* Helpful Count */}
            <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-gray-200 items-center">
              <Text className="text-2xl font-semibold text-purple-600 mb-1 font-outfit-bold">
                {userReports.reduce((sum, r) => {
                  const upvotes = Array.isArray(r.upvotes) ? r.upvotes.length : (r.upvotes || 0);
                  return sum + upvotes;
                }, 0)}
              </Text>
              <Text className="text-xs text-gray-600 font-outfit-regular">Helpful</Text>
            </View>

            {/* Member Since */}
            <View className="flex-1 bg-white rounded-3xl p-4 shadow-sm border border-gray-200 items-center justify-center">
              <Text className="text-sm font-semibold text-purple-600 mb-1 font-outfit-bold">
                {getAccountAge()}
              </Text>
              <Text className="text-xs text-gray-600 font-outfit-regular">Member</Text>
            </View>
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            className="py-4 px-4 bg-red-600 rounded-2xl active:bg-red-700"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Ionicons name="log-out" size={20} color="white" />
              <Text className="text-white font-bold text-base font-outfit-semibold">
                Logout
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            {/* Alert Title */}
            <Text className="text-lg font-bold text-gray-900 mb-3 text-center font-outfit-bold">
              {alertData.title}
            </Text>

            {/* Alert Message */}
            <Text className="text-gray-700 text-center mb-6 leading-5 font-outfit-regular">
              {alertData.message}
            </Text>

            {/* Alert Buttons */}
            <View className="gap-3">
              {alertData.buttons.map((button, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleAlertButton(button)}
                  className={`py-3 px-4 rounded-xl active:opacity-80 ${
                    button.style === 'destructive'
                      ? 'bg-red-600'
                      : button.style === 'cancel'
                      ? 'bg-gray-200'
                      : 'bg-purple-600'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold font-outfit-semibold ${
                      button.style === 'cancel' ? 'text-gray-800' : 'text-white'
                    }`}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Details Modal */}
      <Modal
        visible={!!selectedReport}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 font-outfit-bold">
                Report Details
              </Text>
              <Pressable
                onPress={() => setSelectedReport(null)}
                className="px-3 py-2 bg-gray-100 rounded-xl"
              >
                <Text className="text-gray-700 font-semibold font-outfit-semibold">Close</Text>
              </Pressable>
            </View>

            {selectedReport && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-xl font-bold text-gray-900 mb-2 font-outfit-bold">
                  {selectedReport.title || 'Untitled Report'}
                </Text>

                <View className="flex-row items-center gap-2 mb-4">
                  <View
                    className={`px-3 py-1 rounded-full ${
                      selectedReport.category === 'scam'
                        ? 'bg-orange-100'
                        : selectedReport.category === 'danger'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize font-outfit-semibold ${
                        selectedReport.category === 'scam'
                          ? 'text-orange-700'
                          : selectedReport.category === 'danger'
                          ? 'text-red-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {selectedReport.category || 'other'}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500 font-outfit-regular">
                    {formatDate(selectedReport.createdAt)}
                  </Text>
                </View>

                <Text className="text-sm text-gray-700 leading-6 mb-4 font-outfit-regular">
                  {selectedReport.description || 'No description provided'}
                </Text>

                <View className="flex-row items-center gap-2 mb-6">
                  <Ionicons name="thumbs-up" size={16} color="#A855F7" />
                  <Text className="text-sm text-purple-700 font-outfit-semibold">
                    {Array.isArray(selectedReport.upvotes)
                      ? selectedReport.upvotes.length
                      : selectedReport.upvotes || 0}{' '}
                    helpful votes
                  </Text>
                </View>

                {(() => {
                  const reportUserId =
                    typeof selectedReport.userId === 'object'
                      ? selectedReport.userId?._id
                      : selectedReport.userId;
                  const reportId = getReportId(selectedReport);
                  const isDeleting = deletingReportId === reportId;

                  if (reportUserId !== currentUserId) return null;

                  return (
                    <View>
                      {deleteError && (
                        <View className="p-3 bg-red-50 rounded-lg border border-red-200 mb-3">
                          <View className="flex-row gap-2 items-start">
                            <Ionicons name="alert-circle" size={18} color="#DC2626" />
                            <Text className="text-red-700 text-xs flex-1 font-outfit-regular">{deleteError}</Text>
                          </View>
                        </View>
                      )}
                      <Pressable
                        onPress={() => {
                          if (!isDeleting) {
                            handleDeleteReport(reportId);
                          }
                        }}
                        disabled={isDeleting}
                        className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-2xl mb-3 ${
                          isDeleting ? 'bg-red-200 opacity-70' : 'bg-red-100'
                        }`}
                      >
                        {isDeleting ? (
                          <>
                            <ActivityIndicator size="small" color="#DC2626" />
                            <Text className="text-red-700 font-bold font-outfit-semibold">Deleting...</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="trash" size={18} color="#DC2626" />
                            <Text className="text-red-700 font-bold font-outfit-semibold">Delete Report</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  );
                })()}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      
    </View>
  );
}

