const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const { name, mobile, password, role } = req.body;

  if (!name || !mobile || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  try {
    const [existing] = await db.query(
      'SELECT user_id FROM users WHERE mobile = ?', [mobile]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Mobile already registered' });
    }

    const hash = await bcrypt.hash(password, 12);

    await db.query(
      'INSERT INTO users (name, mobile, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, mobile, hash, role || 'staff']
    );

    return res.status(201).json({ success: true, message: 'Account created successfully' });
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
      'SELECT user_id, name, mobile, role, created_at FROM users WHERE user_id = ?',
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