import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getBudget, getBudgetProgress, deleteBudget } from '../redux/slices/budgetSlice';
import { getTransactions } from '../redux/slices/transactionSlice';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiArrowLeft, FiPlus, FiCalendar, FiDollarSign, FiCreditCard } from 'react-icons/fi';

const BudgetDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { budget, progress, isLoading } = useSelector((state) => state.budgets);
  const { transactions } = useSelector((state) => state.transactions);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    dispatch(getBudget(id));
    dispatch(getBudgetProgress(id));
    dispatch(getTransactions());
  }, [dispatch, id]);

  const formatPeriod = (period) => {
    switch (period) {
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return period.charAt(0).toUpperCase() + period.slice(1);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getColorClass = (percentage) => {
    if (percentage < 50) {
      return 'bg-green-500';
    } else if (percentage < 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  const getRelevantTransactions = () => {
    if (!transactions || !budget || !progress) return [];

    return transactions
      .filter(t => 
        t.category === budget.category && 
        t.type === 'expense' &&
        new Date(t.date) >= new Date(progress.period.startDate) &&
        new Date(t.date) <= new Date(progress.period.endDate)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleDelete = () => {
    dispatch(deleteBudget(id)).then(() => {
      toast.success('Budget deleted successfully');
      window.location.href = '/budgets';
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!budget || !progress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700">Budget not found or still loading...</p>
          <Link to="/budgets" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <FiArrowLeft className="mr-2" /> Back to Budgets
          </Link>
        </div>
      </div>
    );
  }

  const relevantTransactions = getRelevantTransactions();
  const { totalSpent, remaining, percentageSpent, isOverspent } = progress.progress;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link to="/budgets" className="text-blue-600 hover:text-blue-800 mr-4">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{budget.category} Budget</h1>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/budgets/edit/${budget.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <FiEdit2 className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            <FiTrash2 className="mr-2 -ml-1 h-5 w-5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Budget Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Overview</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Amount</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(budget.amount)}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Period</span>
                    <span className="text-sm font-semibold text-gray-900">{formatPeriod(budget.period)}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Current Period</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(progress.period.startDate)} - {formatDate(progress.period.endDate)}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Spent So Far</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalSpent)}</span>
                  </div>
                  
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Remaining</span>
                    <span className={`text-sm font-semibold ${isOverspent ? 'text-red-600' : 'text-green-600'}`}>
                      {isOverspent ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Progress</h2>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-base font-medium text-gray-700">
                    {formatCurrency(totalSpent)} of {formatCurrency(budget.amount)}
                  </span>
                  <span className={`text-base font-medium ${
                    percentageSpent >= 100 ? 'text-red-600' : percentageSpent >= 80 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {Math.round(percentageSpent)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${getColorClass(percentageSpent)}`}
                    style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                  ></div>
                </div>
                
                <div className="mt-3">
                  {percentageSpent < 50 && (
                    <p className="text-sm text-green-600">You're doing well with this budget!</p>
                  )}
                  {percentageSpent >= 50 && percentageSpent < 80 && (
                    <p className="text-sm text-yellow-600">You've used more than half of your budget.</p>
                  )}
                  {percentageSpent >= 80 && percentageSpent < 100 && (
                    <p className="text-sm text-orange-600">You're approaching your budget limit!</p>
                  )}
                  {percentageSpent >= 100 && (
                    <p className="text-sm text-red-600 font-medium">You've exceeded your budget!</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                      <FiDollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">Total Budget</p>
                      <p className="text-lg font-bold text-blue-900">{formatCurrency(budget.amount)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                      <FiCalendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">Time Remaining</p>
                      <p className="text-lg font-bold text-green-900">
                        {Math.ceil((new Date(progress.period.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={`${isOverspent ? 'bg-red-50' : 'bg-green-50'} p-4 rounded-md`}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 ${isOverspent ? 'bg-red-100' : 'bg-green-100'} rounded-full p-2`}>
                      <FiCreditCard className={`h-5 w-5 ${isOverspent ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isOverspent ? 'text-red-800' : 'text-green-800'}`}>
                        {isOverspent ? 'Over Budget' : 'Remaining'}
                      </p>
                      <p className={`text-lg font-bold ${isOverspent ? 'text-red-900' : 'text-green-900'}`}>
                        {isOverspent 
                          ? `-${formatCurrency(Math.abs(remaining))}` 
                          : formatCurrency(remaining)
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Related Transactions</h2>
            <Link
              to="/transactions/add"
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <FiPlus className="mr-1 -ml-0.5 h-4 w-4" /> Add Transaction
            </Link>
          </div>
        </div>
        <div className="px-6 py-4">
          {relevantTransactions.length > 0 ? (
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relevantTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        {transaction.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{transaction.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-red-600">
                        -{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No expenses for this category in the current budget period.
              </p>
              <div className="mt-6">
                <Link
                  to="/transactions/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                  Add Transaction
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDeleteModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Budget
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this budget? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDetails;