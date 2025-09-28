require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSequence() {
  try {
    console.log('🔍 Appointment number sequence ni tekshirmoqda...');
    
    // Check if sequence exists
    const sequenceCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_sequences 
        WHERE sequencename = 'appointment_number_seq'
      );
    `);
    
    console.log('📋 appointment_number_seq mavjudmi:', sequenceCheck.rows[0].exists);
    
    if (sequenceCheck.rows[0].exists) {
      // Get current sequence value
      const currentValue = await pool.query(`
        SELECT last_value 
        FROM appointment_number_seq;
      `);
      
      console.log('🔢 Sequence ma\'lumotlari:');
      console.log(`   Joriy qiymat: ${currentValue.rows[0].last_value}`);
      
      // Test generating a number
      const testResult = await pool.query('SELECT nextval(\'appointment_number_seq\') as next_val');
      const nextVal = testResult.rows[0].next_val;
      
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetters = letters.charAt(Math.floor(Math.random() * letters.length)) + 
                           letters.charAt(Math.floor(Math.random() * letters.length));
      
      const generatedNumber = `${randomLetters}${String(nextVal).padStart(7, '0')}`;
      console.log(`\n🎯 Test raqam: ${generatedNumber}`);
      
    } else {
      console.log('❌ Sequence mavjud emas');
    }
    
    // Check existing appointment numbers
    const appointments = await pool.query(`
      SELECT application_number, created_at 
      FROM appointments 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📝 Oxirgi 10 ta appointment raqami:');
    appointments.rows.forEach((app, index) => {
      console.log(`${index + 1}. ${app.application_number} (${app.created_at})`);
    });
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

checkSequence();