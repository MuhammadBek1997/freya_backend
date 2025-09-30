const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Production database connection
const pool = new Pool({
  connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
  ssl: { rejectUnauthorized: false }
});

async function verifyEmployee1() {
  try {
    console.log('🔗 Connecting to production database...');
    
    // Check if employee1 exists
    console.log('\n🔍 Searching for employee1...');
    const result = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role, salon_id, is_active FROM admins WHERE username = $1',
      ['employee1']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ employee1 not found in database');
      
      // Check all employees
      console.log('\n📋 All employees in database:');
      const allEmployees = await pool.query(
        'SELECT id, username, email, full_name, role, salon_id, is_active FROM admins WHERE role = $1',
        ['employee']
      );
      
      if (allEmployees.rows.length > 0) {
        console.table(allEmployees.rows);
      } else {
        console.log('❌ No employees found');
      }
      
      return;
    }
    
    const employee = result.rows[0];
    console.log('✅ employee1 found!');
    console.table([employee]);
    
    // Test password
    console.log('\n🔐 Testing password...');
    const testPassword = 'employee123';
    const isPasswordValid = await bcrypt.compare(testPassword, employee.password_hash);
    console.log(`Password "${testPassword}":`, isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    // Check if active and role is correct
    console.log('\n📊 Status checks:');
    console.log('Is Active:', employee.is_active ? '✅ Yes' : '❌ No');
    console.log('Role:', employee.role === 'employee' ? '✅ employee' : `❌ ${employee.role}`);
    console.log('Salon ID:', employee.salon_id || 'Not set');
    
    // Test the exact query used in login
    console.log('\n🔍 Testing login query...');
    const loginQuery = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role, salon_id, is_active FROM admins WHERE (username = $1 OR email = $1) AND role = $2 AND is_active = true',
      ['employee1', 'employee']
    );
    
    if (loginQuery.rows.length > 0) {
      console.log('✅ Login query successful');
      console.table(loginQuery.rows);
    } else {
      console.log('❌ Login query failed - no matching records');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔚 Database connection closed');
  }
}

verifyEmployee1();