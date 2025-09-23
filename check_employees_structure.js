const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkEmployeesStructure() {
  try {
    console.log('🔍 Employees jadvalining strukturasini tekshirish...\n');
    
    // Jadval ustunlarini olish
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      ORDER BY ordinal_position
    `;
    
    const columns = await pool.query(columnsQuery);
    
    console.log('📋 Employees jadval ustunlari:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Mavjud ma'lumotlarni ko'rish
    const dataQuery = 'SELECT * FROM employees LIMIT 3';
    const data = await pool.query(dataQuery);
    
    console.log('\n📊 Mavjud ma\'lumotlar (birinchi 3 ta):');
    data.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Name: ${row.name || 'NULL'}`);
      console.log(`   Phone: ${row.phone || 'NULL'}`);
      console.log(`   Email: ${row.email || 'NULL'}`);
      console.log(`   Position: ${row.position || 'NULL'}`);
      console.log(`   Salon ID: ${row.salon_id || 'NULL'}`);
      console.log(`   Active: ${row.is_active}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmployeesStructure();