const { pool } = require('./config/database');

async function checkEmployeeTable() {
    try {
        console.log('🔍 Employee jadval ustunlarini tekshirish...\n');
        
        // Employee jadval ustunlarini ko'rish
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position;
        `;
        
        const result = await pool.query(columnsQuery);
        
        console.log('📋 Employee jadval ustunlari:');
        result.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });
        
        // Employee ma'lumotlarini ko'rish
        const employeesQuery = 'SELECT * FROM employees LIMIT 5';
        const employeesResult = await pool.query(employeesQuery);
        
        console.log('\n👥 Employee ma\'lumotlari:');
        employeesResult.rows.forEach(employee => {
            console.log(`   ID: ${employee.id}`);
            console.log(`   Name: ${employee.name || employee.employee_name}`);
            console.log(`   Email: ${employee.email}`);
            console.log(`   Phone: ${employee.phone}`);
            console.log(`   Position: ${employee.position}`);
            console.log(`   Password: ${employee.password || 'YO\'Q'}`);
            console.log('   ---');
        });
        
    } catch (error) {
        console.error('Xatolik:', error);
    } finally {
        await pool.end();
    }
}

checkEmployeeTable();