require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTranslations() {
  try {
    console.log('🔍 Tarjima tablelarini tekshirish...');
    
    // Check if salon_translations table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'salon_translations'
      );
    `);
    
    console.log('salon_translations table mavjudmi:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check translations data
      const translations = await pool.query('SELECT * FROM salon_translations');
      console.log('Tarjimalar soni:', translations.rows.length);
      
      if (translations.rows.length > 0) {
        console.log('Birinchi tarjima:', translations.rows[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await pool.end();
  }
}

checkTranslations();