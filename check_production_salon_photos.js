const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

// Production database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSalonPhotosColumn() {
  try {
    console.log('Connecting to production database...');
    
    // Salons jadvalining strukturasini tekshirish
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'salons'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== SALONS TABLE STRUCTURE ===');
    tableInfo.rows.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
    // salon_photos ustuni mavjudligini tekshirish
    const hasPhotosColumn = tableInfo.rows.some(col => col.column_name === 'salon_photos');
    
    if (hasPhotosColumn) {
      console.log('\n✅ salon_photos ustuni mavjud');
      
      // Mavjud salon_photos ma'lumotlarini ko'rish
      const photosData = await pool.query('SELECT id, salon_name, salon_photos FROM salons LIMIT 5');
      
      console.log('\n=== SALON PHOTOS DATA ===');
      photosData.rows.forEach(row => {
        console.log(`Salon ${row.id} (${row.salon_name}): ${row.salon_photos || 'NULL'}`);
      });
    } else {
      console.log('\n❌ salon_photos ustuni mavjud emas');
      console.log('salon_photos ustunini qo\'shish...');
      
      // salon_photos ustunini qo'shish
      await pool.query('ALTER TABLE salons ADD COLUMN salon_photos TEXT');
      console.log('✅ salon_photos ustuni muvaffaqiyatli qo\'shildi');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSalonPhotosColumn();