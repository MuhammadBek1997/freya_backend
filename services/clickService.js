const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('../config/database');

class ClickService {
    constructor() {
        this.merchantId = process.env.CLICK_MERCHANT_ID || '12345';
        this.serviceId = process.env.CLICK_SERVICE_ID || '67890';
        this.secretKey = process.env.CLICK_SECRET_KEY || 'your_secret_key';
        this.baseUrl = process.env.CLICK_BASE_URL || 'https://api.click.uz/v2';
    }

    // MD5 hash yaratish
    generateSignature(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        return crypto.createHash('md5')
            .update(sortedParams + this.secretKey)
            .digest('hex');
    }

    // To'lov URL yaratish
    async createPaymentUrl(paymentData) {
        const { amount, orderId, returnUrl, description } = paymentData;
        
        const params = {
            merchant_id: this.merchantId,
            service_id: this.serviceId,
            amount: amount,
            transaction_param: orderId,
            return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
            description: description || 'To\'lov'
        };

        const signature = this.generateSignature(params);
        params.sign = signature;

        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');

        return `${this.baseUrl}/payments/create?${queryString}`;
    }

    // Employee post uchun to'lov
    async createEmployeePostPayment(employeeId, postCount = 4) {
        try {
            const amount = postCount * 5000; // Har bir post uchun 5000 so'm
            const orderId = `emp_post_${employeeId}_${Date.now()}`;

            // Payment record yaratish
            const paymentResult = await pool.query(`
                INSERT INTO payments (employee_id, amount, payment_type, transaction_id, description)
                VALUES ($1, $2, 'employee_post', $3, $4)
                RETURNING id, transaction_id
            `, [employeeId, amount, orderId, `${postCount} ta post uchun to'lov`]);

            const payment = paymentResult.rows[0];

            // Click URL yaratish
            const paymentUrl = await this.createPaymentUrl({
                amount: amount,
                orderId: orderId,
                description: `${postCount} ta post uchun to'lov`
            });

            return {
                success: true,
                paymentId: payment.id,
                paymentUrl: paymentUrl,
                amount: amount,
                orderId: orderId
            };
        } catch (error) {
            console.error('Employee post payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // User premium uchun to'lov
    async createUserPremiumPayment(userId, duration = 30) {
        try {
            const amount = duration === 30 ? 50000 : 150000; // 30 kun - 50k, 90 kun - 150k
            const orderId = `user_premium_${userId}_${Date.now()}`;

            // Payment record yaratish
            const paymentResult = await pool.query(`
                INSERT INTO payments (user_id, amount, payment_type, transaction_id, description)
                VALUES ($1, $2, 'user_premium', $3, $4)
                RETURNING id, transaction_id
            `, [userId, amount, orderId, `${duration} kunlik premium obuna`]);

            const payment = paymentResult.rows[0];

            // Click URL yaratish
            const paymentUrl = await this.createPaymentUrl({
                amount: amount,
                orderId: orderId,
                description: `${duration} kunlik premium obuna`
            });

            return {
                success: true,
                paymentId: payment.id,
                paymentUrl: paymentUrl,
                amount: amount,
                orderId: orderId,
                duration: duration
            };
        } catch (error) {
            console.error('User premium payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // Salon top uchun to'lov
    async createSalonTopPayment(salonId, adminId, duration = 7) {
        try {
            const amount = duration === 7 ? 100000 : 300000; // 7 kun - 100k, 30 kun - 300k
            const orderId = `salon_top_${salonId}_${Date.now()}`;

            // Payment record yaratish
            const paymentResult = await pool.query(`
                INSERT INTO payments (salon_id, amount, payment_type, transaction_id, description)
                VALUES ($1, $2, 'salon_top', $3, $4)
                RETURNING id, transaction_id
            `, [salonId, amount, orderId, `${duration} kunlik salon top`]);

            const payment = paymentResult.rows[0];

            // Click URL yaratish
            const paymentUrl = await this.createPaymentUrl({
                amount: amount,
                orderId: orderId,
                description: `${duration} kunlik salon top`
            });

            return {
                success: true,
                paymentId: payment.id,
                paymentUrl: paymentUrl,
                amount: amount,
                orderId: orderId,
                duration: duration
            };
        } catch (error) {
            console.error('Salon top payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // To'lov holatini tekshirish
    async checkPaymentStatus(transactionId) {
        try {
            const params = {
                merchant_id: this.merchantId,
                service_id: this.serviceId,
                transaction_param: transactionId
            };

            const signature = this.generateSignature(params);
            params.sign = signature;

            const response = await axios.get(`${this.baseUrl}/payments/status`, { params });
            return response.data;
        } catch (error) {
            console.error('Payment status check error:', error);
            return { success: false, error: error.message };
        }
    }

    // To'lov muvaffaqiyatli bo'lganda
    async handleSuccessfulPayment(transactionId, clickTransId) {
        try {
            // Payment statusini yangilash
            const updateResult = await pool.query(`
                UPDATE payments 
                SET status = 'completed', click_trans_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE transaction_id = $2
                RETURNING *
            `, [clickTransId, transactionId]);

            if (updateResult.rows.length === 0) {
                throw new Error('Payment not found');
            }

            const payment = updateResult.rows[0];

            // Payment turiga qarab tegishli amallarni bajarish
            switch (payment.payment_type) {
                case 'employee_post':
                    await this.handleEmployeePostPayment(payment);
                    break;
                case 'user_premium':
                    await this.handleUserPremiumPayment(payment);
                    break;
                case 'salon_top':
                    await this.handleSalonTopPayment(payment);
                    break;
            }

            return { success: true, payment };
        } catch (error) {
            console.error('Handle successful payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // Employee post to'lovi muvaffaqiyatli bo'lganda
    async handleEmployeePostPayment(payment) {
        const postCount = Math.floor(payment.amount / 5000);
        
        await pool.query(`
            UPDATE employee_post_limits 
            SET total_paid_posts = total_paid_posts + $1, updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $2
        `, [postCount, payment.employee_id]);
    }

    // User premium to'lovi muvaffaqiyatli bo'lganda
    async handleUserPremiumPayment(payment) {
        const duration = payment.amount === 50000 ? 30 : 90;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        await pool.query(`
            INSERT INTO subscriptions (user_id, type, end_date, payment_id)
            VALUES ($1, 'premium', $2, $3)
        `, [payment.user_id, endDate, payment.id]);
    }

    // Salon top to'lovi muvaffaqiyatli bo'lganda
    async handleSalonTopPayment(payment) {
        const duration = payment.amount === 100000 ? 7 : 30;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        // Salon top qilish
        await pool.query(`
            UPDATE salons SET is_top = TRUE WHERE id = $1
        `, [payment.salon_id]);

        // Top history qo'shish
        await pool.query(`
            INSERT INTO salon_top_history (salon_id, end_date, payment_id)
            VALUES ($1, $2, $3)
        `, [payment.salon_id, endDate, payment.id]);
    }
}

module.exports = new ClickService();