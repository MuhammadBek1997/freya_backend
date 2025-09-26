require('dotenv').config();
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function checkSalonsStructure() {
    try {
        console.log('🔗 Connecting to production database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to production database');

        // Check salons table structure
        console.log('\n=== Salons Table Structure ===');
        const structureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position
        `;
        
        const structure = await pool.query(structureQuery);
        structure.rows.forEach(column => {
            console.log(`- ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
        });

        // Check some sample data
        console.log('\n=== Sample Salons Data ===');
        const sampleData = await pool.query('SELECT * FROM salons LIMIT 3');
        console.log('Sample salons:', sampleData.rows);

    } catch (error) {
        console.error('❌ Error checking salons structure:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
checkSalonsStructure()
    .then(() => {
        console.log('✅ Salons structure check completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to check salons structure:', error);
        process.exit(1);
    });