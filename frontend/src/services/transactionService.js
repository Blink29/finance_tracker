import axios from 'axios';

const API_URL = 'http://localhost:3000/api/transactions/';

// Get all transactions
const getTransactions = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);
  return response.data;
};

// Get single transaction
const getTransaction = async (token, id) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + id, config);
  return response.data;
};

// Get transaction summary
const getTransactionSummary = async (token, dateRange = {}) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: dateRange
  };

  const response = await axios.get(API_URL + 'summary', config);
  return response.data;
};

// Create new transaction
const createTransaction = async (token, transactionData) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
  };

  const response = await axios.post(API_URL, transactionData, config);
  return response.data;
};

// Update transaction
const updateTransaction = async (token, id, transactionData) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
  };

  const response = await axios.put(API_URL + id, transactionData, config);
  return response.data;
};

// Delete transaction
const deleteTransaction = async (token, id) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + id, config);
  return response.data;
};

const transactionService = {
  getTransactions,
  getTransaction,
  getTransactionSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};

export default transactionService;