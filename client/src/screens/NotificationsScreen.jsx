import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/redux/slices/notificationSlice';

/**
 * NotificationsScreen Component
 * Displays notifications with actions:
 * - Mark individual notification as read
 * - Mark all notifications as read
 * - Delete notification
 */
export default function NotificationsScreen() {
  const dispatch = useDispatch();
  const notificationState = useSelector((state) => state?.notification || {});
  const { notifications, unreadCount, loading, error } = notificationState;
  const [refreshing, setRefreshing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
  });
  const [pendingAction, setPendingAction] = useState(null);

  console.log(notifications, 'notifications');
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
    setPendingAction(null);
  };

  /**
   * Fetch notifications on screen load
   */
  useEffect(() => {
    handleRefresh();
  }, []);

  /**
   * Refresh notifications list
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Fetching notifications...');
      await dispatch(getNotifications()).unwrap();
      await dispatch(getUnreadCount()).unwrap();
      console.log('✅ Notifications fetched successfully');
    } catch (err) {
      console.error('❌ Failed to refresh notifications:', err);
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to load notifications';
      showAlert('Error', errorMsg, [
        { text: 'Retry', onPress: handleRefresh },
        { text: 'Dismiss', onPress: () => {}, style: 'cancel' }
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle mark notification as read
   */
  const handleMarkAsRead = async (notificationId, isRead) => {
    if (isRead) return; // Already read
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      await dispatch(getUnreadCount()).unwrap();
    } catch (err) {
      console.error('❌ Failed to mark notification as read:', err);
    }
  };

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    showAlert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            try {
              console.log('📌 Marking all notifications as read...');
              await dispatch(markAllNotificationsAsRead()).unwrap();
              await dispatch(getUnreadCount()).unwrap();
              console.log('✅ All marked as read');
            } catch (err) {
              console.error('❌ Failed to mark all as read:', err);
              const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to mark all as read';
              showAlert('Error', errorMsg, [{ text: 'OK', onPress: () => {} }]);
            }
          },
          style: 'default',
        },
      ]
    );
  };

  /**
   * Handle delete notification
   */
  const handleDelete = (notificationId) => {
    setPendingAction({ type: 'delete', id: notificationId });
    
    showAlert(
      'Delete Notification',
      'Are you sure you want to delete this notification? This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting notification:', notificationId);
              await dispatch(deleteNotification(notificationId)).unwrap();
              await dispatch(getUnreadCount()).unwrap();
              console.log('✅ Notification deleted');
            } catch (err) {
              console.error('❌ Failed to delete notification:', err);
              const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to delete notification';
              showAlert('Error', errorMsg, [{ text: 'OK', onPress: () => {} }]);
            }
          },
        },
      ]
    );
  };

  /**
   * Format timestamp
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    // If still loading, don't show empty state
    if (loading) return null;

    return (
      <View className="flex-1 items-center justify-center py-12 px-6">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#F3E8FF' }}>
          <Ionicons name="notifications-off" size={40} color="#A855F7" />
        </View>
        <Text className="text-gray-800 text-lg font-bold font-outfit-bold text-center">
          No Notifications
        </Text>
        <Text className="text-gray-500 text-sm mt-2 text-center font-outfit-regular">
          New alerts and updates will appear here
        </Text>
      </View>
    );
  };

  /**
   * Render notification card
   */
  const renderNotificationCard = ({ item }) => {
    // Handle missing data
    if (!item || !item._id) {
      console.warn('⚠️ Invalid notification item:', item);
      return null;
    }

    const message = item.message || 'No message';
    const createdAt = item.createdAt || new Date().toISOString();
    const isRead = item.isRead || false;

    return (
      <View
        className="mx-4 mt-3 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#fff',
          borderLeftWidth: isRead ? 0 : 4,
          borderLeftColor: '#A855F7',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}>
        {/* Main Content */}
        <View className="p-4 flex-row items-start justify-between gap-3">
          {/* Left Content - Message */}
          <View className="flex-1">
            {/* Message */}
            <Text 
              className="text-gray-900 font-semibold text-sm leading-5 font-outfit-semibold"
              numberOfLines={3}
            >
              {message}
            </Text>

            {/* Timestamp */}
            <Text className="text-gray-400 text-xs mt-2.5 font-outfit-regular">
              {formatTime(createdAt)}
            </Text>
          </View>

          {/* Right Actions */}
          <View className="flex-row gap-2 items-center flex-shrink-0">
            {/* Mark as Read Button */}
            {!isRead && (
              <Pressable
                onPress={() => handleMarkAsRead(item._id, isRead)}
                className="p-2 rounded-lg active:bg-purple-50"
                style={{ backgroundColor: '#F3E8FF' }}>
                <Ionicons name="checkmark-circle" size={18} color="#A855F7" />
              </Pressable>
            )}

            {/* Delete Button */}
            <Pressable
              onPress={() => handleDelete(item._id)}
              className="p-2 rounded-lg active:bg-red-50"
              style={{ backgroundColor: '#FEF2F2' }}>
              <Ionicons name="trash" size={18} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-4xl font-bold text-gray-900 font-outfit-bold">Notifications</Text>
            <Text className="text-gray-500 text-sm mt-2 font-outfit-regular">
              {loading ? 'Loading...' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
          {unreadCount > 0 && !loading && (
            <Pressable
              onPress={handleMarkAllAsRead}
              className="px-4 py-2 rounded-xl ml-2 active:opacity-70"
              style={{ backgroundColor: '#F3E8FF' }}>
              <Text className="text-purple-600 text-xs font-bold font-outfit-bold">Mark All</Text>
            </Pressable>
          )}
        </View>

        {/* Error Display */}
        {error && !loading && (
          <View className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-start gap-3">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text className="text-red-700 text-xs font-semibold flex-1 font-outfit-semibold">
              {typeof error === 'string' ? error : error?.message || 'Failed to load notifications. Pull to refresh.'}
            </Text>
          </View>
        )}
      </View>

      {/* Loading State */}
      {loading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#A855F7" />
          <Text className="text-gray-600 mt-3 font-outfit-regular">Loading notifications...</Text>
        </View>
      ) : (
        /* Notifications List */
        <FlatList
          data={notifications && notifications.length > 0 ? notifications : []}
          renderItem={renderNotificationCard}
          keyExtractor={(item) => item?._id || Math.random().toString()}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#A855F7"
              progressViewOffset={10}
            />
          }
          contentContainerStyle={
            !notifications || notifications.length === 0 ? { flexGrow: 1 } : { paddingVertical: 8, paddingBottom: 16 }
          }
          scrollEnabled={notifications && notifications.length > 0}
          ListFooterComponent={
            notifications && notifications.length > 0 ? <View className="h-8" /> : null
          }
          onEndReachedThreshold={0.8}
        />
      )}

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
    </View>
  );
}
