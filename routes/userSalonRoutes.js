const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyUserToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Salon:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Salon ID raqami
 *         name:
 *           type: string
 *           description: Salon nomi
 *         address:
 *           type: string
 *           description: Salon manzili
 *         phone:
 *           type: string
 *           description: Salon telefon raqami
 *         description:
 *           type: string
 *           description: Salon haqida ma'lumot
 *         working_hours:
 *           type: string
 *           description: Ish vaqti
 *         is_active:
 *           type: boolean
 *           description: Salon faol holati
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/user-salons:
 *   get:
 *     summary: Barcha salonlarni ko'rish (faqat o'qish uchun)
 *     tags: [User Salons]
 *     security:
 *       - UserToken: []
 *     responses:
 *       200:
 *         description: Salonlar ro'yxati muvaffaqiyatli qaytarildi
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
 *                   example: "Salonlar ro'yxati"
 *                 salons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salon'
 *                 total:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Autentifikatsiya xatosi
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
 *                   example: "Token topilmadi, kirish rad etildi"
 *       500:
 *         description: Server xatosi
 */
router.get('/', verifyUserToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT id, name, address, phone, description, working_hours, is_active, created_at, updated_at
            FROM salons 
            WHERE is_active = true
        `;
        let countQuery = 'SELECT COUNT(*) FROM salons WHERE is_active = true';
        let queryParams = [];
        let countParams = [];

        // Search functionality
        if (search) {
            query += ` AND (name ILIKE $1 OR address ILIKE $1 OR description ILIKE $1)`;
            countQuery += ` AND (name ILIKE $1 OR address ILIKE $1 OR description ILIKE $1)`;
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const [salonsResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, countParams)
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            message: "Salonlar ro'yxati",
            salons: salonsResult.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            user: {
                id: req.user.id,
                name: req.user.name,
                access_type: 'readonly'
            }
        });

    } catch (error) {
        console.error('Get Salons Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

/**
 * @swagger
 * /api/user-salons/{id}:
 *   get:
 *     summary: Bitta salonni ko'rish (faqat o'qish uchun)
 *     tags: [User Salons]
 *     security:
 *       - UserToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID raqami
 *     responses:
 *       200:
 *         description: Salon ma'lumotlari muvaffaqiyatli qaytarildi
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
 *                   example: "Salon ma'lumotlari"
 *                 salon:
 *                   $ref: '#/components/schemas/Salon'
 *       404:
 *         description: Salon topilmadi
 *       401:
 *         description: Autentifikatsiya xatosi
 *       500:
 *         description: Server xatosi
 */
router.get('/:id', verifyUserToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, name, address, phone, description, working_hours, is_active, created_at, updated_at
             FROM salons 
             WHERE id = $1 AND is_active = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi yoki faol emas'
            });
        }

        res.json({
            success: true,
            message: "Salon ma'lumotlari",
            salon: result.rows[0],
            user: {
                id: req.user.id,
                name: req.user.name,
                access_type: 'readonly'
            }
        });

    } catch (error) {
        console.error('Get Salon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     UserToken:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: User uchun maxsus yaratilgan read-only token
 */

module.exports = router;