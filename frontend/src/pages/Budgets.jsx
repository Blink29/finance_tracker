import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiPieChart,
  FiTarget,
  FiArrowRight,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../redux/slices/budgetSlice";
import { getTransactions } from "../redux/slices/transactionSlice";

const Budgets = () => {
  const dispatch = useDispatch();
  const { budgets, isLoading, isError, message } = useSelector(
    (state) => state.budgets
  );
  const { transactions } = useSelector((state) => state.transactions);

  const [showModal, setShowModal] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    amount: "",
    period: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    description: "",
  });
  const [activeView, setActiveView] = useState("cards"); // 'cards' or 'categories'
  const [categoryTotals, setCategoryTotals] = useState({});

  useEffect(() => {
    dispatch(getBudgets());
    dispatch(getTransactions());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  // Calculate spending totals by category when transactions change
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const totals = calculateCategoryTotals();
      setCategoryTotals(totals);
    }
  }, [transactions]);

  const calculateCategoryTotals = () => {
    if (!transactions) return {};

    return transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += parseFloat(t.amount);
        return acc;
      }, {});
  };

  const openModal = (budget = null) => {
    if (budget) {
      setCurrentBudget(budget);
      setFormData({
        name: budget.name || budget.category,
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        startDate: budget.startDate
          ? new Date(budget.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        endDate: budget.endDate
          ? new Date(budget.endDate).toISOString().split("T")[0]
          : "",
        description: budget.description || "",
      });
    } else {
      setCurrentBudget(null);
      setFormData({
        name: "",
        category: "",
        amount: "",
        period: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const openModalForCategory = (category) => {
    setCurrentBudget(null);
    setFormData({
      name: `${category} Budget`,
      category: category,
      amount: "",
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      description: `Budget goal for ${category} expenses`,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentBudget(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.category ||
      !formData.amount ||
      !formData.startDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const budgetData = {
      name: formData.name,
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      description: formData.description,
    };

    try {
      if (currentBudget) {
        dispatch(
          updateBudget({
            id: currentBudget.id,
            budgetData,
          })
        )
          .unwrap()
          .then(() => {
            toast.success("Budget updated successfully!");
            closeModal();
          })
          .catch((error) => {
            toast.error(error || "Failed to update budget");
          });
      } else {
        dispatch(createBudget(budgetData))
          .unwrap()
          .then(() => {
            toast.success("Budget created successfully!");
            closeModal();
          })
          .catch((error) => {
            toast.error(error || "Failed to create budget");
          });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleDeleteBudget = (id) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      dispatch(deleteBudget(id));
    }
  };

  // Calculate spending for each budget based on transactions
  const calculateSpending = (category, period) => {
    if (!transactions) return 0;

    const now = new Date();
    let startDate;

    // Determine start date based on period
    if (period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "weekly") {
      // Get the first day of the current week (Sunday)
      const day = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
    } else if (period === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === "quarterly") {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    }

    // Filter transactions by category and date
    const relevantTransactions = transactions.filter(
      (t) =>
        t.category === category &&
        t.type === "expense" &&
        new Date(t.date) >= startDate &&
        new Date(t.date) <= now
    );

    // Sum up amounts
    return relevantTransactions.reduce(
      (total, t) => total + parseFloat(t.amount),
      0
    );
  };

  // Calculate percentage of budget used
  const calculatePercentage = (spent, budget) => {
    return Math.min(Math.round((spent / budget) * 100), 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get color based on percentage
  const getColorClass = (percentage) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Convert period to display text
  const formatPeriod = (period) => {
    switch (period) {
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "yearly":
        return "Yearly";
      default:
        return "Monthly";
    }
  };

  // Common expense categories
  const categories = [
    "Housing",
    "Food",
    "Transportation",
    "Utilities",
    "Insurance",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Personal Care",
    "Education",
    "Debt",
    "Savings",
    "Gifts & Donations",
    "Travel",
    "Other Expenses",
  ];

  // Get budget for a specific category if it exists
  const getBudgetForCategory = (category) => {
    if (!budgets || !budgets.length) return null;
    return budgets.find((b) => b.category === category);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Budget Management</h1>

        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setActiveView("cards")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeView === "cards"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Active Budgets
            </button>
            <button
              type="button"
              onClick={() => setActiveView("categories")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeView === "categories"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Category Goals
            </button>
          </div>

          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <FiPlus className="mr-2" /> Create Budget
          </button>
        </div>
      </div>

      {activeView === "cards" && (
        <>
          {budgets && budgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map((budget) => {
                const spent = calculateSpending(budget.category, budget.period);
                const percentage = calculatePercentage(spent, budget.amount);
                const colorClass = getColorClass(percentage);

                return (
                  <div
                    key={budget.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {budget.name || budget.category}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatPeriod(budget.period)} Budget for{" "}
                            {budget.category}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/budgets/${budget.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiTarget className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => openModal(budget)}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {formatCurrency(spent)} of{" "}
                            {formatCurrency(budget.amount)}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${colorClass}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <div className="mt-4">
                          <p
                            className={`text-sm ${
                              percentage >= 100
                                ? "text-red-600 font-bold"
                                : "text-gray-500"
                            }`}
                          >
                            {percentage < 100
                              ? `${formatCurrency(
                                  budget.amount - spent
                                )} remaining`
                              : `Exceeded by ${formatCurrency(
                                  spent - budget.amount
                                )}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <FiDollarSign className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No budgets set up yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first budget to start tracking your spending against
                your financial goals.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <FiPlus className="mr-2" /> Create New Budget
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeView === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const budget = getBudgetForCategory(category);
            const spent = categoryTotals[category] || 0;

            return (
              <div
                key={category}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {category}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {budget
                          ? `${formatPeriod(budget.period)} Budget`
                          : "No budget set"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {budget ? (
                        <>
                          <Link
                            to={`/budgets/${budget.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiTarget className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => openModal(budget)}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openModalForCategory(category)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <FiPlus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    {budget ? (
                      <>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {formatCurrency(spent)} of{" "}
                            {formatCurrency(budget.amount)}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {calculatePercentage(spent, budget.amount)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getColorClass(
                              calculatePercentage(spent, budget.amount)
                            )}`}
                            style={{
                              width: `${Math.min(
                                (spent / budget.amount) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>

                        <div className="mt-4">
                          <p
                            className={`text-sm ${
                              spent >= budget.amount
                                ? "text-red-600 font-bold"
                                : "text-gray-500"
                            }`}
                          >
                            {spent < budget.amount
                              ? `${formatCurrency(
                                  budget.amount - spent
                                )} remaining`
                              : `Exceeded by ${formatCurrency(
                                  spent - budget.amount
                                )}`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">
                          Total spent: {formatCurrency(spent)}
                        </p>
                        <button
                          onClick={() => openModalForCategory(category)}
                          className="mt-3 inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                          <FiTarget className="mr-1.5 -ml-0.5 h-4 w-4" />
                          Set Budget Goal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Form Modal */}
      {showModal && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(0px)",
          }}
          className="fixed inset-0 flex items-center justify-center overflow-y-auto z-50"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={closeModal}></div>

          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 md:mx-auto z-50">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <h3
                className="text-lg leading-6 font-medium text-gray-900 mb-3"
                id="modal-title"
              >
                {currentBudget ? "Edit Budget" : "Create Budget Goal"}
              </h3>

              <form id="budget-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="e.g. Monthly Groceries"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Expense Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select a Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Budget Amount *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border border-gray-300 rounded-md p-2"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="period"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Budget Period *
                  </label>
                  <select
                    id="period"
                    name="period"
                    value={formData.period}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="Add notes about this budget goal"
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse">
              <button
                type="submit"
                form="budget-form"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:w-auto sm:text-sm"
              >
                {currentBudget ? "Update Budget" : "Create Budget"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="mt-0 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
