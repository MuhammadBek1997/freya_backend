const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function getSalonIds() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Salon ID larini olish...');
    
    const salons = await client.query(`
      SELECT id, name, is_private 
      FROM salons 
      ORDER BY is_private DESC
    `);
    
    console.log('\n📋 Mavjud salonlar:');
    salons.rows.forEach(salon => {
      const type = salon.is_private ? 'Private' : 'Corporate';
      console.log(`- ${salon.name} (${type}): ${salon.id}`);
    });
    
    return salons.rows;
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

getSalonIds();