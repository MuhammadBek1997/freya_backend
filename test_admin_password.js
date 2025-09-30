require('dotenv').config({ path: '.env.production' });

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
    console.log('🔍 Yangilangan admin ma\'lumotlarini tekshirmoqda...\n');
    
    // Get all admins with updated roles
    const result = await pool.query('SELECT username, password_hash, role, full_name FROM admins ORDER BY username');
    
    if (result.rows.length === 0) {
      console.log('❌ Hech qanday admin topilmadi');
      return;
    }
    
    console.log(`✅ ${result.rows.length} ta admin topildi:\n`);
    
    // Display admin information
    result.rows.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.role})`);
      console.log(`   Full Name: ${admin.full_name}`);
      console.log(`   Password: admin${index + 1}123`);
      console.log('');
    });
    
    console.log('🔐 Login ma\'lumotlari:');
    console.log('='.repeat(50));
    console.log('Admin 1:');
    console.log('  Username: admin1');
    console.log('  Password: admin1123');
    console.log('  Role: admin');
    console.log('');
    console.log('Admin 2:');
    console.log('  Username: admin2');
    console.log('  Password: admin2123');
    console.log('  Role: private_admin');
    console.log('');
    
    // Test login for both admins
    console.log('🧪 Login testlari:');
    console.log('='.repeat(50));
    
    const testCredentials = [
      { username: 'admin1', password: 'admin1123' },
      { username: 'admin2', password: 'admin2123' }
    ];
    
    for (const cred of testCredentials) {
      const admin = result.rows.find(a => a.username === cred.username);
      if (admin) {
        const isValid = await bcrypt.compare(cred.password, admin.password_hash);
        console.log(`${cred.username}: ${isValid ? '✅ TO\'G\'RI' : '❌ NOTO\'G\'RI'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

testAdminPassword();