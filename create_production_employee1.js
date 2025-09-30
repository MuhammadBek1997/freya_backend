const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Production database connection
const pool = new Pool({
  connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
  ssl: { rejectUnauthorized: false }
});

async function createProductionEmployee1() {
  try {
    console.log('🔗 Connecting to production database...');
    
    // Check if employee1 already exists
    console.log('🔍 Checking if employee1 already exists...');
    const existingEmployee = await pool.query(
      "SELECT id, username FROM admins WHERE username = 'employee1'"
    );
    
    if (existingEmployee.rows.length > 0) {
      console.log('⚠️ employee1 already exists!');
      console.log('👤 Existing employee:', existingEmployee.rows[0]);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('employee123', 10);
      await pool.query(
        'UPDATE admins SET password_hash = $1 WHERE username = $2',
        [hashedPassword, 'employee1']
      );
      console.log('🔄 Password updated to employee123');
    } else {
      console.log('➕ Creating new employee1...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('employee123', 10);
      
      // Get a salon_id (use salon 1 if exists)
      const salonResult = await pool.query('SELECT id FROM salons LIMIT 1');
      const salonId = salonResult.rows.length > 0 ? salonResult.rows[0].id : 1;
      
      console.log('🏢 Using salon_id:', salonId);
      
      // Create employee1
      const result = await pool.query(`
        INSERT INTO admins (username, email, password_hash, full_name, role, salon_id, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, username, email, full_name, role, salon_id, is_active
      `, [
        'employee1',
        'employee1@freyasalon.uz',
        hashedPassword,
        'Employee One',
        'employee',
        salonId,
        true
      ]);
      
      console.log('✅ employee1 created successfully!');
      console.log('👤 Employee data:', result.rows[0]);
    }
    
    // Verify the employee can be found
    console.log('\n🧪 Testing employee1 login credentials...');
    const employee = await pool.query(
      "SELECT id, username, email, full_name, role, salon_id, is_active FROM admins WHERE username = 'employee1'"
    );
    
    if (employee.rows.length > 0) {
      console.log('✅ employee1 found in database:');
      console.table(employee.rows[0]);
      
      // Test password
        const passwordCheck = await pool.query(
          "SELECT password_hash FROM admins WHERE username = 'employee1'"
        );
        const isPasswordValid = await bcrypt.compare('employee123', passwordCheck.rows[0].password_hash);
      console.log('🔐 Password check:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    } else {
      console.log('❌ employee1 not found after creation!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('🔚 Database connection closed');
  }
}

createProductionEmployee1();