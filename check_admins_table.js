const { pool } = require('./config/database');

async function checkAdminsTable() {
    try {
        console.log('🔍 Admins jadval strukturasini tekshirish...\n');

        // Admins jadval strukturasini ko'rish
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position;
        `);

        console.log('📋 Admins jadval ustunlari:');
        tableStructure.rows.forEach(column => {
            console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
        });

        // Mavjud adminlarni ko'rish
        const adminsData = await pool.query('SELECT * FROM admins LIMIT 3');
        console.log('\n👥 Mavjud adminlar:');
        adminsData.rows.forEach((admin, index) => {
            console.log(`\nAdmin ${index + 1}:`);
            Object.keys(admin).forEach(key => {
                console.log(`   ${key}: ${admin[key]}`);
            });
        });

    } catch (error) {
        console.error('❌ Xatolik:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkAdminsTable();