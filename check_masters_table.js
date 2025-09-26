const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function checkMastersTable() {
    try {
        console.log('🔍 Masters jadvalini tekshiryapman...\n');

        // Masters jadval strukturasini olish
        const structureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'masters'
            ORDER BY ordinal_position
        `);

        console.log('📋 Masters jadval ustunlari:');
        structureResult.rows.forEach((column, index) => {
            console.log(`${index + 1}. ${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\n🔍 Masters jadvalidagi ma\'lumotlarni olish...');
        
        // Barcha mastersni olish
        const mastersResult = await pool.query('SELECT * FROM masters ORDER BY id');
        
        console.log(`\n📊 Jami ${mastersResult.rows.length} ta master topildi\n`);

        if (mastersResult.rows.length > 0) {
            mastersResult.rows.forEach((master, index) => {
                console.log(`${index + 1}. Master:`);
                Object.keys(master).forEach(key => {
                    const value = master[key];
                    if (key.includes('password')) {
                        console.log(`   ${key}: ${value ? value.substring(0, 30) + '...' : 'NULL'}`);
                    } else {
                        console.log(`   ${key}: ${value}`);
                    }
                });
                console.log('');
            });
        } else {
            console.log('❌ Hech qanday master topilmadi');
        }

    } catch (error) {
        console.error('❌ Xato:', error.message);
    } finally {
        await pool.end();
    }
}

checkMastersTable();