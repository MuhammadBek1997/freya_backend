const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authMiddleware = {
  // Superadmin authentication middleware
  verifySuperAdmin: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token topilmadi, kirish rad etildi' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if superadmin exists and is active
      const result = await pool.query(
        'SELECT * FROM admins WHERE id = $1 AND role = $2 AND is_active = true',
        [decoded.id, 'superadmin']
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Superadmin huquqi talab qilinadi' });
      }

      req.admin = result.rows[0];
      next();
    } catch (error) {
      console.error('Superadmin verification error:', error);
      res.status(401).json({ message: 'Token yaroqsiz' });
    }
  },

  // Admin authentication middleware (admin yoki superadmin)
  verifyAdmin: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token topilmadi, kirish rad etildi' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if admin or superadmin exists and is active
      const result = await pool.query(
        'SELECT * FROM admins WHERE id = $1 AND role IN ($2, $3) AND is_active = true',
        [decoded.id, 'admin', 'superadmin']
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Admin huquqi talab qilinadi' });
      }

      req.admin = result.rows[0];
      next();
    } catch (error) {
      console.error('Admin verification error:', error);
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
      const result = await pool.query(
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

  // Universal authentication middleware (user, employee, admin)
  verifyAuth: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token topilmadi, kirish rad etildi' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      let user = null;
      
      // Check based on role in token
      if (decoded.role === 'employee') {
        console.log('Checking employee with ID:', decoded.id);
        const result = await pool.query(
          'SELECT * FROM employees WHERE id = $1 AND is_active = true',
          [decoded.id]
        );
        console.log('Employee query result:', result.rows.length);
        if (result.rows.length > 0) {
          user = { ...result.rows[0], role: 'employee' };
          console.log('Employee found:', user.name);
        }
      } else if (decoded.role === 'admin' || decoded.role === 'superadmin') {
        const result = await pool.query(
          'SELECT * FROM admins WHERE id = $1 AND is_active = true',
          [decoded.id]
        );
        if (result.rows.length > 0) {
          user = { ...result.rows[0], role: decoded.role };
        }
      } else {
        // Default to user table
        const result = await pool.query(
          'SELECT * FROM users WHERE id = $1 AND is_active = true',
          [decoded.id]
        );
        if (result.rows.length > 0) {
          user = { ...result.rows[0], role: 'user' };
        }
      }

      if (!user) {
        console.log('User not found or inactive');
        return res.status(401).json({ message: 'Foydalanuvchi topilmadi yoki faol emas' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Token yaroqsiz' });
    }
  },

  // Generate JWT token with unique identifiers
  generateToken: (payload) => {
    // Create unique token payload with timestamp and user type prefix
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    
    // Add user type prefix to ensure uniqueness
    let userTypePrefix = '';
    switch (payload.role) {
      case 'superadmin':
        userTypePrefix = 'SA';
        break;
      case 'admin':
        userTypePrefix = 'AD';
        break;
      case 'employee':
        userTypePrefix = 'EM';
        break;
      case 'user':
        userTypePrefix = 'US';
        break;
      default:
        userTypePrefix = 'UN';
    }
    
    // Enhanced payload with unique identifiers
    const enhancedPayload = {
      ...payload,
      tokenId: `${userTypePrefix}_${payload.id}_${timestamp}_${randomSuffix}`,
      iat: Math.floor(timestamp / 1000),
      userType: payload.role,
      sessionId: `${userTypePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    };
    
    return jwt.sign(enhancedPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
  }
};

module.exports = {
  verifySuperAdmin: authMiddleware.verifySuperAdmin,
  verifyAdmin: authMiddleware.verifyAdmin,
  verifyUser: authMiddleware.verifyUser,
  verifyAuth: authMiddleware.verifyAuth,
  generateToken: authMiddleware.generateToken
};