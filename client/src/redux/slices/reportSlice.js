import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/api/axiosClient';

/**
 * Report Slice - Scoped Loading States
 * 
 * State shape:
 * {
 *   list: [],            // All reports (nearby or all)
 *   loadingNearby: bool  // Fetching nearby reports
 *   creating: bool       // Creating new report
 *   voting: bool         // Voting on report (upvote/downvote)
 * }
 */

const initialState = {
  list: [],
  loadingNearby: false,
  creating: false,
  voting: false,
};

const getReportId = (report) => report?._id || report?.id;

// Async thunk for fetching nearby reports
export const fetchNearbyReports = createAsyncThunk(
  'report/fetchNearbyReports',
  async (coords, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/api/reports/nearby', {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
      // Backend returns { status: "success", count, data: reports[] }
      return response.data.data || response.data.reports || [];
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch nearby reports';
      console.error('❌ fetchNearbyReports error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for fetching all reports
export const fetchAllReports = createAsyncThunk(
  'report/fetchAllReports',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/api/reports', {
        params: filters,
      });
      // Backend returns { status: "success", data: reports[] }
      return response.data.data || response.data.reports || [];
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch reports';
      console.error('❌ fetchAllReports error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for fetching a single report by ID
export const fetchReportById = createAsyncThunk(
  'report/fetchReportById',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/api/reports/${reportId}`);
      // Backend returns { status: "success", data: report }
      return response.data.data || response.data.report;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch report';
      console.error('❌ fetchReportById error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for creating a new report
export const createReport = createAsyncThunk(
  'report/createReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/api/reports', reportData);
      // Backend returns { status: "success", data: report }
      return response.data.data || response.data.report;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to create report';
      console.error('❌ createReport error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for upvoting a report
export const upvoteReport = createAsyncThunk(
  'report/upvoteReport',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/api/reports/${reportId}/upvote`);
      // Backend returns { status: "success", upvotes, downvotes }
      return {
        reportId,
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to upvote report';
      console.error('❌ upvoteReport error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for downvoting a report
export const downvoteReport = createAsyncThunk(
  'report/downvoteReport',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(`/api/reports/${reportId}/downvote`);
      // Backend returns { status: "success", upvotes, downvotes }
      return {
        reportId,
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to downvote report';
      console.error('❌ downvoteReport error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for deleting a report
export const deleteReport = createAsyncThunk(
  'report/deleteReport',
  async (reportId, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/api/reports/${reportId}`);
      // Backend returns { status: "success" }
      return reportId;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to delete report';
      console.error('❌ deleteReport error:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    // Replace entire reports list (used for nearby reports replacement)
    setReportsList: (state, action) => {
      state.list = action.payload;
    },
    // Add single report to list (for create operations)
    addReport: (state, action) => {
      state.list.unshift(action.payload);
    },
    // Remove report from list (for delete operations)
    removeReport: (state, action) => {
      state.list = state.list.filter((r) => getReportId(r) !== action.payload);
    },
    // Update report votes optimistically
    updateReportVotes: (state, action) => {
      const { reportId, upvotes, downvotes } = action.payload;
      const report = state.list.find((r) => getReportId(r) === reportId);
      if (report) {
        report.upvotes = upvotes;
        report.downvotes = downvotes;
      }
    },
  },
  extraReducers: (builder) => {
    // ==================== Fetch Nearby Reports ====================
    builder
      .addCase(fetchNearbyReports.pending, (state) => {
        state.loadingNearby = true;
      })
      .addCase(fetchNearbyReports.fulfilled, (state, action) => {
        state.loadingNearby = false;
        state.list = action.payload; // Replace with nearby reports
      })
      .addCase(fetchNearbyReports.rejected, (state) => {
        state.loadingNearby = false;
        // Keep existing list on error
      });

    // ==================== Fetch All Reports ====================
    builder
      .addCase(fetchAllReports.pending, (state) => {
        state.loadingNearby = true;
      })
      .addCase(fetchAllReports.fulfilled, (state, action) => {
        state.loadingNearby = false;
        state.list = action.payload;
      })
      .addCase(fetchAllReports.rejected, (state) => {
        state.loadingNearby = false;
        // Keep existing list on error
      });

    // ==================== Fetch Report By ID ====================
    builder
      .addCase(fetchReportById.pending, (state) => {
        state.loadingNearby = true;
      })
      .addCase(fetchReportById.fulfilled, (state) => {
        state.loadingNearby = false;
        // Single report fetch doesn't change list
      })
      .addCase(fetchReportById.rejected, (state) => {
        state.loadingNearby = false;
      });

    // ==================== Create Report ====================
    builder
      .addCase(createReport.pending, (state) => {
        state.creating = true;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.creating = false;
        state.list.unshift(action.payload); // Add to beginning
      })
      .addCase(createReport.rejected, (state) => {
        state.creating = false;
      });

    // ==================== Upvote Report ====================
    builder
      .addCase(upvoteReport.pending, (state) => {
        state.voting = true;
      })
      .addCase(upvoteReport.fulfilled, (state, action) => {
        state.voting = false;
        const { reportId, upvotes, downvotes } = action.payload;
        const report = state.list.find((r) => getReportId(r) === reportId);
        if (report) {
          report.upvotes = upvotes;
          report.downvotes = downvotes;
        }
      })
      .addCase(upvoteReport.rejected, (state) => {
        state.voting = false;
      });

    // ==================== Downvote Report ====================
    builder
      .addCase(downvoteReport.pending, (state) => {
        state.voting = true;
      })
      .addCase(downvoteReport.fulfilled, (state, action) => {
        state.voting = false;
        const { reportId, upvotes, downvotes } = action.payload;
        const report = state.list.find((r) => getReportId(r) === reportId);
        if (report) {
          report.upvotes = upvotes;
          report.downvotes = downvotes;
        }
      })
      .addCase(downvoteReport.rejected, (state) => {
        state.voting = false;
      });

    // ==================== Delete Report ====================
    builder
      .addCase(deleteReport.pending, (state) => {
        state.loadingNearby = true;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loadingNearby = false;
        state.list = state.list.filter((r) => getReportId(r) !== action.payload);
      })
      .addCase(deleteReport.rejected, (state) => {
        state.loadingNearby = false;
      });
  },
});

export const { setReportsList, addReport, removeReport, updateReportVotes } =
  reportSlice.actions;

export default reportSlice.reducer;
