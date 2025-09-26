const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const smsService = require('../services/smsService');
const { getImageAsBase64, deleteOldImage } = require('../middleware/imageUpload');
const path = require('path');

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
        const { phone, password } = req.body;

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

        // Parolni hash qilish
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Eskiz.uz orqali SMS yuborish (avtomatik random kod bilan)
        const smsResult = await smsService.sendVerificationCode(phone);
        
        // SMS yuborilgan kod va vaqtni olish
        const verificationCode = smsResult.verificationCode || generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa

        // Foydalanuvchini 1-bosqich bilan saqlash (email null)
        const result = await pool.query(
            `INSERT INTO users (phone, email, password_hash, registration_step, verification_code, verification_expires_at, created_at)
             VALUES ($1, $2, $3, 1, $4, $5, CURRENT_TIMESTAMP)
             RETURNING id, phone, email, registration_step`,
            [phone, null, hashedPassword, verificationCode, verificationExpires]
        );

        const user = result.rows[0];
        
        if (!smsResult.success) {
            console.error('SMS yuborishda xatolik:', smsResult.error);
            // SMS yuborilmasa ham, foydalanuvchi ro'yxatdan o'tsin (development uchun)
        }

        res.status(201).json({
            success: true,
            message: 'Ro\'yxatdan o\'tish 1-bosqichi muvaffaqiyatli. Telefon raqamingizga tasdiqlash kodi yuborildi.',
            data: {
                userId: user.id,
                phone: user.phone,
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

// 2-bosqich: Username va email qo'shish
const registerStep2 = async (req, res) => {
    try {
        const { phone, username, email } = req.body;

        if (!phone || !username) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam va username majburiy'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username kamida 3 ta belgidan iborat bo\'lishi kerak'
            });
        }

        // Username formatini tekshirish (faqat harflar, raqamlar va _ ruxsat etilgan)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username faqat harflar, raqamlar va _ belgisidan iborat bo\'lishi kerak'
            });
        }

        // Email formatini tekshirish (agar berilgan bo'lsa)
        if (email && !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email formati noto\'g\'ri'
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

        // Username allaqachon mavjudligini tekshirish
        const existingUsername = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [username, user.id]
        );

        if (existingUsername.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu username allaqachon band'
            });
        }

        // Email mavjudligini tekshirish (agar berilgan bo'lsa)
        if (email) {
            const existingEmail = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, user.id]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email allaqachon ro\'yxatdan o\'tgan'
                });
            }
        }

        // Foydalanuvchi ma'lumotlarini yangilash va 2-bosqichni yakunlash
        const updateResult = await pool.query(
            `UPDATE users 
             SET username = $1, email = $2, registration_step = 2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, phone, email, username, registration_step`,
            [username, email, user.id]
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
            'SELECT * FROM users WHERE phone = $1',
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Telefon raqam yoki parol noto\'g\'ri'
            });
        }

        const user = result.rows[0];

        // Registration step tekshirish
        if (user.registration_step !== 2) {
            return res.status(401).json({
                success: false,
                message: 'Ro\'yxatdan o\'tish tugallanmagan'
            });
        }

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

            // Foydalanuvchi bilan bog'liq user_chats'ni o'chirish (sender yoki receiver sifatida)
            await client.query('DELETE FROM user_chats WHERE sender_id = $1 OR receiver_id = $1', [user.id]);

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
            RETURNING id, name, email, phone, location, image, created_at, updated_at
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

