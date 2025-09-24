const { pool } = require('./config/database');

async function addRoleColumn() {
    try {
        console.log('🔧 Admin jadvaliga role ustunini qo\'shish...\n');

        // Avval role ustuni mavjudligini tekshirish
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'admins' AND column_name = 'role';
        `);

        if (checkColumn.rows.length > 0) {
            console.log('✅ Role ustuni allaqachon mavjud');
        } else {
            // Role ustunini qo'shish
            await pool.query(`
                ALTER TABLE admins 
                ADD COLUMN role VARCHAR(50) DEFAULT 'admin';
            `);
            console.log('✅ Role ustuni muvaffaqiyatli qo\'shildi');

            // Mavjud adminlarga role qiymatini berish
            await pool.query(`
                UPDATE admins 
                SET role = 'admin' 
                WHERE role IS NULL;
            `);
            console.log('✅ Mavjud adminlarga role qiymati berildi');
        }

        // Yangi jadval strukturasini ko'rish
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Yangi admins jadval strukturasi:');
        tableStructure.rows.forEach(column => {
            console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
        });

        // Mavjud adminlarni ko'rish
        const adminsData = await pool.query('SELECT id, username, role, salon_id FROM admins LIMIT 3');
        console.log('\n👥 Mavjud adminlar:');
        adminsData.rows.forEach((admin, index) => {
            console.log(`\nAdmin ${index + 1}:`);
            console.log(`   ID: ${admin.id}`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Salon ID: ${admin.salon_id}`);
        });

    } catch (error) {
        console.error('❌ Xatolik:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

addRoleColumn();