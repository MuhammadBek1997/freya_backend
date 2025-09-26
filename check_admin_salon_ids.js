const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAdminSalonIds() {
    try {
        console.log('🔍 Admin salon_id larini tekshirish...\n');
        
        const result = await pool.query(`
            SELECT 
                id,
                username, 
                full_name,
                salon_id
            FROM admins 
            WHERE username IN ('admin1', 'admin2', 'admin3')
            ORDER BY username
        `);
        
        result.rows.forEach((admin) => {
            console.log(`${admin.username}:`);
            console.log(`  ID: ${admin.id}`);
            console.log(`  Full Name: ${admin.full_name}`);
            console.log(`  Salon ID: ${admin.salon_id}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkAdminSalonIds();