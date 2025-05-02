const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middleware/auth');

// Create receipts directory if it doesn't exist
const receiptsDir = path.join(__dirname, '../../public/uploads/receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, receiptsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'receipt-' + uniqueSuffix + ext);
  }
});

// File filter for receipt uploads (only allow images and PDFs)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all transactions
router.get('/', transactionController.getAllTransactions);

// Get transactions summary (for dashboard)
router.get('/summary', transactionController.getTransactionsSummary);

// Get a single transaction
router.get('/:id', transactionController.getTransactionById);

// Create a transaction
router.post('/', 
  upload.single('receipt'),
  [
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 }),
    check('type', 'Type must be either income or expense').isIn(['income', 'expense']),
    check('category', 'Category is required').not().isEmpty(),
    check('date', 'Date must be valid').optional().isDate()
  ],
  transactionController.createTransaction
);

// Update a transaction
router.put('/:id', 
  upload.single('receipt'),
  [
    check('amount', 'Amount must be a positive number').optional().isFloat({ min: 0 }),
    check('type', 'Type must be either income or expense').optional().isIn(['income', 'expense']),
    check('date', 'Date must be valid').optional().isDate()
  ],
  transactionController.updateTransaction
);

// Delete a transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;