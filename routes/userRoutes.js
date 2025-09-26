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
    sendPhoneChangeCode,
    resetPassword,
    deleteUser,
    updateUser,
    generateUserToken,
    updateUserLocation,
    getUserLocation,
    getUserProfile,
    uploadProfileImage,
    getProfileImage,
    deleteProfileImage
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

const { verifyUser } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/imageUpload');

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
 *         - username
 *       properties:
 *         phone:
 *           type: string
 *           description: Foydalanuvchi telefon raqami
 *           example: "+998901234567"
 *         username:
 *           type: string
 *           description: Foydalanuvchi username (majburiy)
 *           example: "akmal_user"
 *         email:
 *           type: string
 *           description: Foydalanuvchi email manzili (ixtiyoriy)
 *           example: "user@example.com"
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
 *     
 *     UserDelete:
 *       type: object
 *       required:
 *         - phone
 *         - password
 *       properties:
 *         phone:
 *           type: string
 *           description: Foydalanuvchi telefon raqami (+998XXXXXXXXX formatida)
 *           example: "+998901234567"
 *         password:
 *           type: string
 *           description: Foydalanuvchi paroli (tasdiqlash uchun)
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
    validatePasswordStrength,
    checkPhoneExists(),
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
 *                           nullable: true
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
 *                           nullable: true
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

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Parolni tiklash (tasdiqlash kodi bilan)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - verificationCode
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Telefon raqam
 *                 example: "+998901234567"
 *               verificationCode:
 *                 type: string
 *                 description: SMS orqali kelgan tasdiqlash kodi
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 description: Yangi parol (kamida 6 ta belgi)
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Parol muvaffaqiyatli yangilandi
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
 *                   example: "Parol muvaffaqiyatli yangilandi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 123
 *                     phone:
 *                       type: string
 *                       example: "+998901234567"
 *       400:
 *         description: Validatsiya xatosi yoki noto'g'ri tasdiqlash kodi
 *       404:
 *         description: Telefon raqam topilmadi
 *       500:
 *         description: Server xatosi
 */
