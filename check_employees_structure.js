const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkEmployeesStructure() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Employees jadvalining strukturasi:\n');
    
    const structure = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'None'}`);
    });
    
    console.log('\n📊 Mavjud employees soni:');
    const count = await client.query('SELECT COUNT(*) as count FROM employees');
    console.log(`Jami: ${count.rows[0].count} ta employee`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmployeesStructure();