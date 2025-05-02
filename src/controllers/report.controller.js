const { Transaction } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Generate monthly income vs expense report
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    
    // Default to current year if not specified
    const reportYear = year || new Date().getFullYear();
    
    const startDate = new Date(reportYear, 0, 1); // January 1st of the year
    const endDate = new Date(reportYear, 11, 31); // December 31st of the year
    
    // Get all transactions for the year
    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('date')), 'month'],
        [sequelize.fn('sum', sequelize.col('amount')), 'total'],
        'type'
      ],
      group: ['month', 'type'],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('date')), 'ASC']]
    });
    
    // Process data into monthly summaries
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(reportYear, i, 1);
      return {
        month: date.toLocaleString('default', { month: 'long' }),
        income: 0,
        expense: 0,
        savings: 0
      };
    });
    
    // Fill in actual data from transactions
    transactions.forEach(transaction => {
      const monthIndex = new Date(transaction.getDataValue('month')).getMonth();
      const amount = parseFloat(transaction.getDataValue('total'));
      
      if (transaction.type === 'income') {
        months[monthIndex].income = amount;
      } else if (transaction.type === 'expense') {
        months[monthIndex].expense = amount;
      }
      
      // Calculate savings (income - expense)
      months[monthIndex].savings = months[monthIndex].income - months[monthIndex].expense;
    });
    
    // Calculate year totals
    const yearTotals = {
      totalIncome: months.reduce((sum, month) => sum + month.income, 0),
      totalExpense: months.reduce((sum, month) => sum + month.expense, 0),
      totalSavings: months.reduce((sum, month) => sum + month.savings, 0)
    };
    
    res.json({
      year: reportYear,
      months,
      totals: yearTotals
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ message: 'Server error generating monthly report' });
  }
};

// Generate category breakdown report
exports.getCategoryReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Default to current month if dates not specified
    const currentDate = new Date();
    const reportStartDate = startDate 
      ? new Date(startDate) 
      : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const reportEndDate = endDate 
      ? new Date(endDate) 
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Validate transaction type
    const transactionType = type && ['income', 'expense'].includes(type.toLowerCase()) 
      ? type.toLowerCase() 
      : null;
    
    // Build where clause
    const whereClause = {
      userId: req.user.id,
      date: {
        [Op.between]: [reportStartDate, reportEndDate]
      }
    };
    
    // Add type filter if specified
    if (transactionType) {
      whereClause.type = transactionType;
    }
    
    // Get transactions grouped by category
    const categoryData = await Transaction.findAll({
      where: whereClause,
      attributes: [
        'category',
        'type',
        [sequelize.fn('sum', sequelize.col('amount')), 'total']
      ],
      group: ['category', 'type'],
      order: [[sequelize.fn('sum', sequelize.col('amount')), 'DESC']]
    });
    
    // Process the data
    const incomeCategories = [];
    const expenseCategories = [];
    
    categoryData.forEach(item => {
      const category = item.category;
      const amount = parseFloat(item.getDataValue('total'));
      
      if (item.type === 'income') {
        incomeCategories.push({ category, amount });
      } else if (item.type === 'expense') {
        expenseCategories.push({ category, amount });
      }
    });
    
    // Calculate totals
    const totalIncome = incomeCategories.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenseCategories.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate percentages
    incomeCategories.forEach(item => {
      item.percentage = totalIncome > 0 ? ((item.amount / totalIncome) * 100).toFixed(2) : 0;
    });
    
    expenseCategories.forEach(item => {
      item.percentage = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(2) : 0;
    });
    
    res.json({
      period: {
        startDate: reportStartDate,
        endDate: reportEndDate
      },
      income: {
        categories: incomeCategories,
        total: totalIncome
      },
      expense: {
        categories: expenseCategories,
        total: totalExpense
      }
    });
  } catch (error) {
    console.error('Error generating category report:', error);
    res.status(500).json({ message: 'Server error generating category report' });
  }
};

// Generate cash flow report
exports.getCashFlowReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    // Validate period (daily, weekly, monthly)
    const reportPeriod = ['daily', 'weekly', 'monthly'].includes(period) ? period : 'monthly';
    
    // Default dates if not specified
    const currentDate = new Date();
    let reportStartDate, reportEndDate;
    
    if (startDate && endDate) {
      reportStartDate = new Date(startDate);
      reportEndDate = new Date(endDate);
    } else {
      // Default to last 30 days
      reportEndDate = new Date();
      reportStartDate = new Date();
      reportStartDate.setDate(reportStartDate.getDate() - 30);
    }
    
    // SQL date truncation based on period
    let dateTrunc;
    if (reportPeriod === 'daily') {
      dateTrunc = 'day';
    } else if (reportPeriod === 'weekly') {
      dateTrunc = 'week';
    } else {
      dateTrunc = 'month';
    }
    
    // Get cash flow data
    const cashFlowData = await Transaction.findAll({
      where: {
        userId: req.user.id,
        date: {
          [Op.between]: [reportStartDate, reportEndDate]
        }
      },
      attributes: [
        [sequelize.fn('date_trunc', dateTrunc, sequelize.col('date')), 'period'],
        'type',
        [sequelize.fn('sum', sequelize.col('amount')), 'total']
      ],
      group: [sequelize.fn('date_trunc', dateTrunc, sequelize.col('date')), 'type'],
      order: [[sequelize.fn('date_trunc', dateTrunc, sequelize.col('date')), 'ASC']]
    });
    
    // Process the data
    const cashFlow = [];
    const periodMap = new Map();
    
    cashFlowData.forEach(item => {
      const periodDate = new Date(item.getDataValue('period'));
      const periodKey = periodDate.toISOString().split('T')[0];
      const amount = parseFloat(item.getDataValue('total'));
      
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          period: periodDate,
          income: 0,
          expense: 0,
          netCashFlow: 0
        });
      }
      
      const periodData = periodMap.get(periodKey);
      
      if (item.type === 'income') {
        periodData.income = amount;
      } else if (item.type === 'expense') {
        periodData.expense = amount;
      }
      
      periodData.netCashFlow = periodData.income - periodData.expense;
    });
    
    // Convert map to array
    periodMap.forEach(data => {
      cashFlow.push(data);
    });
    
    // Sort by period
    cashFlow.sort((a, b) => a.period - b.period);
    
    // Calculate cumulative cash flow
    let cumulativeCashFlow = 0;
    cashFlow.forEach(item => {
      cumulativeCashFlow += item.netCashFlow;
      item.cumulativeCashFlow = cumulativeCashFlow;
    });
    
    res.json({
      period: reportPeriod,
      dateRange: {
        startDate: reportStartDate,
        endDate: reportEndDate
      },
      cashFlow
    });
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    res.status(500).json({ message: 'Server error generating cash flow report' });
  }
};