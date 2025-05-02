const { Budget, Transaction } = require("../models");
const { Op } = require("sequelize");
const { validationResult } = require("express-validator");
const { createNotification } = require("../services/notification.service");

// Get all budgets for current user
exports.getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({ budgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Server error while fetching budgets" });
  }
};

// Get a single budget by ID
exports.getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ budget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ message: "Server error while fetching budget" });
  }
};

// Create a new budget
exports.createBudget = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      category,
      amount,
      period,
      startDate,
      endDate,
      isRecurring,
      description,
    } = req.body;

    // Create budget object
    const budgetData = {
      userId: req.user.id,
      name: name || category, // Use name if provided, otherwise use category
      category,
      amount,
      period: period || "monthly",
      startDate: startDate || new Date(),
      endDate,
      isRecurring: isRecurring !== undefined ? isRecurring : true,
      description: description || "",
    };

    // Save budget to database
    const budget = await Budget.create(budgetData);

    res.status(201).json({
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ message: "Server error while creating budget" });
  }
};

// Update a budget
exports.updateBudget = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the budget
    const budget = await Budget.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Update fields
    const {
      name,
      category,
      amount,
      period,
      startDate,
      endDate,
      isRecurring,
      description,
    } = req.body;

    if (name) budget.name = name;
    if (category) budget.category = category;
    if (amount) budget.amount = amount;
    if (period) budget.period = period;
    if (startDate) budget.startDate = startDate;
    if (endDate !== undefined) budget.endDate = endDate;
    if (isRecurring !== undefined) budget.isRecurring = isRecurring;
    if (description !== undefined) budget.description = description;

    // Save updated budget
    await budget.save();

    res.json({
      message: "Budget updated successfully",
      budget,
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Server error while updating budget" });
  }
};

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    // Find the budget
    const budget = await Budget.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Delete the budget
    await budget.destroy();

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({ message: "Server error while deleting budget" });
  }
};

// Get budget progress (for tracking spending against budget)
exports.getBudgetProgress = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the budget
    const budget = await Budget.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Calculate date range based on budget period
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
        userId: req.user.id,
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

    // Calculate remaining budget
    const remaining = parseFloat(budget.amount) - totalSpent;

    // Calculate percentage spent
    const percentageSpent = (totalSpent / parseFloat(budget.amount)) * 100;

    // Check if budget is overspent
    const isOverspent = totalSpent > parseFloat(budget.amount);

    res.json({
      budget,
      progress: {
        totalSpent,
        remaining,
        percentageSpent,
        isOverspent,
      },
      period: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error calculating budget progress:", error);
    res
      .status(500)
      .json({ message: "Server error while calculating budget progress" });
  }
};
