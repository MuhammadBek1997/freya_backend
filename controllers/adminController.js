const bcrypt = require('bcryptjs');
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const adminController = {
  // Admin login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email va parol talab qilinadi' });
      }

      // Find admin by email
      const result = await db.query(
        'SELECT * FROM admins WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
      }

      const admin = result.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
      }

      // Generate token
      const token = authMiddleware.generateToken({ id: admin.id, role: 'admin' });

      // Remove password from response
      const { password_hash, ...adminData } = admin;

      res.json({
        message: 'Muvaffaqiyatli kirish',
        token,
        admin: adminData
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Admin registration
  register: async (req, res) => {
    try {
      const { username, email, password, full_name } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email va parol talab qilinadi' });
      }

      // Check if admin already exists
      const existingAdmin = await db.query(
        'SELECT id FROM admins WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingAdmin.rows.length > 0) {
        return res.status(400).json({ message: 'Admin allaqachon mavjud' });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create admin
      const result = await db.query(
        'INSERT INTO admins (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, role, created_at',
        [username, email, password_hash, full_name]
      );

      const newAdmin = result.rows[0];
      const token = authMiddleware.generateToken({ id: newAdmin.id, role: 'admin' });

      res.status(201).json({
        message: 'Admin muvaffaqiyatli yaratildi',
        token,
        admin: newAdmin
      });
    } catch (error) {
      console.error('Admin registration error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get dashboard data
  getDashboard: async (req, res) => {
    try {
      // Get statistics
      const userCount = await db.query('SELECT COUNT(*) FROM users WHERE is_active = true');
      const contentCount = await db.query('SELECT COUNT(*) FROM content');
      const publishedContentCount = await db.query('SELECT COUNT(*) FROM content WHERE status = \'published\'');
      
      // Get recent users
      const recentUsers = await db.query(
        'SELECT id, full_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
      );

      // Get recent content
      const recentContent = await db.query(
        'SELECT id, title, content_type, status, created_at FROM content ORDER BY created_at DESC LIMIT 5'
      );

      res.json({
        statistics: {
          totalUsers: parseInt(userCount.rows[0].count),
          totalContent: parseInt(contentCount.rows[0].count),
          publishedContent: parseInt(publishedContentCount.rows[0].count)
        },
        recentUsers: recentUsers.rows,
        recentContent: recentContent.rows
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get all users
  getUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await db.query(
        'SELECT id, username, email, full_name, phone, is_active, is_verified, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      const totalResult = await db.query('SELECT COUNT(*) FROM users');
      const total = parseInt(totalResult.rows[0].count);

      res.json({
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        'SELECT id, username, email, full_name, phone, avatar_url, date_of_birth, gender, is_active, is_verified, last_login, created_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, phone, is_active, is_verified } = req.body;

      const result = await db.query(
        'UPDATE users SET full_name = $1, phone = $2, is_active = $3, is_verified = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [full_name, phone, is_active, is_verified, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      const { password_hash, ...userData } = result.rows[0];
      res.json({ message: 'Foydalanuvchi yangilandi', user: userData });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      }

      res.json({ message: 'Foydalanuvchi o\'chirildi' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get content
  getContent: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      let query = 'SELECT * FROM content';
      let params = [];

      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await db.query(query, params);

      let countQuery = 'SELECT COUNT(*) FROM content';
      let countParams = [];
      if (status) {
        countQuery += ' WHERE status = $1';
        countParams.push(status);
      }

      const totalResult = await db.query(countQuery, countParams);
      const total = parseInt(totalResult.rows[0].count);

      res.json({
        content: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get content error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Create content
  createContent: async (req, res) => {
    try {
      const { title, description, content_type, content_data, image_url, video_url, status, tags } = req.body;
      const created_by = req.admin.id;

      if (!title || !content_type) {
        return res.status(400).json({ message: 'Sarlavha va kontent turi talab qilinadi' });
      }

      const result = await db.query(
        'INSERT INTO content (title, description, content_type, content_data, image_url, video_url, status, tags, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [title, description, content_type, JSON.stringify(content_data), image_url, video_url, status || 'draft', tags, created_by]
      );

      res.status(201).json({
        message: 'Kontent yaratildi',
        content: result.rows[0]
      });
    } catch (error) {
      console.error('Create content error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Update content
  updateContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, content_type, content_data, image_url, video_url, status, tags } = req.body;

      const result = await db.query(
        'UPDATE content SET title = $1, description = $2, content_type = $3, content_data = $4, image_url = $5, video_url = $6, status = $7, tags = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
        [title, description, content_type, JSON.stringify(content_data), image_url, video_url, status, tags, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Kontent topilmadi' });
      }

      res.json({
        message: 'Kontent yangilandi',
        content: result.rows[0]
      });
    } catch (error) {
      console.error('Update content error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Delete content
  deleteContent: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query('DELETE FROM content WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Kontent topilmadi' });
      }

      res.json({ message: 'Kontent o\'chirildi' });
    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  },

  // Get analytics
  getAnalytics: async (req, res) => {
    try {
      // Get daily user registrations for last 30 days
      const userRegistrations = await db.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' 
        GROUP BY DATE(created_at) 
        ORDER BY date
      `);

      // Get content views by type
      const contentViews = await db.query(`
        SELECT content_type, SUM(view_count) as total_views 
        FROM content 
        GROUP BY content_type
      `);

      // Get top content
      const topContent = await db.query(`
        SELECT title, view_count, like_count 
        FROM content 
        WHERE status = 'published' 
        ORDER BY view_count DESC 
        LIMIT 10
      `);

      res.json({
        userRegistrations: userRegistrations.rows,
        contentViews: contentViews.rows,
        topContent: topContent.rows
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  }
};

module.exports = adminController;