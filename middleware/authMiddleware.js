const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = {
  // Admin authentication middleware
  verifyAdmin: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token topilmadi, kirish rad etildi' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user is admin
      const result = await db.query(
        'SELECT * FROM admins WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Admin topilmadi yoki faol emas' });
      }

      req.admin = result.rows[0];
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      res.status(401).json({ message: 'Token yaroqsiz' });
    }
  },

  // User authentication middleware
  verifyUser: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token topilmadi, kirish rad etildi' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user exists and is active
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Foydalanuvchi topilmadi yoki faol emas' });
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('User auth error:', error);
      res.status(401).json({ message: 'Token yaroqsiz' });
    }
  },

  // Generate JWT token
  generateToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  }
};

module.exports = authMiddleware;