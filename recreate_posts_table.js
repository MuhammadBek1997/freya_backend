require('dotenv').config();
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function recreatePostsTable() {
    try {
        console.log('🔗 Connecting to production database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to production database');

        // Drop existing posts table if exists
        console.log('🗑️ Dropping existing posts table...');
        await pool.query('DROP TABLE IF EXISTS posts CASCADE');
        console.log('✅ Existing posts table dropped');

        // Create posts table with correct structure
        console.log('📝 Creating posts table with correct structure...');
        await pool.query(`
            CREATE TABLE posts (
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
        await pool.query(`CREATE INDEX idx_posts_admin_id ON posts(admin_id)`);
        await pool.query(`CREATE INDEX idx_posts_salon_id ON posts(salon_id)`);
        await pool.query(`CREATE INDEX idx_posts_is_active ON posts(is_active)`);
        await pool.query(`CREATE INDEX idx_posts_created_at ON posts(created_at)`);

        console.log('✅ Posts table created successfully with correct structure!');

        // Verify table structure
        const structureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'posts' 
            ORDER BY ordinal_position
        `;
        
        const structure = await pool.query(structureQuery);
        console.log('\n=== Posts Table Structure ===');
        structure.rows.forEach(column => {
            console.log(`- ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
        });

    } catch (error) {
        console.error('❌ Error recreating posts table:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
recreatePostsTable()
    .then(() => {
        console.log('✅ Posts table recreation completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to recreate posts table:', error);
        process.exit(1);
    });