const db = require('../config/db');

// GET /api/bills — get all bills
const getAllBills = async (req, res) => {
  try {
    const [bills] = await db.query(`
      SELECT b.*, 
        c.name as customer_name, 
        c.mobile as customer_mobile,
        u.name as created_by_name
      FROM bills b
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users u ON b.created_by = u.user_id
      ORDER BY b.bill_date DESC
    `);
    return res.json({ success: true, bills });
  } catch (err) {
    console.error('Get bills error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/bills/:id — get single bill with line items
const getBillById = async (req, res) => {
  try {
    const [bills] = await db.query(`
      SELECT b.*,
        c.name as customer_name,
        c.mobile as customer_mobile,
        u.name as created_by_name
      FROM bills b
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users u ON b.created_by = u.user_id
      WHERE b.bill_id = ?
    `, [req.params.id]);

    if (bills.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Get line items for this bill
    const [items] = await db.query(`
      SELECT * FROM bill_items WHERE bill_id = ?
    `, [req.params.id]);

    return res.json({
      success: true,
      bill: { ...bills[0], items }
    });
  } catch (err) {
    console.error('Get bill error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/bills — create new bill
const createBill = async (req, res) => {
  const {
    customer_id,
    items,
    discount,
    amount_paid,
    payment_method,
    notes
  } = req.body;

  if (!customer_id || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Customer and at least one item are required'
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }

    const discountAmount = discount || 0;
    const totalAmount    = subtotal - discountAmount;
    const paidAmount     = amount_paid || 0;
    const pendingDue     = totalAmount - paidAmount;

    // Insert bill
    const [billResult] = await conn.query(`
      INSERT INTO bills 
        (customer_id, created_by, subtotal, discount, total_amount, amount_paid, pending_due, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_id,
      req.user.user_id,
      subtotal,
      discountAmount,
      totalAmount,
      paidAmount,
      pendingDue,
      payment_method || 'cash',
      notes || null
    ]);

    // Get the inserted bill id
    const [newBillRows] = await conn.query(`
      SELECT bill_id FROM bills 
      WHERE customer_id = ? AND created_by = ?
      ORDER BY bill_date DESC LIMIT 1
    `, [customer_id, req.user.user_id]);

    const billId = newBillRows[0].bill_id;

    // Insert line items and update stock
    for (const item of items) {
      const lineTotal = item.quantity * item.unit_price;

      await conn.query(`
        INSERT INTO bill_items 
          (bill_id, item_id, item_name, quantity, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [billId, item.item_id || null, item.item_name, item.quantity, item.unit_price, lineTotal]);

      // Reduce stock if item_id provided
      if (item.item_id) {
        await conn.query(`
          UPDATE cloth_items 
          SET stock_qty = stock_qty - ?
          WHERE item_id = ?
        `, [item.quantity, item.item_id]);
      }
    }

    // Update customer total_due
    if (pendingDue > 0) {
      await conn.query(`
        UPDATE customers 
        SET total_due = total_due + ?
        WHERE customer_id = ?
      `, [pendingDue, customer_id]);
    }

    // If amount paid, record payment
    if (paidAmount > 0) {
      await conn.query(`
        INSERT INTO payments 
          (customer_id, bill_id, amount, method)
        VALUES (?, ?, ?, ?)
      `, [customer_id, billId, paidAmount, payment_method || 'cash']);
    }

    await conn.commit();

    // Return full bill
    const [finalBill] = await conn.query(`
      SELECT b.*,
        c.name as customer_name,
        c.mobile as customer_mobile
      FROM bills b
      JOIN customers c ON b.customer_id = c.customer_id
      WHERE b.bill_id = ?
    `, [billId]);

    const [finalItems] = await conn.query(
      `SELECT * FROM bill_items WHERE bill_id = ?`, [billId]
    );

    return res.status(201).json({
      success: true,
      bill: { ...finalBill[0], items: finalItems }
    });

  } catch (err) {
    await conn.rollback();
    console.error('Create bill error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/bills/customer/:customerId — all bills for a customer
const getCustomerBills = async (req, res) => {
  try {
    const [bills] = await db.query(`
      SELECT b.*, u.name as created_by_name
      FROM bills b
      JOIN users u ON b.created_by = u.user_id
      WHERE b.customer_id = ?
      ORDER BY b.bill_date DESC
    `, [req.params.customerId]);

    return res.json({ success: true, bills });
  } catch (err) {
    console.error('Get customer bills error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllBills, getBillById, createBill, getCustomerBills };