require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createProductionAdmin1() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔧 Production database da admin1 yaratilmoqda...\n');

        // Check if admins table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admins'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Admins jadvali mavjud emas!');
            return;
        }

        // Check if admin1 already exists
        const existingAdmin = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin1']);
        
        if (existingAdmin.rows.length > 0) {
            console.log('⚠️  admin1 allaqachon mavjud!');
            return;
        }

        // Hash the password
        const password = 'admin1123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create admin1
        const result = await pool.query(`
            INSERT INTO admins (username, password_hash, email, full_name, role, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `, ['admin1', hashedPassword, 'admin1@freya.com', 'Admin One', 'admin', true]);

        console.log('✅ admin1 muvaffaqiyatli yaratildi!');
        console.log(`   ID: ${result.rows[0].id}`);
        console.log(`   Username: ${result.rows[0].username}`);
        console.log(`   Email: ${result.rows[0].email}`);
        console.log(`   Role: ${result.rows[0].role}`);
        console.log(`   Password: ${password}`);
        console.log(`   Created: ${result.rows[0].created_at}`);

        // Verify the admin was created
        const verification = await pool.query('SELECT COUNT(*) FROM admins');
        console.log(`\n📊 Jami adminlar soni: ${verification.rows[0].count}`);

    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

createProductionAdmin1();