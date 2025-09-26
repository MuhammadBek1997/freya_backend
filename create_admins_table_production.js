require('dotenv').config();
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function createAdminsTableInProduction() {
    try {
        console.log('🔗 Connecting to production database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to production database');

        // Create admins table
        console.log('📝 Creating admins table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role VARCHAR(20) DEFAULT 'admin',
                salon_id INTEGER REFERENCES salons(id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_admins_salon_id ON admins(salon_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active)`);

        console.log('✅ Admins table created successfully in production!');

        // Check if table exists
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'admins'
        `);
        
        if (tableCheck.rows.length > 0) {
            console.log('✅ Admins table confirmed to exist in production database');
        } else {
            console.log('❌ Admins table not found after creation');
        }

    } catch (error) {
        console.error('❌ Error creating admins table:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
createAdminsTableInProduction()
    .then(() => {
        console.log('✅ Admins table creation completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to create admins table:', error);
        process.exit(1);
    });