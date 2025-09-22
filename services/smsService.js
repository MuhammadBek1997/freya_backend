const axios = require('axios');
const eskizConfig = require('../config/eskiz');

class SMSService {
    constructor() {
        this.token = eskizConfig.token;
        this.baseUrl = eskizConfig.baseUrl;
    }

    /**
     * Eskiz.uz orqali SMS yuborish
     * @param {string} phone - Telefon raqami (+998901234567 formatida)
     * @param {string} message - SMS matni
     * @returns {Promise<Object>} - API javobi
     */
    async sendSMS(phone, message) {
        try {
            // Token tekshiruvi
            if (!this.token || this.token.trim() === '') {
                console.log('Token mavjud emas, yangi token olishga harakat qilaman...');
                const refreshResult = await this.refreshToken();
                if (!refreshResult.success) {
                    return {
                        success: false,
                        error: 'Token olishda xatolik'
                    };
                }
            }
            
            // Telefon raqamini formatlash (faqat raqamlar)
            const formattedPhone = phone.replace(/[^\d]/g, '');
            
            console.log('SMS yuborish uchun token:', this.token ? 'Mavjud' : 'Mavjud emas');
            
            const response = await axios.post(
                `${this.baseUrl}${eskizConfig.endpoints.sendSms}`,
                {
                    mobile_phone: formattedPhone,
                    message: message,
                    from: '4546',
                    callback_url: null
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                data: response.data,
                messageId: response.data.id
            };
        } catch (error) {
            console.error('SMS yuborishda xatolik:', error.response?.data || error.message);
            
            // Token muddati tugagan bo'lsa, yangilashga harakat qilish
            if (error.response?.status === 401) {
                const refreshResult = await this.refreshToken();
                if (refreshResult.success) {
                    // Token yangilangandan keyin qayta urinish
                    return this.sendSMS(phone, message);
                }
            }

            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Random 6 xonali kod generatsiya qilish
     * @returns {string} - 6 xonali tasdiqlash kodi
     */
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Tasdiqlash kodini yuborish (Ro'yxatdan o'tish uchun)
     * @param {string} phone - Telefon raqami
     * @param {string} code - Tasdiqlash kodi (ixtiyoriy, agar berilmasa random yaratiladi)
     * @returns {Promise<Object>} - SMS yuborish natijasi
     */
    async sendVerificationCode(phone, code = null) {
        // Agar kod berilmagan bo'lsa, random yaratish
        const verificationCode = code || this.generateVerificationCode();
        
        // Oddiy SMS matni
        const message = `Tasdiqlash kodi: ${verificationCode}`;
        
        const result = await this.sendSMS(phone, message);
        
        // Natijaga verification code qo'shish
        if (result.success) {
            result.verificationCode = verificationCode;
        }
        
        return result;
    }

    /**
     * Parolni tiklash uchun tasdiqlash kodi yuborish
     * @param {string} phone - Telefon raqami
     * @param {string} code - Tasdiqlash kodi (ixtiyoriy, agar berilmasa random yaratiladi)
     * @returns {Promise<Object>} - SMS yuborish natijasi
     */
    async sendPasswordResetCode(phone, code = null) {
        // Agar kod berilmagan bo'lsa, random yaratish
        const verificationCode = code || this.generateVerificationCode();
        
        // Oddiy SMS matni
        const message = `Parol tiklash kodi: ${verificationCode}`;
        
        const result = await this.sendSMS(phone, message);
        
        // Natijaga verification code qo'shish
        if (result.success) {
            result.verificationCode = verificationCode;
        }
        
        return result;
    }

    /**
     * Telefon raqamni o'zgartirish uchun tasdiqlash kodi yuborish
     * @param {string} phone - Telefon raqami
     * @param {string} code - Tasdiqlash kodi (ixtiyoriy, agar berilmasa random yaratiladi)
     * @returns {Promise<Object>} - SMS yuborish natijasi
     */
    async sendPhoneChangeCode(phone, code = null) {
        // Agar kod berilmagan bo'lsa, random yaratish
        const verificationCode = code || this.generateVerificationCode();
        
        // Oddiy SMS matni
        const message = `Telefon o'zgartirish kodi: ${verificationCode}`;
        
        const result = await this.sendSMS(phone, message);
        
        // Natijaga verification code qo'shish
        if (result.success) {
            result.verificationCode = verificationCode;
        }
        
        return result;
    }

    /**
     * Ro'yxatdan o'tish uchun tasdiqlash kodi yuborish (qisqa format)
     * @param {string} phone - Telefon raqami
     * @param {string} code - Tasdiqlash kodi (ixtiyoriy, agar berilmasa random yaratiladi)
     * @returns {Promise<Object>} - SMS yuborish natijasi
     */
    async sendRegistrationCode(phone, code = null) {
        // Agar kod berilmagan bo'lsa, random yaratish
        const verificationCode = code || this.generateVerificationCode();
        
        // Oddiy SMS matni
        const message = `Ro'yxatdan o'tish kodi: ${verificationCode}`;
        
        const result = await this.sendSMS(phone, message);
        
        // Natijaga verification code qo'shish
        if (result.success) {
            result.verificationCode = verificationCode;
        }
        
        return result;
    }

    /**
     * Tokenni yangilash
     * @returns {Promise<Object>} - Yangilash natijasi
     */
    async refreshToken() {
        try {
            const response = await axios.post(
                `${this.baseUrl}${eskizConfig.endpoints.auth}`,
                {
                    email: eskizConfig.email,
                    password: eskizConfig.password
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.token) {
                this.token = response.data.token;
                return {
                    success: true,
                    token: response.data.token
                };
            }

            return {
                success: false,
                error: 'Token olinmadi'
            };
        } catch (error) {
            console.error('Token yangilashda xatolik:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Balansni tekshirish
     * @returns {Promise<Object>} - Balans ma'lumotlari
     */
    async getBalance() {
        try {
            const response = await axios.get(
                `${this.baseUrl}${eskizConfig.endpoints.getBalance}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                balance: response.data
            };
        } catch (error) {
            console.error('Balansni olishda xatolik:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * SMS holatini tekshirish
     * @param {string} messageId - SMS ID
     * @returns {Promise<Object>} - SMS holati
     */
    async getSMSStatus(messageId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/message/sms/status/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                status: response.data
            };
        } catch (error) {
            console.error('SMS holatini olishda xatolik:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = new SMSService();