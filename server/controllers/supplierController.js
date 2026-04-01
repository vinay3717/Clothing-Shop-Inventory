const db = require('../config/db');

// GET /api/suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.query(
      `SELECT * FROM suppliers ORDER BY created_at DESC`
    );
    return res.json({ success: true, suppliers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/suppliers
const addSupplier = async (req, res) => {
  const { name, mobile, address } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  try {
    await db.query(
      `INSERT INTO suppliers (name, mobile, address) VALUES (?, ?, ?)`,
      [name, mobile || null, address || null]
    );
    const [rows] = await db.query(
      `SELECT * FROM suppliers ORDER BY created_at DESC LIMIT 1`
    );
    return res.status(201).json({ success: true, supplier: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllSuppliers, addSupplier };