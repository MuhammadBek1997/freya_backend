require('dotenv').config();
const { pool } = require('./config/database');

async function checkTables() {
    try {
        console.log('Checking table structures...\n');
        
        // Admins table structure
        const adminsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position
        `);
        
        console.log('ADMINS table columns:');
        adminsResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Employees table structure
        const employeesResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);
        
        console.log('\nEMPLOYEES table columns:');
        employeesResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Salons table structure
        const salonsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position
        `);
        
        console.log('\nSALONS table columns:');
        salonsResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkTables();