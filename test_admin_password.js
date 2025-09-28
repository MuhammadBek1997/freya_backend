require('dotenv').config({ path: '.env.production' });
require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testAdminPassword() {
  try {
    console.log('🔍 Admin1 password ni tekshirmoqda...');
    
    // Get admin1 data
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin1']);
    
    if (result.rows.length === 0) {
      console.log('❌ admin1 topilmadi');
      return;
    }
    
    const admin = result.rows[0];
    console.log('✅ admin1 topildi:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Full Name: ${admin.full_name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Is Active: ${admin.is_active}`);
    console.log(`   Password Hash: ${admin.password_hash}`);
    
    // Test different passwords
    const testPasswords = ['admin1123', 'admin123', 'password', '123456', 'admin1'];
    
    console.log('\n🔐 Password testlari:');
    for (const password of testPasswords) {
      const isMatch = await bcrypt.compare(password, admin.password_hash);
      console.log(`   "${password}": ${isMatch ? '✅ TO\'G\'RI' : '❌ NOTO\'G\'RI'}`);
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

testAdminPassword();