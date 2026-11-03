const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateTutorialStatus,
  resetTutorialStatus,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.post('/tutorial-status', protect, updateTutorialStatus);
router.post('/reset-tutorial', protect, resetTutorialStatus);

module.exports = router;

