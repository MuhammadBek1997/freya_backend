const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function makeAdminEmployee() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Private salon adminini employee sifatida qo\'shish...\n');
    
    // Private salon admin ma'lumotlarini olish
    const privateAdmin = await client.query(`
      SELECT a.id, a.username, a.email, a.full_name, a.salon_id, s.name as salon_name
      FROM admins a
      LEFT JOIN salons s ON a.salon_id = s.id
      WHERE s.is_private = true
    `);
    
    if (privateAdmin.rows.length === 0) {
      console.log('❌ Private salon admin topilmadi!');
      return;
    }
    
    const admin = privateAdmin.rows[0];
    console.log('📋 Private salon admin ma\'lumotlari:');
    console.log(`Username: ${admin.username}`);
    console.log(`Full Name: ${admin.full_name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Salon: ${admin.salon_name}`);
    console.log(`Salon ID: ${admin.salon_id}`);
    
    // Admin2 ni employee sifatida qo'shish
    const hashedPassword = await bcrypt.hash('admin2123', 10);
    
    const newEmployee = await client.query(`
      INSERT INTO employees (
        employee_name, username, email, password_hash, full_name, position, salon_id, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
      ) RETURNING *
    `, [
      admin.full_name,
      admin.username + '_emp', // username ni farqlash uchun
      admin.email,
      hashedPassword,
      admin.full_name,
      'Salon Administratori',
      admin.salon_id
    ]);
    
    console.log('\n✅ Admin employee sifatida qo\'shildi:');
    console.log(`Employee Name: ${newEmployee.rows[0].employee_name}`);
    console.log(`Username: ${newEmployee.rows[0].username}`);
    console.log(`Position: ${newEmployee.rows[0].position}`);
    console.log(`Employee ID: ${newEmployee.rows[0].id}`);
    
    // Yangilangan employeeslar ro'yxati
    console.log('\n📊 Barcha employeeslar:');
    const allEmployees = await client.query(`
      SELECT e.id, e.employee_name, e.username, e.position, s.name as salon_name, s.is_private
      FROM employees e
      LEFT JOIN salons s ON e.salon_id = s.id
      ORDER BY s.is_private, e.employee_name
    `);
    
    allEmployees.rows.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.employee_name} (${emp.username})`);
      console.log(`   Position: ${emp.position}`);
      console.log(`   Salon: ${emp.salon_name} (${emp.is_private ? 'Private' : 'Corporate'})`);
      console.log('');
    });
    
    console.log(`📈 Jami employeeslar: ${allEmployees.rows.length} ta`);
    console.log('   - Corporate salon: 3 ta');
    console.log('   - Private salon: 1 ta (admin ham employee)');
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

makeAdminEmployee();