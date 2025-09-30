const express = require('express');
const router = express.Router();
const userChatController = require('../controllers/userChatController');
const { verifyAuth } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Xabar ID
 *         sender_id:
 *           type: string
 *           format: uuid
 *           description: Yuboruvchi foydalanuvchi ID
 *         receiver_id:
 *           type: string
 *           format: uuid
 *           description: Qabul qiluvchi ID
 *         receiver_type:
 *           type: string
 *           enum: [user, employee, admin]
 *           description: Qabul qiluvchi turi
 *         message_text:
 *           type: string
 *           description: Xabar matni
 *         message_type:
 *           type: string
 *           enum: [text, image, file]
 *           description: Xabar turi
 *         file_url:
 *           type: string
 *           description: Fayl URL (agar mavjud bo'lsa)
 *         is_read:
 *           type: boolean
 *           description: O'qilgan holati
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Yaratilgan vaqt
 *     UserConversation:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: Suhbatdosh ID
 *         user_name:
 *           type: string
 *           description: Suhbatdosh nomi
 *         user_type:
 *           type: string
 *           enum: [user, employee, admin]
 *           description: Suhbatdosh turi
 *         last_message:
 *           type: string
 *           description: Oxirgi xabar
 *         last_message_time:
 *           type: string
 *           format: date-time
 *           description: Oxirgi xabar vaqti
 *         unread_count:
 *           type: integer
 *           description: O'qilmagan xabarlar soni
 */

/**
 * @swagger
 * /api/user-chat/send:
 *   post:
 *     summary: Foydalanuvchi tomonidan xabar yuborish
 *     tags: [User Chat]
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
 *                 description: Qabul qiluvchi ID
 *               receiver_type:
 *                 type: string
 *                 enum: [user, employee, admin]
 *                 description: Qabul qiluvchi turi
 *               message_text:
 *                 type: string
 *                 description: Xabar matni
 *               message_type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *                 description: Xabar turi
 *               file_url:
 *                 type: string
 *                 description: Fayl URL (ixtiyoriy)
 *     responses:
 *       201:
 *         description: Xabar muvaffaqiyatli yuborildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserMessage'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Foydalanuvchi avtorizatsiyasi talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.post('/send', verifyAuth, userChatController.sendMessage);

/**
 * @swagger
 * /api/user-chat/conversations:
 *   get:
 *     summary: Foydalanuvchi suhbatlarini olish
 *     tags: [User Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suhbatlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserConversation'
 *       401:
 *         description: Foydalanuvchi avtorizatsiyasi talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.get('/conversations', verifyAuth, userChatController.getConversations);

/**
 * @swagger
 * /api/user-chat/conversation/{employeeId}:
 *   get:
 *     summary: Muayyan employee bilan suhbat
 *     tags: [User Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Sahifadagi xabarlar soni
 *     responses:
 *       200:
 *         description: Suhbat xabarlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserMessage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Foydalanuvchi avtorizatsiyasi talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.get('/conversation/:employeeId', verifyAuth, userChatController.getConversationWithEmployee);

/**
 * @swagger
 * /api/user-chat/mark-read/{messageId}:
 *   put:
 *     summary: Xabarni o'qilgan deb belgilash
 *     tags: [User Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Xabar ID
 *     responses:
 *       200:
 *         description: Xabar o'qilgan deb belgilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Foydalanuvchi avtorizatsiyasi talab qilinadi
 *       404:
 *         description: Xabar topilmadi
 *       500:
 *         description: Server xatosi
 */
router.put('/mark-read/:messageId', verifyAuth, userChatController.markMessageAsRead);

/**
 * @swagger
 * /api/user-chat/unread-count:
 *   get:
 *     summary: O'qilmagan xabarlar sonini olish
 *     tags: [User Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: O'qilmagan xabarlar soni
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       401:
 *         description: Foydalanuvchi avtorizatsiyasi talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.get('/unread-count', verifyAuth, userChatController.getUnreadCount);

module.exports = router;
