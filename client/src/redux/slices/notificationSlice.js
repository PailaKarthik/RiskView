import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Async thunk for fetching all notifications
export const getNotifications = createAsyncThunk(
  'notification/getNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/api/notifications');
      return response.data.data; // Assuming the API response has a 'data' field containing notifications
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch notifications';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for fetching unread count
export const getUnreadCount = createAsyncThunk(
  'notification/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/api/notifications/unread/count');
      return response.data.unreadCount;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch unread count';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for marking a notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/api/notifications/${notificationId}/read`);
      return notificationId;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to mark notification as read';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for marking all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put('/api/notifications/read/all');
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to mark all as read';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for deleting a notification
export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/api/notifications/${notificationId}`);
      return notificationId;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to delete notification';
      return rejectWithValue(errorMessage);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotificationOptimistic: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Helper function to get notification ID
    const getNotificationId = (notification) => notification?._id || notification?.id;

    // Get notifications
    builder
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = Array.isArray(action.payload) ? action.payload : [];
        state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
        state.error = null;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.notifications = [];
      });

    // Get unread count
    builder
      .addCase(getUnreadCount.pending, (state) => {
        state.error = null;
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
        state.error = null;
      })
      .addCase(getUnreadCount.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Mark notification as read
    builder
      .addCase(markNotificationAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (n) => getNotificationId(n) === action.payload
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Mark all notifications as read
    builder
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (n) => getNotificationId(n) === action.payload
        );
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(
          (n) => getNotificationId(n) !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, addNotificationOptimistic } = notificationSlice.actions;

export default notificationSlice.reducer;
