const { Pool } = require('pg');

// Production database URL
const pool = new Pool({
  connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
  ssl: { rejectUnauthorized: false }
});

async function getEmployeeCredentials() {
  try {
    console.log('🔍 Employeelarning login va parol ma\'lumotlarini olish...\n');
    
    // Barcha employeelarni olish
    const employeesQuery = `
      SELECT 
        e.*,
        s.salon_name as salon_name
      FROM employees e
      LEFT JOIN salons s ON e.salon_id = s.id
      ORDER BY s.salon_name, e.email;
    `;
    
    const result = await pool.query(employeesQuery);
    
    console.log(`📊 Jami ${result.rows.length} ta employee topildi:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ Hech qanday employee topilmadi!');
      return;
    }
    
    // Employeelarni salon bo'yicha guruhlash
    const employeesBySalon = {};
    result.rows.forEach(emp => {
      const salonName = emp.salon_name || 'Noma\'lum Salon';
      if (!employeesBySalon[salonName]) {
        employeesBySalon[salonName] = [];
      }
      employeesBySalon[salonName].push(emp);
    });
    
    // Har bir salon uchun employeelarni ko'rsatish
    Object.keys(employeesBySalon).forEach(salonName => {
      console.log(`🏢 SALON: ${salonName}`);
      console.log('=' + '='.repeat(salonName.length + 8));
      
      employeesBySalon[salonName].forEach((emp, index) => {
        console.log(`\n--- Employee ${index + 1} ---`);
        console.log(`ID: ${emp.id}`);
        console.log(`Ism: ${emp.name || 'Mavjud emas'}`);
        console.log(`Familiya: ${emp.surname || 'Mavjud emas'}`);
        console.log(`Email: ${emp.email || 'Mavjud emas'}`);
        console.log(`Telefon: ${emp.phone || 'Mavjud emas'}`);
        console.log(`Username: ${emp.username || 'Mavjud emas'}`);
        console.log(`Kasb: ${emp.profession || 'Mavjud emas'}`);
        
        // Parol ma'lumotlari
        if (emp.employee_password) {
          // Agar parol hash bo'lsa
          if (emp.employee_password.startsWith('$2b$')) {
            console.log(`Parol: Hash format (${emp.employee_password.substring(0, 20)}...)`);
            console.log(`⚠️  Asl parol ma'lum emas - hash saqlanadi`);
          } else {
            console.log(`Parol: ${emp.employee_password}`);
          }
        } else {
          console.log('Parol: Mavjud emas');
        }
        
        console.log(`Salon ID: ${emp.salon_id}`);
        console.log(`Faol: ${emp.is_active ? 'Ha' : 'Yo\'q'}`);
        console.log(`Yaratilgan: ${emp.created_at ? new Date(emp.created_at).toLocaleDateString() : 'N/A'}`);
      });
      
      console.log('\n' + '-'.repeat(50) + '\n');
    });
    
    // Umumiy statistika
    console.log('📈 UMUMIY STATISTIKA:');
    console.log(`• Jami employeelar: ${result.rows.length}`);
    console.log(`• Faol employeelar: ${result.rows.filter(emp => emp.is_active).length}`);
    console.log(`• Parol bilan employeelar: ${result.rows.filter(emp => emp.employee_password).length}`);
    console.log(`• Username bilan employeelar: ${result.rows.filter(emp => emp.username).length}`);
    console.log(`• Email bilan employeelar: ${result.rows.filter(emp => emp.email).length}`);
    
  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await pool.end();
  }
}

// Scriptni ishga tushirish
getEmployeeCredentials()
  .then(() => {
    console.log('\n✅ Script muvaffaqiyatli yakunlandi!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script xato bilan yakunlandi:', error.message);
    process.exit(1);
  });