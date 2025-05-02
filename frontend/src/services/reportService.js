import axios from 'axios';

const API_URL = 'http://localhost:3000/api/reports/';

// Get monthly income vs expense report
const getMonthlyReport = async (token, year) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { year }
  };

  const response = await axios.get(API_URL + 'monthly', config);
  return response.data;
};

// Get category breakdown report
const getCategoryReport = async (token, params) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params
  };

  const response = await axios.get(API_URL + 'category', config);
  return response.data;
};

// Get cash flow report
const getCashFlowReport = async (token, params) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params
  };

  const response = await axios.get(API_URL + 'cashflow', config);
  return response.data;
};

const reportService = {
  getMonthlyReport,
  getCategoryReport,
  getCashFlowReport,
};

export default reportService;