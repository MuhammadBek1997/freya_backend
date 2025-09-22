const { query } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function addTestData() {
  try {
    console.log('Test ma\'lumotlarini qo\'shish boshlandi...');

    // Test user qo'shish
    const userId = 'ad88400b-2ce7-4116-9322-cf017f20d89e';
    await query(`
      INSERT OR REPLACE INTO users (id, phone, name, role) 
      VALUES (?, ?, ?, ?)
    `, [userId, '+998901111112', 'Test User', 'user']);
    
    console.log('Test user qo\'shildi:', userId);

    // Test employee qo'shish
    const employeeId = '33e5cc80-aa9a-44f4-8731-66b338df6dc7';
    await query(`
      INSERT OR REPLACE INTO employees (id, name, phone, email, position) 
      VALUES (?, ?, ?, ?, ?)
    `, [employeeId, 'Sartarosh Olim', '+998901234567', 'olim@salon.uz', 'Sartarosh']);
    
    console.log('Test employee qo\'shildi:', employeeId);

    // Yana bir employee qo'shish
    const employee2Id = uuidv4();
    await query(`
      INSERT OR REPLACE INTO employees (id, name, phone, email, position) 
      VALUES (?, ?, ?, ?, ?)
    `, [employee2Id, 'Stilist Malika', '+998907654321', 'malika@salon.uz', 'Stilist']);
    
    console.log('Ikkinchi test employee qo\'shildi:', employee2Id);

    // Test xabarlar qo'shish
    const messageId1 = uuidv4();
    await query(`
      INSERT INTO user_chats (id, sender_id, sender_type, receiver_id, receiver_type, message_text, is_read) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [messageId1, userId, 'user', employeeId, 'employee', 'Salom! Ertaga vaqt bormi?', false]);
    
    const messageId2 = uuidv4();
    await query(`
      INSERT INTO user_chats (id, sender_id, sender_type, receiver_id, receiver_type, message_text, is_read) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [messageId2, employeeId, 'employee', userId, 'user', 'Salom! Ha, ertaga 14:00 da bo\'sh vaqtim bor.', true]);

    console.log('Test xabarlar qo\'shildi');
    console.log('Test ma\'lumotlari muvaffaqiyatli qo\'shildi!');
    
    // Ma'lumotlarni tekshirish
    const users = await query('SELECT * FROM users');
    const employees = await query('SELECT * FROM employees');
    const messages = await query('SELECT * FROM user_chats');
    
    console.log('\\nQo\'shilgan ma\'lumotlar:');
    console.log('Users:', users.rows.length);
    console.log('Employees:', employees.rows.length);
    console.log('Messages:', messages.rows.length);
    
  } catch (error) {
    console.error('Xato:', error);
  }
}

// Script'ni ishga tushirish
if (require.main === module) {
  addTestData().then(() => {
    console.log('Script tugadi');
    process.exit(0);
  }).catch(err => {
    console.error('Script xatosi:', err);
    process.exit(1);
  });
}

module.exports = { addTestData };