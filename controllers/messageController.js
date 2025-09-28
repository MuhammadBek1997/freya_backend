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
    const { receiver_id, receiver_type, content, message_type = 'text', file_url } = req.body;
    const sender_id = req.user.id;
    const sender_type = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';

    if (!receiver_id || !receiver_type || !content) {
      return res.status(400).json({ message: 'Barcha majburiy maydonlarni to\'ldiring' });
    }

    const query = `
      INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, message_type, file_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      sender_id, sender_type, receiver_id, receiver_type, content, message_type, file_url
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
               WHEN m.sender_type = 'user' THEN u.full_name
               WHEN m.sender_type = 'employee' THEN CONCAT(e.name, ' ', e.surname)
               WHEN m.sender_type = 'admin' THEN a.full_name
             END as sender_name,
             CASE 
               WHEN m.receiver_type = 'user' THEN u2.full_name
               WHEN m.receiver_type = 'employee' THEN CONCAT(e2.name, ' ', e2.surname)
               WHEN m.receiver_type = 'admin' THEN a2.full_name
             END as receiver_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'user'
      LEFT JOIN employees e ON m.sender_id = e.id AND m.sender_type = 'employee'
      LEFT JOIN admins a ON m.sender_id = a.id AND m.sender_type = 'admin'
      LEFT JOIN users u2 ON m.receiver_id = u2.id AND m.receiver_type = 'user'
      LEFT JOIN employees e2 ON m.receiver_id = e2.id AND m.receiver_type = 'employee'
      LEFT JOIN admins a2 ON m.receiver_id = a2.id AND m.receiver_type = 'admin'
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
    const currentUserId = req.user.id;
    const currentUserType = req.user.role === 'superadmin' || req.user.role === 'admin' ? 'admin' : 'employee';

    const query = `
      WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = $1 AND sender_type = $2 THEN CONCAT(receiver_id, '-', receiver_type)
            ELSE CONCAT(sender_id, '-', sender_type)
          END
        ) 
        m.*,
        CASE 
          WHEN sender_id = $1 AND sender_type = $2 THEN receiver_id
          ELSE sender_id
        END as other_user_id,
        CASE 
          WHEN sender_id = $1 AND sender_type = $2 THEN receiver_type
          ELSE sender_type
        END as other_user_type
        FROM messages m
        WHERE (sender_id = $1 AND sender_type = $2) OR (receiver_id = $1 AND receiver_type = $2)
        ORDER BY 
          CASE 
            WHEN sender_id = $1 AND sender_type = $2 THEN CONCAT(receiver_id, '-', receiver_type)
            ELSE CONCAT(sender_id, '-', sender_type)
          END,
          created_at DESC
      )
      SELECT lm.*,
             CASE 
               WHEN lm.other_user_type = 'user' THEN u.full_name
               WHEN lm.other_user_type = 'employee' THEN CONCAT(e.name, ' ', e.surname)
               WHEN lm.other_user_type = 'admin' THEN a.full_name
             END as other_user_name,
             CASE 
          WHEN lm.other_user_type = 'user' THEN NULL
          WHEN lm.other_user_type = 'employee' THEN NULL
               WHEN lm.other_user_type = 'admin' THEN NULL
             END as other_user_avatar
      FROM latest_messages lm
      LEFT JOIN users u ON lm.other_user_id = u.id AND lm.other_user_type = 'user'
      LEFT JOIN employees e ON lm.other_user_id = e.id AND lm.other_user_type = 'employee'
      LEFT JOIN admins a ON lm.other_user_id = a.id AND lm.other_user_type = 'admin'
      ORDER BY lm.created_at DESC
    `;

    const result = await pool.query(query, [currentUserId, currentUserType]);

    res.json({
      message: 'Suhbatlar ro\'yxati muvaffaqiyatli olindi',
      data: result.rows
    });
  } catch (error) {
    console.error('Suhbatlar ro\'yxatini olishda xatolik:', error);
    res.status(500).json({ message: 'Server xatoligi' });
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
      UPDATE messages 
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
      FROM messages
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
  getUnreadCount
};