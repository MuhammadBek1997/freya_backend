const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkProductionSalons() {
  try {
    console.log('🔍 Production databasedagi salonlarni tekshirmoqda...\n');

    // Avval salons jadvalining strukturasini ko'ramiz
    console.log('📋 Salons jadvalining strukturasi:');
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'salons'
      ORDER BY ordinal_position
    `;
    
    const structureResult = await pool.query(structureQuery);
    structureResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    console.log('');

    // Barcha salonlarni olish (mavjud ustunlar bilan)
    const salonsQuery = `
      SELECT 
        id,
        name,
        created_at
      FROM salons
      ORDER BY created_at DESC
    `;

    const salonsResult = await pool.query(salonsQuery);
    
    console.log(`📊 Jami salonlar soni: ${salonsResult.rows.length}\n`);
    
    if (salonsResult.rows.length === 0) {
      console.log('❌ Hech qanday salon topilmadi!');
      return;
    }

    // Barcha salonlarni ko'rsatish
    console.log('📋 Mavjud salonlar:');
    salonsResult.rows.forEach((salon, index) => {
      console.log(`   ${index + 1}. ID: ${salon.id}, Nomi: "${salon.name}", Yaratilgan: ${salon.created_at}`);
    });

    // Admin1 va admin2 ning salonlarini aniqlash (nom bo'yicha)
    // Odatda admin1 va admin2 ning salonlari ma'lum nomlarga ega bo'ladi
    const admin1Salons = salonsResult.rows.filter(salon => {
      const name = salon.name.toLowerCase();
      return name.includes('admin1') || 
             name.includes('test salon') || 
             name.includes('freya salon') ||
             salon.id <= 2; // Birinchi 2 ta salon admin1/admin2 ga tegishli deb hisoblaymiz
    });

    const admin2Salons = salonsResult.rows.filter(salon => {
      const name = salon.name.toLowerCase();
      return name.includes('admin2') && !admin1Salons.some(s => s.id === salon.id);
    });
    
    // Qolgan barcha salonlar o'chiriladigan
    const otherSalons = salonsResult.rows.filter(salon => 
      !admin1Salons.some(s => s.id === salon.id) && 
      !admin2Salons.some(s => s.id === salon.id)
    );

    console.log('\n🟢 SAQLANADIGAN salonlar (admin1/admin2):');
    [...admin1Salons, ...admin2Salons].forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
    });

    console.log('\n🔴 O\'CHIRILADIGAN salonlar:');
    if (otherSalons.length === 0) {
      console.log('   - Hech qanday salon yo\'q');
    } else {
      otherSalons.forEach(salon => {
        console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
      });
    }

    console.log('\n📈 Xulosa:');
    console.log(`   - Saqlanadigan salonlar: ${admin1Salons.length + admin2Salons.length}`);
    console.log(`   - O'chiriladigan salonlar: ${otherSalons.length}`);

    // O'chiriladigan salonlarning ID larini qaytarish
    return {
      keepSalons: [...admin1Salons, ...admin2Salons],
      deleteSalons: otherSalons,
      deleteIds: otherSalons.map(salon => salon.id)
    };

  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Agar to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  checkProductionSalons()
    .then(result => {
      if (result && result.deleteIds.length > 0) {
        console.log('\n⚠️  O\'chirish uchun tayyor ID lar:', result.deleteIds.join(', '));
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Script xatosi:', error);
      process.exit(1);
    });
}

module.exports = { checkProductionSalons };