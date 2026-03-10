import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '@/api/axiosClient';

const initialState = {
  user: null,
  userId: null,
  token: null,
  loading: false,
  error: null,
  isRestoring: true, // Track if we're restoring auth on app startup
};

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/api/auth/register', credentials);
      const { token, user } = response.data;

      // Persist token and userId to AsyncStorage
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      if (user?.id) {
        await AsyncStorage.setItem('userId', user.id);
      }

      return { token, user };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for user login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/api/auth/login', credentials);
      const { token, user } = response.data;

      // Persist token and userId to AsyncStorage
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
      if (user?.id) {
        await AsyncStorage.setItem('userId', user.id);
      }

      return { token, user };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for updating push token
export const updatePushToken = createAsyncThunk(
  'auth/updatePushToken',
  async (pushToken, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put('/api/auth/update-push-token', {
        pushToken,
      });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to update push token';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for fetching current user
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/api/auth/me');
      return response.data.user;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch user data';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for user logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Remove token and userId from AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      return null;
    } catch (error) {
      const errorMessage = error.message || 'Logout failed';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setIsRestoring: (state, action) => {
      state.isRestoring = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.userId = null;
      state.token = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.userId = action.payload.user?.id;
        state.error = null;
        state.isRestoring = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.userId = action.payload.user?.id;
        state.error = null;
        state.isRestoring = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.userId = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update push token
    builder
      .addCase(updatePushToken.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePushToken.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(updatePushToken.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.userId = action.payload?.id;
        state.error = null;
        state.isRestoring = false;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.user = null;
        state.userId = null;
        state.token = null;
        state.error = action.payload;
        state.isRestoring = false;
      });
  },
});

export const { clearError, setToken, setUser, setUserId, setIsRestoring, clearAuth } = authSlice.actions;

export default authSlice.reducer;
