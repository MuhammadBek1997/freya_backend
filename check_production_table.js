const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkProductionTable() {
    try {
        console.log('Connecting to production database...');
        
        // Check table structure
        const structureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nAdmins table structure:');
        console.log('Column Name | Data Type | Nullable | Default');
        console.log('------------|-----------|----------|--------');
        structureResult.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(11)} | ${row.data_type.padEnd(9)} | ${row.is_nullable.padEnd(8)} | ${row.column_default || 'NULL'}`);
        });
        
        // Check all admins
        const adminsResult = await pool.query('SELECT * FROM admins');
        
        console.log('\nAll admins in production:');
        console.log(JSON.stringify(adminsResult.rows, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
        console.log('\nDatabase connection closed');
    }
}

checkProductionTable();