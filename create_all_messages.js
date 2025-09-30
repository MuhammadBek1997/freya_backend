const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createAllMessages() {
  const client = await pool.connect();
  
  try {
    console.log('💬 Barcha habarlarni yaratish boshlandi...\n');
    
    // Avval mavjud habarlarni o'chirish
    console.log('🗑️ Mavjud habarlarni o\'chirish...');
    const deleteResult = await client.query('DELETE FROM messages');
    console.log(`✅ ${deleteResult.rowCount} ta habar o'chirildi\n`);
    
    // Userlar ro'yxati
    const users = await client.query(`
      SELECT id, username, full_name FROM users ORDER BY username
    `);
    
    // Employeeslar ro'yxati (admin2_emp ham bor)
    const employees = await client.query(`
      SELECT id, username, employee_name FROM employees ORDER BY employee_name
    `);
    
    // Private salon admin
    const privateAdmin = await client.query(`
      SELECT id, username, full_name FROM admins 
      WHERE salon_id = (SELECT id FROM salons WHERE is_private = true)
    `);
    
    console.log('📋 Ma\'lumotlar:');
    console.log(`👤 Userlar: ${users.rows.length} ta`);
    console.log(`👥 Employeeslar: ${employees.rows.length} ta`);
    console.log(`👤 Private Admin: ${privateAdmin.rows.length} ta\n`);
    
    // Habar shablonlari
    const messageTemplates = [
      "Salom! Sizning xizmatlaringiz haqida ma'lumot olsam bo'ladimi?",
      "Assalomu alaykum! Qachon band vaqtingiz bor?",
      "Salom! Narxlar haqida ma'lumot bera olasizmi?",
      "Yaxshimisiz! Ertaga kelishim mumkinmi?",
      "Salom! Qanday xizmatlar mavjud?",
      "Assalomu alaykum! Vaqt band qilsam bo'ladimi?",
      "Salom! Sizning ish vaqtlaringiz qanday?",
      "Yaxshimisiz! Bugun kelishim mumkinmi?"
    ];
    
    const replyTemplates = [
      "Assalomu alaykum! Albatta, barcha ma'lumotlarni beraman.",
      "Salom! Ha, ertaga 14:00 dan keyin bo'sh vaqtim bor.",
      "Yaxshimisiz! Narxlar haqida batafsil aytib beraman.",
      "Salom! Ha, ertaga kela olasiz. Vaqt band qilib qo'yamiz.",
      "Assalomu alaykum! Bizda turli xizmatlar mavjud.",
      "Salom! Ha, vaqt band qilishingiz mumkin.",
      "Yaxshimisiz! Ish vaqtlarimiz 9:00 dan 18:00 gacha.",
      "Salom! Bugun ham kela olasiz, joy bor."
    ];
    
    let messageCount = 0;
    
    // 1. Har bir userdan har bir employeega 2 ta habar (2 xil sana bilan)
    console.log('📤 1. Userlardan employeeslarga habarlar yaratish...');
    
    for (let user of users.rows) {
      for (let employee of employees.rows) {
        // Birinchi habar (3 kun oldin)
        const message1 = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
        const date1 = new Date();
        date1.setDate(date1.getDate() - 3);
        
        await client.query(`
          INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, created_at, updated_at)
          VALUES ($1, 'user', $2, 'employee', $3, $4, $4)
        `, [user.id, employee.id, message1, date1]);
        
        // Ikkinchi habar (1 kun oldin)
        const message2 = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
        const date2 = new Date();
        date2.setDate(date2.getDate() - 1);
        
        await client.query(`
          INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, created_at, updated_at)
          VALUES ($1, 'user', $2, 'employee', $3, $4, $4)
        `, [user.id, employee.id, message2, date2]);
        
        messageCount += 2;
        console.log(`✅ ${user.full_name} → ${employee.employee_name}: 2 ta habar`);
      }
    }
    
    // 2. Har bir userdan private salon adminga 2 ta habar
    console.log('\n📤 2. Userlardan private salon adminga habarlar yaratish...');
    
    if (privateAdmin.rows.length > 0) {
      const admin = privateAdmin.rows[0];
      
      for (let user of users.rows) {
        // Birinchi habar (2 kun oldin)
        const message1 = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
        const date1 = new Date();
        date1.setDate(date1.getDate() - 2);
        
        await client.query(`
          INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, created_at, updated_at)
          VALUES ($1, 'user', $2, 'admin', $3, $4, $4)
        `, [user.id, admin.id, message1, date1]);
        
        // Ikkinchi habar (bugun)
        const message2 = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
        const date2 = new Date();
        
        await client.query(`
          INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, created_at, updated_at)
          VALUES ($1, 'user', $2, 'admin', $3, $4, $4)
        `, [user.id, admin.id, message2, date2]);
        
        messageCount += 2;
        console.log(`✅ ${user.full_name} → ${admin.full_name} (Admin): 2 ta habar`);
      }
    }
    
    // 3. Har bir employeedan userslarga javob
    console.log('\n📤 3. Employeeslardan userslarga javoblar yaratish...');
    
    for (let employee of employees.rows) {
      for (let user of users.rows) {
        const reply = replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
        const replyDate = new Date();
        replyDate.setHours(replyDate.getHours() - Math.floor(Math.random() * 12)); // So'nggi 12 soat ichida
        
        await client.query(`
          INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, created_at, updated_at)
          VALUES ($1, 'employee', $2, 'user', $3, $4, $4)
        `, [employee.id, user.id, reply, replyDate]);
        
        messageCount++;
        console.log(`✅ ${employee.employee_name} → ${user.full_name}: javob`);
      }
    }
    
    // 4. Private salon admindan userslarga javob
    console.log('\n📤 4. Private salon admindan userslarga javoblar yaratish...');
    
    if (privateAdmin.rows.length > 0) {
      const admin = privateAdmin.rows[0];
      
      for (let user of users.rows) {
        const reply = replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
        const replyDate = new Date();
        replyDate.setHours(replyDate.getHours() - Math.floor(Math.random() * 6)); // So'nggi 6 soat ichida
        
        await client.query(`
          INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content, created_at, updated_at)
          VALUES ($1, 'admin', $2, 'user', $3, $4, $4)
        `, [admin.id, user.id, reply, replyDate]);
        
        messageCount++;
        console.log(`✅ ${admin.full_name} (Admin) → ${user.full_name}: javob`);
      }
    }
    
    // Yakuniy hisobot
    console.log('\n📊 YAKUNIY HISOBOT:');
    const finalCount = await client.query('SELECT COUNT(*) as count FROM messages');
    console.log(`💬 Jami yaratilgan habarlar: ${messageCount} ta`);
    console.log(`💬 Bazadagi habarlar: ${finalCount.rows[0].count} ta`);
    
    // Habarlar taqsimoti
    const userToEmployee = await client.query(`
      SELECT COUNT(*) as count FROM messages 
      WHERE sender_type = 'user' AND receiver_type = 'employee'
    `);
    
    const userToAdmin = await client.query(`
      SELECT COUNT(*) as count FROM messages 
      WHERE sender_type = 'user' AND receiver_type = 'admin'
    `);
    
    const employeeToUser = await client.query(`
      SELECT COUNT(*) as count FROM messages 
      WHERE sender_type = 'employee' AND receiver_type = 'user'
    `);
    
    const adminToUser = await client.query(`
      SELECT COUNT(*) as count FROM messages 
      WHERE sender_type = 'admin' AND receiver_type = 'user'
    `);
    
    console.log('\n📈 Habarlar taqsimoti:');
    console.log(`👤→👥 User → Employee: ${userToEmployee.rows[0].count} ta`);
    console.log(`👤→👤 User → Admin: ${userToAdmin.rows[0].count} ta`);
    console.log(`👥→👤 Employee → User: ${employeeToUser.rows[0].count} ta`);
    console.log(`👤→👤 Admin → User: ${adminToUser.rows[0].count} ta`);
    
    console.log('\n🎉 Barcha habarlar muvaffaqiyatli yaratildi!');
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAllMessages();