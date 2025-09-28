require('dotenv').config();

const { Pool } = require('pg');

// Use local database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'freya_salon',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function checkLocalAppointments() {
  try {
    console.log('🔍 Local database appointmentlarni tekshirmoqda...');
    
    // Check if sequence exists in local
    const sequenceCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_sequences 
        WHERE sequencename = 'appointment_number_seq'
      );
    `);
    
    console.log('📋 Local da appointment_number_seq mavjudmi:', sequenceCheck.rows[0].exists);
    
    if (sequenceCheck.rows[0].exists) {
      const currentValue = await pool.query(`
        SELECT last_value 
        FROM appointment_number_seq;
      `);
      
      console.log('🔢 Local sequence qiymati:', currentValue.rows[0].last_value);
    }
    
    // Check existing appointment numbers in local
    const appointments = await pool.query(`
      SELECT application_number, created_at 
      FROM appointments 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📝 Local da oxirgi 10 ta appointment raqami:');
    if (appointments.rows.length === 0) {
      console.log('   Hech qanday appointment topilmadi');
    } else {
      appointments.rows.forEach((app, index) => {
        console.log(`${index + 1}. ${app.application_number} (${app.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

checkLocalAppointments();