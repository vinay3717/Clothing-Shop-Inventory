const db = require('../config/db');

// GET /api/payments — get all payments
const getAllPayments = async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT p.*, 
        c.name as customer_name,
        c.mobile as customer_mobile
      FROM payments p
      JOIN customers c ON p.customer_id = c.customer_id
      ORDER BY p.payment_date DESC
    `);
    return res.json({ success: true, payments });
  } catch (err) {
    console.error('Get payments error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/payments/customer/:customerId — payments for a customer
const getCustomerPayments = async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT p.*, b.total_amount as bill_total
      FROM payments p
      LEFT JOIN bills b ON p.bill_id = b.bill_id
      WHERE p.customer_id = ?
      ORDER BY p.payment_date DESC
    `, [req.params.customerId]);

    return res.json({ success: true, payments });
  } catch (err) {
    console.error('Get customer payments error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/payments — record a new payment
const addPayment = async (req, res) => {
  const { customer_id, bill_id, amount, method, notes } = req.body;

  if (!customer_id || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Customer and amount are required'
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert payment record
    await conn.query(`
      INSERT INTO payments (customer_id, bill_id, amount, method, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [customer_id, bill_id || null, amount, method || 'cash', notes || null]);

    // Reduce customer total_due
    await conn.query(`
      UPDATE customers
      SET total_due = GREATEST(total_due - ?, 0)
      WHERE customer_id = ?
    `, [amount, customer_id]);

    // If bill_id provided, reduce pending_due on that bill
    if (bill_id) {
      await conn.query(`
        UPDATE bills
        SET 
          amount_paid = amount_paid + ?,
          pending_due = GREATEST(pending_due - ?, 0)
        WHERE bill_id = ?
      `, [amount, amount, bill_id]);
    }

    await conn.commit();

    // Get updated customer
    const [customer] = await conn.query(`
      SELECT customer_id, name, mobile, total_due 
      FROM customers WHERE customer_id = ?
    `, [customer_id]);

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      customer: customer[0]
    });

  } catch (err) {
    await conn.rollback();
    console.error('Add payment error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

module.exports = { getAllPayments, getCustomerPayments, addPayment };