const { pool } = require('./config/database');

async function updateSalonsStructure() {
  try {
    console.log('Salons jadvalini yangilash boshlandi...');

    // 1. is_private ustunini qo'shish
    console.log('1. is_private ustunini qo\'shamiz...');
    await pool.query(`
      ALTER TABLE salons 
      ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false
    `);

    // 2. location ustunini default qiymat bilan yangilash
    console.log('2. Location ustunini yangilaymiz...');
    await pool.query(`
      UPDATE salons 
      SET location = '{"lat": 41, "long": 64}'::jsonb 
      WHERE location IS NULL OR location::text = '"Test location"' OR location::text = 'Test location'
    `);

    // 3. salon_types uchun default qiymatlar
    console.log('3. Salon types ni yangilaymiz...');
    await pool.query(`
      UPDATE salons 
      SET salon_types = '[
        {"id": 1, "name": "Ayollar saloni", "name_ru": "Женский салон", "name_en": "Women salon"},
        {"id": 2, "name": "Erkaklar saloni", "name_ru": "Мужской салон", "name_en": "Men salon"},
        {"id": 3, "name": "Bolalar saloni", "name_ru": "Детский салон", "name_en": "Kids salon"}
      ]'::jsonb
      WHERE salon_types IS NULL OR salon_types = '[]'::jsonb
    `);

    // 4. salon_description ni o'chirib, 3 tilda description qo'shamiz
    console.log('4. Description ustunlarini yangilaymiz...');
    
    // Yangi description ustunlarini qo'shamiz
    await pool.query(`
      ALTER TABLE salons 
      ADD COLUMN IF NOT EXISTS description_uz TEXT,
      ADD COLUMN IF NOT EXISTS description_ru TEXT,
      ADD COLUMN IF NOT EXISTS description_en TEXT
    `);

    // Eski description dan yangi ustunlarga ko'chiramiz
    await pool.query(`
      UPDATE salons 
      SET 
        description_uz = COALESCE(salon_description, 'Salon haqida malumot'),
        description_ru = COALESCE(salon_description, 'Информация о салоне'),
        description_en = COALESCE(salon_description, 'Salon information')
      WHERE description_uz IS NULL
    `);

    // 5. address ustunlarini qo'shamiz
    console.log('5. Address ustunlarini qo\'shamiz...');
    await pool.query(`
      ALTER TABLE salons 
      ADD COLUMN IF NOT EXISTS address_uz TEXT,
      ADD COLUMN IF NOT EXISTS address_ru TEXT,
      ADD COLUMN IF NOT EXISTS address_en TEXT
    `);

    // Default address qiymatlarini o'rnatamiz
    await pool.query(`
      UPDATE salons 
      SET 
        address_uz = 'Toshkent shahri',
        address_ru = 'Город Ташкент',
        address_en = 'Tashkent city'
      WHERE address_uz IS NULL
    `);

    // 6. salon_name ni faqat bitta tilda qoldiramiz (uz)
    console.log('6. Salon name ni yangilaymiz...');
    // salon_name allaqachon mavjud, faqat yangilaymiz
    await pool.query(`
      UPDATE salons 
      SET salon_name = COALESCE(salon_name, 'Salon nomi')
      WHERE salon_name IS NULL OR salon_name = ''
    `);

    console.log('Barcha o\'zgarishlar muvaffaqiyatli amalga oshirildi!');

    // Yangilangan strukturani ko'rsatamiz
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'salons' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nYangilangan salons jadvali strukturasi:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Bitta yangilangan ma'lumotni ko'rsatamiz
    const sampleResult = await pool.query('SELECT * FROM salons LIMIT 1');
    console.log('\nYangilangan ma\'lumot namunasi:');
    console.log(JSON.stringify(sampleResult.rows[0], null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error.message);
    process.exit(1);
  }
}

updateSalonsStructure();