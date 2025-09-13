const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Admin Auth
 *     description: Admin autentifikatsiya endpointlari
 *   - name: Admin Users
 *     description: Foydalanuvchilarni boshqarish
 *   - name: Admin Content
 *     description: Kontent boshqaruvi
 *   - name: Admin Analytics
 *     description: Analitika va hisobotlar
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Admin email manzili
 *         password:
 *           type: string
 *           description: Admin paroli
 *     AdminRegister:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - full_name
 *       properties:
 *         username:
 *           type: string
 *           description: Admin foydalanuvchi nomi
 *         email:
 *           type: string
 *           format: email
 *           description: Admin email manzili
 *         password:
 *           type: string
 *           description: Admin paroli
 *         full_name:
 *           type: string
 *           description: Admin to'liq ismi
 *         role:
 *           type: string
 *           description: Admin roli
 *           default: admin
 */

// Admin authentication
/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin tizimga kirish
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli kirish
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Muvaffaqiyatli kirish
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Email yoki parol noto'g'ri
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', adminController.login);
/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Yangi admin ro'yxatdan o'tkazish
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRegister'
 *     responses:
 *       201:
 *         description: Admin muvaffaqiyatli ro'yxatdan o'tdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin muvaffaqiyatli ro'yxatdan o'tdi
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Noto'g'ri ma'lumotlar yoki admin allaqachon mavjud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', adminController.register);

// Protected admin routes
router.use(authMiddleware.verifyAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Barcha foydalanuvchilarni olish
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli javob
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', adminController.getUsers);
/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: ID bo'yicha foydalanuvchini olish
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Foydalanuvchi ID
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli javob
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Foydalanuvchi topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/:id', adminController.getUserById);
/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Foydalanuvchi ma'lumotlarini yangilash
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Foydalanuvchi ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Foydalanuvchi nomi
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email manzil
 *               full_name:
 *                 type: string
 *                 description: To'liq ism
 *               is_active:
 *                 type: boolean
 *                 description: Faol holat
 *     responses:
 *       200:
 *         description: Ma'lumotlar muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Foydalanuvchi ma'lumotlari yangilandi
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Foydalanuvchi topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Content management
router.get('/content', adminController.getContent);
router.post('/content', adminController.createContent);
router.put('/content/:id', adminController.updateContent);
router.delete('/content/:id', adminController.deleteContent);

// Analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;