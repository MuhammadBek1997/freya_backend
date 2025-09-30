const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function deleteProductionSalons() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  To\'g\'ri production databasedan salonlarni o\'chirmoqda...\n');

    // Barcha salonlarni olish
    const allSalonsQuery = `SELECT id, name FROM salons ORDER BY created_at`;
    const allSalonsResult = await client.query(allSalonsQuery);
    
    console.log(`📊 Jami ${allSalonsResult.rows.length} ta salon topildi:`);
    allSalonsResult.rows.forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
    });
    console.log('');

    // Admin1 va admin2 salonlarini aniqlash
    const keepSalons = [];
    const deleteSalons = [];
    
    allSalonsResult.rows.forEach(salon => {
      const name = salon.name.toLowerCase();
      
      // Admin1 va admin2 salonlarini aniqlash
      if (name.includes('admin1') || 
          name.includes('admin2') || 
          name.includes('test salon') || 
          name.includes('freya salon')) {
        keepSalons.push(salon);
      } else {
        deleteSalons.push(salon);
      }
    });

    console.log(`🔒 SAQLANADIGAN salonlar (${keepSalons.length} ta):`);
    keepSalons.forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
    });
    console.log('');

    console.log(`🗑️  O'CHIRILADIGAN salonlar (${deleteSalons.length} ta):`);
    deleteSalons.forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
    });
    console.log('');

    if (deleteSalons.length === 0) {
      console.log('✅ O\'chiriladigan salonlar yo\'q!');
      return;
    }

    // Transaction boshlanishi
    await client.query('BEGIN');
    console.log('🔄 Transaction boshlandi...');

    let deletedPosts = 0;
    let deletedEmployees = 0;
    let deletedAppointments = 0;
    let deletedSchedules = 0;
    let deletedAdmins = 0;
    let deletedSalonTopHistory = 0;
    let deletedSalonTranslations = 0;
    let deletedServices = 0;

    // Har bir salon uchun bog'liq ma'lumotlarni o'chirish
    for (const salon of deleteSalons) {
      const salonId = salon.id;
      
      console.log(`\n🔄 "${salon.name}" (${salonId}) salonini o'chirmoqda...`);

      // 1. Admins jadvalini tozalash
      try {
        const deleteAdminsQuery = `DELETE FROM admins WHERE salon_id = $1`;
        const adminsResult = await client.query(deleteAdminsQuery, [salonId]);
        deletedAdmins += adminsResult.rowCount;
        console.log(`   👤 ${adminsResult.rowCount} ta admin o'chirildi`);
      } catch (error) {
        console.log(`   ⚠️  Admins o'chirishda xato: ${error.message}`);
      }

      // 2. Posts jadvalini tozalash
      try {
        const deletePostsQuery = `DELETE FROM posts WHERE salon_id = $1`;
        const postsResult = await client.query(deletePostsQuery, [salonId]);
        deletedPosts += postsResult.rowCount;
        console.log(`   📝 ${postsResult.rowCount} ta post o'chirildi`);
      } catch (error) {
        console.log(`   ⚠️  Posts o'chirishda xato: ${error.message}`);
      }

      // 3. Salon_top_history jadvalini tozalash
      try {
        const deleteSalonTopHistoryQuery = `DELETE FROM salon_top_history WHERE salon_id = $1`;
        const salonTopHistoryResult = await client.query(deleteSalonTopHistoryQuery, [salonId]);
        deletedSalonTopHistory += salonTopHistoryResult.rowCount;
        console.log(`   📈 ${salonTopHistoryResult.rowCount} ta salon_top_history o'chirildi`);
      } catch (error) {
        console.log(`   ⚠️  Salon_top_history o'chirishda xato: ${error.message}`);
      }

      // 4. Salon_translations jadvalini tozalash
      try {
        const deleteSalonTranslationsQuery = `DELETE FROM salon_translations WHERE salon_id = $1`;
        const salonTranslationsResult = await client.query(deleteSalonTranslationsQuery, [salonId]);
        deletedSalonTranslations += salonTranslationsResult.rowCount;
        console.log(`   🌐 ${salonTranslationsResult.rowCount} ta salon_translation o'chirildi`);
      } catch (error) {
        console.log(`   ⚠️  Salon_translations o'chirishda xato: ${error.message}`);
      }

      // 5. Schedules jadvalini tozalash
      try {
        const deleteSchedulesQuery = `DELETE FROM schedules WHERE salon_id = $1`;
        const schedulesResult = await client.query(deleteSchedulesQuery, [salonId]);
        deletedSchedules += schedulesResult.rowCount;
        console.log(`   📅 ${schedulesResult.rowCount} ta schedule o'chirildi`);
      } catch (error) {
        console.log(`   ⚠️  Schedules o'chirishda xato: ${error.message}`);
      }

      // 6. Services jadvalini tozalash (faqat salon_id ga bog'liq bo'lganlarni)
      try {
        const deleteServicesQuery = `DELETE FROM services WHERE salon_id = $1`;
        const servicesResult = await client.query(deleteServicesQuery, [salonId]);
        deletedServices += servicesResult.rowCount;
        console.log(`   🛠️  ${servicesResult.rowCount} ta service o'chirildi`);
      } catch (error) {
        console.log(`   ⚠️  Services o'chirishda xato: ${error.message}`);
      }

      // 7. Employees jadvalini tozalash
      try {
        const deleteEmployeesQuery = `DELETE FROM employees WHERE salon_id = $1`;
        const employeesResult = await client.query(deleteEmployeesQuery, [salonId]);
        deletedEmployees += employeesResult.rowCount;
        console.log(`   👥 ${employeesResult.rowCount} ta employee o'chirildi`);
      } catch (error) {
        console.log(`   ⚠️  Employees o'chirishda xato: ${error.message}`);
      }

      // 8. Appointments jadvalini tozalash (agar salon_id ustuni mavjud bo'lsa)
      try {
        const checkColumnQuery = `
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'appointments' AND column_name = 'salon_id'
        `;
        const columnExists = await client.query(checkColumnQuery);
        
        if (columnExists.rows.length > 0) {
          const deleteAppointmentsQuery = `DELETE FROM appointments WHERE salon_id = $1`;
          const appointmentsResult = await client.query(deleteAppointmentsQuery, [salonId]);
          deletedAppointments += appointmentsResult.rowCount;
          console.log(`   📅 ${appointmentsResult.rowCount} ta appointment o'chirildi`);
        } else {
          console.log(`   ℹ️  Appointments jadvalida salon_id ustuni yo'q`);
        }
      } catch (error) {
        console.log(`   ⚠️  Appointments o'chirishda xato: ${error.message}`);
      }

      // 9. Salonni o'chirish
      const deleteSalonQuery = `DELETE FROM salons WHERE id = $1`;
      const salonResult = await client.query(deleteSalonQuery, [salonId]);
      console.log(`   🏢 Salon o'chirildi (${salonResult.rowCount} ta yozuv)`);
    }

    // Transaction yakunlash
    await client.query('COMMIT');
    console.log('\n✅ Transaction muvaffaqiyatli yakunlandi!');

    // Yakuniy statistika
    console.log('\n📊 O\'chirish statistikasi:');
    console.log(`   🏢 O'chirilgan salonlar: ${deleteSalons.length}`);
    console.log(`   👤 O'chirilgan adminlar: ${deletedAdmins}`);
    console.log(`   📝 O'chirilgan postlar: ${deletedPosts}`);
    console.log(`   👥 O'chirilgan employeelar: ${deletedEmployees}`);
    console.log(`   📅 O'chirilgan appointmentlar: ${deletedAppointments}`);
    console.log(`   📅 O'chirilgan schedulelar: ${deletedSchedules}`);
    console.log(`   📈 O'chirilgan salon_top_history: ${deletedSalonTopHistory}`);
    console.log(`   🌐 O'chirilgan salon_translations: ${deletedSalonTranslations}`);
    console.log(`   🛠️  O'chirilgan servicelar: ${deletedServices}`);

    // Yakuniy tekshirish
    const finalCheckQuery = `SELECT COUNT(*) as count FROM salons`;
    const finalResult = await client.query(finalCheckQuery);
    console.log(`\n🔍 Yakuniy tekshirish: Database da ${finalResult.rows[0].count} ta salon qoldi`);

    if (finalResult.rows[0].count > 0) {
      const remainingSalonsQuery = `SELECT id, name FROM salons ORDER BY created_at`;
      const remainingResult = await client.query(remainingSalonsQuery);
      console.log('\n🏢 Qolgan salonlar:');
      remainingResult.rows.forEach(salon => {
        console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
      });
    }

  } catch (error) {
    // Transaction bekor qilish
    await client.query('ROLLBACK');
    console.error('\n❌ Xatolik yuz berdi, transaction bekor qilindi:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Script ishga tushirish
if (require.main === module) {
  deleteProductionSalons()
    .then(() => {
      console.log('\n🎉 Salon tozalash muvaffaqiyatli yakunlandi!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Script xatosi:', error);
      process.exit(1);
    });
}

module.exports = { deleteProductionSalons };