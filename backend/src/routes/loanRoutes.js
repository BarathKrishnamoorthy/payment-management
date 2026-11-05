const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLoans,
  createLoan,
  addRepayment,
  deleteLoan,
} = require('../controllers/loanController');

router.use(protect);

router.route('/')
  .get(getLoans)
  .post(createLoan);

router.post('/:id/repayments', addRepayment);
router.delete('/:id', deleteLoan);

module.exports = router;
