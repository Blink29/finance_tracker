import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  createTransaction,
  getTransaction,
  updateTransaction,
  reset,
} from "../redux/slices/transactionSlice";
import { FiSave, FiX, FiUpload, FiEdit } from "react-icons/fi";

// Predefined categories for transactions
const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Gifts",
  "Refunds",
  "Other Income",
];

const EXPENSE_CATEGORIES = [
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

const TransactionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = window.location.pathname;

  const { transaction, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.transactions
  );

  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    receipt: null,
  });

  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if we're editing, viewing, or adding a transaction
  const isEditing = location.includes("/edit/");
  const isViewing = Boolean(id) && !isEditing;

  useEffect(() => {
    if (id) {
      dispatch(getTransaction(id));
    }

    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (transaction) {
      // Format the date for the form
      const formattedDate = transaction.date
        ? new Date(transaction.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      setFormData({
        type: transaction.type || "expense",
        amount: transaction.amount || "",
        description: transaction.description || "",
        category: transaction.category || "",
        date: formattedDate,
        notes: transaction.notes || "",
        receipt: null, // We don't load the file itself, just the URL
      });

      // Use receiptUrl for preview
      if (transaction.receiptUrl) {
        setPreviewUrl(transaction.receiptUrl);
      } else {
        setPreviewUrl("");
      }
    }
  }, [transaction]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
      setIsSubmitting(false);
    }

    if (isSuccess && isSubmitting) {
      toast.success(
        `Transaction ${isEditing ? "updated" : "added"} successfully`
      );
      navigate("/transactions");
    }
  }, [isError, isSuccess, message, navigate, isEditing, isSubmitting]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && files[0]) {
      // Handle file upload
      setFormData((prevState) => ({
        ...prevState,
        receipt: files[0],
      }));

      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(files[0]);
    } else {
      // For type change, also change category to empty
      if (name === "type") {
        setFormData((prevState) => ({
          ...prevState,
          [name]: value,
          category: "", // Reset category when type changes
        }));
      } else {
        setFormData((prevState) => ({
          ...prevState,
          [name]: value,
        }));
      }
    }
  };

  // Get categories based on transaction type
  const getCategories = () => {
    return formData.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      !formData.amount ||
      !formData.description ||
      !formData.category ||
      !formData.date
    ) {
      toast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    // Create form data object for file upload
    const transactionData = new FormData();
    transactionData.append("type", formData.type);
    transactionData.append("amount", formData.amount);
    transactionData.append("description", formData.description);
    transactionData.append("category", formData.category);
    transactionData.append("date", formData.date);

    if (formData.notes) {
      transactionData.append("notes", formData.notes);
    }

    // Only append receipt if there's a new file selected
    if (formData.receipt && formData.receipt instanceof File) {
      transactionData.append("receipt", formData.receipt);
    }

    if (isEditing) {
      dispatch(updateTransaction({ id, transactionData }));
    } else {
      dispatch(createTransaction(transactionData));
    }
  };

  const removeReceipt = () => {
    setFormData((prevState) => ({
      ...prevState,
      receipt: null,
    }));
    setPreviewUrl("");
  };

  if (isLoading && (isEditing || isViewing)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isViewing
            ? "View Transaction"
            : isEditing
            ? "Edit Transaction"
            : "Add New Transaction"}
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Transaction Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === "income"}
                    onChange={handleChange}
                    className="form-radio h-5 w-5 text-blue-600"
                    disabled={isViewing}
                  />
                  <span className="ml-2 text-gray-700">Income</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === "expense"}
                    onChange={handleChange}
                    className="form-radio h-5 w-5 text-red-600"
                    disabled={isViewing}
                  />
                  <span className="ml-2 text-gray-700">Expense</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Amount *
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
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    disabled={isViewing}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                  disabled={isViewing}
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="description"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Description *
              </label>
              <input
                type="text"
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Transaction description"
                required
                disabled={isViewing}
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="category"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Category *
              </label>
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={isViewing}
              >
                <option value="">Select a category</option>
                {getCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <label
                htmlFor="notes"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Add any additional notes here"
                disabled={isViewing}
              ></textarea>
            </div>

            <div className="mt-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Receipt Image (Optional)
              </label>
              <div className="mt-1 flex items-center">
                <span className="inline-block h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-full w-full text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
                      <path d="M14 10l-4 4-2-2-1 1 3 3 5-5z" />
                    </svg>
                  )}
                </span>
                {!isViewing && (
                  <div className="ml-4 flex">
                    <div className="relative bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm flex items-center cursor-pointer hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <label
                        htmlFor="receipt-upload"
                        className="relative text-sm font-medium text-gray-700"
                      >
                        <FiUpload className="mr-2 h-5 w-5 text-gray-400 inline" />
                        <span>
                          {previewUrl ? "Change receipt" : "Upload receipt"}
                        </span>
                        <input
                          id="receipt-upload"
                          name="receipt"
                          type="file"
                          className="sr-only"
                          onChange={handleChange}
                          accept="image/*"
                        />
                      </label>
                    </div>
                    {previewUrl && (
                      <button
                        type="button"
                        className="ml-3 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={removeReceipt}
                      >
                        <FiX className="h-5 w-5 text-red-500" />
                      </button>
                    )}
                  </div>
                )}
                {isViewing && previewUrl && (
                  <div className="ml-4">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Full Receipt
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Different actions based on the mode */}
            <div className="mt-8 flex justify-end">
              {isViewing ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Transactions
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/transactions/edit/${id}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiEdit className="mr-2 h-5 w-5" />
                    Edit Transaction
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <FiSave className="mr-2 h-5 w-5" />
                    {isSubmitting ? "Saving..." : "Save Transaction"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
