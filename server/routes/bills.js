const express = require('express');
const router  = express.Router();
const {
  getAllBills, getBillById, createBill, getCustomerBills
} = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.get('/',                        protect, getAllBills);
router.get('/customer/:customerId',    protect, getCustomerBills);
router.get('/:id',                     protect, getBillById);
router.post('/',                       protect, createBill);

module.exports = router;