// Parolni tiklash (tasdiqlash kodi bilan)
router.post('/reset-password',
    validatePhoneNumber,
    resetPassword
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

/**
 * @swagger
 * /api/users/delete:
 *   delete:
 *     summary: Foydalanuvchini o'chirish
 *     description: Foydalanuvchi hisobini va unga bog'liq barcha ma'lumotlarni o'chirish (xabarlar, chat ishtirokchilari, sevimlilar va boshqalar)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserDelete'
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli o'chirildi
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
 *                   example: "Foydalanuvchi muvaffaqiyatli o'chirildi"
 *       400:
 *         description: Noto'g'ri ma'lumotlar (telefon raqam yoki parol noto'g'ri formatda)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Telefon raqam va parol talab qilinadi"
 *       401:
 *         description: Noto'g'ri parol
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Noto'g'ri parol"
 *       404:
 *         description: Foydalanuvchi topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Foydalanuvchi topilmadi"
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server xatosi"
 */
router.delete('/delete', deleteUser);

/**
 * @swagger
 * /api/users/update/{id}:
 *   put:
 *     summary: Foydalanuvchi ma'lumotlarini yangilash
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID raqami
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Yangi ism (ixtiyoriy)
 *                 example: "Yangi Ism"
 *               email:
 *                 type: string
 *                 description: Yangi email (ixtiyoriy)
 *                 example: "newemail@example.com"
 *               phone:
 *                 type: string
 *                 description: Yangi telefon raqam (ixtiyoriy)
 *                 example: "+998901234567"
 *               password:
 *                 type: string
 *                 description: Yangi parol (ixtiyoriy)
 *                 example: "newpassword123"
 *               location:
 *                 type: string
 *                 description: Yangi manzil (ixtiyoriy)
 *                 example: "Toshkent, O'zbekiston"
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli yangilandi
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
 *                   example: "Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "Yangi Ism"
 *                     email:
 *                       type: string
 *                       example: "newemail@example.com"
 *                     phone:
 *                       type: string
 *                       example: "+998901234567"
 *                     location:
 *                       type: string
 *                       example: "Toshkent, O'zbekiston"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.put('/update/:id', updateUser);

/**
 * @swagger
 * /api/users/generate-token/{id}:
 *   post:
 *     summary: Foydalanuvchi uchun alohida token yaratish
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID raqami
 *     responses:
 *       200:
 *         description: Token muvaffaqiyatli yaratildi
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
 *                   example: "User token muvaffaqiyatli yaratildi"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     phone:
 *                       type: string
 *                       example: "+998901234567"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post('/generate-token/:id', generateUserToken);

/**
 * @swagger
 * /api/users/location:
 *   put:
 *     summary: Foydalanuvchi location ma'lumotlarini yangilash
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 41.2995
 *                 description: Kenglik (latitude)
 *               longitude:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 69.2401
 *                 description: Uzunlik (longitude)
 *               address:
 *                 type: string
 *                 example: "Toshkent shahri, Yunusobod tumani"
 *                 description: To'liq manzil
 *               city:
 *                 type: string
 *                 example: "Toshkent"
 *                 description: Shahar nomi
 *               country:
 *                 type: string
 *                 example: "Uzbekistan"
 *                 description: Davlat nomi
 *               location_permission:
 *                 type: boolean
 *                 example: true
 *                 description: Location ruxsati berilganmi
 *     responses:
 *       200:
 *         description: Location ma'lumotlari muvaffaqiyatli yangilandi
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
 *                   example: "Location ma'lumotlari yangilandi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     latitude:
 *                       type: number
 *                       example: 41.2995
 *                     longitude:
 *                       type: number
 *                       example: 69.2401
 *                     address:
 *                       type: string
 *                       example: "Toshkent shahri, Yunusobod tumani"
 *                     city:
 *                       type: string
 *                       example: "Toshkent"
 *                     country:
 *                       type: string
 *                       example: "Uzbekistan"
 *                     location_permission:
 *                       type: boolean
 *                       example: true
 *                     location_updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.put('/location', verifyUser, updateUserLocation);

/**
 * @swagger
 * /api/users/location:
 *   get:
 *     summary: Foydalanuvchi location ma'lumotlarini olish
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location ma'lumotlari muvaffaqiyatli olingan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     latitude:
 *                       type: number
 *                       example: 41.2995
 *                     longitude:
 *                       type: number
 *                       example: 69.2401
 *                     address:
 *                       type: string
 *                       example: "Toshkent shahri, Yunusobod tumani"
 *                     city:
 *                       type: string
 *                       example: "Toshkent"
 *                     country:
 *                       type: string
 *                       example: "Uzbekistan"
 *                     location_permission:
 *                       type: boolean
 *                       example: true
 *                     location_updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       404:
 *         description: Foydalanuvchi topilmadi yoki location ma'lumotlari yo'q
 *       500:
 *         description: Server xatosi
 */
router.get('/location', verifyUser, getUserLocation);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Foydalanuvchi profilini olish
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foydalanuvchi profili muvaffaqiyatli olindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+998901234567"
 *                         location:
 *                           type: string
 *                           example: "Tashkent"
 *                         image:
 *                           type: string
 *                           example: "base64_encoded_image_data"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
router.get('/profile', verifyUser, getUserProfile);

/**
 * @swagger
 * /api/users/profile/image/upload:
 *   post:
 *     summary: Profil rasmini yuklash
 *     description: Foydalanuvchi profil rasmini yuklash (faqat autentifikatsiya qilingan foydalanuvchilar uchun)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profil rasmi (JPEG, PNG, GIF, WebP formatlarida, maksimal 5MB)
 *     responses:
 *       200:
 *         description: Profil rasmi muvaffaqiyatli yuklandi
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
 *                   example: "Profil rasmi muvaffaqiyatli yuklandi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imagePath:
 *                       type: string
 *                       example: "/uploads/profile-images/profile-1234567890-123456789.jpg"
 *                     imageBase64:
 *                       type: string
 *                       example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
 *       400:
 *         description: Xato so'rov (fayl tanlanmagan yoki noto'g'ri format)
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatoligi
 */
router.post('/profile/image/upload', verifyUser, upload, handleUploadError, uploadProfileImage);

/**
 * @swagger
 * /api/users/profile/image:
 *   get:
 *     summary: Profil rasmini olish
 *     description: Foydalanuvchi profil rasmini Base64 formatida olish
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil rasmi muvaffaqiyatli olindi
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
 *                   example: "Profil rasmi muvaffaqiyatli olindi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageBase64:
 *                       type: string
 *                       example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatoligi
 */
router.get('/profile/image', verifyUser, getProfileImage);

/**
 * @swagger
 * /api/users/profile/image:
 *   delete:
 *     summary: Profil rasmini o'chirish
 *     description: Foydalanuvchi profil rasmini o'chirish
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil rasmi muvaffaqiyatli o'chirildi
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
 *                   example: "Profil rasmi muvaffaqiyatli o'chirildi"
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatoligi
 */
router.delete('/profile/image', verifyUser, deleteProfileImage);

module.exports = router;