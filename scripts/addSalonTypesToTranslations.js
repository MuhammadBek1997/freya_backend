require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSalonTypesToTranslations() {
  try {
    console.log('=== SALON_TRANSLATIONS JADVALIGA SALON_TYPES USTUNINI QO\'SHISH ===\n');
    
    // salon_types ustunini qo'shish
    console.log('1. salon_types ustunini qo\'shamiz...');
    await pool.query(`
      ALTER TABLE salon_translations 
      ADD COLUMN IF NOT EXISTS salon_types JSONB DEFAULT '[]'::jsonb
    `);
    console.log('✓ salon_types ustuni muvaffaqiyatli qo\'shildi\n');
    
    // Jadval strukturasini tekshirish
    console.log('2. Yangilangan jadval strukturasi:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'salon_translations'
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    console.log('\n=== MUVAFFAQIYATLI TUGALLANDI ===');
    
  } catch (error) {
    console.error('Xato:', error);
  } finally {
    await pool.end();
  }
}

addSalonTypesToTranslations();