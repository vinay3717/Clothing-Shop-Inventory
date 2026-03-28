const express = require('express');
const router  = express.Router();
const {
  getDashboard, getMonthlyReport, getStockReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboard);
router.get('/monthly',   protect, getMonthlyReport);
router.get('/stock',     protect, getStockReport);

module.exports = router;