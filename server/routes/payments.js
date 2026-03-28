const express = require('express');
const router  = express.Router();
const {
  getAllPayments, getCustomerPayments, addPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/',                       protect, getAllPayments);
router.get('/customer/:customerId',   protect, getCustomerPayments);
router.post('/',                      protect, addPayment);

module.exports = router;