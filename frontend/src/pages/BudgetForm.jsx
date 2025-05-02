import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { createBudget, getBudget, updateBudget } from '../redux/slices/budgetSlice';

const BudgetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { budget, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.budgets
  );

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    period: 'monthly',
    startDate: '',
    endDate: '',
    description: ''
  });

  const { name, amount, category, period, startDate, endDate, description } = formData;

  // Categories for budgets
  const categories = [
    'Housing', 'Transportation', 'Food', 'Utilities', 
    'Insurance', 'Medical', 'Savings', 'Personal', 
    'Entertainment', 'Debt', 'Education', 'Other'
  ];

  // If we're editing, populate the form with budget data
  useEffect(() => {
    if (id) {
      dispatch(getBudget(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (id && budget) {
      setFormData({
        name: budget.name || '',
        amount: budget.amount || '',
        category: budget.category || '',
        period: budget.period || 'monthly',
        startDate: budget.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : '',
        endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : '',
        description: budget.description || ''
      });
    }
  }, [id, budget]);

  // useEffect(() => {
  //   if (isError) {
  //     toast.error(message);
  //   }
    
  //   if (isSuccess && !isLoading) {
  //     toast.success(`Budget ${id ? 'updated' : 'created'} successfully!`);
  //     navigate('/budgets');
  //   }
  // }, [isError, isSuccess, message, isLoading, navigate, id]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!name || !amount || !category || !period || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const budgetData = {
      name,
      amount: parseFloat(amount),
      category,
      period,
      startDate,
      endDate: endDate || undefined,
      description
    };

    if (id) {
      dispatch(updateBudget({ id, budgetData }));
    } else {
      dispatch(createBudget(budgetData));
    }

    toast.success(`Budget ${id ? 'updated' : 'created'} successfully!`);
    navigate('/budgets');
  };

  if (isLoading && id) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Budget' : 'Create New Budget'}
      </h1>

      <form onSubmit={onSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Budget Name*
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            placeholder="e.g., Monthly Groceries"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Budget Amount*
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-700">
              $
            </span>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 pl-7 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="amount"
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={amount}
              onChange={onChange}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
            Category*
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="category"
            name="category"
            value={category}
            onChange={onChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="period">
            Budget Period*
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="period"
            name="period"
            value={period}
            onChange={onChange}
            required
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
            Start Date*
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="startDate"
            type="date"
            name="startDate"
            value={startDate}
            onChange={onChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
            End Date (Optional)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="endDate"
            type="date"
            name="endDate"
            value={endDate}
            onChange={onChange}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description (Optional)
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="description"
            name="description"
            value={description}
            onChange={onChange}
            placeholder="Add any additional notes about this budget"
            rows="3"
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (id ? 'Update Budget' : 'Create Budget')}
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={() => navigate('/budgets')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;