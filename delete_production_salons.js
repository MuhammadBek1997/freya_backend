const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// O'chiriladigan salon ID lari (check_production_salons.js dan olingan)
const SALONS_TO_DELETE = [3, 4, 5]; // Private Luxury Salon, Elite Beauty Center, Modern Style Salon
const SALONS_TO_KEEP = [1, 2]; // Beauty Palace, Luxury Spa (admin1/admin2)

async function deleteProductionSalons() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Production salonlarini o\'chirish jarayoni boshlandi...\n');

    // Transaction boshlash
    await client.query('BEGIN');

    // Avval o'chiriladigan salonlarni tekshirish
    console.log('🔍 O\'chiriladigan salonlarni tekshirmoqda...');
    for (const salonId of SALONS_TO_DELETE) {
      const checkQuery = 'SELECT id, name FROM salons WHERE id = $1';
      const result = await client.query(checkQuery, [salonId]);
      
      if (result.rows.length === 0) {
        console.log(`   ⚠️  Salon ID ${salonId} topilmadi (allaqachon o'chirilgan)`);
      } else {
        console.log(`   ✅ Salon ID ${salonId}: "${result.rows[0].name}" - o'chirishga tayyor`);
      }
    }

    // Saqlanadigan salonlarni tekshirish
    console.log('\n🔒 Saqlanadigan salonlarni tekshirmoqda...');
    for (const salonId of SALONS_TO_KEEP) {
      const checkQuery = 'SELECT id, name FROM salons WHERE id = $1';
      const result = await client.query(checkQuery, [salonId]);
      
      if (result.rows.length === 0) {
        console.log(`   ❌ XATO: Saqlanishi kerak bo'lgan salon ID ${salonId} topilmadi!`);
        throw new Error(`Saqlanishi kerak bo'lgan salon ID ${salonId} mavjud emas!`);
      } else {
        console.log(`   ✅ Salon ID ${salonId}: "${result.rows[0].name}" - saqlanadi`);
      }
    }

    // Bog'liq ma'lumotlarni o'chirish (agar mavjud bo'lsa)
    console.log('\n🔗 Bog\'liq ma\'lumotlarni o\'chirmoqda...');
    
    // Avval bog'liq jadvallarning strukturasini tekshirish
    const checkTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('posts', 'employees', 'appointments')
    `;
    const tablesResult = await client.query(checkTablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log(`   📋 Mavjud bog'liq jadvallar: ${existingTables.join(', ')}`);

    // Posts jadvalidan bog'liq postlarni o'chirish
    if (existingTables.includes('posts')) {
      for (const salonId of SALONS_TO_DELETE) {
        try {
          const deletePostsQuery = 'DELETE FROM posts WHERE salon_id = $1';
          const postsResult = await client.query(deletePostsQuery, [salonId]);
          console.log(`   📝 Salon ${salonId} uchun ${postsResult.rowCount} ta post o'chirildi`);
        } catch (error) {
          console.log(`   ⚠️  Salon ${salonId} uchun postlar o'chirishda xato: ${error.message}`);
        }
      }
    } else {
      console.log(`   ℹ️  Posts jadvali mavjud emas`);
    }

    // Employees jadvalidan bog'liq xodimlarni o'chirish
    if (existingTables.includes('employees')) {
      // Avval employees jadvalining salon_id maydonining tipini tekshirish
      const employeeColumnQuery = `
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'salon_id'
      `;
      const columnResult = await client.query(employeeColumnQuery);
      const salonIdType = columnResult.rows[0]?.data_type;
      console.log(`   🔍 Employees jadvalida salon_id tipi: ${salonIdType}`);

      for (const salonId of SALONS_TO_DELETE) {
        try {
          let deleteEmployeesQuery;
          let queryParam;
          
          if (salonIdType === 'uuid') {
            // UUID uchun salon_id ni string sifatida cast qilish
            deleteEmployeesQuery = 'DELETE FROM employees WHERE salon_id::text = $1';
            queryParam = salonId.toString();
          } else {
            deleteEmployeesQuery = 'DELETE FROM employees WHERE salon_id = $1';
            queryParam = salonId;
          }
          
          const employeesResult = await client.query(deleteEmployeesQuery, [queryParam]);
          console.log(`   👥 Salon ${salonId} uchun ${employeesResult.rowCount} ta xodim o'chirildi`);
        } catch (error) {
          console.log(`   ⚠️  Salon ${salonId} uchun xodimlar o'chirishda xato: ${error.message}`);
        }
      }
    } else {
      console.log(`   ℹ️  Employees jadvali mavjud emas`);
    }

    // Appointments jadvalidan bog'liq uchrashuvlarni o'chirish
    if (existingTables.includes('appointments')) {
      for (const salonId of SALONS_TO_DELETE) {
        try {
          const deleteAppointmentsQuery = 'DELETE FROM appointments WHERE salon_id = $1';
          const appointmentsResult = await client.query(deleteAppointmentsQuery, [salonId]);
          console.log(`   📅 Salon ${salonId} uchun ${appointmentsResult.rowCount} ta appointment o'chirildi`);
        } catch (error) {
          console.log(`   ⚠️  Salon ${salonId} uchun appointmentlar o'chirishda xato: ${error.message}`);
        }
      }
    } else {
      console.log(`   ℹ️  Appointments jadvali mavjud emas`);
    }

    // Asosiy salonlarni o'chirish
    console.log('\n🏢 Asosiy salonlarni o\'chirmoqda...');
    let totalDeleted = 0;
    
    for (const salonId of SALONS_TO_DELETE) {
      const deleteSalonQuery = 'DELETE FROM salons WHERE id = $1';
      const result = await client.query(deleteSalonQuery, [salonId]);
      
      if (result.rowCount > 0) {
        console.log(`   ✅ Salon ID ${salonId} muvaffaqiyatli o'chirildi`);
        totalDeleted++;
      } else {
        console.log(`   ⚠️  Salon ID ${salonId} o'chirilmadi (mavjud emas)`);
      }
    }

    // Transaction commit qilish
    await client.query('COMMIT');
    
    console.log('\n🎉 O\'chirish jarayoni muvaffaqiyatli yakunlandi!');
    console.log(`   📊 Jami o'chirilgan salonlar: ${totalDeleted}`);
    console.log(`   🔒 Saqlanib qolgan salonlar: ${SALONS_TO_KEEP.length} (ID: ${SALONS_TO_KEEP.join(', ')})`);

    // Yakuniy tekshirish
    console.log('\n🔍 Yakuniy tekshirish...');
    const finalCheckQuery = 'SELECT id, name FROM salons ORDER BY id';
    const finalResult = await client.query(finalCheckQuery);
    
    console.log(`📋 Qolgan salonlar (${finalResult.rows.length} ta):`);
    finalResult.rows.forEach(salon => {
      console.log(`   - ID: ${salon.id}, Nomi: "${salon.name}"`);
    });

  } catch (error) {
    // Xato bo'lsa rollback qilish
    await client.query('ROLLBACK');
    console.error('\n❌ Xatolik yuz berdi, barcha o\'zgarishlar bekor qilindi:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Agar to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
  console.log('⚠️  DIQQAT: Bu script production databasedan salonlarni o\'chiradi!');
  console.log('🔒 Saqlanadigan salonlar: ID 1, 2 (admin1/admin2)');
  console.log('🗑️  O\'chiriladigan salonlar: ID 3, 4, 5');
  console.log('');
  
  deleteProductionSalons()
    .then(() => {
      console.log('\n✅ Script muvaffaqiyatli yakunlandi!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script xatosi:', error);
      process.exit(1);
    });
}

module.exports = { deleteProductionSalons, SALONS_TO_DELETE, SALONS_TO_KEEP };