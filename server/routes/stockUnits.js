const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { protect } = require('../middleware/auth');

// GET /api/stock-units/:itemId — all units for an item
router.get('/:itemId', protect, async (req, res) => {
  try {
    const [units] = await db.query(`
      SELECT
        su.*,
        c.name  as customer_name,
        c.mobile as customer_mobile,
        b.bill_date
      FROM stock_units su
      LEFT JOIN customers c ON su.customer_id = c.customer_id
      LEFT JOIN bills     b ON su.bill_id     = b.bill_id
      WHERE su.item_id = ?
      ORDER BY su.created_at ASC
    `, [req.params.itemId]);

    const available = units.filter(u => u.status === 'available').length;
    const sold      = units.filter(u => u.status === 'sold').length;
    const returned  = units.filter(u => u.status === 'returned').length;

    res.json({ success: true, units, summary: { available, sold, returned } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/stock-units/serial/:serial — look up one serial number
router.get('/serial/:serial', protect, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        su.*,
        ci.name  as item_name,
        ci.category,
        ci.price as selling_price,
        c.name   as customer_name,
        c.mobile as customer_mobile,
        b.bill_date,
        b.total_amount as bill_total
      FROM stock_units su
      JOIN cloth_items ci ON su.item_id     = ci.item_id
      LEFT JOIN customers c  ON su.customer_id = c.customer_id
      LEFT JOIN bills     b  ON su.bill_id     = b.bill_id
      WHERE su.serial_number = ?
    `, [req.params.serial]);

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Serial number not found' });

    res.json({ success: true, unit: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/stock-units/:unitId/return — mark a piece as returned
router.patch('/:unitId/return', protect, async (req, res) => {
  try {
    await db.query(
      `UPDATE stock_units
       SET status = 'returned', bill_id = NULL, customer_id = NULL, sold_at = NULL
       WHERE unit_id = ?`,
      [req.params.unitId]
    );

    // Increment cloth_items stock back
    const [unit] = await db.query(
      `SELECT item_id FROM stock_units WHERE unit_id = ?`,
      [req.params.unitId]
    );
    await db.query(
      `UPDATE cloth_items SET stock_qty = stock_qty + 1 WHERE item_id = ?`,
      [unit[0].item_id]
    );

    res.json({ success: true, message: 'Item marked as returned and stock restored' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;