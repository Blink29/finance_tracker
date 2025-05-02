import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getTransactionSummary, getTransactions, reset } from '../redux/slices/transactionSlice';
import { getBudgets } from '../redux/slices/budgetSlice';
import { toast } from 'react-toastify';
import { FiPlusCircle, FiArrowUp, FiArrowDown, FiDollarSign, FiPieChart, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { transactions, summary, isLoading, isError, message } = useSelector((state) => state.transactions);
  const { budgets } = useSelector((state) => state.budgets);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });

  useEffect(() => {
    dispatch(getTransactions());
    dispatch(getBudgets());
    dispatch(getTransactionSummary(dateRange));

    return () => {
      dispatch(reset());
    };
  }, [dispatch, dateRange]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  const getRecentTransactions = () => {
    if (!transactions || transactions.length === 0) return [];
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  // Fix: Use summary.summary.categorySummary for category breakdown
  const getExpensesByCategory = () => {
    if (!summary?.summary?.categorySummary) return {};
    return summary.summary.categorySummary;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getChartData = () => {
    const expensesByCategory = getExpensesByCategory();
    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    const backgroundColors = [
      '#4F46E5', // Indigo
      '#3B82F6', // Blue
      '#0EA5E9', // Light Blue
      '#06B6D4', // Cyan
      '#14B8A6', // Teal
      '#10B981', // Emerald
      '#22C55E', // Green
      '#84CC16', // Lime
      '#EAB308', // Yellow
      '#F59E0B', // Amber
      '#F97316', // Orange
      '#EF4444', // Red
      '#EC4899', // Pink
      '#8B5CF6', // Purple
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  };

  // Fix: Use available summary for the current period for the chart
  const getIncomeVsExpenseData = () => {
    if (!summary?.summary) return null;

    // Use the period from summary.period for the label
    const start = summary.period?.startDate
      ? new Date(summary.period.startDate)
      : new Date();
    const end = summary.period?.endDate
      ? new Date(summary.period.endDate)
      : new Date();

    const label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;

    return {
      labels: [label],
      datasets: [
        {
          label: 'Income',
          data: [summary.summary.totalIncome || 0],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: [summary.summary.totalExpense || 0],
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const recentTransactions = getRecentTransactions();
  const chartData = getChartData();
  const incomeVsExpenseData = getIncomeVsExpenseData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate summary numbers
  const totalIncome = summary?.summary?.totalIncome || 0;
  const totalExpense = summary?.summary?.totalExpense || 0;
  const balance = totalIncome - totalExpense;

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          <Link
            to="/transactions/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
            Add Transaction
          </Link>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
              <FiArrowUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Income</h2>
              <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/transactions" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all income →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-red-100 p-3">
              <FiArrowDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Expenses</h2>
              <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/transactions" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all expenses →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Current Balance</h2>
              <p className={`mt-1 text-xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/reports" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View detailed reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expenses Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Income vs Expenses</h2>
            <div className="flex items-center">
              <FiCalendar className="mr-2 text-gray-400" />
              <span className="text-sm text-gray-500">Last 6 months</span>
            </div>
          </div>
          <div className="h-64">
            {incomeVsExpenseData && <Line 
              data={incomeVsExpenseData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatCurrency(value),
                    },
                  },
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                      }
                    }
                  }
                }
              }} 
            />}
          </div>
        </div>

        {/* Expense Categories Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Expense Breakdown</h2>
            <div className="flex items-center">
              <FiPieChart className="mr-2 text-gray-400" />
              <span className="text-sm text-gray-500">By category</span>
            </div>
          </div>
          <div className="h-64 flex justify-center">
            {Object.keys(getExpensesByCategory()).length > 0 ? (
              <Doughnut 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${formatCurrency(context.parsed)}`;
                        }
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 mb-2">No expense data available</p>
                <Link
                  to="/transactions/add"
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlusCircle className="mr-1 h-4 w-4" />
                  Add Expense
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.category}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <FiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new transaction.</p>
              <div className="mt-6">
                <Link
                  to="/transactions/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
                  Add Transaction
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;