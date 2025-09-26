const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
  connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkEmployeePasswords() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to production database...');
    
    // Check if employees table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
      );
    `;
    
    const tableExists = await client.query(tableExistsQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Employees table does not exist in the database');
      return;
    }
    
    console.log('✅ Employees table found');
    
    // First, check the table structure
    console.log('🔍 Checking employees table structure...');
    const structureQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structure = await client.query(structureQuery);
    console.log('\n📋 Employees table structure:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if password_hash column exists
    const hasPasswordHash = structure.rows.some(col => col.column_name === 'password_hash');
    const hasPassword = structure.rows.some(col => col.column_name === 'password');
    
    let passwordColumn = null;
    if (hasPasswordHash) {
      passwordColumn = 'password_hash';
    } else if (hasPassword) {
      passwordColumn = 'password';
    }
    
    console.log(`\n🔐 Password column found: ${passwordColumn || 'None'}`);
    
    // Build dynamic query based on available columns
    const availableColumns = structure.rows.map(col => col.column_name);
    const selectColumns = [];
    
    if (availableColumns.includes('id')) selectColumns.push('id');
    if (availableColumns.includes('name')) selectColumns.push('name');
    if (availableColumns.includes('email')) selectColumns.push('email');
    if (availableColumns.includes('phone')) selectColumns.push('phone');
    if (passwordColumn) selectColumns.push(passwordColumn);
    if (availableColumns.includes('salon_id')) selectColumns.push('salon_id');
    if (availableColumns.includes('role')) selectColumns.push('role');
    if (availableColumns.includes('created_at')) selectColumns.push('created_at');
    
    const employeesQuery = `
      SELECT ${selectColumns.join(', ')}
      FROM employees 
      ORDER BY id;
    `;
    
    const result = await client.query(employeesQuery);
    
    console.log(`\n📊 Found ${result.rows.length} employees in the database:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No employees found in the database');
      return;
    }
    
    // Display employee credentials
    result.rows.forEach((employee, index) => {
      console.log(`${index + 1}. Employee ID: ${employee.id || 'Not set'}`);
      console.log(`   Name: ${employee.name || 'Not set'}`);
      console.log(`   Email: ${employee.email || 'Not set'}`);
      console.log(`   Phone: ${employee.phone || 'Not set'}`);
      
      // Display password field dynamically
      if (passwordColumn) {
        const passwordValue = employee[passwordColumn];
        console.log(`   ${passwordColumn}: ${passwordValue || 'Not set'}`);
        if (passwordValue && passwordColumn === 'password_hash') {
          console.log(`   Password Hash Length: ${passwordValue.length} characters`);
        }
      } else {
        console.log(`   Password: No password column found`);
      }
      
      console.log(`   Salon ID: ${employee.salon_id || 'Not set'}`);
      console.log(`   Role: ${employee.role || 'Not set'}`);
      console.log(`   Created: ${employee.created_at || 'Not set'}`);
      console.log('   ---');
    });
    
    // Summary
    const withPasswords = passwordColumn ? result.rows.filter(emp => emp[passwordColumn]).length : 0;
    const withEmails = result.rows.filter(emp => emp.email).length;
    const withPhones = result.rows.filter(emp => emp.phone).length;
    
    console.log('\n📈 Summary:');
    console.log(`Total employees: ${result.rows.length}`);
    console.log(`With passwords: ${withPasswords}`);
    console.log(`With emails: ${withEmails}`);
    console.log(`With phones: ${withPhones}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
checkEmployeePasswords()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });