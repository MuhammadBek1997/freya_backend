const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function findEmployeeTables() {
    try {
        console.log('🔍 Employee ma\'lumotlari qaysi jadvalda ekanini qidiryapman...\n');

        // Barcha jadvallarni olish
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('📋 Barcha jadvallar:');
        tablesResult.rows.forEach((table, index) => {
            console.log(`${index + 1}. ${table.table_name}`);
        });

        console.log('\n🔍 Har bir jadvalda employee_name yoki employee_password ustunini qidiryapman...\n');

        for (const table of tablesResult.rows) {
            const tableName = table.table_name;
            
            try {
                // Jadval ustunlarini tekshirish
                const columnsResult = await pool.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                    AND (column_name LIKE '%employee%' OR column_name LIKE '%password%')
                `, [tableName]);

                if (columnsResult.rows.length > 0) {
                    console.log(`📊 ${tableName} jadvalida employee/password ustunlari:`);
                    columnsResult.rows.forEach(col => {
                        console.log(`   - ${col.column_name}`);
                    });

                    // Agar employee_name yoki employee_password topilsa, ma'lumotlarni ko'rish
                    const hasEmployeeName = columnsResult.rows.some(col => col.column_name === 'employee_name');
                    const hasEmployeePassword = columnsResult.rows.some(col => col.column_name === 'employee_password');

                    if (hasEmployeeName || hasEmployeePassword) {
                        const dataResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`);
                        console.log(`   📈 Ma'lumotlar soni: ${dataResult.rows.length}`);
                        
                        if (dataResult.rows.length > 0) {
                            console.log(`   📋 Birinchi yozuv:`);
                            const firstRow = dataResult.rows[0];
                            Object.keys(firstRow).forEach(key => {
                                const value = firstRow[key];
                                if (key.includes('password')) {
                                    console.log(`      ${key}: ${value ? value.substring(0, 20) + '...' : 'NULL'}`);
                                } else {
                                    console.log(`      ${key}: ${value}`);
                                }
                            });
                        }
                    }
                    console.log('');
                }
            } catch (error) {
                // Jadval mavjud emas yoki boshqa xato
            }
        }

    } catch (error) {
        console.error('❌ Xato:', error.message);
    } finally {
        await pool.end();
    }
}

findEmployeeTables();