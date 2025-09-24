require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addSalonTypesToSalons() {
  try {
    console.log('=== SALONS JADVALIGA SALON_TYPES USTUNINI QO\'SHISH ===\n');
    
    // salon_types ustunini qo'shish
    console.log('1. salon_types ustunini qo\'shamiz...');
    await pool.query(`
      ALTER TABLE salons 
      ADD COLUMN IF NOT EXISTS salon_types JSONB DEFAULT '[{"name":"Ayollar","icon":"woman"},{"name":"Erkaklar","icon":"man"},{"name":"Bolalar","icon":"child"}]'::jsonb
    `);
    console.log('✓ salon_types ustuni muvaffaqiyatli qo\'shildi\n');
    
    // Mavjud salonlarga default salon_types qo'shish
    console.log('2. Mavjud salonlarga default salon_types qo\'shamiz...');
    await pool.query(`
      UPDATE salons 
      SET salon_types = '[{"name":"Ayollar","icon":"woman"},{"name":"Erkaklar","icon":"man"},{"name":"Bolalar","icon":"child"}]'::jsonb
      WHERE salon_types IS NULL OR salon_types = '[]'::jsonb
    `);
    console.log('✓ Mavjud salonlarga default salon_types qo\'shildi\n');
    
    // Jadval strukturasini tekshirish
    console.log('3. Yangilangan jadval strukturasi:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'salons'
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Salonlar sonini tekshirish
    console.log('\n4. Salonlar soni:');
    const salonCount = await pool.query('SELECT COUNT(*) as count FROM salons');
    console.log(`  - Jami salonlar: ${salonCount.rows[0].count}`);
    
    console.log('\n=== MUVAFFAQIYATLI TUGALLANDI ===');
    
  } catch (error) {
    console.error('Xato:', error);
  } finally {
    await pool.end();
  }
}

addSalonTypesToSalons();