const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAccounts,
  createAccount,
  updateAccount,
  transferBetweenAccounts,
  archiveAccount,
} = require('../controllers/accountController');

router.use(protect);

router.route('/')
  .get(getAccounts)
  .post(createAccount);

router.post('/transfer', transferBetweenAccounts);

router.route('/:id')
  .put(updateAccount)
  .delete(archiveAccount);

module.exports = router;

