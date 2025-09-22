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
        const { phone, firstName, lastName, location } = req.body;

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
                 location = $5, registration_step = 2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING id, phone, email, first_name, last_name, full_name, username, location, registration_step`,
            [firstName, lastName, `${firstName} ${lastName}`, username, location, user.id]
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
                    location: updatedUser.location,
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
        console.log('Login attempt started');
        const { phone, password } = req.body;
        console.log('Phone:', phone, 'Password length:', password ? password.length : 'undefined');

        if (!phone || !password) {
            console.log('Missing phone or password');
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam va parol majburiy'
            });
        }

        // Foydalanuvchini topish - eng sodda SQL
        console.log('Searching for user with phone:', phone);
        const result = await pool.query(
            'SELECT * FROM users WHERE phone = $1',
            [phone]
        );
        console.log('Query result rows:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('User not found');
            return res.status(401).json({
                success: false,
                message: 'Telefon raqam yoki parol noto\'g\'ri'
            });
        }

        const user = result.rows[0];
        console.log('User found, registration_step:', user.registration_step);

        // Registration step tekshirish
        if (user.registration_step !== 2) {
            console.log('Registration not completed');
            return res.status(401).json({
                success: false,
                message: 'Ro\'yxatdan o\'tish tugallanmagan'
            });
        }

        // Parolni tekshirish
        console.log('Checking password...');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('Invalid password');
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
                    phone: user.phone
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

// Foydalanuvchini o'chirish
const deleteUser = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validatsiya
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam majburiy'
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Parol majburiy'
            });
        }

        // Foydalanuvchini topish
        const userQuery = 'SELECT * FROM users WHERE phone = $1';
        const userResult = await pool.query(userQuery, [phone]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        const user = userResult.rows[0];

        // Parolni tekshirish
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Noto\'g\'ri parol'
            });
        }

        // Foydalanuvchi bilan bog'liq barcha ma'lumotlarni o'chirish
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Foydalanuvchi bilan bog'liq xabarlarni o'chirish (sender yoki receiver sifatida)
            await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [user.id]);

            // Foydalanuvchi bilan bog'liq user_favorites'ni o'chirish
            await client.query('DELETE FROM user_favorites WHERE user_id = $1', [user.id]);

            // Foydalanuvchi bilan bog'liq notifications'ni o'chirish
            await client.query('DELETE FROM notifications WHERE user_id = $1', [user.id]);

            // Foydalanuvchi bilan bog'liq user_sessions'ni o'chirish
            await client.query('DELETE FROM user_sessions WHERE user_id = $1', [user.id]);

            // Foydalanuvchi bilan bog'liq chat_participants'ni o'chirish
            await client.query('DELETE FROM chat_participants WHERE participant_id = $1 AND participant_type = $2', [user.id, 'user']);

            // Foydalanuvchini o'chirish
            await client.query('DELETE FROM users WHERE id = $1', [user.id]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// User ma'lumotlarini yangilash
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, password, location } = req.body;

        // Foydalanuvchini tekshirish
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        // Validatsiya
        if (phone && !validatePhoneNumber(phone)) {
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

        // Telefon raqam yoki email boshqa foydalanuvchida mavjudligini tekshirish
        if (phone) {
            const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1 AND id != $2', [phone, id]);
            if (phoneCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu telefon raqam boshqa foydalanuvchi tomonidan ishlatilmoqda'
                });
            }
        }

        if (email) {
            const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email boshqa foydalanuvchi tomonidan ishlatilmoqda'
                });
            }
        }

        // Yangilanishi kerak bo'lgan maydonlarni aniqlash
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (name) {
            updateFields.push(`name = $${paramIndex}`);
            updateValues.push(name);
            paramIndex++;
        }

        if (email !== undefined) {
            updateFields.push(`email = $${paramIndex}`);
            updateValues.push(email);
            paramIndex++;
        }

        if (phone) {
            updateFields.push(`phone = $${paramIndex}`);
            updateValues.push(phone);
            paramIndex++;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${paramIndex}`);
            updateValues.push(hashedPassword);
            paramIndex++;
        }

        if (location !== undefined) {
            updateFields.push(`location = $${paramIndex}`);
            updateValues.push(location);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Yangilanishi kerak bo\'lgan maydon ko\'rsatilmagan'
            });
        }

        updateFields.push(`updated_at = $${paramIndex}`);
        updateValues.push(new Date());
        updateValues.push(id);

        const updateQuery = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex + 1}
            RETURNING id, name, email, phone, location, created_at, updated_at
        `;

        const result = await pool.query(updateQuery, updateValues);

        res.json({
            success: true,
            message: 'Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// User uchun alohida token generatsiya qilish
const generateUserToken = async (req, res) => {
    try {
        const { id } = req.params;

        // Foydalanuvchini tekshirish
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        const user = userResult.rows[0];

        // User uchun maxsus token yaratish (admin tokendan farqli)
        const userToken = jwt.sign(
            { 
                userId: user.id, 
                phone: user.phone,
                type: 'user_readonly',
                name: user.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' } // 30 kun amal qiladi
        );

        res.json({
            success: true,
            message: 'User token muvaffaqiyatli yaratildi',
            token: userToken,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Generate User Token Error:', error);
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
    sendPhoneChangeCode,
    deleteUser,
    updateUser,
    generateUserToken
};