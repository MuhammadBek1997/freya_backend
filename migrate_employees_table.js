require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateEmployeesTable() {
    try {
        console.log('🔄 Employees table strukturasini yangilash...\n');

        // Mavjud ustunlarni tekshirish
        const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees'
        `;
        const existingColumns = await pool.query(columnsQuery);
        const columnNames = existingColumns.rows.map(row => row.column_name);
        
        console.log('📋 Mavjud ustunlar:', columnNames);

        // Kerakli ustunlarni qo'shish
        const columnsToAdd = [
            { name: 'surname', type: 'VARCHAR(100)' },
            { name: 'profession', type: 'VARCHAR(100)' },
            { name: 'username', type: 'VARCHAR(50) UNIQUE' },
            { name: 'employee_password', type: 'VARCHAR(255)' },
            { name: 'avatar_url', type: 'VARCHAR(255)' },
            { name: 'bio', type: 'TEXT' },
            { name: 'experience_years', type: 'INTEGER DEFAULT 0' },
            { name: 'rating', type: 'DECIMAL(3,2) DEFAULT 0' },
            { name: 'deleted_at', type: 'TIMESTAMP' }
        ];

        for (const column of columnsToAdd) {
            if (!columnNames.includes(column.name)) {
                try {
                    await pool.query(`ALTER TABLE employees ADD COLUMN ${column.name} ${column.type}`);
                    console.log(`✅ ${column.name} ustuni qo'shildi`);
                } catch (error) {
                    console.log(`⚠️  ${column.name} ustunini qo'shishda xatolik: ${error.message}`);
                }
            } else {
                console.log(`ℹ️  ${column.name} ustuni allaqachon mavjud`);
            }
        }

        // Email ustuniga UNIQUE constraint qo'shish
        if (columnNames.includes('email')) {
            try {
                await pool.query(`ALTER TABLE employees ADD CONSTRAINT employees_email_unique UNIQUE (email)`);
                console.log('✅ Email ustuniga UNIQUE constraint qo\'shildi');
            } catch (error) {
                console.log('⚠️  Email UNIQUE constraint allaqachon mavjud yoki xatolik:', error.message);
            }
        }

        // is_waiting default qiymatini o'zgartirish
        try {
            await pool.query(`ALTER TABLE employees ALTER COLUMN is_waiting SET DEFAULT true`);
            console.log('✅ is_waiting default qiymati true ga o\'zgartirildi');
        } catch (error) {
            console.log('⚠️  is_waiting default qiymatini o\'zgartirishda xatolik:', error.message);
        }

        // Yangi jadval strukturasini ko'rish
        const newStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Yangilangan employees table strukturasi:');
        newStructure.rows.forEach(column => {
            console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
        });

        console.log('\n✅ Migration muvaffaqiyatli yakunlandi!');

    } catch (error) {
        console.error('❌ Migration xatosi:', error);
    } finally {
        await pool.end();
    }
}

migrateEmployeesTable();