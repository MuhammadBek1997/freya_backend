const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('Users jadvaliga image ustuni qo\'shilmoqda...');

const addImageColumn = async () => {
    try {
        // Avval ustun mavjudligini tekshirish
        const checkColumnQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'image'
        `;
        
        const columnCheck = await pool.query(checkColumnQuery);
        
        if (columnCheck.rows.length > 0) {
            console.log('✅ Image ustuni allaqachon mavjud.');
            return;
        }

        // Image ustunini qo'shish
        const addColumnQuery = `ALTER TABLE users ADD COLUMN image TEXT`;
        
        await pool.query(addColumnQuery);
        console.log('✅ Image ustuni muvaffaqiyatli qo\'shildi.');
        
    } catch (error) {
        console.error('❌ Image ustuni qo\'shishda xatolik:', error.message);
        throw error;
    }
};

const checkTableStructure = async () => {
    try {
        const query = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `;
        
        const result = await pool.query(query);
        
        console.log('\n📋 Users jadval strukturasi:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
    } catch (error) {
        console.error('❌ Jadval strukturasini tekshirishda xatolik:', error.message);
    }
};

const main = async () => {
    try {
        await addImageColumn();
        await checkTableStructure();
        console.log('\n✅ Migratsiya tugallandi!');
    } catch (error) {
        console.error('❌ Migratsiya xatosi:', error.message);
    } finally {
        await pool.end();
    }
};

main();