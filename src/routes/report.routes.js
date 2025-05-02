const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Monthly income vs expense report
router.get('/monthly', reportController.getMonthlyReport);

// Category breakdown report
router.get('/category', reportController.getCategoryReport);

// Cash flow report
router.get('/cashflow', reportController.getCashFlowReport);

module.exports = router;