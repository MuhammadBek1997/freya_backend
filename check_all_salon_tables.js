const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAllSalonTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Production databasedagi barcha salon-related jadvallarni tekshirmoqda...\n');

    // 1. Barcha jadvallarni topish
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%salon%'
      ORDER BY table_name
    `;
    const tablesResult = await client.query(tablesQuery);
    
    console.log('📋 Salon-related jadvallar:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    // 2. Asosiy salons jadvalini batafsil tekshirish
    console.log('🏢 Asosiy SALONS jadvalini batafsil tekshirmoqda...');
    
    // Avval strukturani ko'ramiz
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'salons' 
      ORDER BY ordinal_position
    `;
    const structureResult = await client.query(structureQuery);
    
    console.log('📊 Salons jadvali strukturasi:');
    structureResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    console.log('');
    
    // Barcha salonlarni olish
    const allSalonsQuery = `SELECT * FROM salons ORDER BY id`;
    const allSalonsResult = await client.query(allSalonsQuery);
    
    console.log(`📊 Salons jadvalida jami ${allSalonsResult.rows.length} ta yozuv:`);
    allSalonsResult.rows.forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}", Yaratilgan: ${salon.created_at}`);
    });
    console.log('');

    // 3. API test qilish - to'g'ridan-to'g'ri database query bilan
    console.log('🔍 API query ni to\'g\'ridan-to\'g\'ri test qilmoqda...');
    
    // API controller dagi query ni takrorlash
    const apiQuery = `
      SELECT * FROM salons 
      WHERE 1=1
      ORDER BY created_at DESC LIMIT 10 OFFSET 0
    `;
    const apiResult = await client.query(apiQuery);
    
    console.log(`📊 API query natijasi: ${apiResult.rows.length} ta salon`);
    apiResult.rows.forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
    });
    console.log('');

    // 4. Boshqa salon-related jadvallarni tekshirish
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      if (tableName === 'salons') continue; // Allaqachon tekshirdik
      
      try {
        console.log(`🔍 ${tableName} jadvalini tekshirmoqda...`);
        
        // Ma'lumotlar sonini olish
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const countResult = await client.query(countQuery);
        const count = countResult.rows[0].count;
        
        console.log(`   📈 Jami yozuvlar: ${count}`);
        
        // Agar yozuvlar bor bo'lsa, bir nechta namunani ko'rsatish
        if (count > 0 && count <= 10) {
          const sampleQuery = `SELECT * FROM ${tableName} LIMIT 5`;
          const sampleResult = await client.query(sampleQuery);
          
          console.log(`   📋 Namuna ma'lumotlar:`);
          sampleResult.rows.forEach((row, index) => {
            console.log(`      ${index + 1}. ID: ${row.id || 'N/A'}, Ma'lumot: ${JSON.stringify(row).substring(0, 100)}...`);
          });
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ ${tableName} jadvalini tekshirishda xato: ${error.message}`);
        console.log('');
      }
    }

    // 5. Cache yoki view jadvallarini tekshirish
    console.log('🔍 View va materialized view jadvallarini tekshirmoqda...');
    
    const viewsQuery = `
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_type = 'VIEW' OR table_type = 'MATERIALIZED VIEW')
      AND table_name LIKE '%salon%'
    `;
    const viewsResult = await client.query(viewsQuery);
    
    if (viewsResult.rows.length > 0) {
      console.log('📋 Topilgan view jadvallar:');
      viewsResult.rows.forEach(view => {
        console.log(`   - ${view.table_name} (${view.table_type})`);
      });
    } else {
      console.log('ℹ️  Salon-related view jadvallar topilmadi');
    }

    // 6. Heroku cache yoki connection pool muammosini tekshirish
    console.log('\n🔄 Database connection pool holatini tekshirmoqda...');
    const poolStatsQuery = `
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    try {
      const poolResult = await client.query(poolStatsQuery);
      console.log('📊 Connection pool holati:');
      console.log(`   - Jami connectionlar: ${poolResult.rows[0].total_connections}`);
      console.log(`   - Faol connectionlar: ${poolResult.rows[0].active_connections}`);
      console.log(`   - Bo'sh connectionlar: ${poolResult.rows[0].idle_connections}`);
    } catch (error) {
      console.log('⚠️  Connection pool ma\'lumotlarini olishda xato:', error.message);
    }

  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Script ishga tushirish
if (require.main === module) {
  checkAllSalonTables()
    .then(() => {
      console.log('\n✅ Tekshirish yakunlandi!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script xatosi:', error);
      process.exit(1);
    });
}

module.exports = { checkAllSalonTables };