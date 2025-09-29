/**
 * Vaqtinchalik user ma'lumotlarini saqlash xizmati
 * SMS tasdiqlash tugallanmaguncha user ma'lumotlarini xotirada saqlaydi
 */

class TempUserStorage {
    constructor() {
        // In-memory storage for temporary user data
        this.tempUsers = new Map();
        
        // Cleanup expired entries every 15 minutes
        setInterval(() => {
            this.cleanupExpiredUsers();
        }, 15 * 60 * 1000); // 15 minutes
    }

    /**
     * Vaqtinchalik user ma'lumotlarini saqlash
     * @param {string} phone - Telefon raqami
     * @param {Object} userData - User ma'lumotlari
     * @returns {string} - Unique session ID
     */
    storeTempUser(phone, userData) {
        const sessionId = this.generateSessionId();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        
        const tempUserData = {
            sessionId,
            phone,
            ...userData,
            createdAt: new Date(),
            expiresAt,
            verified: false
        };
        
        // Phone raqam bo'yicha saqlash (bir telefon uchun faqat bitta session)
        this.tempUsers.set(phone, tempUserData);
        
        return sessionId;
    }

    /**
     * Vaqtinchalik user ma'lumotlarini olish
     * @param {string} phone - Telefon raqami
     * @returns {Object|null} - User ma'lumotlari yoki null
     */
    getTempUser(phone) {
        const userData = this.tempUsers.get(phone);
        
        if (!userData) {
            return null;
        }
        
        // Muddati tugagan bo'lsa o'chirish
        if (new Date() > userData.expiresAt) {
            this.tempUsers.delete(phone);
            return null;
        }
        
        return userData;
    }

    /**
     * Vaqtinchalik user ma'lumotlarini yangilash
     * @param {string} phone - Telefon raqami
     * @param {Object} updates - Yangilanish ma'lumotlari
     * @returns {boolean} - Muvaffaqiyat holati
     */
    updateTempUser(phone, updates) {
        const userData = this.getTempUser(phone);
        
        if (!userData) {
            return false;
        }
        
        // Ma'lumotlarni yangilash
        Object.assign(userData, updates);
        this.tempUsers.set(phone, userData);
        
        return true;
    }

    /**
     * Vaqtinchalik user ma'lumotlarini o'chirish
     * @param {string} phone - Telefon raqami
     * @returns {boolean} - O'chirildi yoki yo'q
     */
    removeTempUser(phone) {
        return this.tempUsers.delete(phone);
    }

    /**
     * Verification code ni yangilash
     * @param {string} phone - Telefon raqami
     * @param {string} verificationCode - Yangi verification code
     * @param {Date} expiresAt - Code muddati
     * @returns {boolean} - Muvaffaqiyat holati
     */
    updateVerificationCode(phone, verificationCode, expiresAt) {
        return this.updateTempUser(phone, {
            verificationCode,
            verificationExpiresAt: expiresAt
        });
    }

    /**
     * Verification code ni tekshirish
     * @param {string} phone - Telefon raqami
     * @param {string} code - Tekshiriladigan kod
     * @returns {Object} - Tekshirish natijasi
     */
    verifyCode(phone, code) {
        const userData = this.getTempUser(phone);
        
        if (!userData) {
            return {
                success: false,
                message: 'Foydalanuvchi ma\'lumotlari topilmadi'
            };
        }
        
        if (!userData.verificationCode) {
            return {
                success: false,
                message: 'Verification code yuborilmagan'
            };
        }
        
        if (new Date() > userData.verificationExpiresAt) {
            return {
                success: false,
                message: 'Verification code muddati tugagan'
            };
        }
        
        if (userData.verificationCode !== code) {
            return {
                success: false,
                message: 'Verification code noto\'g\'ri'
            };
        }
        
        // Verification muvaffaqiyatli
        this.updateTempUser(phone, { verified: true });
        
        return {
            success: true,
            message: 'Verification muvaffaqiyatli',
            userData
        };
    }

    /**
     * Muddati tugagan userlarni tozalash
     */
    cleanupExpiredUsers() {
        const now = new Date();
        const expiredPhones = [];
        
        for (const [phone, userData] of this.tempUsers.entries()) {
            if (now > userData.expiresAt) {
                expiredPhones.push(phone);
            }
        }
        
        expiredPhones.forEach(phone => {
            this.tempUsers.delete(phone);
        });
        
        if (expiredPhones.length > 0) {
            console.log(`Cleaned up ${expiredPhones.length} expired temp users`);
        }
    }

    /**
     * Unique session ID yaratish
     * @returns {string} - Session ID
     */
    generateSessionId() {
        return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Barcha vaqtinchalik userlar sonini olish (debug uchun)
     * @returns {number} - Userlar soni
     */
    getTempUsersCount() {
        return this.tempUsers.size;
    }

    /**
     * Barcha vaqtinchalik userlarni ko'rish (debug uchun)
     * @returns {Array} - Userlar ro'yxati
     */
    getAllTempUsers() {
        return Array.from(this.tempUsers.values());
    }
}

// Singleton instance
const tempUserStorage = new TempUserStorage();

module.exports = tempUserStorage;