const express = require('express');
const router  = express.Router();
const { getAllSuppliers, addSupplier } = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');

router.get('/',  protect, getAllSuppliers);
router.post('/', protect, addSupplier);

module.exports = router;