// User location ma'lumotlarini yangilash
const updateUserLocation = async (req, res) => {
    try {
        const { latitude, longitude, address, city, country, location_permission } = req.body;
        const userId = req.user.userId; // JWT tokendan olinadi

        // Validatsiya
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude va longitude majburiy'
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // Koordinatalarni tekshirish
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri koordinatalar'
            });
        }

        // Foydalanuvchini tekshirish
        const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        // Location ma'lumotlarini yangilash
        const updateQuery = `
            UPDATE users 
            SET latitude = $1, 
                longitude = $2, 
                address = $3, 
                city = $4, 
                country = $5, 
                location_permission = $6,
                location_updated_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING id, latitude, longitude, address, city, country, location_permission, location_updated_at
        `;

        const result = await pool.query(updateQuery, [
            lat, 
            lng, 
            address || null, 
            city || null, 
            country || null, 
            location_permission !== undefined ? location_permission : true,
            userId
        ]);

        res.json({
            success: true,
            message: 'Location ma\'lumotlari muvaffaqiyatli yangilandi',
            data: {
                user_id: result.rows[0].id,
                location: {
                    latitude: result.rows[0].latitude,
                    longitude: result.rows[0].longitude,
                    address: result.rows[0].address,
                    city: result.rows[0].city,
                    country: result.rows[0].country,
                    permission: result.rows[0].location_permission,
                    updated_at: result.rows[0].location_updated_at
                }
            }
        });

    } catch (error) {
        console.error('Update User Location Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// User location ma'lumotlarini olish
const getUserLocation = async (req, res) => {
    try {
        const userId = req.user.userId; // JWT tokendan olinadi

        // Foydalanuvchi location ma'lumotlarini olish
        const result = await pool.query(`
            SELECT id, latitude, longitude, address, city, country, location_permission, location_updated_at
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            data: {
                user_id: user.id,
                location: {
                    latitude: user.latitude,
                    longitude: user.longitude,
                    address: user.address,
                    city: user.city,
                    country: user.country,
                    permission: user.location_permission,
                    updated_at: user.location_updated_at
                },
                has_location: !!(user.latitude && user.longitude),
                permission_granted: user.location_permission === true
            }
        });

    } catch (error) {
        console.error('Get User Location Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId; // JWT tokendan olinadi

        // Foydalanuvchi ma'lumotlarini olish
        const result = await pool.query(`
            SELECT id, full_name as name, email, phone, location, image, created_at, updated_at
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            data: {
                user: user
            }
        });

    } catch (error) {
        console.error('Get User Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Parolni tiklash (tasdiqlash kodi bilan)
const resetPassword = async (req, res) => {
    try {
        const { phone, verificationCode, newPassword } = req.body;

        // Validatsiya
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam kiritilishi shart'
            });
        }

        if (!verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Tasdiqlash kodi kiritilishi shart'
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Yangi parol kiritilishi shart'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
            });
        }

        if (!validatePhoneNumber(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam formati noto\'g\'ri'
            });
        }

        // Foydalanuvchini topish va tasdiqlash kodini tekshirish
        const userQuery = `
            SELECT id, verification_code, verification_expires_at 
            FROM users 
            WHERE phone = $1
        `;
        const userResult = await pool.query(userQuery, [phone]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bu telefon raqam bilan ro\'yxatdan o\'tmagan'
            });
        }

        const user = userResult.rows[0];

        // Tasdiqlash kodini tekshirish
        if (!user.verification_code) {
            return res.status(400).json({
                success: false,
                message: 'Avval parolni tiklash kodini so\'rang'
            });
        }

        if (user.verification_code !== verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Tasdiqlash kodi noto\'g\'ri'
            });
        }

        // Kodning muddati tugaganligini tekshirish
        if (new Date() > new Date(user.verification_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Tasdiqlash kodining muddati tugagan. Yangi kod so\'rang'
            });
        }

        // Yangi parolni hash qilish
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Parolni yangilash va tasdiqlash kodini tozalash
        const updateQuery = `
            UPDATE users 
            SET password_hash = $1, 
                verification_code = NULL, 
                verification_expires_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, phone
        `;

        const updateResult = await pool.query(updateQuery, [hashedPassword, user.id]);

        res.json({
            success: true,
            message: 'Parol muvaffaqiyatli yangilandi',
            data: {
                userId: updateResult.rows[0].id,
                phone: updateResult.rows[0].phone
            }
        });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// User profil rasmini yuklash
const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Rasm fayli tanlanmagan'
            });
        }

        // Eski rasmni olish
        const getUserQuery = 'SELECT image FROM users WHERE id = $1';
        const userResult = await pool.query(getUserQuery, [userId]);
        const userRows = userResult.rows;
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        // File buffer'dan base64 yaratish
        const mimeType = req.file.mimetype;
        const imageBase64 = getImageAsBase64(req.file.buffer, mimeType);

        // Base64 ni database'ga saqlash
        const updateQuery = 'UPDATE users SET image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        await pool.query(updateQuery, [imageBase64, userId]);

        // Eski rasmni o'chirish (memory storage uchun hech narsa qilmaydi)
        const oldImageData = userRows[0].image;
        if (oldImageData) {
            deleteOldImage(oldImageData);
        }

        res.json({
            success: true,
            message: 'Profil rasmi muvaffaqiyatli yuklandi',
            data: {
                imageBase64: imageBase64
            }
        });

    } catch (error) {
        console.error('Profil rasmini yuklashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi'
        });
    }
};

// User profil rasmini olish
const getProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = 'SELECT image FROM users WHERE id = $1';
        const result = await pool.query(query, [userId]);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        const imageData = rows[0].image;
        
        if (!imageData) {
            return res.json({
                success: true,
                message: 'Profil rasmi mavjud emas',
                data: {
                    imageBase64: null
                }
            });
        }

        // Database'dan kelgan base64 ma'lumotlarini qaytarish
        const imageBase64 = getImageAsBase64(imageData);

        res.json({
            success: true,
            message: 'Profil rasmi muvaffaqiyatli olindi',
            data: {
                imageBase64: imageBase64
            }
        });

    } catch (error) {
        console.error('Profil rasmini olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi'
        });
    }
};

// User profil rasmini o'chirish
const deleteProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;

        // Eski rasmni olish
        const getUserQuery = 'SELECT image FROM users WHERE id = $1';
        const userResult = await pool.query(getUserQuery, [userId]);
        const userRows = userResult.rows;
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }

        const oldImageData = userRows[0].image;

        // Database dan rasm ma'lumotlarini o'chirish
        const updateQuery = 'UPDATE users SET image = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
        await pool.query(updateQuery, [userId]);

        // Memory storage uchun eski rasm ma'lumotlarini tozalash
        if (oldImageData) {
            deleteOldImage(oldImageData);
        }

        res.json({
            success: true,
            message: 'Profil rasmi muvaffaqiyatli o\'chirildi'
        });

    } catch (error) {
        console.error('Profil rasmini o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi'
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
    resetPassword,
    deleteUser,
    updateUser,
    generateUserToken,
    updateUserLocation,
    getUserLocation,
    getUserProfile,
    uploadProfileImage,
    getProfileImage,
    deleteProfileImage
};