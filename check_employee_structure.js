const { Pool } = require('pg');

// Production database URL
const pool = new Pool({
  connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
  ssl: { rejectUnauthorized: false }
});

async function checkEmployeeStructure() {
  try {
    console.log('🔍 EMPLOYEES JADVAL STRUKTURASINI TEKSHIRISH\n');
    console.log('=' + '='.repeat(50));
    
    // Employees jadval strukturasini olish
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    
    console.log(`\n📊 Employees jadval strukturasi (${structureResult.rows.length} ta ustun):\n`);
    
    structureResult.rows.forEach((column, index) => {
      console.log(`${index + 1}. ${column.column_name}`);
      console.log(`   Turi: ${column.data_type}`);
      console.log(`   Null bo'lishi mumkin: ${column.is_nullable}`);
      console.log(`   Default qiymat: ${column.column_default || 'Yo\'q'}`);
      if (column.character_maximum_length) {
        console.log(`   Maksimal uzunlik: ${column.character_maximum_length}`);
      }
      console.log('');
    });
    
    // Username ustuni mavjudligini tekshirish
    const hasUsername = structureResult.rows.some(col => col.column_name === 'username');
    
    console.log('🔍 USERNAME USTUNI TEKSHIRUVI:');
    console.log('=' + '='.repeat(35));
    
    if (hasUsername) {
      console.log('✅ Username ustuni MAVJUD');
      
      // Username qiymatlari mavjudligini tekshirish
      const usernameDataQuery = `
        SELECT 
          id,
          email,
          username,
          CASE 
            WHEN username IS NULL THEN 'NULL'
            WHEN username = '' THEN 'BO\'SH'
            ELSE 'MAVJUD'
          END as username_status
        FROM employees 
        ORDER BY email
        LIMIT 10;
      `;
      
      const usernameResult = await pool.query(usernameDataQuery);
      
      console.log('\n📋 Username qiymatlari (birinchi 10 ta):');
      usernameResult.rows.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.email} - Username: ${emp.username || 'NULL'} (${emp.username_status})`);
      });
      
      // Username statistikasi
      const statsQuery = `
        SELECT 
          COUNT(*) as total_employees,
          COUNT(username) as with_username,
          COUNT(*) - COUNT(username) as without_username,
          COUNT(CASE WHEN username = '' THEN 1 END) as empty_username
        FROM employees;
      `;
      
      const statsResult = await pool.query(statsQuery);
      const stats = statsResult.rows[0];
      
      console.log('\n📈 USERNAME STATISTIKASI:');
      console.log(`• Jami employeelar: ${stats.total_employees}`);
      console.log(`• Username bilan: ${stats.with_username}`);
      console.log(`• Username yo'q: ${stats.without_username}`);
      console.log(`• Bo'sh username: ${stats.empty_username}`);
      
    } else {
      console.log('❌ Username ustuni MAVJUD EMAS');
      console.log('💡 Username ustunini qo\'shish kerak!');
    }
    
    // Employees jadvalidagi barcha ma'lumotlar soni
    const countQuery = 'SELECT COUNT(*) as total FROM employees';
    const countResult = await pool.query(countQuery);
    
    console.log('\n📊 UMUMIY MA\'LUMOT:');
    console.log('=' + '='.repeat(25));
    console.log(`• Jami employeelar: ${countResult.rows[0].total}`);
    console.log(`• Jadval ustunlari: ${structureResult.rows.length}`);
    console.log(`• Username ustuni: ${hasUsername ? 'Mavjud' : 'Mavjud emas'}`);
    
  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await pool.end();
  }
}

// Scriptni ishga tushirish
checkEmployeeStructure()
  .then(() => {
    console.log('\n✅ Tekshiruv muvaffaqiyatli yakunlandi!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Tekshiruv xato bilan yakunlandi:', error.message);
    process.exit(1);
  });