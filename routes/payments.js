const express = require('express');
const router = express.Router();
const clickService = require('../services/clickService');
const { pool } = require('../config/database');
const { verifyAuth } = require('../middleware/authMiddleware');

// Employee post uchun to'lov yaratish
router.post('/employee/post', verifyAuth, async (req, res) => {
    try {
        const { postCount = 4 } = req.body;
        const employeeId = req.user.id;

        // Employee ekanligini tekshirish
        if (req.user.role !== 'employee') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat employeelar post sotib olishi mumkin' 
            });
        }

        // Post count validatsiyasi
        if (postCount < 1 || postCount > 20) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post soni 1 dan 20 gacha bo\'lishi kerak' 
            });
        }

        const result = await clickService.createEmployeePostPayment(employeeId, postCount);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'To\'lov URL yaratildi',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'To\'lov yaratishda xatolik',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Employee post payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// User premium uchun to'lov yaratish
router.post('/user/premium', verifyAuth, async (req, res) => {
    try {
        const { duration = 30 } = req.body; // 30 yoki 90 kun
        const userId = req.user.id;

        // User ekanligini tekshirish
        if (req.user.role !== 'user') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat userlar premium sotib olishi mumkin' 
            });
        }

        // Duration validatsiyasi
        if (![30, 90].includes(duration)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Davomiylik 30 yoki 90 kun bo\'lishi kerak' 
            });
        }

        const result = await clickService.createUserPremiumPayment(userId, duration);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'To\'lov URL yaratildi',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'To\'lov yaratishda xatolik',
                error: result.error
            });
        }
    } catch (error) {
        console.error('User premium payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// Admin salon top uchun to'lov yaratish
router.post('/salon/top', verifyAuth, async (req, res) => {
    try {
        const { salonId, duration = 7 } = req.body; // 7 yoki 30 kun
        const adminId = req.user.id;

        // Admin ekanligini tekshirish
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat adminlar salon top qilishi mumkin' 
            });
        }

        // Duration validatsiyasi
        if (![7, 30].includes(duration)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Davomiylik 7 yoki 30 kun bo\'lishi kerak' 
            });
        }

        // Salon mavjudligini tekshirish
        const salonCheck = await pool.query('SELECT id FROM salons WHERE id = $1', [salonId]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Salon topilmadi' 
            });
        }

        const result = await clickService.createSalonTopPayment(salonId, adminId, duration);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'To\'lov URL yaratildi',
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'To\'lov yaratishda xatolik',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Salon top payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// To'lov holatini tekshirish
router.get('/status/:paymentId', verifyAuth, async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Payment ma'lumotlarini olish
        const paymentResult = await pool.query(`
            SELECT p.*, 
                   CASE 
                       WHEN p.employee_id IS NOT NULL THEN e.name
                       WHEN p.user_id IS NOT NULL THEN u.name
                       WHEN p.salon_id IS NOT NULL THEN s.name
                   END as payer_name
            FROM payments p
            LEFT JOIN employees e ON p.employee_id = e.id
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN salons s ON p.salon_id = s.id
            WHERE p.transaction_id = $1
        `, [transactionId]);

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'To\'lov topilmadi' 
            });
        }

        const payment = paymentResult.rows[0];

        // Faqat o'z to'lovini ko'rishi mumkin
        const userId = req.user.id;
        const userRole = req.user.role;
        
        if (userRole === 'employee' && payment.employee_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Ruxsat yo\'q' 
            });
        }
        
        if (userRole === 'user' && payment.user_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Ruxsat yo\'q' 
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// Click callback endpoint (webhook)
router.post('/click/callback', async (req, res) => {
    try {
        const { transaction_param, click_trans_id, status } = req.body;

        if (status === 'success') {
            const result = await clickService.handleSuccessfulPayment(transaction_param, click_trans_id);
            
            if (result.success) {
                res.json({ success: true, message: 'To\'lov muvaffaqiyatli qayta ishlandi' });
            } else {
                res.status(500).json({ success: false, error: result.error });
            }
        } else {
            // To'lov muvaffaqiyatsiz bo'lganda
            await pool.query(`
                UPDATE payments 
                SET status = 'failed', updated_at = CURRENT_TIMESTAMP
                WHERE transaction_id = $1
            `, [transaction_param]);

            res.json({ success: true, message: 'To\'lov muvaffaqiyatsiz deb belgilandi' });
        }
    } catch (error) {
        console.error('Click callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Callback qayta ishlashda xatolik',
            error: error.message
        });
    }
});

// Employee post limitlarini olish
router.get('/employee/limits', verifyAuth, async (req, res) => {
    try {
        if (req.user.role !== 'employee') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat employeelar limit ko\'rishi mumkin' 
            });
        }

        const result = await pool.query(`
            SELECT * FROM employee_post_limits 
            WHERE employee_id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            // Agar record yo'q bo'lsa, yaratish
            await pool.query(`
                INSERT INTO employee_post_limits (employee_id) VALUES ($1)
            `, [req.user.id]);

            return res.json({
                success: true,
                data: {
                    free_posts_used: 0,
                    total_paid_posts: 0,
                    remaining_free_posts: 4,
                    remaining_paid_posts: 0
                }
            });
        }

        const limits = result.rows[0];
        const remainingFreePosts = Math.max(0, 4 - limits.free_posts_used);
        const remainingPaidPosts = Math.max(0, limits.total_paid_posts - (limits.free_posts_used > 4 ? limits.free_posts_used - 4 : 0));

        res.json({
            success: true,
            data: {
                free_posts_used: limits.free_posts_used,
                total_paid_posts: limits.total_paid_posts,
                remaining_free_posts: remainingFreePosts,
                remaining_paid_posts: remainingPaidPosts
            }
        });
    } catch (error) {
        console.error('Employee limits error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

// User subscription statusini olish
router.get('/user/subscription', verifyAuth, async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json({ 
                success: false, 
                message: 'Faqat userlar subscription ko\'rishi mumkin' 
            });
        }

        const result = await pool.query(`
            SELECT * FROM subscriptions 
            WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_TIMESTAMP
            ORDER BY end_date DESC
            LIMIT 1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    is_premium: false,
                    subscription: null
                }
            });
        }

        res.json({
            success: true,
            data: {
                is_premium: true,
                subscription: result.rows[0]
            }
        });
    } catch (error) {
        console.error('User subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi',
            error: error.message
        });
    }
});

module.exports = router;