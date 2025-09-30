const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createEmployee() {
  try {
    console.log('Creating employee in production database...');
    
    // Hash password
    const password = 'employee123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create employee
    const result = await pool.query(`
      INSERT INTO admins (username, email, password_hash, full_name, role, salon_id, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, username, email, role, salon_id
    `, ['employee1_1', 'employee1@freya.uz', hashedPassword, 'Employee One', 'employee', 1, true]);
    
    console.log('Employee created successfully:');
    console.table(result.rows);
    
    // Verify employee exists
    const verifyResult = await pool.query("SELECT id, username, email, role, salon_id FROM admins WHERE role = 'employee'");
    console.log('All employees in database:');
    console.table(verifyResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createEmployee();