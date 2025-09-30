const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugLogin() {
  try {
    console.log('=== PRODUCTION DATABASE LOGIN DEBUG ===\n');
    
    // Check all admins
    console.log('1. Checking all admins in database:');
    const allAdmins = await pool.query('SELECT id, username, email, role, salon_id, is_active FROM admins ORDER BY id');
    console.table(allAdmins.rows);
    
    // Check specific admin credentials
    console.log('\n2. Testing admin1 login:');
    const admin1 = await pool.query('SELECT id, username, email, password_hash, role, is_active FROM admins WHERE username = $1', ['admin1']);
    if (admin1.rows.length > 0) {
      console.log('Admin1 found:', {
        id: admin1.rows[0].id,
        username: admin1.rows[0].username,
        email: admin1.rows[0].email,
        role: admin1.rows[0].role,
        is_active: admin1.rows[0].is_active,
        has_password: !!admin1.rows[0].password_hash
      });
      
      // Test password
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, admin1.rows[0].password_hash);
      console.log(`Password test for '${testPassword}':`, isValid);
    } else {
      console.log('Admin1 not found!');
    }
    
    // Check specific employee credentials
    console.log('\n3. Testing employee1_1 login:');
    const employee = await pool.query('SELECT id, username, email, password_hash, role, is_active FROM admins WHERE username = $1', ['employee1_1']);
    if (employee.rows.length > 0) {
      console.log('Employee1_1 found:', {
        id: employee.rows[0].id,
        username: employee.rows[0].username,
        email: employee.rows[0].email,
        role: employee.rows[0].role,
        is_active: employee.rows[0].is_active,
        has_password: !!employee.rows[0].password_hash
      });
      
      // Test password
      const testPassword = 'employee123';
      const isValid = await bcrypt.compare(testPassword, employee.rows[0].password_hash);
      console.log(`Password test for '${testPassword}':`, isValid);
    } else {
      console.log('Employee1_1 not found!');
    }
    
    // Test bcrypt functionality
    console.log('\n4. Testing bcrypt functionality:');
    const testHash = await bcrypt.hash('test123', 10);
    const testVerify = await bcrypt.compare('test123', testHash);
    console.log('Bcrypt test:', testVerify);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugLogin();