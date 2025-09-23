const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUntranslatedData() {
  try {
    console.log('🔍 Tarjima qilinmagan ma\'lumotlarni tekshirish...\n');

    // Salonlar tekshirish
    console.log('📍 SALONLAR:');
    const salonsQuery = `
      SELECT s.id, s.salon_name, s.salon_description, s.salon_title,
             COUNT(st.salon_id) as translation_count
      FROM salons s
      LEFT JOIN salon_translations st ON s.id = st.salon_id
      GROUP BY s.id, s.salon_name, s.salon_description, s.salon_title
      ORDER BY s.created_at DESC
      LIMIT 10
    `;
    
    const salonsResult = await pool.query(salonsQuery);
    console.log(`Jami salonlar: ${salonsResult.rows.length}`);
    
    for (const salon of salonsResult.rows) {
      console.log(`- ID: ${salon.id}`);
      console.log(`  Nomi: ${salon.salon_name}`);
      console.log(`  Tarjimalar soni: ${salon.translation_count}/3 (uz, en, ru)`);
      if (salon.translation_count < 3) {
        console.log(`  ⚠️  Tarjima to'liq emas!`);
      }
      console.log('');
    }

    // Xodimlar tekshirish
    console.log('\n👥 XODIMLAR:');
    const employeesQuery = `
      SELECT e.id, e.name, e.surname, e.profession, e.bio,
             COUNT(et.employee_id) as translation_count
      FROM employees e
      LEFT JOIN employee_translations et ON e.id = et.employee_id
      GROUP BY e.id, e.name, e.surname, e.profession, e.bio
      ORDER BY e.created_at DESC
      LIMIT 10
    `;
    
    const employeesResult = await pool.query(employeesQuery);
    console.log(`Jami xodimlar: ${employeesResult.rows.length}`);
    
    for (const employee of employeesResult.rows) {
      console.log(`- ID: ${employee.id}`);
      console.log(`  Nomi: ${employee.name} ${employee.surname}`);
      console.log(`  Kasbi: ${employee.profession}`);
      console.log(`  Tarjimalar soni: ${employee.translation_count}/3 (uz, en, ru)`);
      if (employee.translation_count < 3) {
        console.log(`  ⚠️  Tarjima to'liq emas!`);
      }
      console.log('');
    }

    // Jadvallar tekshirish
    console.log('\n📅 JADVALLAR:');
    const schedulesQuery = `
      SELECT s.id, s.name, s.title,
             COUNT(st.schedule_id) as translation_count
      FROM schedules s
      LEFT JOIN schedule_translations st ON s.id = st.schedule_id
      GROUP BY s.id, s.name, s.title
      ORDER BY s.created_at DESC
      LIMIT 10
    `;
    
    const schedulesResult = await pool.query(schedulesQuery);
    console.log(`Jami jadvallar: ${schedulesResult.rows.length}`);
    
    for (const schedule of schedulesResult.rows) {
      console.log(`- ID: ${schedule.id}`);
      console.log(`  Nomi: ${schedule.name}`);
      console.log(`  Sarlavha: ${schedule.title}`);
      console.log(`  Tarjimalar soni: ${schedule.translation_count}/3 (uz, en, ru)`);
      if (schedule.translation_count < 3) {
        console.log(`  ⚠️  Tarjima to'liq emas!`);
      }
      console.log('');
    }

    // Umumiy statistika
    console.log('\n📊 UMUMIY STATISTIKA:');
    
    const salonStatsQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_salons,
        COUNT(DISTINCT CASE WHEN st.language = 'uz' THEN s.id END) as uz_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'en' THEN s.id END) as en_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'ru' THEN s.id END) as ru_translations
      FROM salons s
      LEFT JOIN salon_translations st ON s.id = st.salon_id
    `;
    
    const salonStats = await pool.query(salonStatsQuery);
    const salonStat = salonStats.rows[0];
    
    console.log(`Salonlar:`);
    console.log(`  Jami: ${salonStat.total_salons}`);
    console.log(`  UZ tarjimalar: ${salonStat.uz_translations}`);
    console.log(`  EN tarjimalar: ${salonStat.en_translations}`);
    console.log(`  RU tarjimalar: ${salonStat.ru_translations}`);

    const employeeStatsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN et.language = 'uz' THEN e.id END) as uz_translations,
        COUNT(DISTINCT CASE WHEN et.language = 'en' THEN e.id END) as en_translations,
        COUNT(DISTINCT CASE WHEN et.language = 'ru' THEN e.id END) as ru_translations
      FROM employees e
      LEFT JOIN employee_translations et ON e.id = et.employee_id
    `;
    
    const employeeStats = await pool.query(employeeStatsQuery);
    const employeeStat = employeeStats.rows[0];
    
    console.log(`\nXodimlar:`);
    console.log(`  Jami: ${employeeStat.total_employees}`);
    console.log(`  UZ tarjimalar: ${employeeStat.uz_translations}`);
    console.log(`  EN tarjimalar: ${employeeStat.en_translations}`);
    console.log(`  RU tarjimalar: ${employeeStat.ru_translations}`);

    const scheduleStatsQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_schedules,
        COUNT(DISTINCT CASE WHEN st.language = 'uz' THEN s.id END) as uz_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'en' THEN s.id END) as en_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'ru' THEN s.id END) as ru_translations
      FROM schedules s
      LEFT JOIN schedule_translations st ON s.id = st.schedule_id
    `;
    
    const scheduleStats = await pool.query(scheduleStatsQuery);
    const scheduleStat = scheduleStats.rows[0];
    
    console.log(`\nJadvallar:`);
    console.log(`  Jami: ${scheduleStat.total_schedules}`);
    console.log(`  UZ tarjimalar: ${scheduleStat.uz_translations}`);
    console.log(`  EN tarjimalar: ${scheduleStat.en_translations}`);
    console.log(`  RU tarjimalar: ${scheduleStat.ru_translations}`);

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

checkUntranslatedData();