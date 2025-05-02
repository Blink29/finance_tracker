import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from '../../services/reportService';

const initialState = {
  monthlyReport: null,
  categoryReport: null,
  cashFlowReport: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

// Get monthly income vs expense report
export const getMonthlyReport = createAsyncThunk(
  'reports/getMonthly',
  async (year, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await reportService.getMonthlyReport(token, year);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get category breakdown report
export const getCategoryReport = createAsyncThunk(
  'reports/getCategory',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await reportService.getCategoryReport(token, params);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get cash flow report
export const getCashFlowReport = createAsyncThunk(
  'reports/getCashFlow',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await reportService.getCashFlowReport(token, params);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearReports: (state) => {
      state.monthlyReport = null;
      state.categoryReport = null;
      state.cashFlowReport = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMonthlyReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMonthlyReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.monthlyReport = action.payload;
      })
      .addCase(getMonthlyReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getCategoryReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCategoryReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.categoryReport = action.payload;
      })
      .addCase(getCategoryReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getCashFlowReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCashFlowReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cashFlowReport = action.payload;
      })
      .addCase(getCashFlowReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearReports } = reportSlice.actions;
export default reportSlice.reducer;