const { pool } = require('./config/database');

async function checkSalonsTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'salons' 
      ORDER BY ordinal_position
    `);
    
    console.log('Salons jadvali strukturasi:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Mavjud ma'lumotlarni ham ko'ramiz
    const dataResult = await pool.query('SELECT * FROM salons LIMIT 3');
    console.log('\nMavjud ma\'lumotlar (birinchi 3 ta):');
    dataResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${JSON.stringify(row, null, 2)}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error.message);
    process.exit(1);
  }
}

checkSalonsTable();