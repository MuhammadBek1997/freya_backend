require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearAllUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Production database ga ulanmoqda...');
    
    // Check if users table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Users table mavjud emas!');
      return;
    }
    
    // Count existing users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Hozirda ${userCount.rows[0].count} ta user mavjud`);
    
    if (userCount.rows[0].count === '0') {
      console.log('✅ Users table allaqachon bo\'sh');
      return;
    }
    
    // Delete all users
    console.log('🗑️ Barcha userlarni o\'chirmoqda...');
    const deleteResult = await client.query('DELETE FROM users');
    
    console.log(`✅ ${deleteResult.rowCount} ta user o'chirildi`);
    
    // Verify deletion
    const finalCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Oxirgi holat: ${finalCount.rows[0].count} ta user qoldi`);
    
    // Show table structure
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Users table schema:');
    schema.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    console.log('🎉 Users table tozalandi va registratsiya uchun tayyor!');
    
  } catch (error) {
    console.error('❌ Xato:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
clearAllUsers()
  .then(() => {
    console.log('✅ Cleanup tugadi');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup xatosi:', error);
    process.exit(1);
  });