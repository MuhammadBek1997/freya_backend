const { Pool } = require('pg');

// Heroku PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkSchema() {
    try {
        console.log('🔍 Heroku database schema tekshirilmoqda...\n');

        // Check if tables exist
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;
        
        const tables = await pool.query(tablesQuery);
        console.log('📋 Mavjud tabllar:');
        if (tables.rows.length === 0) {
            console.log('   ❌ Hech qanday table topilmadi!');
        } else {
            tables.rows.forEach(row => {
                console.log(`   ✅ ${row.table_name}`);
            });
        }

        // Check salons table structure if exists
        const salonTableCheck = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position;
        `);

        if (salonTableCheck.rows.length > 0) {
            console.log('\n🏢 Salons table structure:');
            salonTableCheck.rows.forEach(row => {
                console.log(`   - ${row.column_name}: ${row.data_type}`);
            });
        } else {
            console.log('\n❌ Salons table mavjud emas!');
            console.log('\n🔧 Schema yaratish kerak...');
        }

    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();