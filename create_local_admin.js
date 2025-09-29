require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Local database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'freya_chat',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function createLocalAdmin() {
    try {
        console.log('🔗 Connecting to local database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to local database');

        // Check if admins table exists
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admins'
            );
        `);

        if (!tableExists.rows[0].exists) {
            console.log('📋 Creating admins table...');
            await pool.query(`
                CREATE TABLE admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'admin',
                    salon_id INTEGER,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Admins table created');
        }

        // Check existing admin
        const existingAdmin = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin1']);
        
        if (existingAdmin.rows.length > 0) {
            console.log('👤 Admin1 already exists, updating password...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2',
                [hashedPassword, 'admin1']
            );
            console.log('✅ Admin1 password updated');
        } else {
            console.log('👤 Creating admin1...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(`
                INSERT INTO admins (username, email, password_hash, full_name, role, salon_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'admin1',
                'admin1@freya.uz',
                hashedPassword,
                'Local Admin',
                'admin',
                1,
                true
            ]);
            console.log('✅ Admin1 created successfully');
        }

        // Verify admin
        const admin = await pool.query('SELECT id, username, email, full_name FROM admins WHERE username = $1', ['admin1']);
        console.log('📊 Admin details:', admin.rows[0]);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createLocalAdmin();