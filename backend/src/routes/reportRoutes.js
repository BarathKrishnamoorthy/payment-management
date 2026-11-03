const express = require('express');
const router = express.Router();
const { getReportAnalytics } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/analytics', protect, getReportAnalytics);

module.exports = router;

