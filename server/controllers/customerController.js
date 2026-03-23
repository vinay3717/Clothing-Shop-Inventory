const db = require('../config/db');

// GET /api/customers — get all customers
const getAllCustomers = async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT * FROM customers ORDER BY created_at DESC
    `);
    return res.json({ success: true, customers });
  } catch (err) {
    console.error('Get customers error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/customers/dues — customers with pending dues
const getCustomersWithDues = async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT * FROM customers 
      WHERE total_due > 0 
      ORDER BY total_due DESC
    `);
    return res.json({ success: true, customers });
  } catch (err) {
    console.error('Get dues error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/customers/search?q=vinay — search customers
const searchCustomers = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ success: false, message: 'Search query required' });
  }

  try {
    const [customers] = await db.query(`
      SELECT * FROM customers
      WHERE name LIKE ? OR mobile LIKE ?
      ORDER BY name ASC
    `, [`%${q}%`, `%${q}%`]);

    return res.json({ success: true, customers });
  } catch (err) {
    console.error('Search customers error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/customers/:id — get single customer with bill history
const getCustomerById = async (req, res) => {
  try {
    const [customers] = await db.query(
      `SELECT * FROM customers WHERE customer_id = ?`,
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get all bills for this customer
    const [bills] = await db.query(`
      SELECT b.*, u.name as created_by_name
      FROM bills b
      JOIN users u ON b.created_by = u.user_id
      WHERE b.customer_id = ?
      ORDER BY b.bill_date DESC
    `, [req.params.id]);

    // Get all payments for this customer
    const [payments] = await db.query(`
      SELECT * FROM payments
      WHERE customer_id = ?
      ORDER BY payment_date DESC
    `, [req.params.id]);

    return res.json({
      success: true,
      customer: customers[0],
      bills,
      payments
    });
  } catch (err) {
    console.error('Get customer error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/customers — add new customer
const addCustomer = async (req, res) => {
  const { name, mobile, address, birthday } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ success: false, message: 'Name and mobile are required' });
  }

  try {
    await db.query(`
      INSERT INTO customers (name, mobile, address, birthday)
      VALUES (?, ?, ?, ?)
    `, [name, mobile, address || null, birthday || null]);

    const [newCustomer] = await db.query(
      `SELECT * FROM customers WHERE mobile = ? ORDER BY created_at DESC LIMIT 1`,
      [mobile]
    );

    return res.status(201).json({ success: true, customer: newCustomer[0] });
  } catch (err) {
    console.error('Add customer error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/customers/:id — update customer
const updateCustomer = async (req, res) => {
  const { name, mobile, address, birthday } = req.body;

  try {
    const [existing] = await db.query(
      `SELECT customer_id FROM customers WHERE customer_id = ?`,
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await db.query(`
      UPDATE customers SET
        name     = COALESCE(?, name),
        mobile   = COALESCE(?, mobile),
        address  = COALESCE(?, address),
        birthday = COALESCE(?, birthday)
      WHERE customer_id = ?
    `, [name, mobile, address, birthday, req.params.id]);

    const [updated] = await db.query(
      `SELECT * FROM customers WHERE customer_id = ?`,
      [req.params.id]
    );

    return res.json({ success: true, customer: updated[0] });
  } catch (err) {
    console.error('Update customer error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const [existing] = await db.query(
      `SELECT customer_id FROM customers WHERE customer_id = ?`,
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await db.query(
      'DELETE FROM customers WHERE customer_id = ?',
      [req.params.id]
    );

    return res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Delete customer error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllCustomers, getCustomersWithDues, searchCustomers,
  getCustomerById, addCustomer, updateCustomer, deleteCustomer
};