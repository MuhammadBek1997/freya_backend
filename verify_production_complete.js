const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyProductionComplete() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Production ma\'lumotlarini to\'liq tekshirish...\n');
    
    // 1. Salonlar
    console.log('🏢 SALONLAR:');
    const salons = await client.query(`
      SELECT id, name, is_private, location, phone, email, working_hours 
      FROM salons 
      ORDER BY is_private
    `);
    
    salons.rows.forEach((salon, index) => {
      console.log(`${index + 1}. ${salon.name}`);
      console.log(`   ID: ${salon.id}`);
      console.log(`   Type: ${salon.is_private ? 'Private' : 'Corporate'}`);
      console.log(`   Phone: ${salon.phone}`);
      console.log(`   Email: ${salon.email}`);
      console.log('');
    });
    
    // 2. Adminlar
    console.log('👤 ADMINLAR:');
    const admins = await client.query(`
      SELECT a.id, a.username, a.email, a.full_name, a.role, a.salon_id, s.name as salon_name, s.is_private
      FROM admins a
      LEFT JOIN salons s ON a.salon_id = s.id
      ORDER BY a.username
    `);
    
    admins.rows.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.email})`);
      console.log(`   Full Name: ${admin.full_name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Salon: ${admin.salon_name} (${admin.is_private ? 'Private' : 'Corporate'})`);
      console.log(`   Admin ID: ${admin.id}`);
      console.log('');
    });
    
    // 3. Employeeslar
    console.log('👥 EMPLOYEESLAR:');
    const employees = await client.query(`
      SELECT e.id, e.employee_name, e.username, e.email, e.position, e.salon_id, s.name as salon_name, s.is_private
      FROM employees e
      LEFT JOIN salons s ON e.salon_id = s.id
      ORDER BY e.employee_name
    `);
    
    employees.rows.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.employee_name} (${emp.username})`);
      console.log(`   Email: ${emp.email}`);
      console.log(`   Position: ${emp.position}`);
      console.log(`   Salon: ${emp.salon_name} (${emp.is_private ? 'Private' : 'Corporate'})`);
      console.log(`   Employee ID: ${emp.id}`);
      console.log('');
    });
    
    // 4. Userlar
    console.log('👤 USERLAR:');
    const users = await client.query(`
      SELECT id, username, email, full_name, phone, is_active
      FROM users 
      ORDER BY username
    `);
    
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`);
      console.log(`   Full Name: ${user.full_name}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   User ID: ${user.id}`);
      console.log('');
    });
    
    // 5. Habarlar (agar mavjud bo'lsa)
    console.log('💬 HABARLAR:');
    const messages = await client.query(`
      SELECT COUNT(*) as count FROM messages
    `);
    console.log(`Jami habarlar: ${messages.rows[0].count} ta`);
    
    // 6. Hisobot
    console.log('\n📊 UMUMIY HISOBOT:');
    console.log(`🏢 Salonlar: ${salons.rows.length} ta`);
    console.log(`👤 Adminlar: ${admins.rows.length} ta`);
    console.log(`👥 Employeeslar: ${employees.rows.length} ta`);
    console.log(`👤 Userlar: ${users.rows.length} ta`);
    console.log(`💬 Habarlar: ${messages.rows[0].count} ta`);
    
    // Private salon admin ma'lumotlari
    const privateAdmin = admins.rows.find(admin => admin.is_private === true);
    if (privateAdmin) {
      console.log('\n🔑 PRIVATE SALON ADMIN:');
      console.log(`Username: ${privateAdmin.username}`);
      console.log(`ID: ${privateAdmin.id}`);
      console.log(`Salon ID: ${privateAdmin.salon_id}`);
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyProductionComplete();