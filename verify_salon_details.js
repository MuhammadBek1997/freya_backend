const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifySalonDetails() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Salon ma\'lumotlarini tekshirish...\n');
    
    const salons = await client.query(`
      SELECT id, name, is_private, salon_types, salon_comfort 
      FROM salons 
      ORDER BY name
    `);
    
    console.log('🏢 SALONLAR VA ULARNING MA\'LUMOTLARI:\n');
    
    salons.rows.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.name} (${salon.is_private ? 'Private' : 'Public'})`);
      console.log(`   ID: ${salon.id}`);
      
      if (salon.salon_types) {
        console.log('   📋 Salon Types:');
        const types = typeof salon.salon_types === 'string' ? JSON.parse(salon.salon_types) : salon.salon_types;
        types.forEach(type => {
          console.log(`     ${type.selected ? '✅' : '❌'} ${type.type}`);
        });
      } else {
        console.log('   ❌ Salon Types mavjud emas');
      }
      
      if (salon.salon_comfort) {
        console.log('   🛋️ Salon Comfort:');
        const comfort = typeof salon.salon_comfort === 'string' ? JSON.parse(salon.salon_comfort) : salon.salon_comfort;
        comfort.forEach(item => {
          console.log(`     ${item.isActive ? '✅' : '❌'} ${item.name}`);
        });
      } else {
        console.log('   ❌ Salon Comfort mavjud emas');
      }
      
      console.log(''); // Bo'sh qator
    });
    
    console.log('📊 XULOSA:');
    console.log(`✅ Jami salonlar: ${salons.rows.length} ta`);
    
    const withTypes = salons.rows.filter(s => s.salon_types).length;
    const withComfort = salons.rows.filter(s => s.salon_comfort).length;
    
    console.log(`✅ salon_types bilan: ${withTypes} ta`);
    console.log(`✅ salon_comfort bilan: ${withComfort} ta`);
    
    if (withTypes === salons.rows.length && withComfort === salons.rows.length) {
      console.log('\n🎉 Barcha salonlarda salon_types va salon_comfort mavjud!');
    } else {
      console.log('\n⚠️ Ba\'zi salonlarda ma\'lumotlar to\'liq emas');
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifySalonDetails();