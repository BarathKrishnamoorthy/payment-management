const express = require('express');
const router = express.Router();
const {
  createRecurringPayment,
  getRecurringPayments,
  getRecurringById,
  updateRecurringPayment,
  deleteRecurringPayment,
  markAsPaid,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRecurringPayment);
router.get('/', protect, getRecurringPayments);
router.get('/:id', protect, getRecurringById);
router.put('/:id', protect, updateRecurringPayment);
router.delete('/:id', protect, deleteRecurringPayment);
router.post('/:id/pay', protect, markAsPaid);

module.exports = router;

