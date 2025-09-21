const { Pool } = require('pg');

// Test different possible database URLs
const possibleUrls = [
  process.env.DATABASE_URL,
  process.env.HEROKU_POSTGRESQL_URL,
  // Add more if needed
];

async function testHerokuDatabase() {
  console.log('🔍 Testing Heroku database connection...');
  
  // Try to connect using the same method as the main app
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    
    // Check salons table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'salons' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Salons table structure:');
    if (tableInfo.rows.length === 0) {
      console.log('❌ Salons table does not exist!');
    } else {
      tableInfo.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }
    
    // Check if created_at column exists
    const createdAtCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'salons' AND column_name = 'created_at';
    `);
    
    if (createdAtCheck.rows.length === 0) {
      console.log('❌ created_at column is missing!');
    } else {
      console.log('✅ created_at column exists');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  testHerokuDatabase()
    .then(() => {
      console.log('🏁 Database test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testHerokuDatabase };