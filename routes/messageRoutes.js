const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyAuth } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - content
 *         - receiver_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Xabar ID
 *         sender_id:
 *           type: string
 *           format: uuid
 *           description: Yuboruvchi ID
 *         receiver_id:
 *           type: string
 *           format: uuid
 *           description: Qabul qiluvchi ID
 *         content:
 *           type: string
 *           description: Xabar matni
 *         is_read:
 *           type: boolean
 *           description: O'qilgan holati
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Yaratilgan vaqt
 *     ChatRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Chat xona ID
 *         name:
 *           type: string
 *           description: Chat xona nomi
 *         type:
 *           type: string
 *           enum: [private, group]
 *           description: Chat turi
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Yaratilgan vaqt
 *     Conversation:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: Suhbatdosh ID
 *         username:
 *           type: string
 *           description: Suhbatdosh nomi
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
 *               - content
 *             properties:
 *               receiver_id:
 *                 type: string
 *                 format: uuid
 *                 description: Qabul qiluvchi ID
 *               content:
 *                 type: string
 *                 description: Xabar matni
 *     responses:
 *       201:
 *         description: Xabar muvaffaqiyatli yuborildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.post('/send', verifyAuth, messageController.sendMessage);

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
 *         description: Suhbatdosh ID
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
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.get('/conversation/:userId', verifyAuth, messageController.getConversation);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Barcha suhbatlar ro'yxati
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suhbatlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.get('/conversations', verifyAuth, messageController.getConversations);

/**
 * @swagger
 * /api/messages/mark-read/{messageId}:
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
 *         description: Avtorizatsiya talab qilinadi
 *       404:
 *         description: Xabar topilmadi
 *       500:
 *         description: Server xatosi
 */
router.put('/mark-read/:messageId', verifyAuth, messageController.markAsRead);

/**
 * @swagger
 * /api/messages/unread-count:
 *   get:
 *     summary: O'qilmagan xabarlar soni
 *     tags: [Messages]
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
 *                 unread_count:
 *                   type: integer
 *                   description: O'qilmagan xabarlar soni
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       500:
 *         description: Server xatosi
 */
router.get('/unread-count', verifyAuth, messageController.getUnreadCount);

module.exports = router;