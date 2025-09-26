require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugProductionUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Production database ga ulanmoqda...');
    
    // Check all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Barcha table\'lar:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check users table schema
    const usersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Users table schema:');
    usersSchema.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Count all users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Jami userlar soni: ${userCount.rows[0].count}`);
    
    // Show all users
    const allUsers = await client.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 10');
    console.log('\n📝 Oxirgi 10 ta user:');
    if (allUsers.rows.length === 0) {
      console.log('  Hech qanday user topilmadi');
    } else {
      allUsers.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Phone: ${user.phone}`);
        console.log(`     Username: ${user.username || 'null'}`);
        console.log(`     Email: ${user.email || 'null'}`);
        console.log(`     Registration Step: ${user.registration_step}`);
        console.log(`     Is Verified: ${user.is_verified}`);
        console.log(`     Is Active: ${user.is_active}`);
        console.log(`     Created: ${user.created_at}`);
        console.log('     ---');
      });
    }
    
    // Check specific phone number
    const specificUser = await client.query(
      'SELECT * FROM users WHERE phone = $1',
      ['+998990972472']
    );
    
    console.log(`\n🔍 +998990972472 raqami uchun qidiruv:`)
    if (specificUser.rows.length === 0) {
      console.log('  Bu raqam bilan user topilmadi');
    } else {
      console.log('  Bu raqam bilan user topildi:');
      specificUser.rows.forEach(user => {
        console.log(`    ID: ${user.id}`);
        console.log(`    Phone: ${user.phone}`);
        console.log(`    Username: ${user.username || 'null'}`);
        console.log(`    Registration Step: ${user.registration_step}`);
        console.log(`    Is Verified: ${user.is_verified}`);
        console.log(`    Created: ${user.created_at}`);
      });
    }
    
    // Check if there are any other tables with phone numbers
    console.log('\n🔍 Boshqa table\'larda telefon raqam qidirish...');
    
    // Check clients table
    try {
      const clientsCount = await client.query('SELECT COUNT(*) FROM clients WHERE phone = $1', ['+998990972472']);
      console.log(`  Clients table: ${clientsCount.rows[0].count} ta topildi`);
    } catch (error) {
      console.log('  Clients table: mavjud emas yoki xato');
    }
    
    // Check masters table
    try {
      const mastersCount = await client.query('SELECT COUNT(*) FROM masters WHERE phone = $1', ['+998990972472']);
      console.log(`  Masters table: ${mastersCount.rows[0].count} ta topildi`);
    } catch (error) {
      console.log('  Masters table: mavjud emas yoki xato');
    }
    
    // Check employees table
    try {
      const employeesCount = await client.query('SELECT COUNT(*) FROM employees WHERE phone = $1', ['+998990972472']);
      console.log(`  Employees table: ${employeesCount.rows[0].count} ta topildi`);
    } catch (error) {
      console.log('  Employees table: mavjud emas yoki xato');
    }
    
  } catch (error) {
    console.error('❌ Xato:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the debug
debugProductionUsers()
  .then(() => {
    console.log('\n✅ Debug tugadi');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug xatosi:', error);
    process.exit(1);
  });