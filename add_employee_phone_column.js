const { pool } = require('./config/database');

async function addEmployeePhoneColumn() {
    try {
        console.log('🔧 Employee jadvaliga phone ustunini qo\'shish...\n');

        // Avval phone ustuni mavjudligini tekshirish
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = 'phone';
        `);

        if (checkColumn.rows.length > 0) {
            console.log('✅ Phone ustuni allaqachon mavjud');
        } else {
            // Phone ustunini qo'shish
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN phone VARCHAR(20);
            `);
            console.log('✅ Phone ustuni muvaffaqiyatli qo\'shildi');
        }

        // Yangi jadval strukturasini ko'rish
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Yangi employees jadval strukturasi:');
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

addEmployeePhoneColumn();