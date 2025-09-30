const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Salon IDs
const PRIVATE_SALON_ID = 'f590077c-7c96-4bdc-9013-55620dabf651';
const CORPORATE_SALON_ID = '0b62ba7b-2fc3-48c8-b2c7-f1c8b8639cb6';

async function setupCompleteSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Tizimni to\'liq sozlash boshlandi...\n');
    
    // 1. Adminlarni tekshirish
    console.log('👤 1. Adminlarni tekshirish...');
    const admins = await client.query('SELECT username, salon_id FROM admins ORDER BY username');
    
    console.log('✅ Mavjud adminlar:');
    admins.rows.forEach(admin => {
      const salonType = admin.salon_id === PRIVATE_SALON_ID ? 'Private' : 
                       admin.salon_id === CORPORATE_SALON_ID ? 'Corporate' : 'None';
      console.log(`  - ${admin.username}: ${salonType} salon`);
    });
    
    // 2. Mavjud barcha employeesni o'chirish
    console.log('\n🗑️ 2. Mavjud barcha employeesni o\'chirish...');
    const deleteEmployees = await client.query('DELETE FROM employees');
    console.log(`✅ ${deleteEmployees.rowCount} ta employee o'chirildi`);
    
    // 3. Corporate salonga 3 ta employee qo'shish
    console.log('\n👥 3. Corporate salonga 3 ta employee qo\'shish...');
    const employees = [
      {
        username: 'employee1',
        email: 'employee1@freyasalon.uz',
        password: 'emp1123',
        full_name: 'Aziza Karimova',
        position: 'Sartarosh'
      },
      {
        username: 'employee2', 
        email: 'employee2@freyasalon.uz',
        password: 'emp2123',
        full_name: 'Malika Tosheva',
        position: 'Kosmetolog'
      },
      {
        username: 'employee3',
        email: 'employee3@freyasalon.uz', 
        password: 'emp3123',
        full_name: 'Nodira Alimova',
        position: 'Manikur ustasi'
      }
    ];
    
    for (let emp of employees) {
      const hashedEmpPassword = await bcrypt.hash(emp.password, 10);
      const newEmployee = await client.query(`
        INSERT INTO employees (
          employee_name, username, email, password_hash, full_name, position, salon_id, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
        ) RETURNING *
      `, [emp.full_name, emp.username, emp.email, hashedEmpPassword, emp.full_name, emp.position, CORPORATE_SALON_ID]);
      
      console.log(`✅ Employee yaratildi: ${emp.username} - ${emp.full_name} (${emp.position})`);
    }
    
    // 4. Mavjud barcha usersni o'chirish
    console.log('\n🗑️ 4. Mavjud barcha usersni o\'chirish...');
    const deleteUsers = await client.query('DELETE FROM users');
    console.log(`✅ ${deleteUsers.rowCount} ta user o'chirildi`);
    
    // 5. 4 ta yangi user qo'shish
    console.log('\n👤 5. 4 ta yangi user qo\'shish...');
    const users = [
      {
        username: 'user1',
        email: 'user1@example.com',
        password: 'user1123',
        full_name: 'Jasur Abdullayev',
        phone: '+998901111111'
      },
      {
        username: 'user2',
        email: 'user2@example.com', 
        password: 'user2123',
        full_name: 'Dilnoza Karimova',
        phone: '+998902222222'
      },
      {
        username: 'user3',
        email: 'user3@example.com',
        password: 'user3123', 
        full_name: 'Bobur Toshev',
        phone: '+998903333333'
      },
      {
        username: 'user4',
        email: 'user4@example.com',
        password: 'user4123',
        full_name: 'Sevara Alimova', 
        phone: '+998904444444'
      }
    ];
    
    for (let user of users) {
      const hashedUserPassword = await bcrypt.hash(user.password, 10);
      const newUser = await client.query(`
        INSERT INTO users (
          username, email, password_hash, full_name, phone, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, true, NOW(), NOW()
        ) RETURNING *
      `, [user.username, user.email, hashedUserPassword, user.full_name, user.phone]);
      
      console.log(`✅ User yaratildi: ${user.username} - ${user.full_name}`);
    }
    
    // 6. Yakuniy hisobot
    console.log('\n📊 YAKUNIY HISOBOT:');
    
    const adminCount = await client.query('SELECT COUNT(*) as count FROM admins');
    console.log(`👤 Adminlar: ${adminCount.rows[0].count} ta`);
    
    const employeeCount = await client.query('SELECT COUNT(*) as count FROM employees');
    console.log(`👥 Employeeslar: ${employeeCount.rows[0].count} ta`);
    
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`👤 Userlar: ${userCount.rows[0].count} ta`);
    
    const salonCount = await client.query('SELECT COUNT(*) as count FROM salons');
    console.log(`🏢 Salonlar: ${salonCount.rows[0].count} ta`);
    
    console.log('\n🎉 Tizim to\'liq sozlandi!');
    
    console.log('\n🔑 LOGIN MA\'LUMOTLARI:');
    console.log('📋 Adminlar:');
    console.log('  - admin1 / admin1123 (Corporate salon)');
    console.log('  - admin2 / admin2123 (Private salon)');
    console.log('\n📋 Employeeslar (Corporate salon):');
    console.log('  - employee1 / emp1123 (Aziza Karimova - Sartarosh)');
    console.log('  - employee2 / emp2123 (Malika Tosheva - Kosmetolog)');
    console.log('  - employee3 / emp3123 (Nodira Alimova - Manikur ustasi)');
    console.log('\n📋 Userlar:');
    console.log('  - user1 / user1123 (Jasur Abdullayev)');
    console.log('  - user2 / user2123 (Dilnoza Karimova)');
    console.log('  - user3 / user3123 (Bobur Toshev)');
    console.log('  - user4 / user4123 (Sevara Alimova)');
    
  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupCompleteSystem();