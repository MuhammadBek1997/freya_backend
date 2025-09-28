const { pool } = require('./config/database');

async function checkDatabaseStructure() {
    try {
        console.log('🔍 Database strukturasini tekshirish...\n');
        
        // Employees jadval ustunlarini ko'rish
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `;
        
        const result = await pool.query(columnsQuery);
        
        console.log('📋 Employees jadval ustunlari:');
        if (result.rows.length === 0) {
            console.log('❌ Employees jadvali topilmadi yoki ustunlar yo\'q');
        } else {
            result.rows.forEach(row => {
                console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });
        }
        
        // Bitta employee ma'lumotini ko'rish
        console.log('\n👤 Employee ma\'lumoti namunasi:');
        const employeeQuery = 'SELECT * FROM employees LIMIT 1';
        const employeeResult = await pool.query(employeeQuery);
        
        if (employeeResult.rows.length > 0) {
            console.log('Mavjud ustunlar:', Object.keys(employeeResult.rows[0]));
        } else {
            console.log('❌ Hech qanday employee topilmadi');
        }
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkDatabaseStructure();