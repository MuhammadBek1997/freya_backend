const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');
const smsService = require('../services/smsService');
const {
    updateSalon,
    uploadSalonPhotos,
    deleteSalonPhoto
} = require('../controllers/salonController');

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
        const { salonId, isTop, duration = 7 } = req.body; // duration kunlarda
        
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
                INSERT INTO salon_top_history (salon_id, admin_id, action, end_date)
                VALUES ($1, $2, $3, $4)
            `, [salonId, req.admin.id, 'top', endDate]);

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

/**
 * @swagger
 * /api/admin/my-salon:
 *   get:
 *     summary: Adminning o'z salon ma'lumotlarini olish
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Salon ma'lumotlari muvaffaqiyatli olingan
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Salon topilmadi
 */
router.get('/my-salon', verifyAdmin, async (req, res) => {
    try {
        // Admin ekanligini tekshirish
        if (!req.admin || !req.admin.salon_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin salon ma\'lumotlari topilmadi' 
            });
        }

        const salonId = req.admin.salon_id;

        // Salon ma'lumotlarini olish
        const salonQuery = `
            SELECT s.*,
                   CASE WHEN sth.is_active = TRUE THEN sth.end_date ELSE NULL END as top_end_date,
                   CASE WHEN sth.is_active = TRUE THEN TRUE ELSE FALSE END as is_currently_top
            FROM salons s
            LEFT JOIN salon_top_history sth ON s.id = sth.salon_id AND sth.is_active = TRUE
            WHERE s.id = $1
        `;

        const salonResult = await pool.query(salonQuery, [salonId]);

        if (salonResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Salon topilmadi' 
            });
        }

        let salon = salonResult.rows[0];

        // Salon tarjimalarini olish
        try {
            const salonTranslationService = require('../services/salonTranslationService');
            
            // Har bir til uchun tarjimalarni olish
            const languages = ['uz', 'en', 'ru'];
            for (const lang of languages) {
                const translation = await salonTranslationService.getSalonByLanguage(salonId, lang);
                if (translation) {
                    salon[`salon_name_${lang}`] = translation.salon_name || salon.name;
                    salon[`salon_description_${lang}`] = translation.salon_description || salon.description;
                    salon[`salon_title_${lang}`] = translation.salon_title || '';
                    salon[`salon_address_${lang}`] = translation.salon_address || salon.address;
                    salon[`salon_direction_${lang}`] = translation.salon_direction || '';
                }
            }
        } catch (translationError) {
            console.error('Translation error:', translationError);
            // Tarjima xatosi bo'lsa, asosiy ma'lumotlarni qaytaramiz
        }

        res.json({
            success: true,
            data: salon,
            message: 'Salon ma\'lumotlari muvaffaqiyatli olingan'
        });

    } catch (error) {
        console.error('Get admin salon error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/admin/salons/{id}:
 *   put:
 *     summary: Salonni yangilash
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID raqami
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               working_hours:
 *                 type: string
 *               salon_types:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli yangilandi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Salon topilmadi
 */
router.put('/salons/:id', verifyAdmin, updateSalon);

/**
 * @swagger
 * /api/admin/salons/{id}/photos:
 *   post:
 *     summary: Salon rasmlarini yuklash
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID raqami
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Rasmlar muvaffaqiyatli yuklandi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Salon topilmadi
 */
router.post('/salons/:id/photos', verifyAdmin, uploadSalonPhotos);

/**
 * @swagger
 * /api/admin/salons/{id}/photos/{photoIndex}:
 *   delete:
 *     summary: Salon rasmini o'chirish
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID raqami
 *       - in: path
 *         name: photoIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rasm indeksi
 *     responses:
 *       200:
 *         description: Rasm muvaffaqiyatli o'chirildi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Salon yoki rasm topilmadi
 */
router.delete('/salons/:id/photos/:photoIndex', verifyAdmin, deleteSalonPhoto);

/**
 * @swagger
 * /api/admin/card/phone:
 *   post:
 *     summary: Karta raqami bo'yicha telefon topish
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
 *               cardNumber:
 *                 type: string
 *                 description: Karta raqami (16 raqam)
 *                 example: "1234567890123456"
 *     responses:
 *       200:
 *         description: Telefon raqami topildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 phone:
 *                   type: string
 *                   example: "+998901234567"
 *       404:
 *         description: Karta topilmadi
 *       400:
 *         description: Noto'g'ri karta raqami
 */
router.post('/card/phone', verifyAdmin, async (req, res) => {
    try {
        const { cardNumber } = req.body;

        // Karta raqami validatsiyasi
        if (!cardNumber || cardNumber.length !== 16 || !/^\d{16}$/.test(cardNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Karta raqami 16 ta raqamdan iborat bo\'lishi kerak'
            });
        }

        // Barcha salonlarda karta raqamini qidirish
        const salons = await pool.query(`
            SELECT salon_payment, phone, name
            FROM salons 
            WHERE salon_payment IS NOT NULL
        `);

        let foundPhone = null;
        let salonName = null;

        // Har bir salonda karta raqamini tekshirish
        for (const salon of salons.rows) {
            const paymentData = salon.salon_payment || {};
            
            if (paymentData.card_number === cardNumber) {
                foundPhone = salon.phone;
                salonName = salon.name;
                break;
            }
        }

        if (foundPhone) {
            return res.json({
                success: true,
                phone: foundPhone,
                salonName: salonName,
                message: 'Telefon raqami topildi'
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Ushbu karta raqami ro\'yxatda yo\'q'
            });
        }

    } catch (error) {
        console.error('Card phone lookup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// SMS yuborish endpoint - karta raqami orqali telefon topib SMS kod yuborish
router.post('/send-sms', verifyAdmin, async (req, res) => {
    try {
        const { card_number } = req.body;

        if (!card_number || card_number.length !== 16) {
            return res.status(400).json({
                success: false,
                message: "Karta raqami 16 ta raqamdan iborat bo'lishi kerak"
            });
        }

        // Karta raqami orqali telefon topish
        const salonQuery = `
            SELECT phone, name 
            FROM salons 
            WHERE salon_payment::text LIKE $1
        `;
        
        const salonResult = await pool.query(salonQuery, [`%${card_number}%`]);
        
        if (salonResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Ushbu karta raqami ro'yxatda yo'q"
            });
        }

        const foundPhone = salonResult.rows[0].phone;
        const salonName = salonResult.rows[0].name;

        // SMS kod yuborish
        const smsResult = await smsService.sendVerificationCode(foundPhone);
        
        if (smsResult.success) {
            res.json({
                success: true,
                message: "SMS kod yuborildi",
                phone: foundPhone,
                salonName: salonName,
                verificationCode: smsResult.verificationCode // Test uchun
            });
        } else {
            res.status(500).json({
                success: false,
                message: "SMS yuborishda xatolik",
                error: smsResult.error
            });
        }

    } catch (error) {
        console.error('SMS yuborish xatosi:', error);
        res.status(500).json({
            success: false,
            message: "Server xatosi",
            error: error.message
        });
    }
});

// SMS kod tasdiqlash endpoint
router.post('/verify-sms', verifyAdmin, async (req, res) => {
    try {
        const { card_number, sms_code, card_holder, card_type } = req.body;

        if (!card_number || !sms_code || !card_holder || !card_type) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi kerak"
            });
        }

        // Bu yerda SMS kodni tekshirish logikasi bo'lishi kerak
        // Hozircha oddiy tekshirish qilamiz (real loyihada Redis yoki database ishlatiladi)
        if (sms_code.length !== 6) {
            return res.status(400).json({
                success: false,
                message: "SMS kod 6 ta raqamdan iborat bo'lishi kerak"
            });
        }

        // Admin salon ma'lumotlarini yangilash
        const adminId = req.admin.id;
        
        // Avval admin salon_id sini topamiz
        const adminQuery = 'SELECT salon_id FROM admins WHERE id = $1';
        const adminResult = await pool.query(adminQuery, [adminId]);
        
        if (adminResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin topilmadi"
            });
        }

        const salonId = adminResult.rows[0].salon_id;

        // Salon payment ma'lumotlarini yangilash
        const newPaymentData = {
            card_number,
            card_holder,
            card_type,
            verified: true,
            verified_at: new Date().toISOString()
        };

        const updateQuery = `
            UPDATE salons 
            SET salon_payment = $1 
            WHERE id = $2
        `;
        
        await pool.query(updateQuery, [JSON.stringify([newPaymentData]), salonId]);

        res.json({
            success: true,
            message: "Karta muvaffaqiyatli qo'shildi va tasdiqlandi",
            card_data: newPaymentData
        });

    } catch (error) {
        console.error('SMS tasdiqlash xatosi:', error);
        res.status(500).json({
            success: false,
            message: "Server xatosi",
            error: error.message
        });
    }
});

module.exports = router;