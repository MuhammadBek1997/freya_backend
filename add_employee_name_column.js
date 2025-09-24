const { pool } = require('./config/database');

async function addEmployeeNameColumn() {
    try {
        console.log('🔧 Employee jadvaliga name ustunini qo\'shish...\n');

        // Avval name ustuni mavjudligini tekshirish
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = 'name';
        `);

        if (checkColumn.rows.length > 0) {
            console.log('✅ Name ustuni allaqachon mavjud');
        } else {
            // Name ustunini qo'shish
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN name VARCHAR(255);
            `);
            console.log('✅ Name ustuni muvaffaqiyatli qo\'shildi');

            // Mavjud employee_name qiymatlarini name ustuniga ko'chirish
            await pool.query(`
                UPDATE employees 
                SET name = employee_name 
                WHERE name IS NULL AND employee_name IS NOT NULL;
            `);
            console.log('✅ Mavjud employee_name qiymatlari name ustuniga ko\'chirildi');
        }

        // Position ustunini ham qo'shamiz
        const checkPositionColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = 'position';
        `);

        if (checkPositionColumn.rows.length === 0) {
            await pool.query(`
                ALTER TABLE employees 
                ADD COLUMN position VARCHAR(100);
            `);
            console.log('✅ Position ustuni muvaffaqiyatli qo\'shildi');
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

addEmployeeNameColumn();