require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

async function checkProductionTableStructure() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔍 Production database jadval strukturasini tekshirish...\n');

        // Check admins table structure
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position;
        `);

        console.log('📋 Admins jadvali strukturasi:');
        tableStructure.rows.forEach((column, index) => {
            console.log(`${index + 1}. ${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Check if password_hash column exists
        const passwordColumn = tableStructure.rows.find(col => 
            col.column_name === 'password' || 
            col.column_name === 'password_hash' ||
            col.column_name.includes('password')
        );

        if (passwordColumn) {
            console.log(`\n✅ Parol ustuni topildi: ${passwordColumn.column_name}`);
        } else {
            console.log('\n❌ Parol ustuni topilmadi!');
        }

        // Show sample admin data
        console.log('\n📊 Namuna admin ma\'lumotlari:');
        const sampleAdmin = await pool.query('SELECT * FROM admins LIMIT 1');
        if (sampleAdmin.rows.length > 0) {
            console.log('Ustunlar:', Object.keys(sampleAdmin.rows[0]));
            console.log('Ma\'lumotlar:', sampleAdmin.rows[0]);
        }

    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkProductionTableStructure();