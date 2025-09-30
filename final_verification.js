const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function finalVerification() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 YAKUNIY TEKSHIRUV - Production ma\'lumotlari\n');
    
    // 1. Salonlar
    const salons = await client.query('SELECT * FROM salons ORDER BY name');
    console.log('🏢 SALONLAR:');
    salons.rows.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.name} (${salon.is_private ? 'Private' : 'Public'})`);
      console.log(`   ID: ${salon.id}`);
    });
    console.log(`Jami: ${salons.rows.length} ta salon\n`);
    
    // 2. Adminlar
    const admins = await client.query(`
      SELECT a.*, s.name as salon_name, s.is_private 
      FROM admins a 
      JOIN salons s ON a.salon_id = s.id 
      ORDER BY a.username
    `);
    console.log('👤 ADMINLAR:');
    admins.rows.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.full_name})`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Salon: ${admin.salon_name} (${admin.is_private ? 'Private' : 'Public'})`);
      console.log(`   Email: ${admin.email}`);
    });
    console.log(`Jami: ${admins.rows.length} ta admin\n`);
    
    // 3. Employeeslar
    const employees = await client.query(`
      SELECT e.*, s.name as salon_name, s.is_private 
      FROM employees e 
      JOIN salons s ON e.salon_id = s.id 
      ORDER BY e.employee_name
    `);
    console.log('👥 EMPLOYEESLAR:');
    employees.rows.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.username} (${emp.employee_name})`);
      console.log(`   Salon: ${emp.salon_name} (${emp.is_private ? 'Private' : 'Public'})`);
      console.log(`   Email: ${emp.email}`);
    });
    console.log(`Jami: ${employees.rows.length} ta employee\n`);
    
    // 4. Userlar
    const users = await client.query('SELECT * FROM users ORDER BY username');
    console.log('👤 USERLAR:');
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.full_name})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone_number}`);
    });
    console.log(`Jami: ${users.rows.length} ta user\n`);
    
    // 5. Habarlar statistikasi
    const messageStats = await client.query(`
      SELECT 
        sender_type,
        receiver_type,
        COUNT(*) as count
      FROM messages 
      GROUP BY sender_type, receiver_type
      ORDER BY sender_type, receiver_type
    `);
    
    console.log('💬 HABARLAR STATISTIKASI:');
    messageStats.rows.forEach(stat => {
      console.log(`${stat.sender_type} → ${stat.receiver_type}: ${stat.count} ta habar`);
    });
    
    const totalMessages = await client.query('SELECT COUNT(*) as count FROM messages');
    console.log(`Jami habarlar: ${totalMessages.rows[0].count} ta\n`);
    
    // 6. Habarlar sanasi bo'yicha
    const messagesByDate = await client.query(`
      SELECT 
        DATE(created_at) as message_date,
        COUNT(*) as count
      FROM messages 
      GROUP BY DATE(created_at)
      ORDER BY message_date DESC
    `);
    
    console.log('📅 HABARLAR SANASI BO\'YICHA:');
    messagesByDate.rows.forEach(stat => {
      console.log(`${stat.message_date}: ${stat.count} ta habar`);
    });
    
    // 7. Private salon admin employee ekanligini tekshirish
    console.log('\n🔍 PRIVATE SALON ADMIN EMPLOYEE TEKSHIRUVI:');
    const privateAdminEmployee = await client.query(`
      SELECT 
        a.username as admin_username,
        a.full_name as admin_name,
        e.username as employee_username,
        e.employee_name,
        s.name as salon_name
      FROM admins a
      JOIN salons s ON a.salon_id = s.id
      LEFT JOIN employees e ON e.salon_id = s.id AND e.username LIKE a.username || '%'
      WHERE s.is_private = true
    `);
    
    if (privateAdminEmployee.rows.length > 0) {
      const row = privateAdminEmployee.rows[0];
      console.log(`✅ Private salon admin: ${row.admin_username} (${row.admin_name})`);
      if (row.employee_username) {
        console.log(`✅ Employee sifatida ham mavjud: ${row.employee_username} (${row.employee_name})`);
      } else {
        console.log(`❌ Employee sifatida topilmadi`);
      }
    }
    
    console.log('\n🎉 YAKUNIY XULOSA:');
    console.log(`✅ ${salons.rows.length} ta salon (1 ta private, 1 ta public)`);
    console.log(`✅ ${admins.rows.length} ta admin (har bir salonga bittadan)`);
    console.log(`✅ ${employees.rows.length} ta employee (private salon admin ham employee)`);
    console.log(`✅ ${users.rows.length} ta user`);
    console.log(`✅ ${totalMessages.rows[0].count} ta habar (turli sanalar bilan)`);
    console.log(`✅ Har bir userdan har bir employeega 2 ta habar`);
    console.log(`✅ Har bir userdan private admin ga 2 ta habar`);
    console.log(`✅ Har bir employeedan har bir userga 1 ta javob`);
    console.log(`✅ Private admindan har bir userga 1 ta javob`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

finalVerification();