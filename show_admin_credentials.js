require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function showAdminCredentials() {
    try {
        console.log('🔐 Salon adminlarning login ma\'lumotlari:\n');
        
        const result = await pool.query(`
            SELECT 
                id,
                username,
                email,
                full_name,
                salon_id,
                created_at
            FROM admins 
            ORDER BY created_at ASC
        `);

        if (result.rows.length === 0) {
            console.log('❌ Hech qanday admin topilmadi');
            return;
        }

        console.log(`📊 Jami faol adminlar soni: ${result.rows.length}\n`);

        result.rows.forEach((admin, index) => {
            console.log(`${index + 1}. Admin:`);
            console.log(`   👤 Username: ${admin.username}`);
            console.log(`   🔑 Password: admin123`); // Default password for all admins
            console.log(`   📧 Email: ${admin.email}`);
            console.log(`   👨‍💼 Full Name: ${admin.full_name}`);
            console.log(`   🏢 Salon ID: ${admin.salon_id || 'null (Super Admin)'}`);
            console.log(`   📅 Created: ${admin.created_at}`);
            console.log('');
        });

        console.log('📝 Eslatma: Barcha adminlarning paroli "admin123" dir');
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
    } finally {
        await pool.end();
    }
}

showAdminCredentials();