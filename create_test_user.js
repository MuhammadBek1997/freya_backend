const bcrypt = require('bcrypt');
const { pool } = require('./config/database');

async function createTestUser() {
    try {
        const phone = '+998909999999';
        const password = 'testpassword123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Avval foydalanuvchi mavjudligini tekshirish
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE phone = $1',
            [phone]
        );
        
        if (existingUser.rows.length > 0) {
            console.log('Foydalanuvchi allaqachon mavjud');
            return;
        }
        
        // Yangi foydalanuvchi yaratish
        const result = await pool.query(
            `INSERT INTO users (phone, password_hash, first_name, last_name, is_verified, phone_verified, is_active, registration_step, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id`,
            [phone, hashedPassword, 'Test', 'User', true, true, true, 2]
        );
        
        console.log('Test foydalanuvchi yaratildi:', {
            id: result.rows[0].id,
            phone: phone,
            password: password
        });
        
    } catch (error) {
        console.error('Xatolik:', error);
    } finally {
        process.exit();
    }
}

createTestUser();