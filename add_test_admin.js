const { pool } = require('./config/database');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function addTestAdmin() {
    try {
        // Password hash qilish
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Test admin qo'shish
        const adminResult = await pool.query(`
            INSERT INTO admins (username, email, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, ['testadmin', 'test@admin.com', hashedPassword, 'Test Admin', 'admin', true]);
        
        console.log('Test admin yaratildi:', adminResult.rows[0]);
        
        process.exit(0);
    } catch (error) {
        console.error('Xato:', error);
        process.exit(1);
    }
}

addTestAdmin();