require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function fixProductionAdmin1() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔧 Production database da admin1 parolini o\'rnatish...\n');

        // Generate password hash for "admin123"
        const password = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('🔐 Parol hash yaratildi:', hashedPassword.substring(0, 20) + '...');

        // Update admin1 password
        const updateResult = await pool.query(
            'UPDATE admins SET password = $1 WHERE username = $2 RETURNING *',
            [hashedPassword, 'admin1']
        );

        if (updateResult.rows.length > 0) {
            console.log('✅ admin1 paroli muvaffaqiyatli yangilandi!');
            const admin = updateResult.rows[0];
            console.log(`   ID: ${admin.id}`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Password hash: ${admin.password.substring(0, 20)}...`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Salon ID: ${admin.salon_id}`);
        } else {
            console.log('❌ admin1 topilmadi yoki yangilanmadi!');
        }

        // Test the password
        console.log('\n🧪 Parolni tekshirish...');
        const testResult = await bcrypt.compare(password, hashedPassword);
        console.log('Parol tekshiruvi:', testResult ? '✅ To\'g\'ri' : '❌ Noto\'g\'ri');

    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

fixProductionAdmin1();