const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const runSchema = async () => {
    try {
        console.log('Schema faylini o\'qiyapman...');
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Schema ni database ga yuklayapman...');
        await pool.query(schemaSQL);
        
        console.log('✅ Schema muvaffaqiyatli yuklandi!');
        
        // Jadvallar ro'yxatini ko'rish
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('📋 Mavjud jadvallar:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Schema yuklashda xatolik:', error);
    } finally {
        await pool.end();
    }
};

runSchema();