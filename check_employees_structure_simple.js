const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function checkEmployeesStructure() {
    try {
        console.log('🔍 Employees jadval strukturasini tekshiryapman...\n');

        // Jadval strukturasini olish
        const structureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);

        console.log('📋 Employees jadval ustunlari:');
        structureResult.rows.forEach((column, index) => {
            console.log(`${index + 1}. ${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\n🔍 Birinchi employee ma\'lumotini olish...');
        
        // Birinchi employeeni olish
        const firstEmployeeResult = await pool.query('SELECT * FROM employees LIMIT 1');
        
        if (firstEmployeeResult.rows.length > 0) {
            const employee = firstEmployeeResult.rows[0];
            console.log('\n📊 Birinchi employee ma\'lumotlari:');
            Object.keys(employee).forEach(key => {
                const value = employee[key];
                if (key.includes('password')) {
                    console.log(`${key}: ${value ? value.substring(0, 20) + '...' : 'NULL'}`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            });
        } else {
            console.log('❌ Hech qanday employee topilmadi');
        }

    } catch (error) {
        console.error('❌ Xato:', error.message);
    } finally {
        await pool.end();
    }
}

checkEmployeesStructure();