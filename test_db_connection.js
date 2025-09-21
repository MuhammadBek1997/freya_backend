const { pool } = require('./config/database');

async function testConnection() {
  console.log('🔄 Database ulanishini tekshirish...');
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database ulanish muvaffaqiyatli!');
    
    // Test simple query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📅 Server vaqti:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL versiyasi:', result.rows[0].pg_version);
    
    // Test tables existence
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Mavjud jadvallar:');
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  Hech qanday jadval topilmadi. Schema.sql ni import qilish kerak.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   📄 ${row.table_name}`);
      });
    }
    
    client.release();
    console.log('🎉 Database test muvaffaqiyatli yakunlandi!');
    
  } catch (error) {
    console.error('❌ Database ulanish xatosi:', error.message);
    console.error('🔍 Xato tafsilotlari:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();