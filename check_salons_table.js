require('dotenv').config();
const { pool } = require('./config/database');

async function checkSalonsTable() {
    try {
        console.log('🔍 SALONS JADVALINI TEKSHIRISH\n');

        // Jadval strukturasini tekshirish
        const structureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'salons'
            ORDER BY ordinal_position;
        `;
        
        const structure = await pool.query(structureQuery);
        console.log('📋 Salons jadval strukturasi:');
        structure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // Birinchi 5 ta yozuvni ko'rish
        const dataQuery = 'SELECT * FROM salons LIMIT 5';
        const data = await pool.query(dataQuery);
        console.log('\n📊 Birinchi 5 ta salon:');
        console.log(data.rows);

        // Jami yozuvlar soni
        const countQuery = 'SELECT COUNT(*) as total FROM salons';
        const count = await pool.query(countQuery);
        console.log(`\n📈 Jami salonlar: ${count.rows[0].total}`);

    } catch (error) {
        console.error('❌ Xatolik:', error);
    } finally {
        await pool.end();
    }
}

checkSalonsTable();