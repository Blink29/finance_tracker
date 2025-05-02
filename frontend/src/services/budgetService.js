import axios from 'axios';

const API_URL = 'https://fj-be-r2-paurush-kumar-iitm.onrender.com/api/budgets/';

// Get all budgets
const getBudgets = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

// Get single budget
const getBudget = async (token, id) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + id, config);
  return response.data;
};

// Get budget progress
const getBudgetProgress = async (token, id) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + id + '/progress', config);
  return response.data;
};

// Create budget
const createBudget = async (token, budgetData) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, budgetData, config);
  return response.data;
};

// Update budget
const updateBudget = async (token, id, budgetData) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(API_URL + id, budgetData, config);
  return response.data;
};

// Delete budget
const deleteBudget = async (token, id) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + id, config);
  return response.data;
};

const budgetService = {
  getBudgets,
  getBudget,
  getBudgetProgress,
  createBudget,
  updateBudget,
  deleteBudget,
};

export default budgetService;