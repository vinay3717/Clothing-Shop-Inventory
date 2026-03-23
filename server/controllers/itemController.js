const db = require('../config/db');

// GET /api/items — get all cloth items
const getAllItems = async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT 
        i.*,
        GROUP_CONCAT(
          JSON_OBJECT('image_id', img.image_id, 'url', img.image_url, 'is_primary', img.is_primary)
        ) as images
      FROM cloth_items i
      LEFT JOIN cloth_images img ON i.item_id = img.item_id
      WHERE i.is_active = TRUE
      GROUP BY i.item_id
      ORDER BY i.created_at DESC
    `);

    // Parse images string into array
    const parsed = items.map(item => ({
      ...item,
      images: item.images
        ? item.images.split('},{').map(s => {
            try { return JSON.parse(s.startsWith('{') ? s : '{' + s);
            } catch { return null; }
          }).filter(Boolean)
        : []
    }));

    return res.json({ success: true, items: parsed });
  } catch (err) {
    console.error('Get items error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/items/search?q=saree — search items
const searchItems = async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  let query = `
    SELECT i.*, GROUP_CONCAT(img.image_url) as image_urls
    FROM cloth_items i
    LEFT JOIN cloth_images img ON i.item_id = img.item_id
    WHERE i.is_active = TRUE
  `;
  const params = [];

  if (q) {
    query += ` AND (i.name LIKE ? OR i.color LIKE ? OR i.sku_code LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) {
    query += ` AND i.category = ?`;
    params.push(category);
  }
  if (minPrice) {
    query += ` AND i.price >= ?`;
    params.push(minPrice);
  }
  if (maxPrice) {
    query += ` AND i.price <= ?`;
    params.push(maxPrice);
  }

  query += ` GROUP BY i.item_id ORDER BY i.name ASC`;

  try {
    const [items] = await db.query(query, params);
    return res.json({ success: true, items });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/items/:id — get single item
const getItemById = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT * FROM cloth_items WHERE item_id = ? AND is_active = TRUE`,
      [req.params.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const [images] = await db.query(
      `SELECT * FROM cloth_images WHERE item_id = ?`,
      [req.params.id]
    );

    return res.json({ success: true, item: { ...items[0], images } });
  } catch (err) {
    console.error('Get item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/items — add new cloth item
const addItem = async (req, res) => {
  const { name, category, price, stock_qty, color, sku_code, description } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ success: false, message: 'Name, category and price are required' });
  }

  try {
    // Auto generate SKU if not provided
    const sku = sku_code || `SKU-${Date.now()}`;

    await db.query(
      `INSERT INTO cloth_items 
        (name, category, price, stock_qty, color, sku_code, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category, price, stock_qty || 0, color, sku, description]
    );

    const [newItem] = await db.query(
      `SELECT * FROM cloth_items WHERE sku_code = ?`, [sku]
    );

    return res.status(201).json({ success: true, item: newItem[0] });
  } catch (err) {
    console.error('Add item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/items/:id — update item
const updateItem = async (req, res) => {
  const { name, category, price, stock_qty, color, sku_code, description } = req.body;

  try {
    const [existing] = await db.query(
      `SELECT item_id FROM cloth_items WHERE item_id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await db.query(
      `UPDATE cloth_items SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        stock_qty = COALESCE(?, stock_qty),
        color = COALESCE(?, color),
        sku_code = COALESCE(?, sku_code),
        description = COALESCE(?, description)
       WHERE item_id = ?`,
      [name, category, price, stock_qty, color, sku_code, description, req.params.id]
    );

    const [updated] = await db.query(
      `SELECT * FROM cloth_items WHERE item_id = ?`, [req.params.id]
    );

    return res.json({ success: true, item: updated[0] });
  } catch (err) {
    console.error('Update item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/items/:id — soft delete
const deleteItem = async (req, res) => {
  try {
    const [existing] = await db.query(
      `SELECT item_id FROM cloth_items WHERE item_id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await db.query(
      `UPDATE cloth_items SET is_active = FALSE WHERE item_id = ?`,
      [req.params.id]
    );

    return res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete item error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllItems, searchItems, getItemById, addItem, updateItem, deleteItem };