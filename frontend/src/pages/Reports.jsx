import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getMonthlyReport, getCategoryReport, getCashFlowReport, reset } from '../redux/slices/reportSlice';
import { toast } from 'react-toastify';
import { FiCalendar, FiPieChart, FiTrendingUp, FiFilter } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title,
  BarElement 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title,
  BarElement
);

const Reports = () => {
  const dispatch = useDispatch();
  const { monthlyReport, categoryReport, cashFlowReport, isLoading, isError, message } = useSelector(
    (state) => state.reports
  );

  const [activeReport, setActiveReport] = useState('monthly');
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'expense',
    period: 'monthly'
  });

  useEffect(() => {
    // Reset reports when component unmounts
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  useEffect(() => {
    if (activeReport === 'monthly') {
      dispatch(getMonthlyReport(filters.year));
    } else if (activeReport === 'category') {
      dispatch(getCategoryReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type
      }));
    } else if (activeReport === 'cashflow') {
      dispatch(getCashFlowReport({
        period: filters.period,
        startDate: filters.startDate,
        endDate: filters.endDate
      }));
    }
  }, [dispatch, activeReport, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMonthlyChartData = () => {
    if (!monthlyReport) return null;

    const labels = monthlyReport.months.map(month => month.month);
    
    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: monthlyReport.months.map(month => month.income),
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: monthlyReport.months.map(month => month.expense),
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Savings',
          data: monthlyReport.months.map(month => month.savings),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    };
  };

  const getCategoryChartData = () => {
    if (!categoryReport) return null;

    const categoryData = categoryReport[filters.type === 'income' ? 'income' : 'expense'];
    
    return {
      labels: categoryData.categories.map(item => item.category),
      datasets: [
        {
          data: categoryData.categories.map(item => item.amount),
          backgroundColor: [
            '#4F46E5', '#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6', 
            '#10B981', '#22C55E', '#84CC16', '#EAB308', '#F59E0B', 
            '#F97316', '#EF4444', '#EC4899', '#8B5CF6'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getCashFlowChartData = () => {
    if (!cashFlowReport) return null;

    return {
      labels: cashFlowReport.cashFlow.map(item => {
        const date = new Date(item.period);
        return filters.period === 'daily' 
          ? date.toLocaleDateString() 
          : filters.period === 'weekly'
            ? `Week of ${date.toLocaleDateString()}`
            : date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Income',
          data: cashFlowReport.cashFlow.map(item => item.income),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderWidth: 0
        },
        {
          label: 'Expenses',
          data: cashFlowReport.cashFlow.map(item => item.expense),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderWidth: 0
        },
        {
          label: 'Net Cash Flow',
          type: 'line',
          data: cashFlowReport.cashFlow.map(item => item.netCashFlow),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
        <p className="text-gray-600 mt-1">
          Analyze your finances with detailed reports and insights
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="flex overflow-x-auto border-b">
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${
              activeReport === 'monthly' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveReport('monthly')}
          >
            <FiCalendar className="inline-block mr-2" />
            Monthly Income vs Expenses
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${
              activeReport === 'category' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveReport('category')}
          >
            <FiPieChart className="inline-block mr-2" />
            Category Breakdown
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${
              activeReport === 'cashflow' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveReport('cashflow')}
          >
            <FiTrendingUp className="inline-block mr-2" />
            Cash Flow Analysis
          </button>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-3">
              <FiFilter className="text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-700">Report Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeReport === 'monthly' && (
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    id="year"
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              )}

              {activeReport === 'category' && (
                <>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                    <select
                      id="type"
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </>
              )}

              {activeReport === 'cashflow' && (
                <>
                  <div>
                    <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                    <select
                      id="period"
                      name="period"
                      value={filters.period}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Monthly Report */}
              {activeReport === 'monthly' && monthlyReport && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Monthly Income vs Expenses for {filters.year}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-green-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-green-800">Total Income</h3>
                        <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(monthlyReport.totals.totalIncome)}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-red-800">Total Expenses</h3>
                        <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(monthlyReport.totals.totalExpense)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-blue-800">Total Savings</h3>
                        <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(monthlyReport.totals.totalSavings)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <Line
                      data={getMonthlyChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatCurrency(value);
                              }
                            }
                          }
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
                    />
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {monthlyReport.months.map((month, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">{formatCurrency(month.income)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">{formatCurrency(month.expense)}</td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${month.savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(month.savings)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Report */}
              {activeReport === 'category' && categoryReport && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {filters.type === 'income' ? 'Income' : 'Expense'} Breakdown by Category
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(categoryReport.period.startDate).toLocaleDateString()} to {new Date(categoryReport.period.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-80 flex items-center justify-center">
                      {getCategoryChartData()?.labels.length > 0 ? (
                        <Doughnut
                          data={getCategoryChartData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = formatCurrency(context.parsed);
                                    const percentage = categoryReport[filters.type].categories[context.dataIndex].percentage;
                                    return `${label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="text-center p-6">
                          <p className="text-gray-500">No data available for the selected period</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold text-gray-800 mb-4">Category Breakdown</h3>
                      <div className="space-y-3">
                        {categoryReport[filters.type].categories.length > 0 ? (
                          categoryReport[filters.type].categories.map((category, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{category.category}</span>
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(category.amount)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="h-2.5 rounded-full bg-blue-600"
                                  style={{ width: `${category.percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-right mt-1">
                                <span className="text-xs text-gray-500">{category.percentage}%</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4 bg-gray-50 rounded-md">
                            <p className="text-gray-500">No data available for the selected period</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800">Total {filters.type === 'income' ? 'Income' : 'Expenses'}</h4>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          {formatCurrency(categoryReport[filters.type].total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cash Flow Report */}
              {activeReport === 'cashflow' && cashFlowReport && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Cash Flow Analysis</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(cashFlowReport.dateRange.startDate).toLocaleDateString()} to {new Date(cashFlowReport.dateRange.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="h-80 mb-6">
                    {getCashFlowChartData()?.labels.length > 0 ? (
                      <Bar
                        data={getCashFlowChartData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return formatCurrency(value);
                                }
                              }
                            },
                            y1: {
                              position: 'right',
                              grid: {
                                drawOnChartArea: false,
                              },
                              ticks: {
                                callback: function(value) {
                                  return formatCurrency(value);
                                }
                              }
                            }
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
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available for the selected period</p>
                      </div>
                    )}
                  </div>
                  
                  {cashFlowReport.cashFlow.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Cash Flow</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulative Cash Flow</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cashFlowReport.cashFlow.map((item, index) => {
                            const date = new Date(item.period);
                            const formattedDate = filters.period === 'daily' 
                              ? date.toLocaleDateString() 
                              : filters.period === 'weekly'
                                ? `Week of ${date.toLocaleDateString()}`
                                : date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
                            
                            return (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formattedDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">{formatCurrency(item.income)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">{formatCurrency(item.expense)}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${item.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(item.netCashFlow)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${item.cumulativeCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {formatCurrency(item.cumulativeCashFlow)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;