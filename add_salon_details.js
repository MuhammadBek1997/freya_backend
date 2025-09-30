const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSalonDetails() {
  const client = await pool.connect();
  
  try {
    console.log('🏢 Salonlarga salon_types va salon_comfort qo\'shish...\n');
    
    // Salon types ma'lumotlari
    const salonTypes = [
      { "type": "Beauty Salon", "selected": true },
      { "type": "Fitness", "selected": false },
      { "type": "Functional Training", "selected": false },
      { "type": "Yoga", "selected": false },
      { "type": "Massage", "selected": false }
    ];
    
    // Salon comfort ma'lumotlari
    const salonComfort = [
      { "name": "parking", "isActive": true },
      { "name": "cafee", "isActive": false },
      { "name": "onlyFemale", "isActive": false },
      { "name": "water", "isActive": true },
      { "name": "pets", "isActive": false },
      { "name": "bath", "isActive": false },
      { "name": "towel", "isActive": false },
      { "name": "kids", "isActive": true }
    ];
    
    // Avval salons jadvalining strukturasini tekshirish
    console.log('🔍 Salons jadval strukturasini tekshirish...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'salons' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Mavjud ustunlar:');
    tableInfo.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // salon_types va salon_comfort ustunlari mavjudligini tekshirish
    const hasTypes = tableInfo.rows.some(col => col.column_name === 'salon_types');
    const hasComfort = tableInfo.rows.some(col => col.column_name === 'salon_comfort');
    
    // Agar ustunlar mavjud bo'lmasa, qo'shish
    if (!hasTypes) {
      console.log('\n➕ salon_types ustunini qo\'shish...');
      await client.query('ALTER TABLE salons ADD COLUMN salon_types JSONB');
      console.log('✅ salon_types ustuni qo\'shildi');
    } else {
      console.log('\n✅ salon_types ustuni allaqachon mavjud');
    }
    
    if (!hasComfort) {
      console.log('➕ salon_comfort ustunini qo\'shish...');
      await client.query('ALTER TABLE salons ADD COLUMN salon_comfort JSONB');
      console.log('✅ salon_comfort ustuni qo\'shildi');
    } else {
      console.log('✅ salon_comfort ustuni allaqachon mavjud');
    }
    
    // Barcha salonlarni olish
    const salons = await client.query('SELECT id, name, is_private FROM salons ORDER BY name');
    
    console.log('\n🔄 Salonlarni yangilash...');
    
    for (let salon of salons.rows) {
      // Har bir salon uchun salon_types va salon_comfort qo'shish
      await client.query(`
        UPDATE salons 
        SET salon_types = $1, salon_comfort = $2 
        WHERE id = $3
      `, [JSON.stringify(salonTypes), JSON.stringify(salonComfort), salon.id]);
      
      console.log(`✅ ${salon.name} (${salon.is_private ? 'Private' : 'Public'}) yangilandi`);
    }
    
    // Yangilangan ma'lumotlarni tekshirish
    console.log('\n🔍 Yangilangan salonlar:');
    const updatedSalons = await client.query(`
      SELECT id, name, is_private, salon_types, salon_comfort 
      FROM salons 
      ORDER BY name
    `);
    
    updatedSalons.rows.forEach((salon, index) => {
      console.log(`\n${index + 1}. ${salon.name} (${salon.is_private ? 'Private' : 'Public'})`);
      console.log(`   ID: ${salon.id}`);
      
      if (salon.salon_types) {
        console.log('   Salon Types:');
        const types = typeof salon.salon_types === 'string' ? JSON.parse(salon.salon_types) : salon.salon_types;
        types.forEach(type => {
          console.log(`     - ${type.type}: ${type.selected ? '✅' : '❌'}`);
        });
      }
      
      if (salon.salon_comfort) {
        console.log('   Salon Comfort:');
        const comfort = typeof salon.salon_comfort === 'string' ? JSON.parse(salon.salon_comfort) : salon.salon_comfort;
        comfort.forEach(item => {
          console.log(`     - ${item.name}: ${item.isActive ? '✅' : '❌'}`);
        });
      }
    });
    
    console.log('\n🎉 Barcha salonlar muvaffaqiyatli yangilandi!');
    console.log(`✅ ${salons.rows.length} ta salonga salon_types va salon_comfort qo'shildi`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addSalonDetails();