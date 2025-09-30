const express = require('express');
const router = express.Router();
const { superadminLogin, adminLogin, createAdmin, employeeLogin } = require('../controllers/authController');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/auth/superadmin/login:
 *   post:
 *     summary: Superadmin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: superadmin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Noto'g'ri ma'lumotlar
 *       400:
 *         description: Noto'g'ri so'rov
 */
router.post('/superadmin/login', superadminLogin);

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin_beauty_palace
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Noto'g'ri ma'lumotlar
 *       400:
 *         description: Noto'g'ri so'rov
 */
router.post('/admin/login', adminLogin);

/**
 * @swagger
 * /api/auth/admin/create:
 *   post:
 *     summary: Admin yaratish (faqat superadmin)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - full_name
 *               - salon_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin1
 *               email:
 *                 type: string
 *                 example: admin1@freya.com
 *               password:
 *                 type: string
 *                 example: admin123
 *               full_name:
 *                 type: string
 *                 example: Admin User
 *               salon_id:
 *                 type: string
 *                 example: 05fd5bf0-06a5-4095-adf8-209f11aaff4c
 *     responses:
 *       201:
 *         description: Admin muvaffaqiyatli yaratildi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       404:
 *         description: Salon topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post('/admin/create', verifySuperAdmin, createAdmin);

/**
 * @swagger
 * /api/auth/employee/login:
 *   post:
 *     summary: Employee login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Username va password talab qilinadi
 *       401:
 *         description: Noto'g'ri username yoki password
 *       500:
 *         description: Server xatosi
 */
router.post('/employee/login', employeeLogin);

module.exports = router;
