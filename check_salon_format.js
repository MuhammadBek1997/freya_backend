const { pool } = require('./config/database');

async function checkSalonFormat() {
  try {
    console.log('Salon format ustunini tekshirish...');
    
    // Check all salon_format values
    const result = await pool.query('SELECT id, salon_name, salon_format FROM master_salons ORDER BY created_at DESC LIMIT 5');
    
    console.log('Master salons salon_format values:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Name: ${row.salon_name}`);
      console.log(`Format: ${JSON.stringify(row.salon_format)}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Tekshirishda xato:', error);
    process.exit(1);
  }
}

checkSalonFormat();