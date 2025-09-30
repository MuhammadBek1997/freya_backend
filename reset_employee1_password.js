const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Production database connection
const pool = new Pool({
  connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
  ssl: { rejectUnauthorized: false }
});

async function resetEmployee1Password() {
  try {
    console.log('🔗 Connecting to production database...');
    
    // Check current employee1
    console.log('\n🔍 Checking current employee1...');
    const currentEmployee = await pool.query(
      'SELECT id, username, email, role, is_active FROM admins WHERE username = $1',
      ['employee1']
    );
    
    if (currentEmployee.rows.length === 0) {
      console.log('❌ employee1 not found');
      return;
    }
    
    console.log('✅ employee1 found:');
    console.table(currentEmployee.rows);
    
    // Generate new password hash
    console.log('\n🔐 Generating new password hash...');
    const newPassword = 'employee123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('✅ New password hash generated');
    console.log('🔑 Password:', newPassword);
    console.log('🔒 Hash length:', hashedPassword.length);
    
    // Update password
    console.log('\n🔄 Updating password...');
    const updateResult = await pool.query(
      'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE username = $2 RETURNING id, username, email',
      [hashedPassword, 'employee1']
    );
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.table(updateResult.rows);
    } else {
      console.log('❌ Password update failed');
    }
    
    // Test the new password
    console.log('\n🧪 Testing new password...');
    const testResult = await pool.query(
      'SELECT password_hash FROM admins WHERE username = $1',
      ['employee1']
    );
    
    if (testResult.rows.length > 0) {
      const isValid = await bcrypt.compare(newPassword, testResult.rows[0].password_hash);
      console.log('🔐 Password test:', isValid ? '✅ Valid' : '❌ Invalid');
    }
    
    // Test login query
    console.log('\n🔍 Testing login query...');
    const loginTest = await pool.query(
      'SELECT id, username, email, password_hash, full_name, role, salon_id, is_active FROM admins WHERE (username = $1 OR email = $1) AND role = $2 AND is_active = true',
      ['employee1', 'employee']
    );
    
    if (loginTest.rows.length > 0) {
      console.log('✅ Login query successful');
      const employee = loginTest.rows[0];
      const passwordCheck = await bcrypt.compare(newPassword, employee.password_hash);
      console.log('🔐 Login password check:', passwordCheck ? '✅ Valid' : '❌ Invalid');
      
      console.log('\n📋 Employee details:');
      console.log('ID:', employee.id);
      console.log('Username:', employee.username);
      console.log('Email:', employee.email);
      console.log('Role:', employee.role);
      console.log('Salon ID:', employee.salon_id);
      console.log('Active:', employee.is_active);
    } else {
      console.log('❌ Login query failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔚 Database connection closed');
  }
}

resetEmployee1Password();