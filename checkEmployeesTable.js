require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkEmployeesTable() {
    try {
        // Check table structure
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position;
        `);
        
        console.log('Employees table structure:');
        console.table(result.rows);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkEmployeesTable();