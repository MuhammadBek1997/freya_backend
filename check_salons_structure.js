const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSalonsStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Salons jadval strukturasini tekshirish...');
    
    // Jadval ustunlarini ko'rish
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'salons' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Salons jadval ustunlari:');
    columns.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Mavjud salonlarni ko'rish
    const existingSalons = await client.query('SELECT * FROM salons LIMIT 3');
    console.log(`\n📊 Mavjud salonlar soni: ${existingSalons.rows.length}`);
    
    if (existingSalons.rows.length > 0) {
      console.log('\n🏢 Birinchi salon ma\'lumotlari:');
      console.log(existingSalons.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSalonsStructure();