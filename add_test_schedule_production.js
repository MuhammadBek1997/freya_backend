require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addTestSchedule() {
  try {
    console.log('🔗 Production database ga ulanmoqda...');
    
    // Test schedule qo'shamiz
    const insertQuery = `
      INSERT INTO schedules (
        name, 
        title, 
        date, 
        employee_list, 
        repeat, 
        repeat_value, 
        price, 
        full_pay, 
        deposit, 
        is_active,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *;
    `;
    
    const values = [
      'Test Schedule',
      'Test Xizmat',
      '2024-01-15',
      JSON.stringify([
        { id: 1, name: 'Usta 1', role: 'master' },
        { id: 2, name: 'Usta 2', role: 'assistant' }
      ]),
      'weekly',
      7,
      100000,
      100000, // full_pay - numeric
      50000,
      true,
      new Date(),
      new Date()
    ];
    
    const result = await pool.query(insertQuery, values);
    
    console.log('✅ Test schedule qo\'shildi:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    // Barcha schedule larni olish
    const selectQuery = 'SELECT * FROM schedules ORDER BY created_at DESC LIMIT 3';
    const schedules = await pool.query(selectQuery);
    
    console.log('\n📋 Production database dagi schedules:');
    schedules.rows.forEach((schedule, index) => {
      console.log(`${index + 1}. ID: ${schedule.id}`);
      console.log(`   Name: ${schedule.name}`);
      console.log(`   Employee List: ${JSON.stringify(schedule.employee_list)}`);
      console.log(`   Date: ${schedule.date}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

addTestSchedule();