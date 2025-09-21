const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const smsService = require('../services/smsService');

// Telefon raqam formatini tekshirish
const validatePhoneNumber = (phone) => {
    // Uzbek telefon raqam formati: +998XXXXXXXXX
    const phoneRegex = /^\+998[0-9]{9}$/;
    return phoneRegex.test(phone);
};

// Email formatini tekshirish
const validateEmail = (email) => {
    if (!email) return true; // Email optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Tasodifiy 6 xonali kod generatsiya qilish (SMS service'dan foydalanish)
const generateVerificationCode = () => {
    return smsService.generateVerificationCode();
};

// 1-bosqich: Telefon, email va parol bilan ro'yxatdan o'tish
const registerStep1 = async (req, res) => {
    try {
        const { phone, email, password } = req.body;

        // Validatsiya
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam va parol majburiy'
            });
        }

        if (!validatePhoneNumber(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam formati noto\'g\'ri. Namuna: +998901234567'
            });
        }

        if (email && !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email formati noto\'g\'ri'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
            });
        }

        // Telefon raqam allaqachon mavjudligini tekshirish
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE phone = $1',
            [phone]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan'
            });
        }

        // Email mavjudligini tekshirish (agar berilgan bo'lsa)
        if (email) {
            const existingEmail = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email allaqachon ro\'yxatdan o\'tgan'
                });
            }
        }

        // Parolni hash qilish
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Eskiz.uz orqali SMS yuborish (avtomatik random kod bilan)
        const smsResult = await smsService.sendVerificationCode(phone);
        
        // SMS yuborilgan kod va vaqtni olish
        const verificationCode = smsResult.verificationCode || generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa

        // Foydalanuvchini 1-bosqich bilan saqlash
        const result = await pool.query(
            `INSERT INTO users (phone, email, password_hash, registration_step, verification_code, verification_expires_at, created_at)
             VALUES ($1, $2, $3, 1, $4, $5, CURRENT_TIMESTAMP)
             RETURNING id, phone, email, registration_step`,
            [phone, email, hashedPassword, verificationCode, verificationExpires]
        );

        const user = result.rows[0];
        
        if (!smsResult.success) {
            console.error('SMS yuborishda xatolik:', smsResult.error);
            // SMS yuborilmasa ham, foydalanuvchi ro'yxatdan o'tsin (development uchun)
        }

        console.log(`Verification code for ${phone}: ${verificationCode}`);
        console.log('SMS yuborish natijasi:', smsResult);

        res.status(201).json({
            success: true,
            message: 'Ro\'yxatdan o\'tish 1-bosqichi muvaffaqiyatli. Telefon raqamingizga tasdiqlash kodi yuborildi.',
            data: {
                userId: user.id,
                phone: user.phone,
                email: user.email,
                registrationStep: user.registration_step,
                smsStatus: smsResult.success ? 'yuborildi' : 'yuborilmadi',
                // Development uchun verification code qaytaramiz
                verificationCode: verificationCode
            }
        });

    } catch (error) {
        console.error('Register Step 1 Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Telefon raqamni tasdiqlash
const verifyPhone = async (req, res) => {
    try {
        const { phone, verificationCode } = req.body;

        if (!phone || !verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam va tasdiqlash kodi majburiy'
            });
        }

        // Foydalanuvchini topish va kod tekshirish
        const result = await pool.query(
            `SELECT id, phone, email, verification_code, verification_expires_at, registration_step
             FROM users 
             WHERE phone = $1 AND registration_step = 1`,
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi yoki allaqachon tasdiqlangan'
            });
        }

        const user = result.rows[0];

        // Kod muddati tugaganligini tekshirish
        if (new Date() > new Date(user.verification_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Tasdiqlash kodi muddati tugagan'
            });
        }

        // Kodni tekshirish
        if (user.verification_code !== verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Tasdiqlash kodi noto\'g\'ri'
            });
        }

        // Telefon raqamni tasdiqlangan deb belgilash
        await pool.query(
            `UPDATE users 
             SET phone_verified = true, verification_code = NULL, verification_expires_at = NULL
             WHERE id = $1`,
            [user.id]
        );

        res.json({
            success: true,
            message: 'Telefon raqam muvaffaqiyatli tasdiqlandi',
            data: {
                userId: user.id,
                phone: user.phone,
                email: user.email,
                phoneVerified: true
            }
        });

    } catch (error) {
        console.error('Verify Phone Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// 2-bosqich: Ism va familiya qo'shish
const registerStep2 = async (req, res) => {
    try {
        const { phone, firstName, lastName } = req.body;

        if (!phone || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam, ism va familiya majburiy'
            });
        }

        if (firstName.length < 2 || lastName.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Ism va familiya kamida 2 ta belgidan iborat bo\'lishi kerak'
            });
        }

        // Foydalanuvchini topish va telefon tasdiqlangan ekanligini tekshirish
        const result = await pool.query(
            `SELECT id, phone, email, phone_verified, registration_step
             FROM users 
             WHERE phone = $1 AND registration_step = 1 AND phone_verified = true`,
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi yoki telefon raqam tasdiqlanmagan'
            });
        }

        const user = result.rows[0];

        // Username generatsiya qilish (phone raqamdan)
        const username = phone.replace('+', '').replace(/\D/g, '');

        // Foydalanuvchi ma'lumotlarini yangilash va 2-bosqichni yakunlash
        const updateResult = await pool.query(
            `UPDATE users 
             SET first_name = $1, last_name = $2, full_name = $3, username = $4, 
                 registration_step = 2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING id, phone, email, first_name, last_name, full_name, username, registration_step`,
            [firstName, lastName, `${firstName} ${lastName}`, username, user.id]
        );

        const updatedUser = updateResult.rows[0];

        // JWT token generatsiya qilish
        const token = jwt.sign(
            { 
                userId: updatedUser.id, 
                phone: updatedUser.phone,
                role: 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi',
            data: {
                user: {
                    id: updatedUser.id,
                    phone: updatedUser.phone,
                    email: updatedUser.email,
                    firstName: updatedUser.first_name,
                    lastName: updatedUser.last_name,
                    fullName: updatedUser.full_name,
                    username: updatedUser.username,
                    registrationStep: updatedUser.registration_step
                },
                token: token
            }
        });

    } catch (error) {
        console.error('Register Step 2 Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// User login
const loginUser = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam va parol majburiy'
            });
        }

        // Foydalanuvchini topish
        const result = await pool.query(
            `SELECT id, phone, email, password_hash, first_name, last_name, full_name, 
                    username, registration_step, phone_verified
             FROM users 
             WHERE phone = $1 AND registration_step = 2`,
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Telefon raqam yoki parol noto\'g\'ri'
            });
        }

        const user = result.rows[0];

        // Parolni tekshirish
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Telefon raqam yoki parol noto\'g\'ri'
            });
        }

        // JWT token generatsiya qilish
        const token = jwt.sign(
            { 
                userId: user.id, 
                phone: user.phone,
                role: 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Muvaffaqiyatli login qilindi',
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    fullName: user.full_name,
                    username: user.username
                },
                token: token
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Parolni tiklash uchun SMS yuborish
const sendPasswordResetCode = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam kiritilishi shart'
            });
        }

        if (!validatePhoneNumber(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam formati noto\'g\'ri'
            });
        }

        // Foydalanuvchi mavjudligini tekshirish
        const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bu telefon raqam bilan ro\'yxatdan o\'tmagan'
            });
        }

        // SMS yuborish
        const smsResult = await smsService.sendPasswordResetCode(phone);
        
        if (smsResult.success) {
            // Verification code'ni bazaga saqlash
            const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa
            await pool.query(
                'UPDATE users SET verification_code = $1, verification_expires_at = $2 WHERE phone = $3',
                [smsResult.verificationCode, verificationExpires, phone]
            );
        }

        res.json({
            success: true,
            message: 'Parolni tiklash kodi yuborildi',
            data: {
                phone: phone,
                smsStatus: smsResult.success ? 'yuborildi' : 'yuborilmadi',
                verificationCode: smsResult.verificationCode // Development uchun
            }
        });

    } catch (error) {
        console.error('Password Reset Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Telefon raqamni o'zgartirish uchun SMS yuborish
const sendPhoneChangeCode = async (req, res) => {
    try {
        const { newPhone } = req.body;
        const userId = req.user.id; // JWT token'dan olinadi

        if (!newPhone) {
            return res.status(400).json({
                success: false,
                message: 'Yangi telefon raqam kiritilishi shart'
            });
        }

        if (!validatePhoneNumber(newPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam formati noto\'g\'ri'
            });
        }

        // Yangi telefon raqam allaqachon ishlatilganligini tekshirish
        const existingUser = await pool.query('SELECT id FROM users WHERE phone = $1 AND id != $2', [newPhone, userId]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu telefon raqam allaqachon ishlatilmoqda'
            });
        }

        // SMS yuborish
        const smsResult = await smsService.sendPhoneChangeCode(newPhone);
        
        if (smsResult.success) {
            // Verification code'ni bazaga saqlash
            const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa
            await pool.query(
                'UPDATE users SET verification_code = $1, verification_expires_at = $2 WHERE id = $3',
                [smsResult.verificationCode, verificationExpires, userId]
            );
        }

        res.json({
            success: true,
            message: 'Telefon raqamni o\'zgartirish kodi yuborildi',
            data: {
                newPhone: newPhone,
                smsStatus: smsResult.success ? 'yuborildi' : 'yuborilmadi',
                verificationCode: smsResult.verificationCode // Development uchun
            }
        });

    } catch (error) {
        console.error('Phone Change Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

module.exports = {
    registerStep1,
    verifyPhone,
    registerStep2,
    loginUser,
    sendPasswordResetCode,
    sendPhoneChangeCode
};