const { Pool } = require('pg');

// DATABASE_URL should be set as environment variable
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fixHerokuSchema() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking current schema...');
        
        // Check if created_at column exists
        const checkColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'salons' AND column_name = 'created_at'
        `);
        
        if (checkColumn.rows.length > 0) {
            console.log('✅ created_at column already exists');
            return;
        }
        
        console.log('➕ Adding created_at column to salons table...');
        
        // Add created_at column with default value
        await client.query(`
            ALTER TABLE salons 
            ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        
        console.log('✅ Successfully added created_at column');
        
        // Update existing records to have created_at values
        const updateResult = await client.query(`
            UPDATE salons 
            SET created_at = CURRENT_TIMESTAMP 
            WHERE created_at IS NULL
        `);
        
        console.log(`✅ Updated ${updateResult.rowCount} existing records with created_at timestamps`);
        
        // Verify the fix
        const testQuery = await client.query('SELECT id, name, created_at FROM salons LIMIT 3');
        console.log('🔍 Sample data after fix:');
        testQuery.rows.forEach(row => {
            console.log(`  - ${row.name}: ${row.created_at}`);
        });
        
        console.log('🎉 Schema fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing schema:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
fixHerokuSchema()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });