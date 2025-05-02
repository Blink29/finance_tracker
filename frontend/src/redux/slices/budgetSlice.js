import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import budgetService from '../../services/budgetService';

const initialState = {
  budgets: [],
  budget: null,
  progress: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

// Get all budgets
export const getBudgets = createAsyncThunk(
  'budgets/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await budgetService.getBudgets(token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get budget by id
export const getBudget = createAsyncThunk(
  'budgets/getById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await budgetService.getBudget(token, id);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get budget progress
export const getBudgetProgress = createAsyncThunk(
  'budgets/getProgress',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await budgetService.getBudgetProgress(token, id);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create budget
export const createBudget = createAsyncThunk(
  'budgets/create',
  async (budgetData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await budgetService.createBudget(token, budgetData);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update budget
export const updateBudget = createAsyncThunk(
  'budgets/update',
  async ({ id, budgetData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await budgetService.updateBudget(token, id, budgetData);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete budget
export const deleteBudget = createAsyncThunk(
  'budgets/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await budgetService.deleteBudget(token, id);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearBudget: (state) => {
      state.budget = null;
      state.progress = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBudgets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBudgets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgets = action.payload.budgets;
      })
      .addCase(getBudgets.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getBudget.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budget = action.payload.budget;
      })
      .addCase(getBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getBudgetProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBudgetProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.progress = action.payload;
      })
      .addCase(getBudgetProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createBudget.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgets.push(action.payload.budget);
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateBudget.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgets = state.budgets.map(budget =>
          budget.id === action.payload.budget.id ? action.payload.budget : budget
        );
        if (state.budget?.id === action.payload.budget.id) {
          state.budget = action.payload.budget;
        }
      })
      .addCase(updateBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteBudget.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgets = state.budgets.filter(budget => budget.id !== action.payload.id);
      })
      .addCase(deleteBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearBudget } = budgetSlice.actions;
export default budgetSlice.reducer;