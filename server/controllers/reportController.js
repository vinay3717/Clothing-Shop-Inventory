const db = require('../config/db');

// GET /api/reports/dashboard — main dashboard stats
const getDashboard = async (req, res) => {
  try {
    // Today's sales
    const [todaySales] = await db.query(`
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(amount_paid), 0) as total_collected
      FROM bills
      WHERE DATE(bill_date) = CURDATE()
    `);

    // This month's sales
    const [monthSales] = await db.query(`
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(amount_paid), 0) as total_collected
      FROM bills
      WHERE MONTH(bill_date) = MONTH(CURDATE())
      AND YEAR(bill_date) = YEAR(CURDATE())
    `);

    // Total pending dues across all customers
    const [totalDues] = await db.query(`
      SELECT COALESCE(SUM(total_due), 0) as total_pending
      FROM customers
    `);

    // Total customers
    const [totalCustomers] = await db.query(`
      SELECT COUNT(*) as total FROM customers
    `);

    // Total cloth items
    const [totalItems] = await db.query(`
      SELECT COUNT(*) as total FROM cloth_items WHERE is_active = TRUE
    `);

    // Low stock items (less than 3)
    const [lowStock] = await db.query(`
      SELECT item_id, name, category, stock_qty
      FROM cloth_items
      WHERE stock_qty < 3 AND is_active = TRUE
      ORDER BY stock_qty ASC
    `);

    // Recent 5 bills
    const [recentBills] = await db.query(`
      SELECT b.bill_id, b.bill_date, b.total_amount, 
        b.amount_paid, b.pending_due, b.payment_method,
        c.name as customer_name
      FROM bills b
      JOIN customers c ON b.customer_id = c.customer_id
      ORDER BY b.bill_date DESC
      LIMIT 5
    `);

    // Top 5 customers with highest dues
    const [topDues] = await db.query(`
      SELECT customer_id, name, mobile, total_due
      FROM customers
      WHERE total_due > 0
      ORDER BY total_due DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      dashboard: {
        today:          todaySales[0],
        this_month:     monthSales[0],
        total_pending:  totalDues[0].total_pending,
        total_customers: totalCustomers[0].total,
        total_items:    totalItems[0].total,
        low_stock:      lowStock,
        recent_bills:   recentBills,
        top_dues:       topDues
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/reports/monthly?year=2026&month=3
const getMonthlyReport = async (req, res) => {
  const year  = req.query.year  || new Date().getFullYear();
  const month = req.query.month || new Date().getMonth() + 1;

  try {
    // Daily sales breakdown
    const [dailySales] = await db.query(`
      SELECT 
        DATE(bill_date) as date,
        COUNT(*) as total_bills,
        SUM(total_amount) as total_sales,
        SUM(amount_paid) as total_collected,
        SUM(pending_due) as total_pending
      FROM bills
      WHERE YEAR(bill_date) = ? AND MONTH(bill_date) = ?
      GROUP BY DATE(bill_date)
      ORDER BY date ASC
    `, [year, month]);

    // Top selling items this month
    const [topItems] = await db.query(`
      SELECT 
        bi.item_name,
        SUM(bi.quantity) as total_qty,
        SUM(bi.line_total) as total_revenue
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.bill_id
      WHERE YEAR(b.bill_date) = ? AND MONTH(b.bill_date) = ?
      GROUP BY bi.item_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [year, month]);

    // Category wise sales
    const [categorySales] = await db.query(`
      SELECT 
        ci.category,
        SUM(bi.quantity) as total_qty,
        SUM(bi.line_total) as total_revenue
      FROM bill_items bi
      JOIN cloth_items ci ON bi.item_id = ci.item_id
      JOIN bills b ON bi.bill_id = b.bill_id
      WHERE YEAR(b.bill_date) = ? AND MONTH(b.bill_date) = ?
      GROUP BY ci.category
      ORDER BY total_revenue DESC
    `, [year, month]);

    // Monthly totals
    const [totals] = await db.query(`
      SELECT
        COUNT(*) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(amount_paid), 0) as total_collected,
        COALESCE(SUM(pending_due), 0) as total_pending,
        COALESCE(SUM(discount), 0) as total_discount
      FROM bills
      WHERE YEAR(bill_date) = ? AND MONTH(bill_date) = ?
    `, [year, month]);

    return res.json({
      success: true,
      report: {
        year, month,
        totals:         totals[0],
        daily_sales:    dailySales,
        top_items:      topItems,
        category_sales: categorySales
      }
    });
  } catch (err) {
    console.error('Monthly report error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/reports/stock — full stock report
const getStockReport = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT 
        item_id, name, category, 
        price, stock_qty, color, sku_code,
        CASE 
          WHEN stock_qty = 0 THEN 'Out of Stock'
          WHEN stock_qty < 3 THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM cloth_items
      WHERE is_active = TRUE
      ORDER BY stock_qty ASC
    `);

    return res.json({ success: true, items });
  } catch (err) {
    console.error('Stock report error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDashboard, getMonthlyReport, getStockReport };