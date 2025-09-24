require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkUsersTable() {
    try {
        console.log('🔍 Users jadvalining strukturasini tekshirish...\n');
        
        // Jadval ustunlarini olish
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `;
        
        const columns = await pool.query(columnsQuery);
        
        console.log('📋 Users jadval ustunlari:');
        columns.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Mavjud ma'lumotlarni ko'rish
        const dataQuery = 'SELECT * FROM users LIMIT 3';
        const data = await pool.query(dataQuery);
        
        console.log('\n📊 Mavjud ma\'lumotlar (birinchi 3 ta):');
        data.rows.forEach((row, index) => {
            console.log(`${index + 1}. ID: ${row.id}`);
            console.log(`   Phone: ${row.phone || 'NULL'}`);
            console.log(`   Email: ${row.email || 'NULL'}`);
            console.log(`   First Name: ${row.first_name || 'NULL'}`);
            console.log(`   Last Name: ${row.last_name || 'NULL'}`);
            console.log(`   Registration Step: ${row.registration_step || 'NULL'}`);
            console.log(`   Phone Verified: ${row.phone_verified || 'NULL'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkUsersTable();