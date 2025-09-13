const bcrypt = require('bcryptjs');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const mobileController = {
  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email va parol talab qilinadi' });
      }

      // Find user by email
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
      }

      const user = result.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate token
      const token = authMiddleware.generateToken({ id: user.id, role: 'user' });

      // Remove password from response
      const { password_hash, ...userData } = user;

      res.json({
        message: 'Muvaffaqiyatli kirish',
        token,
        user: userData
      });
    } catch (error) {
      console.error('User login error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // User registration
  register: async (req, res) => {
    try {
      const { username, email, password, full_name, phone } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email va parol talab qilinadi' });
      }

      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Foydalanuvchi allaqachon mavjud' });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await db.query(
        'INSERT INTO users (username, email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, phone, created_at',
        [username, email, password_hash, full_name, phone]
      );

      const newUser = result.rows[0];
      const token = authMiddleware.generateToken({ id: newUser.id, role: 'user' });

      res.status(201).json({
        message: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi',
        token,
        user: newUser
      });
    } catch (error) {
      console.error('User registration error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email talab qilinadi' });
      }

      // Check if user exists
      const result = await db.query(
        'SELECT id, email FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        // Don't reveal if email exists or not for security
        return res.json({ message: 'Agar email mavjud bo\'lsa, parolni tiklash havolasi yuboriladi' });
      }

      // In a real app, you would send an email with reset token
      // For now, we'll just return a success message
      res.json({ message: 'Parolni tiklash havolasi emailga yuborildi' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { email, newPassword, resetToken } = req.body;

      if (!email || !newPassword || !resetToken) {
        return res.status(400).json({ message: 'Barcha maydonlar talab qilinadi' });
      }

      // In a real app, you would verify the reset token
      // For now, we'll just update the password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      const result = await db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 AND is_active = true RETURNING id',
        [password_hash, email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await db.query(
        'SELECT id, username, email, full_name, phone, avatar_url, date_of_birth, gender, is_verified, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { full_name, phone, date_of_birth, gender } = req.body;

      const result = await db.query(
        'UPDATE users SET full_name = $1, phone = $2, date_of_birth = $3, gender = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, email, full_name, phone, avatar_url, date_of_birth, gender, is_verified, created_at',
        [full_name, phone, date_of_birth, gender, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      res.json({
        message: 'Profil yangilandi',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Upload avatar (placeholder)
  uploadAvatar: async (req, res) => {
    try {
      const userId = req.user.id;
      // In a real app, you would handle file upload here
      const avatar_url = req.body.avatar_url || 'https://via.placeholder.com/150';

      const result = await db.query(
        'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING avatar_url',
        [avatar_url, userId]
      );

      res.json({
        message: 'Avatar yangilandi',
        avatar_url: result.rows[0].avatar_url
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get content
  getContent: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const content_type = req.query.type;

      let query = 'SELECT * FROM content WHERE status = \'published\'';
      let params = [];

      if (content_type) {
        query += ' AND content_type = $1';
        params.push(content_type);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Update view count for each content
      if (result.rows.length > 0) {
        const contentIds = result.rows.map(content => content.id);
        await db.query(
          'UPDATE content SET view_count = view_count + 1 WHERE id = ANY($1)',
          [contentIds]
        );
      }

      res.json({ content: result.rows });
    } catch (error) {
      console.error('Get content error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get content by ID
  getContentById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'SELECT * FROM content WHERE id = $1 AND status = \'published\'',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Kontent topilmadi' });
      }

      // Update view count
      await db.query(
        'UPDATE content SET view_count = view_count + 1 WHERE id = $1',
        [id]
      );

      res.json({ content: result.rows[0] });
    } catch (error) {
      console.error('Get content by ID error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Add to favorites
  addToFavorites: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id: contentId } = req.params;

      // Check if content exists
      const contentResult = await db.query(
        'SELECT id FROM content WHERE id = $1 AND status = \'published\'',
        [contentId]
      );

      if (contentResult.rows.length === 0) {
        return res.status(404).json({ message: 'Kontent topilmadi' });
      }

      // Add to favorites (ignore if already exists)
      await db.query(
        'INSERT INTO user_favorites (user_id, content_id) VALUES ($1, $2) ON CONFLICT (user_id, content_id) DO NOTHING',
        [userId, contentId]
      );

      res.json({ message: 'Sevimlilar ro\'yxatiga qo\'shildi' });
    } catch (error) {
      console.error('Add to favorites error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Remove from favorites
  removeFromFavorites: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id: contentId } = req.params;

      const result = await db.query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND content_id = $2 RETURNING id',
        [userId, contentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Sevimlilar ro\'yxatida topilmadi' });
      }

      res.json({ message: 'Sevimlilar ro\'yxatidan o\'chirildi' });
    } catch (error) {
      console.error('Remove from favorites error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get favorites
  getFavorites: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await db.query(`
        SELECT c.*, uf.created_at as favorited_at 
        FROM content c 
        JOIN user_favorites uf ON c.id = uf.content_id 
        WHERE uf.user_id = $1 AND c.status = 'published'
        ORDER BY uf.created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      res.json({ favorites: result.rows });
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get notifications
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const result = await db.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      // Get unread count
      const unreadResult = await db.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      res.json({
        notifications: result.rows,
        unreadCount: parseInt(unreadResult.rows[0].count)
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Mark notification as read
  markNotificationRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await db.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Bildirishnoma topilmadi' });
      }

      res.json({ message: 'Bildirishnoma o\'qilgan deb belgilandi' });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  }
};

module.exports = mobileController;