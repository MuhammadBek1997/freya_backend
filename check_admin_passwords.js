const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAdminPasswords() {
    try {
        console.log('🔍 Admin parollarini tekshirish...\n');
        
        const result = await pool.query(`
            SELECT 
                username, 
                password_hash
            FROM admins 
            WHERE username IN ('admin1', 'admin2', 'admin3')
            ORDER BY username
        `);
        
        result.rows.forEach((admin) => {
            console.log(`${admin.username}: ${admin.password_hash.substring(0, 20)}...`);
        });
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkAdminPasswords();