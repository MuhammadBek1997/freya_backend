require('dotenv').config();
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function createPostsTableInProduction() {
    try {
        console.log('🔗 Connecting to production database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to production database');

        // Create posts table
        console.log('📝 Creating posts table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                media_files JSONB DEFAULT '[]'::jsonb,
                admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
                salon_id INTEGER REFERENCES salons(id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_admin_id ON posts(admin_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_salon_id ON posts(salon_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_is_active ON posts(is_active)`);

        console.log('✅ Posts table created successfully in production!');

        // Check if table exists
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'posts'
        `);
        
        if (tableCheck.rows.length > 0) {
            console.log('✅ Posts table confirmed to exist in production database');
        } else {
            console.log('❌ Posts table not found after creation');
        }

    } catch (error) {
        console.error('❌ Error creating posts table:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
createPostsTableInProduction()
    .then(() => {
        console.log('✅ Posts table creation completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to create posts table:', error);
        process.exit(1);
    });