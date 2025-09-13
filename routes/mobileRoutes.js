const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobileController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Mobile Auth
 *     description: Mobil ilovalar uchun autentifikatsiya
 *   - name: Mobile User
 *     description: Foydalanuvchi profili va ma'lumotlari
 *   - name: Mobile Content
 *     description: Mobil ilova kontenti
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Foydalanuvchi email manzili
 *         password:
 *           type: string
 *           description: Foydalanuvchi paroli
 *     UserRegister:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - full_name
 *       properties:
 *         username:
 *           type: string
 *           description: Foydalanuvchi nomi
 *         email:
 *           type: string
 *           format: email
 *           description: Email manzil
 *         password:
 *           type: string
 *           description: Parol
 *         full_name:
 *           type: string
 *           description: To'liq ism
 *         phone:
 *           type: string
 *           description: Telefon raqami
 *     ForgotPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email manzil
 *     ResetPassword:
 *       type: object
 *       required:
 *         - token
 *         - new_password
 *       properties:
 *         token:
 *           type: string
 *           description: Reset token
 *         new_password:
 *           type: string
 *           description: Yangi parol
 */

/**
 * @swagger
 * /api/mobile/auth/login:
 *   post:
 *     summary: Foydalanuvchi tizimga kirish
 *     tags: [Mobile Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
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
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
// Public routes
router.post('/auth/login', mobileController.login);
/**
 * @swagger
 * /api/mobile/auth/register:
 *   post:
 *     summary: Yangi foydalanuvchi ro'yxatdan o'tish
 *     tags: [Mobile Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi
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
 *                   example: Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Noto'g'ri ma'lumotlar yoki foydalanuvchi allaqachon mavjud
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
router.post('/auth/register', mobileController.register);
/**
 * @swagger
 * /api/mobile/auth/forgot-password:
 *   post:
 *     summary: Parolni unutgan holda tiklash so'rovi
 *     tags: [Mobile Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPassword'
 *     responses:
 *       200:
 *         description: Tiklash havolasi yuborildi
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
 *                   example: Parol tiklash havolasi emailga yuborildi
 *       400:
 *         description: Email topilmadi
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
router.post('/auth/forgot-password', mobileController.forgotPassword);
/**
 * @swagger
 * /api/mobile/auth/reset-password:
 *   post:
 *     summary: Parolni tiklash
 *     tags: [Mobile Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: Parol muvaffaqiyatli tiklandi
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
 *                   example: Parol muvaffaqiyatli tiklandi
 *       400:
 *         description: Noto'g'ri yoki muddati o'tgan token
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
router.post('/auth/reset-password', mobileController.resetPassword);

// Protected mobile routes
router.use(authMiddleware.verifyUser);

// User profile
/**
 * @swagger
 * /api/mobile/profile:
 *   get:
 *     summary: Foydalanuvchi profilini olish
 *     tags: [Mobile User]
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
 *                   $ref: '#/components/schemas/User'
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
router.get('/profile', mobileController.getProfile);
/**
 * @swagger
 * /api/mobile/profile:
 *   put:
 *     summary: Foydalanuvchi profilini yangilash
 *     tags: [Mobile User]
 *     security:
 *       - bearerAuth: []
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
 *               full_name:
 *                 type: string
 *                 description: To'liq ism
 *               phone:
 *                 type: string
 *                 description: Telefon raqami
 *     responses:
 *       200:
 *         description: Profil muvaffaqiyatli yangilandi
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
 *                   example: Profil muvaffaqiyatli yangilandi
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.put('/profile', mobileController.updateProfile);
router.post('/profile/avatar', mobileController.uploadAvatar);

// App content
router.get('/content', mobileController.getContent);
router.get('/content/:id', mobileController.getContentById);

// User interactions
router.post('/favorites/:id', mobileController.addToFavorites);
router.delete('/favorites/:id', mobileController.removeFromFavorites);
router.get('/favorites', mobileController.getFavorites);

// Notifications
router.get('/notifications', mobileController.getNotifications);
router.put('/notifications/:id/read', mobileController.markNotificationRead);

module.exports = router;