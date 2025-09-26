const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSalons() {
  try {
    console.log('Checking salon table structure...\n');
    
    // First check table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'salons'
      ORDER BY ordinal_position
    `);
    
    console.log('Salon table columns:');
    structureResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\nChecking all salons...\n');
    
    const result = await pool.query(`
      SELECT 
        s.id as salon_id,
        s.salon_name,
        s.salon_phone,
        s.salon_instagram,
        s.salon_rating,
        s.address_uz,
        s.address_ru,
        s.address_en,
        s.is_private,
        a.id as admin_id,
        a.username as admin_username,
        a.full_name as admin_full_name
      FROM salons s
      LEFT JOIN admins a ON s.id = a.salon_id
      ORDER BY s.id
    `);
    
    console.log('Salons and their admins:');
    console.log('========================');
    
    result.rows.forEach(row => {
      console.log(`Salon ID: ${row.salon_id}`);
      console.log(`Salon Name: ${row.salon_name}`);
      console.log(`Salon Phone: ${row.salon_phone}`);
      console.log(`Salon Instagram: ${row.salon_instagram}`);
      console.log(`Salon Rating: ${row.salon_rating}`);
      console.log(`Address (UZ): ${row.address_uz}`);
      console.log(`Address (RU): ${row.address_ru}`);
      console.log(`Address (EN): ${row.address_en}`);
      console.log(`Is Private: ${row.is_private}`);
      console.log(`Admin ID: ${row.admin_id}`);
      console.log(`Admin Username: ${row.admin_username}`);
      console.log(`Admin Full Name: ${row.admin_full_name}`);
      console.log('------------------------');
    });
    
    console.log(`\nTotal salons found: ${result.rows.length}`);
    
  } catch (error) {
    console.error('Error checking salons:', error);
  } finally {
    await pool.end();
  }
}

checkSalons();