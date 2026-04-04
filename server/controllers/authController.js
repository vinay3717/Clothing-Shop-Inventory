const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      user_id:      user.user_id,
      role:         user.role,
      name:         user.name,
      shop_name:    user.shop_name,
      shop_address: user.shop_address
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// POST /api/auth/register
// POST /api/auth/register
const register = async (req, res) => {
  const { name, mobile, password, shop_name, shop_address } = req.body;

  if (!name || !mobile || !password || !shop_name) {
    return res.status(400).json({
      success: false,
      message: 'Name, mobile, password and shop name are required'
    });
  }

  try {
    // Check if any owner account already exists
    const [existingOwner] = await db.query(
      `SELECT user_id FROM users WHERE role = 'owner' LIMIT 1`
    );

    if (existingOwner.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A shop account already exists. Please login instead.'
      });
    }

    // Check if mobile already exists
    const [existingMobile] = await db.query(
      `SELECT user_id FROM users WHERE mobile = ?`, [mobile]
    );
    if (existingMobile.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

    const hash = await bcrypt.hash(password, 12);

    await db.query(
      `INSERT INTO users (name, mobile, password_hash, role, shop_name, shop_address)
       VALUES (?, ?, ?, 'owner', ?, ?)`,
      [name, mobile, hash, shop_name, shop_address || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Shop account created successfully! Please login.'
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: 'Mobile and password required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE mobile = ?', [mobile]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        name:    user.name,
        mobile:  user.mobile,
        role:    user.role,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, name, mobile, role, shop_name, shop_address, created_at 
       FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe };