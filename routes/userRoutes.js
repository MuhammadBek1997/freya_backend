const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Controllers
const {
    registerStep1,
    verifyPhone,
    registerStep2,
    loginUser,
    sendPasswordResetCode,
    sendPhoneChangeCode
} = require('../controllers/userController');

// Middleware
const {
    validatePhoneNumber,
    checkPhoneExists,
    checkPhoneExistsForLogin,
    validateEmailFormat,
    validatePasswordStrength,
    validateVerificationCode,
    validateNameFormat
} = require('../middleware/phoneValidationMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegistrationStep1:
 *       type: object
 *       required:
 *         - phone
 *         - password
 *       properties:
 *         phone:
 *           type: string
 *           description: Foydalanuvchi telefon raqami (+998XXXXXXXXX formatida)
 *           example: "+998901234567"
 *         email:
 *           type: string
 *           description: Foydalanuvchi email manzili (ixtiyoriy)
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           description: Foydalanuvchi paroli (kamida 6 ta belgi)
 *           example: "password123"
 *     
 *     PhoneVerification:
 *       type: object
 *       required:
 *         - phone
 *         - verificationCode
 *       properties:
 *         phone:
 *           type: string
 *           description: Foydalanuvchi telefon raqami
 *           example: "+998901234567"
 *         verificationCode:
 *           type: string
 *           description: 6 xonali tasdiqlash kodi
 *           example: "123456"
 *     
 *     UserRegistrationStep2:
 *       type: object
 *       required:
 *         - phone
 *         - firstName
 *         - lastName
 *       properties:
 *         phone:
 *           type: string
 *           description: Foydalanuvchi telefon raqami
 *           example: "+998901234567"
 *         firstName:
 *           type: string
 *           description: Foydalanuvchi ismi
 *           example: "Akmal"
 *         lastName:
 *           type: string
 *           description: Foydalanuvchi familiyasi
 *           example: "Karimov"
 *     
 *     UserLogin:
 *       type: object
 *       required:
 *         - phone
 *         - password
 *       properties:
 *         phone:
 *           type: string
 *           description: Foydalanuvchi telefon raqami
 *           example: "+998901234567"
 *         password:
 *           type: string
 *           description: Foydalanuvchi paroli
 *           example: "password123"
 */

/**
 * @swagger
 * /api/users/register/step1:
 *   post:
 *     summary: Foydalanuvchi ro'yxatdan o'tish - 1-bosqich
 *     description: Telefon raqam, email (ixtiyoriy) va parol bilan ro'yxatdan o'tish
 *     tags: [User Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationStep1'
 *     responses:
 *       201:
 *         description: 1-bosqich muvaffaqiyatli yakunlandi
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
 *                   example: "Ro'yxatdan o'tish 1-bosqichi muvaffaqiyatli"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     registrationStep:
 *                       type: integer
 *                     verificationCode:
 *                       type: string
 *                       description: Development uchun
 *       400:
 *         description: Validatsiya xatosi
 *       500:
 *         description: Server xatosi
 */
router.post('/register/step1', 
    validatePhoneNumber,
    validateEmailFormat,
    validatePasswordStrength,
    checkPhoneExists(pool),
    registerStep1
);

/**
 * @swagger
 * /api/users/verify-phone:
 *   post:
 *     summary: Telefon raqamni tasdiqlash
 *     description: SMS orqali yuborilgan kodni tasdiqlash
 *     tags: [User Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PhoneVerification'
 *     responses:
 *       200:
 *         description: Telefon raqam muvaffaqiyatli tasdiqlandi
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
 *                   example: "Telefon raqam muvaffaqiyatli tasdiqlandi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneVerified:
 *                       type: boolean
 *       400:
 *         description: Validatsiya xatosi yoki noto'g'ri kod
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post('/verify-phone',
    validatePhoneNumber,
    validateVerificationCode,
    verifyPhone
);

/**
 * @swagger
 * /api/users/register/step2:
 *   post:
 *     summary: Foydalanuvchi ro'yxatdan o'tish - 2-bosqich
 *     description: Ism va familiya qo'shib ro'yxatdan o'tishni yakunlash
 *     tags: [User Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationStep2'
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tish muvaffaqiyatli yakunlandi
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
 *                   example: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         username:
 *                           type: string
 *                         registrationStep:
 *                           type: integer
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *       400:
 *         description: Validatsiya xatosi
 *       404:
 *         description: Foydalanuvchi topilmadi yoki telefon tasdiqlanmagan
 *       500:
 *         description: Server xatosi
 */
router.post('/register/step2',
    validatePhoneNumber,
    validateNameFormat,
    registerStep2
);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Foydalanuvchi tizimga kirish
 *     description: Telefon raqam va parol bilan tizimga kirish
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli login qilindi
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
 *                   example: "Muvaffaqiyatli login qilindi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         username:
 *                           type: string
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *       400:
 *         description: Validatsiya xatosi
 *       401:
 *         description: Noto'g'ri telefon raqam yoki parol
 *       500:
 *         description: Server xatosi
 */
router.post('/login',
    validatePhoneNumber,
    validatePasswordStrength,
    loginUser
);

/**
 * @swagger
 * /api/users/password-reset/send-code:
 *   post:
 *     summary: Parolni tiklash uchun SMS kod yuborish
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Telefon raqam
 *                 example: "+998901234567"
 *     responses:
 *       200:
 *         description: SMS kod muvaffaqiyatli yuborildi
 *       400:
 *         description: Validatsiya xatosi
 *       404:
 *         description: Telefon raqam topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post('/password-reset/send-code',
    validatePhoneNumber,
    sendPasswordResetCode
);

// Parolni tiklash uchun yangi endpoint (frontend bilan mos kelishi uchun)
router.post('/reset-password',
    validatePhoneNumber,
    sendPasswordResetCode
);

/**
 * @swagger
 * /api/users/phone-change/send-code:
 *   post:
 *     summary: Telefon raqamni o'zgartirish uchun tasdiqlash kodi yuborish
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Yangi telefon raqami
 *                 example: "+998901234567"
 *     responses:
 *       200:
 *         description: Tasdiqlash kodi muvaffaqiyatli yuborildi
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
 *                   example: "Telefon raqamni o'zgartirish kodi yuborildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     phone:
 *                       type: string
 *                       example: "+998901234567"
 *                     smsStatus:
 *                       type: string
 *                       example: "yuborildi"
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       500:
 *         description: Server xatosi
 */
router.post('/phone-change/send-code',
    validatePhoneNumber,
    sendPhoneChangeCode
);

module.exports = router;