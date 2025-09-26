const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAllAdmins() {
    try {
        console.log('🔍 Barcha adminlarni tekshirish...\n');
        
        const result = await pool.query(`
            SELECT 
                id, 
                username, 
                email, 
                full_name, 
                salon_id,
                is_active,
                created_at
            FROM admins 
            WHERE is_active = true
            ORDER BY created_at ASC
        `);
        
        console.log(`📊 Jami faol adminlar soni: ${result.rows.length}\n`);
        
        result.rows.forEach((admin, index) => {
            console.log(`${index + 1}. Admin:`);
            console.log(`   ID: ${admin.id}`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Full Name: ${admin.full_name}`);
            console.log(`   Salon ID: ${admin.salon_id}`);
            console.log(`   Created: ${admin.created_at}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkAllAdmins();