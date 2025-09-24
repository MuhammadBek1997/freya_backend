const { pool } = require('./config/database');

async function fixEmployeeNameNullable() {
    try {
        console.log('🔧 Employee_name ustunini nullable qilish...\n');

        // Employee_name ustunini nullable qilish
        await pool.query(`
            ALTER TABLE employees 
            ALTER COLUMN employee_name DROP NOT NULL;
        `);
        console.log('✅ Employee_name ustuni nullable qilindi');

        // Yangi jadval strukturasini ko'rish
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name IN ('employee_name', 'name', 'phone', 'email', 'position')
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Employee jadval ustunlari:');
        tableStructure.rows.forEach(column => {
            console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
        });

    } catch (error) {
        console.error('❌ Xatolik:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixEmployeeNameNullable();