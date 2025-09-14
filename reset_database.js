const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  try {
    console.log('Database ni tozalash boshlandi...');
    
    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('Database muvaffaqiyatli tozalandi va qayta yaratildi!');
    
    // Check salon_format column
    const result = await pool.query('SELECT salon_format FROM master_salons LIMIT 1');
    console.log('Salon format check:', result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Database tozalashda xato:', error);
    process.exit(1);
  }
}

resetDatabase();