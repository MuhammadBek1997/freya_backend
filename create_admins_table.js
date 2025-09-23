const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function createAdminsTable() {
    try {
        console.log('🔧 Admins jadvalini yaratish boshlandi...');

        // Admins jadvalini yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role VARCHAR(20) DEFAULT 'admin',
                salon_id UUID REFERENCES salons(id),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Admins jadvali yaratildi');

        // Superadmin mavjudligini tekshirish
        const superadminCheck = await pool.query('SELECT id FROM admins WHERE username = $1', ['superadmin']);
        
        if (superadminCheck.rows.length === 0) {
            console.log('⚠️  Superadmin topilmadi, yangi superadmin yaratilmoqda...');
            
            const hashedPassword = await bcrypt.hash('superadmin123', 10);
            const superadminResult = await pool.query(`
                INSERT INTO admins (username, email, password_hash, full_name, role)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, ['superadmin', 'superadmin@freya.uz', hashedPassword, 'Super Administrator', 'superadmin']);
            
            console.log(`✅ Superadmin yaratildi (ID: ${superadminResult.rows[0].id})`);
        } else {
            console.log(`✅ Superadmin mavjud (ID: ${superadminCheck.rows[0].id})`);
        }

        // Admin mavjudligini tekshirish
        const adminCheck = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
        
        if (adminCheck.rows.length === 0) {
            console.log('⚠️  Admin topilmadi, yangi admin yaratilmoqda...');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminResult = await pool.query(`
                INSERT INTO admins (username, email, password_hash, full_name, role)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, ['admin', 'admin@freya.uz', hashedPassword, 'Administrator', 'admin']);
            
            console.log(`✅ Admin yaratildi (ID: ${adminResult.rows[0].id})`);
        } else {
            console.log(`✅ Admin mavjud (ID: ${adminCheck.rows[0].id})`);
        }

        console.log('\n🔐 LOGIN MA\'LUMOTLARI:');
        console.log('\nSuperadmin:');
        console.log('   Username: superadmin');
        console.log('   Password: superadmin123');
        
        console.log('\nAdmin:');
        console.log('   Username: admin');
        console.log('   Password: admin123');

        console.log('\n✅ Admins jadvali va foydalanuvchilar muvaffaqiyatli yaratildi!');

    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

createAdminsTable();