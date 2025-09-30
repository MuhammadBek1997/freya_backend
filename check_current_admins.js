const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkCurrentAdmins() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Mavjud adminlar:\n');
    
    const admins = await client.query(`
      SELECT id, username, email, full_name, role, salon_id, is_active, created_at
      FROM admins 
      ORDER BY created_at
    `);
    
    admins.rows.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.email})`);
      console.log(`   Full Name: ${admin.full_name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Salon ID: ${admin.salon_id || 'None'}`);
      console.log(`   Active: ${admin.is_active}`);
      console.log(`   Created: ${admin.created_at}`);
      console.log('');
    });
    
    console.log(`📊 Jami adminlar: ${admins.rows.length} ta`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCurrentAdmins();