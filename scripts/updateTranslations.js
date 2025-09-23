require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Manual tarjimalar
const translations = {
  "Test Salon": {
    en: "Test Salon",
    ru: "Тестовый салон",
    uz: "Test Salon"
  },
  "Bu test salon": {
    en: "This is a test salon",
    ru: "Это тестовый салон",
    uz: "Bu test salon"
  },
  "Yangi Go'zallik Saloni": {
    en: "New Beauty Salon",
    ru: "Новый салон красоты",
    uz: "Yangi Go'zallik Saloni"
  },
  "Bu yangi va zamonaviy go'zallik saloni": {
    en: "This is a new and modern beauty salon",
    ru: "Это новый и современный салон красоты",
    uz: "Bu yangi va zamonaviy go'zallik saloni"
  }
};

async function updateAllSalonTranslations() {
  try {
    console.log('=== SALONLAR TARJIMALARINI YANGILASH ===\n');
    
    // Barcha salonlarni olish
    const salonsResult = await pool.query('SELECT id, name, description FROM salons ORDER BY created_at');
    console.log(`Jami ${salonsResult.rows.length} ta salon topildi.\n`);
    
    for (const salon of salonsResult.rows) {
      console.log(`--- Salon: ${salon.name} (${salon.id}) ---`);
      
      // Har bir til uchun tarjima yaratish
      const languages = [
        { code: 'en', name: 'Ingliz' },
        { code: 'ru', name: 'Rus' },
        { code: 'uz', name: "O'zbek" }
      ];
      
      for (const lang of languages) {
        let translatedName = salon.name;
        let translatedDescription = salon.description;
        
        // Manual tarjimalardan olish
        if (translations[salon.name] && translations[salon.name][lang.code]) {
          translatedName = translations[salon.name][lang.code];
        }
        
        if (translations[salon.description] && translations[salon.description][lang.code]) {
          translatedDescription = translations[salon.description][lang.code];
        }
        
        // Tarjimani yangilash yoki yaratish
        await pool.query(`
          INSERT INTO salon_translations (salon_id, language, name, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (salon_id, language)
          DO UPDATE SET 
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
        `, [salon.id, lang.code, translatedName, translatedDescription]);
        
        console.log(`  ✓ ${lang.name}: ${translatedName} - ${translatedDescription}`);
      }
      
      console.log('');
    }
    
    console.log('=== YANGILASH TUGALLANDI ===');
    
    // Natijalarni ko'rsatish
    const statsResult = await pool.query(`
      SELECT 
        language, 
        COUNT(*) as count 
      FROM salon_translations 
      GROUP BY language 
      ORDER BY language
    `);
    
    console.log('\nYangilangan tarjimalar statistikasi:');
    statsResult.rows.forEach(stat => {
      console.log(`${stat.language}: ${stat.count} ta salon`);
    });
    
    // Har bir salon uchun tarjimalarni ko'rsatish
    console.log('\n=== YANGILANGAN TARJIMALAR ===');
    for (const salon of salonsResult.rows) {
      console.log(`\n--- ${salon.name} ---`);
      
      const translationsResult = await pool.query(
        'SELECT language, name, description FROM salon_translations WHERE salon_id = $1 ORDER BY language',
        [salon.id]
      );
      
      translationsResult.rows.forEach(trans => {
        console.log(`  ${trans.language}: ${trans.name} - ${trans.description}`);
      });
    }
    
  } catch (error) {
    console.error('Xato:', error);
  } finally {
    await pool.end();
  }
}

updateAllSalonTranslations();