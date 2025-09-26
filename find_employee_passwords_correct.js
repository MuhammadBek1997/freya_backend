const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// To'g'ri database URL (.env faylidan)
const pool = new Pool({
  connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
  ssl: { rejectUnauthorized: false }
});

// Employee parollar ro'yxati (script dan topilgan format)
const commonPasswords = [
  // Topilgan format: emp{salon_index}_{employee_index}123
  'emp1_1123', 'emp1_2123', 'emp1_3123', 'emp1_4123',
  'emp2_1123', 'emp2_2123', 'emp2_3123', 'emp2_4123',
  'emp3_1123', 'emp3_2123', 'emp3_3123', 'emp3_4123',
  'emp4_1123', 'emp4_2123', 'emp4_3123', 'emp4_4123',
  // Boshqa ehtimoliy formatlar
  'employee123',
  'password123',
  '123456',
  'password',
  'admin123',
  'freya123',
  'salon123'
];

async function findEmployeePasswords() {
  try {
    console.log('Employee parollarini qidirmoqda...\n');
    
    // Barcha employee larni olish
    const employeesQuery = 'SELECT id, email, employee_password FROM employees WHERE employee_password IS NOT NULL';
    const employees = await pool.query(employeesQuery);
    
    console.log(`Jami ${employees.rows.length} ta employee topildi.\n`);
    
    for (const employee of employees.rows) {
      console.log(`Employee: ${employee.email}`);
      console.log(`ID: ${employee.id}`);
      
      let passwordFound = false;
      
      // Har bir keng tarqalgan parolni tekshirish
      for (const password of commonPasswords) {
        try {
          const isMatch = await bcrypt.compare(password, employee.employee_password);
          if (isMatch) {
            console.log(`✅ PAROL TOPILDI: "${password}"`);
            passwordFound = true;
            break;
          }
        } catch (error) {
          console.log(`Parol tekshirishda xato: ${error.message}`);
        }
      }
      
      if (!passwordFound) {
        console.log('❌ Parol topilmadi');
      }
      
      console.log('-------------------\n');
    }
    
  } catch (error) {
    console.error('Xato:', error.message);
  } finally {
    await pool.end();
  }
}

findEmployeePasswords();