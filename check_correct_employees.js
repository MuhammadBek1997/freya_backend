const { Pool } = require('pg');

// To'g'ri database URL (.env faylidan)
const pool = new Pool({
  connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
  ssl: { rejectUnauthorized: false }
});

async function checkEmployees() {
  try {
    console.log('To\'g\'ri database ga ulanmoqda...');
    
    // Employees jadval strukturasini ko'rish
    const structureQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      ORDER BY ordinal_position;
    `;
    
    const structure = await pool.query(structureQuery);
    console.log('\nEmployees jadval strukturasi:');
    console.log(structure.rows);
    
    // Employees ma'lumotlarini olish
    const employeesQuery = 'SELECT * FROM employees ORDER BY id LIMIT 5';
    const employees = await pool.query(employeesQuery);
    
    console.log('\nEmployees ma\'lumotlari:');
    console.log(`Jami employees: ${employees.rows.length}`);
    
    if (employees.rows.length > 0) {
      employees.rows.forEach((emp, index) => {
        console.log(`\n--- Employee ${index + 1} ---`);
        console.log(`ID: ${emp.id}`);
        console.log(`Name: ${emp.name}`);
        console.log(`Email: ${emp.email}`);
        console.log(`Phone: ${emp.phone}`);
        console.log(`Position: ${emp.position}`);
        console.log(`Password Hash: ${emp.employee_password ? emp.employee_password.substring(0, 20) + '...' : 'NULL'}`);
        console.log(`Salon ID: ${emp.salon_id}`);
        console.log(`Active: ${emp.is_active}`);
      });
    } else {
      console.log('Hech qanday employee topilmadi!');
    }
    
  } catch (error) {
    console.error('Xato:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmployees();