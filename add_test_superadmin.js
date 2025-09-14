const { pool } = require('./config/database');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function addTestSuperadmin() {
    try {
        // Password hash qilish
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        
        // Test superadmin qo'shish
        const superadminResult = await pool.query(`
            INSERT INTO admins (username, email, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, ['testsuperadmin', 'testsuperadmin@freya.com', hashedPassword, 'Test Super Administrator', 'superadmin', true]);
        
        console.log('Test superadmin yaratildi:', superadminResult.rows[0]);
        
        process.exit(0);
    } catch (error) {
        console.error('Xato:', error);
        process.exit(1);
    }
}

addTestSuperadmin();