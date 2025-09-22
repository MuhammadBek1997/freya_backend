// Telefon raqam validation middleware

// Uzbek telefon raqam formatini tekshirish
const validatePhoneFormat = (phone) => {
    // Uzbek telefon raqam formati: +998XXXXXXXXX
    const phoneRegex = /^\+998[0-9]{9}$/;
    return phoneRegex.test(phone);
};

// Telefon raqam formatini tekshirish middleware
const validatePhoneNumber = (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({
            success: false,
            message: 'Telefon raqam majburiy'
        });
    }

    if (!validatePhoneFormat(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Telefon raqam formati noto\'g\'ri. To\'g\'ri format: +998XXXXXXXXX'
        });
    }

    // Telefon raqamni normalize qilish (bo'shliqlar va boshqa belgilarni olib tashlash)
    req.body.phone = phone.trim();
    
    next();
};

// Telefon raqam mavjudligini tekshirish middleware
const { query } = require('../config/database');

const checkPhoneExists = () => {
    return async (req, res, next) => {
        try {
            const { phone } = req.body;
            
            const result = await query(
                'SELECT id FROM users WHERE phone = ?',
                [phone]
            );

            if (result.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan'
                });
            }

            next();
        } catch (error) {
            console.error('Check phone exists error:', error);
            res.status(500).json({
                success: false,
                message: 'Server xatosi'
            });
        }
    };
};

// Telefon raqam mavjudligini tekshirish (login uchun)
const checkPhoneExistsForLogin = () => {
    return async (req, res, next) => {
        try {
            const { phone } = req.body;
            
            const result = await query(
                'SELECT id FROM users WHERE phone = ? AND registration_step = 2',
                [phone]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bu telefon raqam bilan ro\'yxatdan o\'tilmagan'
                });
            }

            next();
        } catch (error) {
            console.error('Check phone exists for login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server xatosi'
            });
        }
    };
};

// Email formatini tekshirish middleware (optional)
const validateEmailFormat = (req, res, next) => {
    const { email } = req.body;

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email formati noto\'g\'ri'
            });
        }
        
        // Email ni normalize qilish
        req.body.email = email.trim().toLowerCase();
    }

    next();
};

// Parol kuchini tekshirish middleware
const validatePasswordStrength = (req, res, next) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Parol majburiy'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
        });
    }

    if (password.length > 128) {
        return res.status(400).json({
            success: false,
            message: 'Parol juda uzun (maksimal 128 ta belgi)'
        });
    }

    next();
};

// Verification code formatini tekshirish
const validateVerificationCode = (req, res, next) => {
    const { verificationCode } = req.body;

    if (!verificationCode) {
        return res.status(400).json({
            success: false,
            message: 'Tasdiqlash kodi majburiy'
        });
    }

    if (!/^\d{6}$/.test(verificationCode)) {
        return res.status(400).json({
            success: false,
            message: 'Tasdiqlash kodi 6 ta raqamdan iborat bo\'lishi kerak'
        });
    }

    next();
};

// Ism va familiya formatini tekshirish
const validateNameFormat = (req, res, next) => {
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({
            success: false,
            message: 'Ism va familiya majburiy'
        });
    }

    if (firstName.length < 2 || firstName.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Ism 2-50 ta belgi orasida bo\'lishi kerak'
        });
    }

    if (lastName.length < 2 || lastName.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Familiya 2-50 ta belgi orasida bo\'lishi kerak'
        });
    }

    // Faqat harflar va bo'shliqlarni qabul qilish
    const nameRegex = /^[a-zA-ZА-Яа-яЁёўғҳқ\s]+$/;
    if (!nameRegex.test(firstName)) {
        return res.status(400).json({
            success: false,
            message: 'Ismda faqat harflar bo\'lishi kerak'
        });
    }

    if (!nameRegex.test(lastName)) {
        return res.status(400).json({
            success: false,
            message: 'Familiyada faqat harflar bo\'lishi kerak'
        });
    }

    // Normalize qilish
    req.body.firstName = firstName.trim();
    req.body.lastName = lastName.trim();

    next();
};

module.exports = {
    validatePhoneNumber,
    checkPhoneExists,
    checkPhoneExistsForLogin,
    validateEmailFormat,
    validatePasswordStrength,
    validateVerificationCode,
    validateNameFormat
};