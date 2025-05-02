import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  getTransactions,
  deleteTransaction,
  reset,
} from "../redux/slices/transactionSlice";
import { toast } from "react-toastify";
import {
  FiPlusCircle,
  FiEdit,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiCheck,
  FiX,
  FiEye,
} from "react-icons/fi";
import { format } from "date-fns";

const Transactions = () => {
  const dispatch = useDispatch();
  const { transactions, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.transactions
  );

  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    category: "all",
    searchTerm: "",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null,
    multiple: false,
  });

  // Get all transactions on component mount
  useEffect(() => {
    dispatch(getTransactions());

    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  // Handle toast notifications
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  // Filter and sort transactions whenever transactions or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [transactions, filters, sortConfig]);

  // Update select all state when filtered transactions change
  useEffect(() => {
    if (
      filteredTransactions.length > 0 &&
      selectedTransactions.length === filteredTransactions.length
    ) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [filteredTransactions, selectedTransactions]);

  const applyFiltersAndSort = () => {
    if (!transactions) return;

    let filtered = [...transactions];

    // Apply type filter
    if (filters.type !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.type === filters.type
      );
    }

    // Apply date range filters
    if (filters.startDate) {
      filtered = filtered.filter(
        (transaction) =>
          new Date(transaction.date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (transaction) => new Date(transaction.date) <= new Date(filters.endDate)
      );
    }

    // Apply amount range filters
    if (filters.minAmount) {
      filtered = filtered.filter(
        (transaction) => Number(transaction.amount) >= Number(filters.minAmount)
      );
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(
        (transaction) => Number(transaction.amount) <= Number(filters.maxAmount)
      );
    }

    // Apply category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.category === filters.category
      );
    }

    // Apply search filter
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(search) ||
          transaction.category.toLowerCase().includes(search) ||
          transaction.notes?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortConfig.key === "date") {
        return sortConfig.direction === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      } else if (sortConfig.key === "amount") {
        return sortConfig.direction === "asc"
          ? Number(a.amount) - Number(b.amount)
          : Number(b.amount) - Number(a.amount);
      } else {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      }
    });

    setFilteredTransactions(filtered);
  };

  // Get unique categories from transactions
  const getUniqueCategories = () => {
    if (!transactions) return [];
    const categories = transactions.map((transaction) => transaction.category);
    return ["all", ...new Set(categories)];
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "all",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      category: "all",
      searchTerm: "",
    });
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? (
      <FiChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <FiChevronDown className="ml-1 h-4 w-4" />
    );
  };

  // Handle transaction selection
  const toggleSelectTransaction = (id) => {
    setSelectedTransactions((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((item) => item !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map((t) => t.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle delete transactions
  const confirmDeleteSingle = (id) => {
    setConfirmDelete({ show: true, id, multiple: false });
  };

  const confirmDeleteMultiple = () => {
    if (selectedTransactions.length === 0) return;
    setConfirmDelete({ show: true, id: null, multiple: true });
  };

  const handleDelete = () => {
    if (confirmDelete.multiple) {
      // For multiple delete, we would dispatch a bulk delete action
      // But for now, let's delete them one by one
      selectedTransactions.forEach((id) => {
        dispatch(deleteTransaction(id));
      });
      setSelectedTransactions([]);
    } else {
      dispatch(deleteTransaction(confirmDelete.id));
    }
    setConfirmDelete({ show: false, id: null, multiple: false });
    toast.success("Transaction(s) deleted successfully");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with title and actions */}
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <div className="flex space-x-2">
          {selectedTransactions.length > 0 && (
            <button
              onClick={confirmDeleteMultiple}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiTrash2 className="mr-2 -ml-1 h-5 w-5" />
              Delete ({selectedTransactions.length})
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFilter className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Filters
          </button>
          <Link
            to="/transactions/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
            Add Transaction
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Filter Transactions</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Clear Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Type
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {getUniqueCategories().map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="searchTerm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="searchTerm"
                  id="searchTerm"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Description, category, or notes"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="minAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Min Amount
                </label>
                <input
                  type="number"
                  name="minAmount"
                  id="minAmount"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label
                  htmlFor="maxAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Max Amount
                </label>
                <input
                  type="number"
                  name="maxAmount"
                  id="maxAmount"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="1000"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => requestSort("date")}
                      className="flex items-center focus:outline-none"
                    >
                      Date
                      {getSortIcon("date")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => requestSort("description")}
                      className="flex items-center focus:outline-none"
                    >
                      Description
                      {getSortIcon("description")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => requestSort("category")}
                      className="flex items-center focus:outline-none"
                    >
                      Category
                      {getSortIcon("category")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => requestSort("amount")}
                      className="flex items-center justify-end focus:outline-none ml-auto"
                    >
                      Amount
                      {getSortIcon("amount")}
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={() =>
                          toggleSelectTransaction(transaction.id)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      {transaction.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {transaction.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.category}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/transactions/${transaction.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/transactions/edit/${transaction.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => confirmDeleteSingle(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No transactions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {transactions && transactions.length > 0
                ? "Try changing your filter criteria"
                : "Get started by creating a new transaction."}
            </p>
            <div className="mt-6">
              <Link
                to="/transactions/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlusCircle
                  className="-ml-1 mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Add Transaction
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Deletion confirmation modal */}
      {confirmDelete.show && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete{" "}
                      {confirmDelete.multiple ? "Transactions" : "Transaction"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete{" "}
                        {confirmDelete.multiple
                          ? "these transactions"
                          : "this transaction"}
                        ? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() =>
                    setConfirmDelete({ show: false, id: null, multiple: false })
                  }
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

export default Transactions;
