const { Transaction, sequelize, Budget } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { checkBudgetAndNotify } = require('../services/notification.service');

// Base URL for receipts - adjust as needed for production
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.API_URL || 'https://your-api-domain.com' 
  : 'http://localhost:3000';

// Helper function to format receipt URL
const formatReceiptUrl = (receiptPath) => {
  if (!receiptPath) return null;
  
  // If already a full URL, return as is
  if (receiptPath.startsWith('http')) {
    return receiptPath;
  }
  
  // Ensure path starts with a slash
  const normalizedPath = receiptPath.startsWith('/') ? receiptPath : `/${receiptPath}`;
  return `${BASE_URL}${normalizedPath}`;
};

// Helper function to check budget notifications when transactions are created/updated
const checkBudgetNotifications = async (userId, transaction) => {
  try {
    // Only check budget notifications for expense transactions
    if (transaction.type !== 'expense') return;

    // Find all budgets that match this transaction category
    const budgets = await Budget.findAll({
      where: { 
        userId: userId,
        category: transaction.category
      }
    });

    if (!budgets || budgets.length === 0) return;

    // For each matching budget, check spending and send notification if needed
    for (const budget of budgets) {
      // Calculate date range based on budget period to get current spending
      const currentDate = new Date();
      let startDate, endDate;

      if (budget.period === "daily") {
        startDate = new Date(currentDate.setHours(0, 0, 0, 0));
        endDate = new Date(currentDate.setHours(23, 59, 59, 999));
      } else if (budget.period === "weekly") {
        const firstDayOfWeek = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay())
        );
        startDate = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
        endDate = new Date(firstDayOfWeek);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (budget.period === "monthly") {
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      } else if (budget.period === "yearly") {
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);
      }

      // If budget has specific start/end dates, use those instead
      if (budget.startDate) {
        startDate = new Date(budget.startDate);
      }
      if (budget.endDate) {
        endDate = new Date(budget.endDate);
      }

      // Get expenses for the category in the date range
      const expenses = await Transaction.findAll({
        where: {
          userId: userId,
          type: "expense",
          category: budget.category,
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      // Calculate total spent
      const totalSpent = expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );

      // Send notification if needed
      await checkBudgetAndNotify(userId, budget, totalSpent);
    }
  } catch (error) {
    console.error('Error checking budget notifications:', error);
  }
};

// Get all transactions for current user
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    
    // Format receipt URLs for frontend
    const formattedTransactions = transactions.map(transaction => {
      const plainTransaction = transaction.get({ plain: true });
      if (plainTransaction.receiptUrl) {
        plainTransaction.receiptUrl = formatReceiptUrl(plainTransaction.receiptUrl);
      }
      return plainTransaction;
    });
    
    res.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// Get a single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const plainTransaction = transaction.get({ plain: true });
    
    // Format receipt URL for frontend
    if (plainTransaction.receiptUrl) {
      plainTransaction.receiptUrl = formatReceiptUrl(plainTransaction.receiptUrl);
    }
    
    res.json({ transaction: plainTransaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error while fetching transaction' });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, type, category, description, date } = req.body;
    
    // Create transaction object
    const transactionData = {
      userId: req.user.id,
      amount,
      type,
      category,
      description,
      date: date || new Date()
    };
    
    // If there's a receipt file uploaded
    if (req.file) {
      transactionData.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }
    
    // Save transaction to database
    const transaction = await Transaction.create(transactionData);
    
    // Check budget notifications
    await checkBudgetNotifications(req.user.id, transaction);
    
    // Format the response with a full receipt URL
    const responseTransaction = transaction.get({ plain: true });
    if (responseTransaction.receiptUrl) {
      responseTransaction.receiptUrl = formatReceiptUrl(responseTransaction.receiptUrl);
    }
    
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: responseTransaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error while creating transaction' });
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Update fields
    const { amount, type, category, description, date } = req.body;
    
    if (amount) transaction.amount = amount;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (description) transaction.description = description;
    if (date) transaction.date = date;
    
    // If there's a new receipt file uploaded
    if (req.file) {
      // Delete old receipt if exists
      if (transaction.receiptUrl) {
        const oldReceiptPath = path.join(__dirname, '../../public', transaction.receiptUrl);
        if (fs.existsSync(oldReceiptPath)) {
          fs.unlinkSync(oldReceiptPath);
        }
      }
      transaction.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }
    
    // Save updated transaction
    await transaction.save();
    
    // Check budget notifications
    await checkBudgetNotifications(req.user.id, transaction);
    
    // Format the response with a full receipt URL
    const responseTransaction = transaction.get({ plain: true });
    if (responseTransaction.receiptUrl) {
      responseTransaction.receiptUrl = formatReceiptUrl(responseTransaction.receiptUrl);
    }
    
    res.json({
      message: 'Transaction updated successfully',
      transaction: responseTransaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error while updating transaction' });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Delete receipt file if exists
    if (transaction.receiptUrl) {
      const receiptPath = path.join(__dirname, '../../public', transaction.receiptUrl);
      if (fs.existsSync(receiptPath)) {
        fs.unlinkSync(receiptPath);
      }
    }
    
    // Delete the transaction
    await transaction.destroy();
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
};

// Get transactions summary (for dashboard)
exports.getTransactionsSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set default date range to current month if not provided
    const currentDate = new Date();
    const firstDay = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = endDate ? new Date(endDate) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get all transactions for the period
    const transactions = await Transaction.findAll({
      where: { 
        userId: req.user.id,
        date: {
          [Op.between]: [firstDay, lastDay]
        }
      }
    });
    
    // Calculate summary
    let totalIncome = 0;
    let totalExpense = 0;
    const categorySummary = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += parseFloat(transaction.amount);
      } else if (transaction.type === 'expense') {
        totalExpense += parseFloat(transaction.amount);
        
        // Aggregate by category
        if (!categorySummary[transaction.category]) {
          categorySummary[transaction.category] = 0;
        }
        categorySummary[transaction.category] += parseFloat(transaction.amount);
      }
    });
    
    const netSavings = totalIncome - totalExpense;
    
    res.json({
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        categorySummary
      },
      period: {
        startDate: firstDay,
        endDate: lastDay
      }
    });
  } catch (error) {
    console.error('Error generating transactions summary:', error);
    res.status(500).json({ message: 'Server error while generating transactions summary' });
  }
};