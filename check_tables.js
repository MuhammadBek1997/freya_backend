const { pool } = require('./config/database');
require('dotenv').config();

async function checkTables() {
  try {
    console.log('Database ga ulanish...');
    
    // Check if messages table exists
    const messagesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);
    
    console.log('Messages table mavjudmi:', messagesResult.rows[0].exists);
    
    // Check if users table exists
    const usersResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table mavjudmi:', usersResult.rows[0].exists);
    
    // Check if employees table exists
    const employeesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employees'
      );
    `);
    
    console.log('Employees table mavjudmi:', employeesResult.rows[0].exists);
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nMavjud table lar:');
    tablesResult.rows.forEach(row => {
      console.log('-', row.table_name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error);
    process.exit(1);
  }
}

checkTables();