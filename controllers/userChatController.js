const { query } = require('../config/database');

/**
 * Foydalanuvchi tomonidan xabar yuborish
 */
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, receiver_type, message_text, message_type = 'text' } = req.body;
    const sender_id = req.user.id; // verifyUser middleware orqali olingan user ID
    const sender_type = 'user'; // Foydalanuvchi har doim 'user' turi

    // Majburiy maydonlarni tekshirish
    if (!receiver_id || !receiver_type || !message_text) {
      return res.status(400).json({ 
        success: false,
        message: 'Barcha majburiy maydonlarni to\'ldiring (receiver_id, receiver_type, message_text)' 
      });
    }

    // Receiver type ni tekshirish
    if (!['user', 'employee', 'admin'].includes(receiver_type)) {
      return res.status(400).json({ 
        success: false,
        message: 'receiver_type faqat user, employee yoki admin bo\'lishi mumkin' 
      });
    }

    // Message type ni tekshirish
    if (!['text', 'image', 'file'].includes(message_type)) {
      return res.status(400).json({ 
        success: false,
        message: 'message_type faqat text, image yoki file bo\'lishi mumkin' 
      });
    }

    const queryText = `
      INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, message_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await query(queryText, [
      sender_id, sender_type, receiver_id, receiver_type, message_text, message_type
    ]);

    res.status(201).json({
      success: true,
      message: 'Xabar muvaffaqiyatli yuborildi'
    });
  } catch (error) {
    console.error('Foydalanuvchi xabar yuborishda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi' 
    });
  }
};

/**
 * Foydalanuvchining barcha suhbatlarini olish
 */
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserType = 'user';

    const queryText = `
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
      ),
      unread_counts AS (
        SELECT 
          sender_id as other_user_id,
          sender_type as other_user_type,
          COUNT(*) as unread_count
        FROM messages
        WHERE receiver_id = $1 AND receiver_type = $2 AND is_read = false
        GROUP BY sender_id, sender_type
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
             END as other_user_avatar,
             COALESCE(uc.unread_count, 0) as unread_count
      FROM latest_messages lm
      LEFT JOIN users u ON lm.other_user_id = u.id AND lm.other_user_type = 'user'
      LEFT JOIN employees e ON lm.other_user_id = e.id AND lm.other_user_type = 'employee'
      LEFT JOIN admins a ON lm.other_user_id = a.id AND lm.other_user_type = 'admin'
      LEFT JOIN unread_counts uc ON lm.other_user_id = uc.other_user_id AND lm.other_user_type = uc.other_user_type
      ORDER BY lm.created_at DESC
    `;

    const result = await query(queryText, [currentUserId, currentUserType]);

    res.json({
      success: true,
      message: 'Suhbatlar ro\'yxati muvaffaqiyatli olindi',
      data: result.rows
    });
  } catch (error) {
    console.error('Foydalanuvchi suhbatlar ro\'yxatini olishda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi' 
    });
  }
};

/**
 * Muayyan employee bilan suhbatni olish
 */
const getConversationWithEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.id;
    const currentUserType = 'user';
    const offset = (page - 1) * limit;

    const queryText = `
      SELECT m.*, 
             CASE 
               WHEN m.sender_type = 'user' THEN u.full_name
               WHEN m.sender_type = 'employee' THEN CONCAT(e.name, ' ', e.surname)
               WHEN m.sender_type = 'admin' THEN a.full_name
             END as sender_name,
             CASE 
               WHEN m.sender_type = 'user' THEN NULL
               WHEN m.sender_type = 'employee' THEN NULL
               WHEN m.sender_type = 'admin' THEN NULL
             END as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'user'
      LEFT JOIN employees e ON m.sender_id = e.id AND m.sender_type = 'employee'
      LEFT JOIN admins a ON m.sender_id = a.id AND m.sender_type = 'admin'
      WHERE ((m.sender_id = $1 AND m.sender_type = $2 AND m.receiver_id = $3 AND m.receiver_type = 'employee')
             OR (m.sender_id = $4 AND m.sender_type = 'employee' AND m.receiver_id = $5 AND m.receiver_type = $6))
      ORDER BY m.created_at DESC
      LIMIT $7 OFFSET $8
    `;

    const result = await query(queryText, [currentUserId, currentUserType, employeeId, employeeId, currentUserId, currentUserType, limit, offset]);

    // Umumiy xabarlar sonini olish
    const countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      WHERE ((m.sender_id = $1 AND m.sender_type = $2 AND m.receiver_id = $3)
             OR (m.sender_id = $4 AND m.sender_type = 'employee' AND m.receiver_id = $5 AND m.receiver_type = $6))
    `;

    const countResult = await query(countQuery, [currentUserId, currentUserType, employeeId, employeeId, currentUserId, currentUserType]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message: 'Suhbat muvaffaqiyatli olindi',
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Foydalanuvchi suhbatni olishda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi' 
    });
  }
};

/**
 * Xabarni o'qilgan deb belgilash
 */
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;
    const currentUserType = 'user';

    const queryText = `
      UPDATE messages 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2 AND receiver_type = $3
    `;

    const result = await query(queryText, [messageId, currentUserId, currentUserType]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Xabar topilmadi yoki sizga tegishli emas' 
      });
    }

    res.json({
      success: true,
      message: 'Xabar o\'qilgan deb belgilandi',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Foydalanuvchi xabarni o\'qilgan deb belgilashda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi' 
    });
  }
};

/**
 * O'qilmagan xabarlar sonini olish
 */
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserType = 'user';

    const queryText = `
      SELECT COUNT(*) as unread_count
      FROM messages
      WHERE receiver_id = $1 AND receiver_type = $2 AND is_read = 0
    `;

    const result = await query(queryText, [currentUserId, currentUserType]);

    res.json({
      success: true,
      message: 'O\'qilmagan xabarlar soni',
      unread_count: parseInt(result.rows[0].unread_count)
    });
  } catch (error) {
    console.error('Foydalanuvchi o\'qilmagan xabarlar sonini olishda xatolik:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server xatoligi' 
    });
  }
};

module.exports = {
  sendMessage,
  getConversationWithEmployee,
  getConversations,
  markMessageAsRead,
  getUnreadCount
};