const express = require('express');
const router  = express.Router();
const {
  getAllItems, searchItems, getItemById,
  addItem, updateItem, deleteItem
} = require('../controllers/itemController');
const { protect, ownerOnly } = require('../middleware/auth');

router.get('/',          protect, getAllItems);
router.get('/search',    protect, searchItems);
router.get('/:id',       protect, getItemById);
router.post('/',         protect, ownerOnly, addItem);
router.put('/:id',       protect, ownerOnly, updateItem);
router.delete('/:id',    protect, ownerOnly, deleteItem);

module.exports = router;