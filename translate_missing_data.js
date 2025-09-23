const { Pool } = require('pg');
const salonTranslationService = require('./services/salonTranslationService');
const employeeTranslationService = require('./services/employeeTranslationService');
const scheduleTranslationService = require('./services/scheduleTranslationService');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function translateMissingData() {
  try {
    console.log('🔄 Tarjima qilinmagan ma\'lumotlarni tarjima qilish...\n');

    // 1. Tarjima qilinmagan salonlarni topish va tarjima qilish
    console.log('📍 SALONLARNI TARJIMA QILISH:');
    const untranslatedSalonsQuery = `
      SELECT s.id, s.salon_name, s.salon_description, s.salon_title
      FROM salons s
      WHERE s.id NOT IN (
        SELECT DISTINCT salon_id 
        FROM salon_translations 
        WHERE language IN ('uz', 'en', 'ru')
      )
      OR s.id IN (
        SELECT salon_id 
        FROM salon_translations 
        GROUP BY salon_id 
        HAVING COUNT(DISTINCT language) < 3
      )
      ORDER BY s.created_at DESC
    `;

    const untranslatedSalons = await pool.query(untranslatedSalonsQuery);
    console.log(`Tarjima qilinishi kerak bo'lgan salonlar: ${untranslatedSalons.rows.length}`);

    for (const salon of untranslatedSalons.rows) {
      console.log(`\n- Salon: ${salon.salon_name} (ID: ${salon.id})`);
      
      try {
        await salonTranslationService.translateAndStoreSalon({
          salon_name: salon.salon_name,
          salon_description: salon.salon_description,
          salon_title: salon.salon_title
        }, salon.id);
        console.log(`  ✅ Muvaffaqiyatli tarjima qilindi`);
      } catch (error) {
        console.log(`  ❌ Xatolik: ${error.message}`);
      }
    }

    // 2. Tarjima qilinmagan xodimlarni topish va tarjima qilish
    console.log('\n\n👥 XODIMLARNI TARJIMA QILISH:');
    const untranslatedEmployeesQuery = `
      SELECT e.id, e.name, e.surname, e.profession, e.bio
      FROM employees e
      WHERE e.id NOT IN (
        SELECT DISTINCT employee_id 
        FROM employee_translations 
        WHERE language IN ('uz', 'en', 'ru')
      )
      OR e.id IN (
        SELECT employee_id 
        FROM employee_translations 
        GROUP BY employee_id 
        HAVING COUNT(DISTINCT language) < 3
      )
      ORDER BY e.created_at DESC
    `;

    const untranslatedEmployees = await pool.query(untranslatedEmployeesQuery);
    console.log(`Tarjima qilinishi kerak bo'lgan xodimlar: ${untranslatedEmployees.rows.length}`);

    for (const employee of untranslatedEmployees.rows) {
      console.log(`\n- Xodim: ${employee.name} ${employee.surname || ''} (ID: ${employee.id})`);
      
      try {
        await employeeTranslationService.translateAndStoreEmployee({
          name: employee.name,
          surname: employee.surname || '',
          profession: employee.profession || 'Xodim',
          bio: employee.bio || '',
          specialization: ''
        }, employee.id);
        console.log(`  ✅ Muvaffaqiyatli tarjima qilindi`);
      } catch (error) {
        console.log(`  ❌ Xatolik: ${error.message}`);
      }
    }

    // 3. Tarjima qilinmagan jadvallarni topish va tarjima qilish
    console.log('\n\n📅 JADVALLARNI TARJIMA QILISH:');
    const untranslatedSchedulesQuery = `
      SELECT s.id, s.name, s.title
      FROM schedules s
      WHERE s.id NOT IN (
        SELECT DISTINCT schedule_id 
        FROM schedule_translations 
        WHERE language IN ('uz', 'en', 'ru')
      )
      OR s.id IN (
        SELECT schedule_id 
        FROM schedule_translations 
        GROUP BY schedule_id 
        HAVING COUNT(DISTINCT language) < 3
      )
      ORDER BY s.created_at DESC
    `;

    const untranslatedSchedules = await pool.query(untranslatedSchedulesQuery);
    console.log(`Tarjima qilinishi kerak bo'lgan jadvallar: ${untranslatedSchedules.rows.length}`);

    for (const schedule of untranslatedSchedules.rows) {
      console.log(`\n- Jadval: ${schedule.name} (ID: ${schedule.id})`);
      
      try {
        await scheduleTranslationService.translateAndStoreSchedule({
          name: schedule.name,
          title: schedule.title
        }, schedule.id);
        console.log(`  ✅ Muvaffaqiyatli tarjima qilindi`);
      } catch (error) {
        console.log(`  ❌ Xatolik: ${error.message}`);
      }
    }

    console.log('\n\n🎉 Barcha tarjimalar yakunlandi!');
    
    // Yakuniy statistika
    console.log('\n📊 YAKUNIY STATISTIKA:');
    
    // Salonlar statistikasi
    const finalSalonStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_salons,
        COUNT(DISTINCT CASE WHEN st.language = 'uz' THEN s.id END) as uz_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'en' THEN s.id END) as en_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'ru' THEN s.id END) as ru_translations
      FROM salons s
      LEFT JOIN salon_translations st ON s.id = st.salon_id
    `);
    
    const salonStat = finalSalonStats.rows[0];
    console.log(`Salonlar:`);
    console.log(`  Jami: ${salonStat.total_salons}`);
    console.log(`  UZ tarjimalar: ${salonStat.uz_translations}/${salonStat.total_salons}`);
    console.log(`  EN tarjimalar: ${salonStat.en_translations}/${salonStat.total_salons}`);
    console.log(`  RU tarjimalar: ${salonStat.ru_translations}/${salonStat.total_salons}`);

    // Xodimlar statistikasi
    const finalEmployeeStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN et.language = 'uz' THEN e.id END) as uz_translations,
        COUNT(DISTINCT CASE WHEN et.language = 'en' THEN e.id END) as en_translations,
        COUNT(DISTINCT CASE WHEN et.language = 'ru' THEN e.id END) as ru_translations
      FROM employees e
      LEFT JOIN employee_translations et ON e.id = et.employee_id
    `);
    
    const employeeStat = finalEmployeeStats.rows[0];
    console.log(`\nXodimlar:`);
    console.log(`  Jami: ${employeeStat.total_employees}`);
    console.log(`  UZ tarjimalar: ${employeeStat.uz_translations}/${employeeStat.total_employees}`);
    console.log(`  EN tarjimalar: ${employeeStat.en_translations}/${employeeStat.total_employees}`);
    console.log(`  RU tarjimalar: ${employeeStat.ru_translations}/${employeeStat.total_employees}`);

    // Jadvallar statistikasi
    const finalScheduleStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_schedules,
        COUNT(DISTINCT CASE WHEN st.language = 'uz' THEN s.id END) as uz_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'en' THEN s.id END) as en_translations,
        COUNT(DISTINCT CASE WHEN st.language = 'ru' THEN s.id END) as ru_translations
      FROM schedules s
      LEFT JOIN schedule_translations st ON s.id = st.schedule_id
    `);
    
    const scheduleStat = finalScheduleStats.rows[0];
    console.log(`\nJadvallar:`);
    console.log(`  Jami: ${scheduleStat.total_schedules}`);
    console.log(`  UZ tarjimalar: ${scheduleStat.uz_translations}/${scheduleStat.total_schedules}`);
    console.log(`  EN tarjimalar: ${scheduleStat.en_translations}/${scheduleStat.total_schedules}`);
    console.log(`  RU tarjimalar: ${scheduleStat.ru_translations}/${scheduleStat.total_schedules}`);

  } catch (error) {
    console.error('❌ Umumiy xatolik:', error.message);
  } finally {
    await pool.end();
  }
}

translateMissingData();