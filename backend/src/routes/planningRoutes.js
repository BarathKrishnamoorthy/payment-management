const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getBudgets,
  createBudget,
  deleteBudget,
  getSavingsGoals,
  createSavingsGoal,
  addGoalContribution,
  deleteSavingsGoal,
} = require('../controllers/planningController');

router.use(protect);

// Budgets
router.route('/budgets')
  .get(getBudgets)
  .post(createBudget);

router.delete('/budgets/:id', deleteBudget);

// Savings Goals
router.route('/savings-goals')
  .get(getSavingsGoals)
  .post(createSavingsGoal);

router.post('/savings-goals/:id/contributions', addGoalContribution);
router.delete('/savings-goals/:id', deleteSavingsGoal);

module.exports = router;
