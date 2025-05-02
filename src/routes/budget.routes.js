const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all budgets
router.get('/', budgetController.getAllBudgets);

// Get a single budget
router.get('/:id', budgetController.getBudgetById);

// Get budget progress
router.get('/:id/progress', budgetController.getBudgetProgress);

// Create a budget
router.post('/', 
  [
    check('category', 'Category is required').not().isEmpty(),
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 }),
    check('period', 'Period must be one of: daily, weekly, monthly, yearly').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    check('startDate', 'Start date must be valid').optional().isDate(),
    check('endDate', 'End date must be valid').optional().isDate()
  ],
  budgetController.createBudget
);

// Update a budget
router.put('/:id', 
  [
    check('amount', 'Amount must be a positive number').optional().isFloat({ min: 0 }),
    check('period', 'Period must be one of: daily, weekly, monthly, yearly').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    check('startDate', 'Start date must be valid').optional().isDate(),
    check('endDate', 'End date must be valid').optional().isDate()
  ],
  budgetController.updateBudget
);

// Delete a budget
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;