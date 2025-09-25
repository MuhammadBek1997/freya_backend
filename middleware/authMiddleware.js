const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authMiddleware = {
  // Superadmin authentication middleware
  verifySuperAdmin: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token topilmadi, kirish rad etildi' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if admin exists and is active
      const result = await query(
        'SELECT id, username, email, password_hash, full_name, role, salon_id, is_active, created_at, updated_at FROM admins WHERE id = $1 AND is_active = true',
        [decoded.id]
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
      
      // Check if admin exists and is active
      const result = await query(
        'SELECT id, username, email, password_hash, full_name, role, salon_id, is_active, created_at, updated_at FROM admins WHERE id = $1 AND is_active = true',
        [decoded.id]
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
      const result = await query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.id || decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Foydalanuvchi topilmadi yoki faol emas' });
      }

      req.user = result.rows[0];
      req.user.userId = req.user.id; // Add userId field for compatibility
      next();
    } catch (error) {
      console.error('User auth error:', error.message);
      console.error('Error name:', error.name);
      console.error('Full error:', error);
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
      
      let user = null;
      
      // Check based on role in token
      if (decoded.role === 'employee') {
        const result = await query(
          'SELECT id, employee_name, employee_phone, employee_password, salon_id, position, name, is_active, created_at, updated_at FROM employees WHERE id = $1 AND is_active = true',
          [decoded.id]
        );
        if (result.rows.length > 0) {
          user = { ...result.rows[0], role: 'employee' };
        }
      } else if (decoded.role === 'admin' || decoded.role === 'superadmin') {
        const result = await query(
      'SELECT id, username, email, password, full_name, salon_id, phone, is_active, created_at, updated_at FROM admins WHERE id = $1 AND is_active = true',
      [decoded.id]
    );
        if (result.rows.length > 0) {
          user = { ...result.rows[0], role: decoded.role };
        }
      } else {
        // Default to user table
        const userId = decoded.userId || decoded.id;
        const result = await query(
      'SELECT id, phone, email, password_hash, first_name, last_name, full_name, username, registration_step, phone_verified, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
        if (result.rows.length > 0) {
          user = { ...result.rows[0], role: 'user' };
        }
      }

      if (!user) {
        return res.status(401).json({ message: 'Foydalanuvchi topilmadi yoki faol emas' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Token yaroqsiz' });
    }
  },

  // User token authentication middleware (for read-only access)
  verifyUserToken: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token topilmadi, kirish rad etildi' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if this is a user_readonly token
      if (decoded.type !== 'user_readonly') {
        return res.status(401).json({ message: 'Faqat user token bilan kirish mumkin' });
      }
      
      // Check if user exists and is active
      const result = await query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Foydalanuvchi topilmadi yoki faol emas' });
      }

      req.user = result.rows[0];
      req.userToken = decoded; // Store token info for additional checks
      next();
    } catch (error) {
      console.error('User token auth error:', error);
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
  verifyUserToken: authMiddleware.verifyUserToken,
  generateToken: authMiddleware.generateToken
};