require('dotenv').config({ path: '.env.production' });
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAdmins() {
  try {
    console.log('🔍 Production database dagi admins table ni tekshirmoqda...');
    
    // Check if admins table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admins'
      );
    `);
    
    console.log('📋 Admins table mavjudmi:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'admins'
        ORDER BY ordinal_position;
      `);
      
      console.log('🏗️ Admins table structure:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
      
      // Get all admins
      const admins = await pool.query('SELECT * FROM admins');
      console.log(`\n👥 Jami adminlar soni: ${admins.rows.length}`);
      
      if (admins.rows.length > 0) {
        console.log('\n📝 Adminlar ro\'yxati:');
        admins.rows.forEach((admin, index) => {
          console.log(`${index + 1}. Username: ${admin.username}`);
          console.log(`   Password Hash: ${admin.password_hash ? admin.password_hash.substring(0, 20) + '...' : 'NULL'}`);
          console.log(`   Created: ${admin.created_at}`);
          console.log('   ---');
        });
      } else {
        console.log('❌ Hech qanday admin topilmadi');
      }
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmins();