const { Pool } = require('pg');

// Production database URL
const pool = new Pool({
  connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
  ssl: { rejectUnauthorized: false }
});

async function showEmployeeLogins() {
  try {
    console.log('🔐 EMPLOYEELARNING LOGIN MA\'LUMOTLARI\n');
    console.log('=' + '='.repeat(50));
    
    // Barcha employeelarni olish
    const employeesQuery = `
      SELECT 
        e.id,
        e.name,
        e.surname,
        e.email,
        e.phone,
        e.username,
        e.profession,
        e.employee_password,
        e.salon_id,
        e.is_active,
        e.created_at,
        s.salon_name as salon_name
      FROM employees e
      LEFT JOIN salons s ON e.salon_id = s.id
      WHERE e.is_active = true
      ORDER BY s.salon_name, e.email;
    `;
    
    const result = await pool.query(employeesQuery);
    
    console.log(`\n📊 Jami ${result.rows.length} ta faol employee topildi:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ Hech qanday faol employee topilmadi!');
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
      console.log(`\n🏢 SALON: ${salonName}`);
      console.log('=' + '='.repeat(salonName.length + 8));
      
      employeesBySalon[salonName].forEach((emp, index) => {
        console.log(`\n📋 Employee ${index + 1}:`);
        console.log(`   ID: ${emp.id}`);
        console.log(`   Ism-Familiya: ${emp.name || 'N/A'} ${emp.surname || ''}`);
        console.log(`   📧 Email: ${emp.email || 'Mavjud emas'}`);
        console.log(`   📱 Telefon: ${emp.phone || 'Mavjud emas'}`);
        console.log(`   👤 Username: ${emp.username || 'Mavjud emas'}`);
        console.log(`   💼 Kasb: ${emp.profession || 'Mavjud emas'}`);
        
        // Login ma'lumotlari
        console.log(`\n   🔑 LOGIN MA'LUMOTLARI:`);
        if (emp.email && emp.username) {
          console.log(`   ✅ Login (Email): ${emp.email}`);
          console.log(`   ✅ Login (Username): ${emp.username}`);
        } else if (emp.email) {
          console.log(`   ✅ Login (Email): ${emp.email}`);
          console.log(`   ❌ Username mavjud emas`);
        } else if (emp.username) {
          console.log(`   ❌ Email mavjud emas`);
          console.log(`   ✅ Login (Username): ${emp.username}`);
        } else {
          console.log(`   ❌ Login ma'lumotlari mavjud emas`);
        }
        
        // Parol ma'lumotlari
        if (emp.employee_password) {
          if (emp.employee_password.startsWith('$2b$')) {
            console.log(`   🔒 Parol: employee123 (standart parol)`);
            console.log(`   ℹ️  Hash: ${emp.employee_password.substring(0, 30)}...`);
          } else {
            console.log(`   🔒 Parol: ${emp.employee_password}`);
          }
        } else {
          console.log(`   ❌ Parol mavjud emas`);
        }
        
        console.log(`   🏢 Salon ID: ${emp.salon_id}`);
        console.log(`   ✅ Faol: ${emp.is_active ? 'Ha' : 'Yo\'q'}`);
        console.log(`   📅 Yaratilgan: ${emp.created_at ? new Date(emp.created_at).toLocaleDateString('uz-UZ') : 'N/A'}`);
      });
      
      console.log('\n' + '-'.repeat(60));
    });
    
    // Login uchun foydalanish bo'yicha ko'rsatma
    console.log('\n📖 LOGIN QILISH BO\'YICHA KO\'RSATMA:');
    console.log('=' + '='.repeat(40));
    console.log('1. Employee login endpoint: POST /api/auth/employee/login');
    console.log('2. Login uchun email yoki username va paroldan foydalaning:');
    console.log('   • Email: employee emaili (masalan: emp1_1@freya.uz)');
    console.log('   • Username: employee username (masalan: employee1_1)');
    console.log('   • Parol: employee123 (standart parol)');
    console.log('3. Muvaffaqiyatli login qilgandan so\'ng JWT token olinadi');
    
    // Umumiy statistika
    console.log('\n📈 UMUMIY STATISTIKA:');
    console.log('=' + '='.repeat(25));
    console.log(`• Jami employeelar: ${result.rows.length}`);
    console.log(`• Faol employeelar: ${result.rows.filter(emp => emp.is_active).length}`);
    console.log(`• Parol bilan employeelar: ${result.rows.filter(emp => emp.employee_password).length}`);
    console.log(`• Username bilan employeelar: ${result.rows.filter(emp => emp.username).length}`);
    console.log(`• Email bilan employeelar: ${result.rows.filter(emp => emp.email).length}`);
    console.log(`• Salonlar soni: ${Object.keys(employeesBySalon).length}`);
    
    // Test login misoli
    console.log('\n🧪 TEST LOGIN MISOLLARI:');
    console.log('=' + '='.repeat(25));
    if (result.rows.length > 0) {
      const firstEmp = result.rows[0];
      
      console.log('📧 Email bilan login:');
      console.log('curl -X POST http://localhost:3002/api/auth/employee/login \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log(`  -d '{"email":"${firstEmp.email}","password":"employee123"}'`);
      
      if (firstEmp.username) {
        console.log('\n👤 Username bilan login:');
        console.log('curl -X POST http://localhost:3002/api/auth/employee/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log(`  -d '{"username":"${firstEmp.username}","password":"employee123"}'`);
      }
    }
    
  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await pool.end();
  }
}

// Scriptni ishga tushirish
showEmployeeLogins()
  .then(() => {
    console.log('\n✅ Script muvaffaqiyatli yakunlandi!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script xato bilan yakunlandi:', error.message);
    process.exit(1);
  });