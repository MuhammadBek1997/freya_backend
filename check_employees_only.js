const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkEmployeesOnly() {
    try {
        console.log('🔍 Checking employees table...\n');
        
        // Check employees table structure
        console.log('👥 EMPLOYEES TABLE STRUCTURE:');
        const employeesStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);
        
        console.log(`Found ${employeesStructure.rows.length} columns:`);
        employeesStructure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check actual data
        console.log('\n📊 EMPLOYEES DATA:');
        const employeesData = await pool.query(`
            SELECT * FROM employees LIMIT 5
        `);
        
        console.log(`Total employees: ${employeesData.rows.length}`);
        employeesData.rows.forEach((emp, index) => {
            console.log(`${index + 1}. Employee ID: ${emp.id}`);
            console.log(`   Columns: ${Object.keys(emp).join(', ')}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Database connection closed');
    }
}

checkEmployeesOnly();