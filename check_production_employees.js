const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkEmployees() {
  try {
    console.log('Checking admins table for employees...');
    
    // Check for all admins
    const allAdminsResult = await pool.query('SELECT id, username, email, role, salon_id FROM admins LIMIT 10');
    console.log('All admins data:');
    console.table(allAdminsResult.rows);
    
    // Check for employees specifically
    const employeeResult = await pool.query("SELECT id, username, email, role, salon_id FROM admins WHERE role = 'employee' LIMIT 10");
    console.log('Employee admins:');
    console.table(employeeResult.rows);
    
    // Check for different roles
    const rolesResult = await pool.query("SELECT DISTINCT role FROM admins");
    console.log('Available roles in admins table:');
    console.table(rolesResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmployees();