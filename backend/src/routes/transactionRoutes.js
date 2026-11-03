const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  importBankStatement,
  exportTransactions,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('attachment'), createTransaction);
router.get('/', protect, getTransactions);
router.get('/export', protect, exportTransactions);
router.get('/:id', protect, getTransactionById);
router.put('/:id', protect, upload.single('attachment'), updateTransaction);
router.delete('/:id', protect, deleteTransaction);
router.post('/import-statement', protect, upload.single('statement'), importBankStatement);

module.exports = router;

