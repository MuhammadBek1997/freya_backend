const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function create2Salons() {
  const client = await pool.connect();
  
  try {
    console.log('🏢 2 ta salon yaratish boshlandi...');
    
    // 1. Private salon yaratish
    const privateSalon = await client.query(`
      INSERT INTO salons (
        name, 
        description, 
        address, 
        phone, 
        email, 
        is_private, 
        working_hours, 
        location,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'Freya Beauty Private Salon',
        'Shaxsiy go''zallik saloni - yuqori sifatli xizmatlar',
        'Toshkent sh., Yunusobod tumani, Amir Temur ko''chasi 15',
        '+998901234567',
        'private@freyasalon.uz',
        true,
        '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "10:00-16:00", "sunday": "closed"}',
        '{"latitude": 41.311081, "longitude": 69.240562}',
        true,
        NOW(),
        NOW()
      ) RETURNING *
    `);
    
    console.log('✅ Private salon yaratildi:', privateSalon.rows[0]);
    
    // 2. Corporate salon yaratish
    const corporateSalon = await client.query(`
      INSERT INTO salons (
        name, 
        description, 
        address, 
        phone, 
        email, 
        is_private, 
        working_hours, 
        location,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'Freya Corporate Beauty Center',
        'Korporativ go''zallik markazi - biznes mijozlar uchun',
        'Toshkent sh., Mirobod tumani, Mustaqillik ko''chasi 28',
        '+998901234568',
        'corporate@freyasalon.uz',
        false,
        '{"monday": "08:00-20:00", "tuesday": "08:00-20:00", "wednesday": "08:00-20:00", "thursday": "08:00-20:00", "friday": "08:00-20:00", "saturday": "09:00-18:00", "sunday": "10:00-16:00"}',
        '{"latitude": 41.326418, "longitude": 69.228268}',
        true,
        NOW(),
        NOW()
      ) RETURNING *
    `);
    
    console.log('✅ Corporate salon yaratildi:', corporateSalon.rows[0]);
    
    // 3. Jami salonlar sonini tekshirish
    const totalSalons = await client.query('SELECT COUNT(*) as count FROM salons');
    console.log(`\n📊 Jami salonlar soni: ${totalSalons.rows[0].count}`);
    
    // 4. Salon turlarini ko'rsatish
    const salonTypes = await client.query(`
      SELECT 
        CASE 
          WHEN is_private = true THEN 'Private'
          WHEN is_private = false THEN 'Corporate'
          ELSE 'Unknown'
        END as salon_type,
        COUNT(*) as count 
      FROM salons 
      GROUP BY is_private 
      ORDER BY is_private DESC
    `);
    
    console.log('\n📋 Salon turlari:');
    salonTypes.rows.forEach(row => {
      console.log(`  - ${row.salon_type}: ${row.count} ta`);
    });
    
    console.log('\n🎉 2 ta salon muvaffaqiyatli yaratildi!');
    
  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

create2Salons();