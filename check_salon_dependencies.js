const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSalonDependencies() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Salons jadvaliga bog\'liq barcha foreign key constraint larni tekshirmoqda...\n');

    // Salons jadvaliga bog'liq barcha foreign key constraint larni topish
    const constraintsQuery = `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'salons'
      ORDER BY tc.table_name;
    `;
    
    const constraintsResult = await client.query(constraintsQuery);
    
    console.log(`📋 Salons jadvaliga bog'liq ${constraintsResult.rows.length} ta foreign key constraint topildi:`);
    
    const dependentTables = new Set();
    
    constraintsResult.rows.forEach(constraint => {
      console.log(`   - ${constraint.table_name}.${constraint.column_name} -> salons.${constraint.foreign_column_name} (${constraint.constraint_name})`);
      dependentTables.add(constraint.table_name);
    });
    
    console.log('\n📊 Bog\'liq jadvallar:');
    dependentTables.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    // Har bir bog'liq jadvaldagi ma'lumotlar sonini tekshirish
    console.log('\n🔢 Har bir bog\'liq jadvaldagi ma\'lumotlar soni:');
    
    for (const tableName of dependentTables) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const countResult = await client.query(countQuery);
        console.log(`   - ${tableName}: ${countResult.rows[0].count} ta yozuv`);
        
        // Agar yozuvlar kam bo'lsa, namunalarni ko'rsatish
        if (countResult.rows[0].count <= 10 && countResult.rows[0].count > 0) {
          const sampleQuery = `SELECT * FROM ${tableName} LIMIT 3`;
          const sampleResult = await client.query(sampleQuery);
          console.log(`     Namuna ma'lumotlar:`);
          sampleResult.rows.forEach((row, index) => {
            console.log(`       ${index + 1}. ${JSON.stringify(row).substring(0, 100)}...`);
          });
        }
      } catch (error) {
        console.log(`   - ${tableName}: Xato - ${error.message}`);
      }
    }

    // Salons jadvalidagi ma'lumotlarni ham ko'rsatish
    console.log('\n🏢 Salons jadvalidagi ma\'lumotlar:');
    const salonsQuery = `SELECT id, name FROM salons ORDER BY created_at`;
    const salonsResult = await client.query(salonsQuery);
    
    salonsResult.rows.forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
    });

  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Script ishga tushirish
if (require.main === module) {
  checkSalonDependencies()
    .then(() => {
      console.log('\n✅ Tekshirish yakunlandi!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script xatosi:', error);
      process.exit(1);
    });
}

module.exports = { checkSalonDependencies };