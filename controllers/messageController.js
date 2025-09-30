const { pool } = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sender_id:
 *           type: string
 *           format: uuid
 *         sender_type:
 *           type: string
 *           enum: [user, employee, admin]
 *         receiver_id:
 *           type: string
 *           format: uuid
 *         receiver_type:
 *           type: string
 *           enum: [user, employee, admin]
 *         message_text:
 *           type: string
 *         message_type:
 *           type: string
 *           enum: [text, image, file]
 *         file_url:
 *           type: string
 *         is_read:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Xabar yuborish
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiver_id
 *               - receiver_type
 *               - message_text
 *             properties:
 *               receiver_id:
 *                 type: string
 *                 format: uuid
 *               receiver_type:
 *                 type: string
 *                 enum: [user, employee, admin]
 *               message_text:
 *                 type: string
 *               message_type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *               file_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Xabar muvaffaqiyatli yuborildi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, receiver_type, message_text, message_type = 'text', file_url } = req.body;
    const sender_id = req.user.id;
    const sender_type = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';

    if (!receiver_id || !receiver_type || !message_text) {
      return res.status(400).json({ message: 'Barcha majburiy maydonlarni to\'ldiring' });
    }

    const query = `
      INSERT INTO user_chats (sender_id, sender_type, receiver_id, receiver_type, message_text, message_type, file_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      sender_id, sender_type, receiver_id, receiver_type, message_text, message_type, file_url
    ]);

    res.status(201).json({
      message: 'Xabar muvaffaqiyatli yuborildi',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Xabar yuborishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

/**
 * @swagger
 * /api/messages/conversation/{userId}:
 *   get:
 *     summary: Foydalanuvchi bilan suhbatni olish
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Suhbat xabarlari
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const currentUserId = req.user.id;
    const currentUserType = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';

    const query = `
      SELECT m.*, 
             CASE 
               WHEN m.sender_type = 'user' THEN u.username
               WHEN m.sender_type = 'employee' THEN e.name
               WHEN m.sender_type = 'admin' THEN a.full_name
             END as sender_name,
             CASE 
               WHEN m.receiver_type = 'user' THEN u2.username
               WHEN m.receiver_type = 'employee' THEN e2.name
               WHEN m.receiver_type = 'admin' THEN a2.full_name
             END as receiver_name
      FROM user_chats m
      LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'user'
      LEFT JOIN employees e ON m.sender_id = e.id AND m.sender_type = 'employee'
      LEFT JOIN admins a ON m.sender_id::text = a.id::text AND m.sender_type = 'admin'
      LEFT JOIN users u2 ON m.receiver_id = u2.id AND m.receiver_type = 'user'
      LEFT JOIN employees e2 ON m.receiver_id = e2.id AND m.receiver_type = 'employee'
      LEFT JOIN admins a2 ON m.receiver_id::text = a2.id::text AND m.receiver_type = 'admin'
      WHERE (
        (m.sender_id = $1 AND m.sender_type = $2 AND m.receiver_id = $3) OR
        (m.sender_id = $3 AND m.receiver_id = $1 AND m.receiver_type = $2)
      )
      ORDER BY m.created_at DESC
      LIMIT $4 OFFSET $5
    `;

    const result = await pool.query(query, [currentUserId, currentUserType, userId, limit, offset]);

    res.json({
      message: 'Suhbat muvaffaqiyatli olindi',
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Suhbatni olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Barcha suhbatlar ro'yxatini olish
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suhbatlar ro'yxati
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
const getConversations = async (req, res) => {
  try {
    console.log('🔍 getConversations: req.user =', req.user);
    const userId = req.user.id;
    const userType = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';
    console.log('🔍 getConversations: userId =', userId, 'userType =', userType);
    
    // Simple approach: get all conversations and process them
    const query = `
      SELECT DISTINCT
        CASE 
          WHEN sender_id = $1 AND sender_type = $2 THEN receiver_id
          ELSE sender_id
        END as other_user_id,
        CASE 
          WHEN sender_id = $1 AND sender_type = $2 THEN receiver_type
          ELSE sender_type
        END as other_user_type,
        MAX(created_at) as last_message_time
      FROM user_chats
      WHERE (sender_id = $1 AND sender_type = $2) OR (receiver_id = $1 AND receiver_type = $2)
      GROUP BY other_user_id, other_user_type
      ORDER BY last_message_time DESC
    `;

    const conversations = await pool.query(query, [userId, userType]);
    
    // Get additional details for each conversation
    const enrichedConversations = [];
    
    for (const conv of conversations.rows) {
      // Get last message
      const lastMessageQuery = `
        SELECT message_text, created_at, is_read
        FROM user_chats
        WHERE ((sender_id = $1 AND sender_type = $2 AND receiver_id = $3 AND receiver_type = $4) OR
               (sender_id = $3 AND sender_type = $4 AND receiver_id = $1 AND receiver_type = $2))
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const lastMessage = await pool.query(lastMessageQuery, [
        userId, userType, conv.other_user_id, conv.other_user_type
      ]);
      
      // Get unread count
      const unreadQuery = `
        SELECT COUNT(*) as unread_count
        FROM user_chats
        WHERE sender_id = $1 AND sender_type = $2 AND receiver_id = $3 AND receiver_type = $4 AND is_read = false
      `;
      
      const unreadResult = await pool.query(unreadQuery, [
        conv.other_user_id, conv.other_user_type, userId, userType
      ]);
      
      // Get user details based on type - only handle user and employee types
      let userDetails = { name: 'Unknown', avatar: null };
      
      try {
        if (conv.other_user_type === 'user') {
          const userQuery = `SELECT username as name, avatar FROM users WHERE id = $1`;
          const userResult = await pool.query(userQuery, [conv.other_user_id]);
          userDetails = userResult.rows[0] || userDetails;
        } else if (conv.other_user_type === 'employee') {
          const empQuery = `SELECT name, avatar FROM employees WHERE id = $1`;
          const empResult = await pool.query(empQuery, [conv.other_user_id]);
          userDetails = empResult.rows[0] || userDetails;
        }
        // Skip admin type for now to avoid type casting issues
      } catch (detailError) {
        console.log('Error getting user details:', detailError.message);
        // Use default values
      }
      
      enrichedConversations.push({
        other_user_id: conv.other_user_id,
        other_user_type: conv.other_user_type,
        other_user_name: userDetails.name || 'Unknown',
        other_user_avatar: userDetails.avatar || null,
        last_message: lastMessage.rows[0]?.message_text || '',
        last_message_time: lastMessage.rows[0]?.created_at || conv.last_message_time,
        unread_count: parseInt(unreadResult.rows[0]?.unread_count || 0)
      });
    }

    res.json(enrichedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
};

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   put:
 *     summary: Xabarni o'qilgan deb belgilash
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Xabar o'qilgan deb belgilandi
 *       404:
 *         description: Xabar topilmadi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;
    const currentUserType = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';

    const query = `
      UPDATE user_chats 
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2 AND receiver_type = $3
      RETURNING *
    `;

    const result = await pool.query(query, [messageId, currentUserId, currentUserType]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Xabar topilmadi yoki sizga tegishli emas' });
    }

    res.json({
      message: 'Xabar o\'qilgan deb belgilandi',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Xabarni o\'qilgan deb belgilashda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

/**
 * @swagger
 * /api/messages/conversation/{userId}/mark-read:
 *   put:
 *     summary: Suhbatdagi barcha xabarlarni o'qilgan deb belgilash
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Barcha xabarlar o'qilgan deb belgilandi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
const markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const currentUserType = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';

    const query = `
      UPDATE user_chats 
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE sender_id = $1 AND receiver_id = $2 AND receiver_type = $3 AND is_read = false
      RETURNING id
    `;

    const result = await pool.query(query, [userId, currentUserId, currentUserType]);

    res.json({
      message: 'Suhbatdagi barcha xabarlar o\'qilgan deb belgilandi',
      updated_count: result.rows.length
    });
  } catch (error) {
    console.error('Suhbatni o\'qilgan deb belgilashda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

/**
 * @swagger
 * /api/messages/unread-count:
 *   get:
 *     summary: O'qilmagan xabarlar sonini olish
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: O'qilmagan xabarlar soni
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserType = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';

    const query = `
      SELECT COUNT(*) as unread_count
      FROM user_chats
      WHERE receiver_id = $1 AND receiver_type = $2 AND is_read = false
    `;

    const result = await pool.query(query, [currentUserId, currentUserType]);

    res.json({
      message: 'O\'qilmagan xabarlar soni',
      unread_count: parseInt(result.rows[0].unread_count)
    });
  } catch (error) {
    console.error('O\'qilmagan xabarlar sonini olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi' });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  markConversationAsRead,
  getUnreadCount
};