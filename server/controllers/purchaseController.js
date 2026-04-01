const db = require('../config/db');

// GET /api/purchases
const getAllPurchases = async (req, res) => {
  try {
    const [purchases] = await db.query(`
      SELECT p.*, s.name as supplier_name, s.mobile as supplier_mobile
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      ORDER BY p.purchase_date DESC
    `);
    return res.json({ success: true, purchases });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/purchases/:id
const getPurchaseById = async (req, res) => {
  try {
    const [purchases] = await db.query(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.purchase_id = ?
    `, [req.params.id]);

    if (purchases.length === 0)
      return res.status(404).json({ success: false, message: 'Purchase not found' });

    const [items] = await db.query(
      `SELECT * FROM purchase_items WHERE purchase_id = ?`,
      [req.params.id]
    );

    return res.json({ success: true, purchase: { ...purchases[0], items } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/purchases
const createPurchase = async (req, res) => {
  const { supplier_id, items, amount_paid, notes } = req.body;

  if (!items || items.length === 0)
    return res.status(400).json({ success: false, message: 'At least one item required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.cost_price;
    }

    const paidAmount  = amount_paid || 0;
    const pendingDue  = totalAmount - paidAmount;

    // Insert purchase
    await conn.query(`
      INSERT INTO purchases (supplier_id, total_amount, amount_paid, pending_due, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [supplier_id || null, totalAmount, paidAmount, pendingDue, notes || null]);

    // Get inserted purchase id
    const [newPurchase] = await conn.query(`
      SELECT purchase_id FROM purchases ORDER BY purchase_date DESC LIMIT 1
    `);
    const purchaseId = newPurchase[0].purchase_id;

    // Insert line items + update stock & cost_price
    for (const item of items) {
      const lineTotal = item.quantity * item.cost_price;

      await conn.query(`
        INSERT INTO purchase_items (purchase_id, item_id, item_name, quantity, cost_price, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [purchaseId, item.item_id || null, item.item_name, item.quantity, item.cost_price, lineTotal]);

      // Increase stock
      if (item.item_id) {
        await conn.query(`
          UPDATE cloth_items
          SET stock_qty  = stock_qty + ?,
              cost_price = ?
          WHERE item_id = ?
        `, [item.quantity, item.cost_price, item.item_id]);
      }
    }

    await conn.commit();

    const [final] = await conn.query(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.purchase_id = ?
    `, [purchaseId]);

    const [finalItems] = await conn.query(
      `SELECT * FROM purchase_items WHERE purchase_id = ?`, [purchaseId]
    );

    return res.status(201).json({
      success: true,
      purchase: { ...final[0], items: finalItems }
    });

  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    conn.release();
  }
};

// GET /api/purchases/stats/summary — for dashboard
const getPurchaseSummary = async (req, res) => {
  try {
    // This month purchases
    const [monthPurchases] = await db.query(`
      SELECT
        COUNT(*)                          as total_purchases,
        COALESCE(SUM(total_amount), 0)    as total_spent,
        COALESCE(SUM(amount_paid), 0)     as total_paid,
        COALESCE(SUM(pending_due), 0)     as total_pending
      FROM purchases
      WHERE MONTH(purchase_date) = MONTH(CURDATE())
      AND   YEAR(purchase_date)  = YEAR(CURDATE())
    `);

    // Total profit this month
    // (sales revenue - purchase cost for items sold this month)
    const [profitData] = await db.query(`
      SELECT
        COALESCE(SUM(bi.line_total), 0) as total_revenue,
        COALESCE(SUM(bi.quantity * ci.cost_price), 0) as total_cost
      FROM bill_items bi
      JOIN bills b        ON bi.bill_id  = b.bill_id
      JOIN cloth_items ci ON bi.item_id  = ci.item_id
      WHERE MONTH(b.bill_date) = MONTH(CURDATE())
      AND   YEAR(b.bill_date)  = YEAR(CURDATE())
    `);

    const revenue = Number(profitData[0].total_revenue);
    const cost    = Number(profitData[0].total_cost);
    const profit  = revenue - cost;

    // Items with profit margin
    const [itemProfits] = await db.query(`
      SELECT
        item_id, name, category,
        price       as selling_price,
        cost_price,
        (price - cost_price)                              as profit_per_unit,
        CASE WHEN cost_price > 0
          THEN ROUND(((price - cost_price) / cost_price) * 100, 1)
          ELSE 0
        END                                               as profit_margin_pct
      FROM cloth_items
      WHERE is_active = TRUE AND cost_price > 0
      ORDER BY profit_margin_pct DESC
    `);

    // Recent purchases
    const [recentPurchases] = await db.query(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      ORDER BY p.purchase_date DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      summary: {
        this_month:       monthPurchases[0],
        profit:           { revenue, cost, net_profit: profit },
        item_profits:     itemProfits,
        recent_purchases: recentPurchases
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllPurchases, getPurchaseById, createPurchase, getPurchaseSummary };