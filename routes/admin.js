const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/admin/salon/top:
 *   post:
 *     summary: Salonni top qilish
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salonId:
 *                 type: string
 *                 format: uuid
 *               isTop:
 *                 type: boolean
 *               duration:
 *                 type: integer
 *                 default: 7
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli top qilindi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Salon topilmadi
 */
router.post('/salon/top', verifyAdmin, async (req, res) => {
    try {
        const { salonId } = req.params;
        const { isTop, duration = 7 } = req.body; // duration kunlarda
        
        // Admin ekanligini tekshirish
        if (req.admin.role !== 'admin' && req.admin.role !== 'superadmin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat adminlar salon top qilishi mumkin' 
            });
        }

        // Salon mavjudligini tekshirish
        const salonCheck = await pool.query('SELECT id, name FROM salons WHERE id = $1', [salonId]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Salon topilmadi' 
            });
        }

        const salon = salonCheck.rows[0];

        if (isTop) {
            // Salon top qilish
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + duration);

            // Salon is_top ni true qilish
            await pool.query(`
                UPDATE salons SET is_top = TRUE WHERE id = $1
            `, [salonId]);

            // Avvalgi active top historyni tugatish
            await pool.query(`
                UPDATE salon_top_history 
                SET is_active = FALSE, end_date = CURRENT_TIMESTAMP
                WHERE salon_id = $1 AND is_active = TRUE
            `, [salonId]);

            // Yangi top history qo'shish
            await pool.query(`
                INSERT INTO salon_top_history (salon_id, admin_id, end_date)
                VALUES ($1, $2, $3)
            `, [salonId, req.admin.id, endDate]);

            res.json({
                success: true,
                message: `${salon.name} saloni ${duration} kunga top qilindi`,
                data: {
                    salon_id: salonId,
                    salon_name: salon.name,
                    is_top: true,
                    duration: duration,
                    end_date: endDate
                }
            });
        } else {
            // Salon top holatini bekor qilish
            await pool.query(`
                UPDATE salons SET is_top = FALSE WHERE id = $1
            `, [salonId]);

            // Active top historyni tugatish
            await pool.query(`
                UPDATE salon_top_history 
                SET is_active = FALSE, end_date = CURRENT_TIMESTAMP
                WHERE salon_id = $1 AND is_active = TRUE
            `, [salonId]);

            res.json({
                success: true,
                message: `${salon.name} saloni top holatidan chiqarildi`,
                data: {
                    salon_id: salonId,
                    salon_name: salon.name,
                    is_top: false
                }
            });
        }
    } catch (error) {
        console.error('Admin salon top error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// Top salonlar ro'yxatini olish
router.get('/salons/top', verifyAdmin, async (req, res) => {
    try {
        // Admin ekanligini tekshirish
        if (req.admin.role !== 'admin' && req.admin.role !== 'superadmin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat adminlar top salonlar ro\'yxatini ko\'rishi mumkin' 
            });
        }

        const result = await pool.query(`
            SELECT s.*, sth.start_date, sth.end_date, sth.is_active,
                   a.username as admin_username
            FROM salons s
            LEFT JOIN salon_top_history sth ON s.id = sth.salon_id AND sth.is_active = TRUE
            LEFT JOIN admins a ON sth.admin_id = a.id
            WHERE s.is_top = TRUE
            ORDER BY sth.start_date DESC
        `);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Get top salons error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// Salon top tarixini ko'rish
router.get('/salon/:salonId/top-history', verifyAdmin, async (req, res) => {
    try {
        const { salonId } = req.params;
        
        // Admin ekanligini tekshirish
        if (req.admin.role !== 'admin' && req.admin.role !== 'superadmin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat adminlar salon top history ko\'rishi mumkin' 
            });
        }

        const result = await pool.query(`
            SELECT sth.*, a.username as admin_username, s.name as salon_name
            FROM salon_top_history sth
            LEFT JOIN admins a ON sth.admin_id = a.id
            LEFT JOIN salons s ON sth.salon_id = s.id
            WHERE sth.salon_id = $1
            ORDER BY sth.start_date DESC
        `, [salonId]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Get salon top history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// Barcha salonlar ro'yxati (top maydoni bilan)
router.get('/salons', verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', top_only = false } = req.query;
        
        // Admin ekanligini tekshirish
        if (req.admin.role !== 'admin' && req.admin.role !== 'superadmin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat adminlar salon ro\'yxatini ko\'rishi mumkin' 
            });
        }

        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (s.name ILIKE $${paramIndex} OR s.address ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (top_only === 'true') {
            whereClause += ` AND s.is_top = TRUE`;
        }

        const countQuery = `
            SELECT COUNT(*) as total
            FROM salons s
            ${whereClause}
        `;

        const dataQuery = `
            SELECT s.*, 
                   CASE WHEN sth.is_active = TRUE THEN sth.end_date ELSE NULL END as top_end_date,
                   CASE WHEN sth.is_active = TRUE THEN a.username ELSE NULL END as top_admin
            FROM salons s
            LEFT JOIN salon_top_history sth ON s.id = sth.salon_id AND sth.is_active = TRUE
            LEFT JOIN admins a ON sth.admin_id = a.id
            ${whereClause}
            ORDER BY s.is_top DESC, s.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, queryParams.slice(0, -2)),
            pool.query(dataQuery, queryParams)
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: dataResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: totalPages
            }
        });
    } catch (error) {
        console.error('Get salons error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

module.exports = router;