import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';
import { locationService } from '@/utils/locationService';

const initialState = {
  validationResult: null,
  summary: null,
  ragAnswer: null,
  summarizing: false,
  ragLoading: false,
  error: null,
};

// Async thunk for validating report category
export const validateCategory = createAsyncThunk(
  'ml/validateCategory',
  async (categoryText, { rejectWithValue }) => {
    try {
      // Get current location
      const location = await locationService.getCurrentLocation();
      if (!location) {
        return rejectWithValue('Unable to retrieve current location');
      }

      const response = await axiosClient.post('/api/ml/validate-category', {
        text: categoryText,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Category validation failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for summarizing all reports in area
// Accepts optional { latitude, longitude } to override current location
export const summarizeAll = createAsyncThunk(
  'ml/summarizeAll',
  async (coords, { rejectWithValue }) => {
    try {
      let latitude, longitude;

      if (coords?.latitude && coords?.longitude) {
        latitude = coords.latitude;
        longitude = coords.longitude;
      } else {
        const location = await locationService.getCurrentLocation();
        if (!location) {
          return rejectWithValue('Unable to retrieve current location');
        }
        latitude = location.latitude;
        longitude = location.longitude;
      }

      const response = await axiosClient.post('/api/ml/summarize-all', {
        latitude,
        longitude,
      });
      console.log('[mlSlice] Summarize All - Response:', response.data);
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Summarization failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for asking RAG-based questions
// Accepts { question, latitude?, longitude? } to override current location
export const askRAG = createAsyncThunk(
  'ml/askRAG',
  async (payload, { rejectWithValue }) => {
    try {
      const question = typeof payload === 'string' ? payload : payload.question;
      let latitude, longitude;

      if (typeof payload === 'object' && payload.latitude && payload.longitude) {
        latitude = payload.latitude;
        longitude = payload.longitude;
      } else {
        const location = await locationService.getCurrentLocation();
        if (!location) {
          return rejectWithValue('Unable to retrieve current location');
        }
        latitude = location.latitude;
        longitude = location.longitude;
      }

      const response = await axiosClient.post('/api/ml/ask-rag', {
        question,
        latitude,
        longitude,
      });
      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to retrieve answer';
      return rejectWithValue(errorMessage);
    }
  }
);

const mlSlice = createSlice({
  name: 'ml',
  initialState,
  reducers: {
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
    clearSummary: (state) => {
      state.summary = null;
    },
    clearRAGAnswer: (state) => {
      state.ragAnswer = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Validate category
    builder
      .addCase(validateCategory.pending, (state) => {
        state.error = null;
      })
      .addCase(validateCategory.fulfilled, (state, action) => {
        state.validationResult = action.payload;
        state.error = null;
      })
      .addCase(validateCategory.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Summarize all reports
    builder
      .addCase(summarizeAll.pending, (state) => {
        state.summarizing = true;
        state.error = null;
      })
      .addCase(summarizeAll.fulfilled, (state, action) => {
        state.summarizing = false;
        state.summary = action.payload.data;
        state.error = null;
      })
      .addCase(summarizeAll.rejected, (state, action) => {
        state.summarizing = false;
        state.error = action.payload;
      });

    // Ask RAG question
    builder
      .addCase(askRAG.pending, (state) => {
        state.ragLoading = true;
        state.error = null;
      })
      .addCase(askRAG.fulfilled, (state, action) => {
        state.ragLoading = false;
        state.ragAnswer = action.payload;
        state.error = null;
      })
      .addCase(askRAG.rejected, (state, action) => {
        state.ragLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearValidationResult, clearSummary, clearRAGAnswer, clearError } =
  mlSlice.actions;
export default mlSlice.reducer;
