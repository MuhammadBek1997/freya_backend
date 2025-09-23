require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTestSalon() {
  try {
    console.log('🏢 Test salon yaratilmoqda...');
    
    const result = await pool.query(`
      INSERT INTO salons (name, description, address, phone, email, working_hours, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      'Test Salon',
      'Bu test salon',
      'Toshkent, Test ko\'chasi 1',
      '+998901234567',
      'test@salon.uz',
      JSON.stringify({
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { closed: true }
      }),
      true
    ]);
    
    console.log('✅ Test salon yaratildi:', result.rows[0]);
    
    // Test translation service
    const salonTranslationService = require('./services/salonTranslationService');
    
    console.log('🌐 Tarjima qilish boshlandi...');
    await salonTranslationService.translateAndStoreSalon(result.rows[0], result.rows[0].id);
    console.log('✅ Tarjima muvaffaqiyatli yakunlandi!');
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await pool.end();
  }
}

createTestSalon();