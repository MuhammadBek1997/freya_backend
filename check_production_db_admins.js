require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

async function checkProductionDbAdmins() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔍 Production database admins tekshirilmoqda...\n');

        // Check if admins table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admins'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Admins jadvali mavjud emas!');
            return;
        }

        // Get all admins
        const adminsResult = await pool.query('SELECT * FROM admins ORDER BY created_at');
        
        console.log(`📊 Jami adminlar soni: ${adminsResult.rows.length}\n`);
        
        if (adminsResult.rows.length > 0) {
            console.log('👥 Mavjud adminlar:');
            adminsResult.rows.forEach((admin, index) => {
                console.log(`${index + 1}. ID: ${admin.id}`);
                console.log(`   Username: ${admin.username}`);
                console.log(`   Email: ${admin.email || 'N/A'}`);
                console.log(`   Role: ${admin.role || 'N/A'}`);
                console.log(`   Salon ID: ${admin.salon_id || 'N/A'}`);
                console.log(`   Created: ${admin.created_at}`);
                console.log(`   Password hash: ${admin.password ? admin.password.substring(0, 20) + '...' : 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('❌ Hech qanday admin topilmadi!');
        }

        // Check for admin1 specifically
        const admin1Check = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin1']);
        
        if (admin1Check.rows.length > 0) {
            console.log('✅ admin1 topildi:');
            const admin1 = admin1Check.rows[0];
            console.log(`   ID: ${admin1.id}`);
            console.log(`   Username: ${admin1.username}`);
            console.log(`   Email: ${admin1.email || 'N/A'}`);
            console.log(`   Password hash: ${admin1.password}`);
            console.log(`   Role: ${admin1.role || 'N/A'}`);
        } else {
            console.log('❌ admin1 topilmadi!');
        }

    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkProductionDbAdmins();