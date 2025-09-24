const { pool } = require('./config/database');

async function addEmployeeEmailColumn() {
    try {
        console.log('🔧 Employee jadvaliga email ustunini qo\'shish...\n');

        // Avval email ustuni mavjudligini tekshirish
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = 'email';
        `);

        if (checkColumn.rows.length > 0) {
            console.log('✅ Email ustuni allaqachon mavjud');
        } else {
            // Email ustunini qo'shish
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN email VARCHAR(255);
            `);
            console.log('✅ Email ustuni muvaffaqiyatli qo\'shildi');
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

addEmployeeEmailColumn();