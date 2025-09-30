const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateAdminRole() {
    try {
        console.log('🔄 Admin rollarini yangilamoqda...\n');
        
        // Hozirgi admin rollarini ko'rish
        const currentRoles = await pool.query('SELECT username, role FROM admins ORDER BY username');
        console.log('📋 Hozirgi admin rollari:');
        console.log('='.repeat(50));
        currentRoles.rows.forEach(admin => {
            console.log(`  ${admin.username}: ${admin.role}`);
        });
        console.log('');
        
        // admin2 ning rolini super_admin dan private_admin ga o'zgartirish
        const updateResult = await pool.query(
            'UPDATE admins SET role = $1 WHERE username = $2 AND role = $3',
            ['private_admin', 'admin2', 'super_admin']
        );
        
        console.log(`✅ ${updateResult.rowCount} ta admin roli yangilandi`);
        
        // Yangilangan rollarni tekshirish
        const updatedRoles = await pool.query('SELECT username, role FROM admins ORDER BY username');
        console.log('\n📋 Yangilangan admin rollari:');
        console.log('='.repeat(50));
        updatedRoles.rows.forEach(admin => {
            console.log(`  ${admin.username}: ${admin.role}`);
        });
        
        console.log('\n✅ Admin rollari muvaffaqiyatli yangilandi!');
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
    }
}

updateAdminRole();