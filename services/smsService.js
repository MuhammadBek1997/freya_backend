const axios = require('axios');
const eskizConfig = require('../config/eskiz');

class SMSService {
    constructor() {
        this.token = eskizConfig.token;
        this.baseUrl = eskizConfig.baseUrl;
        this.tokenExpiry = null;
        this.refreshInProgress = false;
    }

    /**
     * Eskiz.uz orqali SMS yuborish
     * @param {string} phone - Telefon raqami (+998901234567 formatida)
     * @param {string} message - SMS matni
     * @returns {Promise<Object>} - API javobi
     */
    async sendSMS(phone, message) {
        try {
            // Token tekshiruvi va avtomatik yangilash
            await this.ensureValidToken();
            
            if (!this.token) {
                return {
                    success: false,
                    error: 'Token olishda xatolik'
                };
            }
            
            // Telefon raqamini formatlash (faqat raqamlar)
            const formattedPhone = phone.replace(/[^\d]/g, '');
            
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
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('Token muddati tugagan, yangilanmoqda...');
                this.token = null; // Tokenni tozalash
                this.tokenExpiry = null;
                
                const refreshResult = await this.refreshToken();
                if (refreshResult.success) {
                    // Token yangilangandan keyin qayta urinish
                    console.log('Token yangilandi, qayta urinish...');
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
        
        // Eskiz.uz tasdiqlangan template #2
        const message = `Freya mobil ilovasiga ro'yxatdan o'tish uchun tasdiqlash kodi: ${verificationCode}`;
        
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
        
        // Eskiz.uz tasdiqlangan template #1
        const message = `Freya ilovasida parolni tiklash uchun tasdiqlash kodi: ${verificationCode}`;
        
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
        
        // Eskiz.uz tasdiqlangan template #3
        const message = `<#>Freya dasturiga Telefon raqamni o'zgartirish uchun tasdiqlash kodi:${verificationCode}`;
        
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
        
        // Eskiz.uz tasdiqlangan template #4
        const message = `<#>Freya dasturiga Ro'yhatdan o'tish uchun tasdiqlash kodi:${verificationCode}`;
        
        const result = await this.sendSMS(phone, message);
        
        // Natijaga verification code qo'shish
        if (result.success) {
            result.verificationCode = verificationCode;
        }
        
        return result;
    }

    /**
     * To'lov kartasi qo'shish uchun tasdiqlash kodi yuborish
     * @param {string} phone - Telefon raqami
     * @param {string} cardNumber - Karta raqamining oxirgi 4 raqami
     * @param {string} code - Tasdiqlash kodi (ixtiyoriy, agar berilmasa random yaratiladi)
     * @returns {Promise<Object>} - SMS yuborish natijasi
     */
    async sendPaymentCardVerificationCode(phone, cardNumber, code = null) {
        // Agar kod berilmagan bo'lsa, random yaratish
        const verificationCode = code || this.generateVerificationCode();
        
        // Karta raqamining oxirgi 4 raqamini olish
        const lastFourDigits = cardNumber.replace(/\s/g, '').slice(-4);
        
        // SMS matni
        const message = `Freya ilovasiga *${lastFourDigits} kartani qo'shish uchun tasdiqlash kodi: ${verificationCode}`;
        
        const result = await this.sendSMS(phone, message);
        
        // Natijaga verification code qo'shish
        if (result.success) {
            result.verificationCode = verificationCode;
        }
        
        return result;
    }

    /**
     * Token mavjudligini va amal qilish muddatini tekshirish
     * @returns {Promise<void>}
     */
    async ensureValidToken() {
        // Token yo'q yoki bo'sh bo'lsa
        if (!this.token || this.token.trim() === '') {
            console.log('Token mavjud emas, yangilanmoqda...');
            await this.refreshToken();
            return;
        }

        // Token muddati tugagan bo'lsa
        if (this.tokenExpiry && new Date() >= this.tokenExpiry) {
            console.log('Token muddati tugagan, yangilanmoqda...');
            await this.refreshToken();
            return;
        }

        // Token muddati yaqinlashgan bo'lsa (1 kun qolgan)
        if (this.tokenExpiry && new Date() >= new Date(this.tokenExpiry.getTime() - (24 * 60 * 60 * 1000))) {
            console.log('Token muddati yaqinlashgan, oldindan yangilanmoqda...');
            await this.refreshToken();
            return;
        }
    }

    /**
     * Tokenni yangilash
     * @returns {Promise<Object>} - Yangilash natijasi
     */
    async refreshToken() {
        // Agar refresh jarayoni davom etayotgan bo'lsa, kutish
        if (this.refreshInProgress) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: !!this.token, token: this.token };
        }

        this.refreshInProgress = true;
        
        try {
            console.log('Eskiz.uz token yangilanmoqda...');
            
            const response = await axios.post(
                `${this.baseUrl}${eskizConfig.endpoints.auth}`,
                {
                    email: eskizConfig.email,
                    password: eskizConfig.password
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 soniya timeout
                }
            );

            if (response.data && response.data.token) {
                this.token = response.data.token;
                // Token 30 kun amal qiladi, lekin 25 kundan keyin yangilaymiz
                this.tokenExpiry = new Date(Date.now() + (25 * 24 * 60 * 60 * 1000));
                
                console.log('Eskiz.uz token muvaffaqiyatli yangilandi');
                
                return {
                    success: true,
                    token: response.data.token,
                    message: 'Token muvaffaqiyatli yangilandi'
                };
            }

            console.error('Eskiz.uz javobida token yo\'q:', response.data);
            return {
                success: false,
                error: 'Token olinmadi - javobda token mavjud emas'
            };
        } catch (error) {
            console.error('Token yangilashda xatolik:', error.response?.data || error.message);
            
            // Xatolik turini aniqlash
            let errorMessage = 'Token yangilashda noma\'lum xatolik';
            if (error.response) {
                errorMessage = error.response.data?.message || `HTTP ${error.response.status} xatolik`;
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'So\'rov vaqti tugadi (timeout)';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage = 'Internet aloqasi yo\'q';
            }
            
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            this.refreshInProgress = false;
        }
    }

    /**
     * Balansni tekshirish
     * @returns {Promise<Object>} - Balans ma'lumotlari
     */
    async getBalance() {
        try {
            // Token tekshiruvi va avtomatik yangilash
            await this.ensureValidToken();
            
            if (!this.token) {
                return {
                    success: false,
                    error: 'Token olishda xatolik'
                };
            }

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
            
            // Token muddati tugagan bo'lsa, yangilashga harakat qilish
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('Balance olishda token muddati tugagan, yangilanmoqda...');
                this.token = null;
                this.tokenExpiry = null;
                
                const refreshResult = await this.refreshToken();
                if (refreshResult.success) {
                    console.log('Token yangilandi, balance qayta olinmoqda...');
                    return this.getBalance();
                }
            }
            
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