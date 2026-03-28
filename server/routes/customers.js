const express = require('express');
const router  = express.Router();
const {
  getAllCustomers, getCustomersWithDues, searchCustomers,
  getCustomerById, addCustomer, updateCustomer, deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.get('/',        protect, getAllCustomers);
router.get('/dues',    protect, getCustomersWithDues);
router.get('/search',  protect, searchCustomers);
router.get('/:id',     protect, getCustomerById);
router.post('/',       protect, addCustomer);
router.put('/:id',     protect, updateCustomer);
router.delete('/:id',  protect, deleteCustomer);
module.exports = router; // Export the router to be used in index.js Importantly, this line is necessary to make the routes defined here available to the main application.