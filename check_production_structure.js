const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
  connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
  ssl: { rejectUnauthorized: false }
});

async function checkProductionStructure() {
  try {
    console.log('🔗 Connecting to production database...');
    
    // Check admins table structure
    console.log('\n📋 Checking admins table structure...');
    const adminsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'admins' 
      ORDER BY ordinal_position
    `);
    
    if (adminsStructure.rows.length > 0) {
      console.log('✅ admins table structure:');
      console.table(adminsStructure.rows);
    } else {
      console.log('❌ admins table not found');
    }
    
    // Check existing admins
    console.log('\n👥 Checking existing admins...');
    const existingAdmins = await pool.query('SELECT * FROM admins LIMIT 5');
    if (existingAdmins.rows.length > 0) {
      console.log('✅ Existing admins:');
      console.table(existingAdmins.rows);
    } else {
      console.log('❌ No admins found');
    }
    
    // Check all tables
    console.log('\n📊 Checking all tables...');
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    console.table(allTables.rows);
    
    // Check if employees table exists
    console.log('\n👷 Checking employees table...');
    const employeesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      ORDER BY ordinal_position
    `);
    
    if (employeesStructure.rows.length > 0) {
      console.log('✅ employees table structure:');
      console.table(employeesStructure.rows);
      
      // Check existing employees
      const existingEmployees = await pool.query('SELECT * FROM employees LIMIT 5');
      if (existingEmployees.rows.length > 0) {
        console.log('✅ Existing employees:');
        console.table(existingEmployees.rows);
      }
    } else {
      console.log('❌ employees table not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔚 Database connection closed');
  }
}

checkProductionStructure();