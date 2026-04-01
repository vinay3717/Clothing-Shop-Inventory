const express = require('express');
const router  = express.Router();
const {
  getAllPurchases, getPurchaseById,
  createPurchase, getPurchaseSummary
} = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');

router.get('/stats/summary', protect, getPurchaseSummary);
router.get('/',              protect, getAllPurchases);
router.get('/:id',           protect, getPurchaseById);
router.post('/',             protect, createPurchase);

module.exports = router;