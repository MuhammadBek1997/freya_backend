const { Pool } = require('pg');

// Production database URL
const pool = new Pool({
  connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
  ssl: { rejectUnauthorized: false }
});

async function generateEmployeeUsernames() {
  try {
    console.log('🔧 EMPLOYEELAR UCHUN USERNAME YARATISH\n');
    console.log('=' + '='.repeat(50));
    
    // Hozirgi username holatini tekshirish
    const checkQuery = `
      SELECT 
        id,
        email,
        username,
        name,
        surname,
        salon_id
      FROM employees 
      WHERE is_active = true
      ORDER BY email;
    `;
    
    const employees = await pool.query(checkQuery);
    
    console.log(`\n📊 Jami ${employees.rows.length} ta faol employee topildi\n`);
    
    let updatedCount = 0;
    let alreadyHasUsername = 0;
    
    for (const employee of employees.rows) {
      const { id, email, username, name, surname } = employee;
      
      if (username && username.trim() !== '') {
        console.log(`✅ ${email} - Username allaqachon mavjud: ${username}`);
        alreadyHasUsername++;
        continue;
      }
      
      // Email asosida username yaratish
      let newUsername = '';
      
      if (email) {
        // Email'dan username yaratish (@ belgisigacha bo'lgan qism)
        const emailPart = email.split('@')[0];
        newUsername = emailPart.toLowerCase();
        
        // Agar emp1_1 kabi bo'lsa, uni employee1_1 ga o'zgartirish
        if (newUsername.startsWith('emp')) {
          newUsername = newUsername.replace('emp', 'employee');
        }
      } else if (name || surname) {
        // Agar email yo'q bo'lsa, ism-familiya asosida yaratish
        const firstName = (name || '').toLowerCase().replace(/\s+/g, '');
        const lastName = (surname || '').toLowerCase().replace(/\s+/g, '');
        newUsername = firstName + (lastName ? '_' + lastName : '');
      } else {
        // Agar hech narsa yo'q bo'lsa, ID asosida yaratish
        newUsername = `employee_${id.substring(0, 8)}`;
      }
      
      // Username unique ekanligini tekshirish
      const existingUsernameQuery = 'SELECT id FROM employees WHERE username = $1 AND id != $2';
      const existingResult = await pool.query(existingUsernameQuery, [newUsername, id]);
      
      if (existingResult.rows.length > 0) {
        // Agar username mavjud bo'lsa, raqam qo'shish
        let counter = 1;
        let uniqueUsername = `${newUsername}_${counter}`;
        
        while (true) {
          const checkUniqueQuery = 'SELECT id FROM employees WHERE username = $1 AND id != $2';
          const checkResult = await pool.query(checkUniqueQuery, [uniqueUsername, id]);
          
          if (checkResult.rows.length === 0) {
            newUsername = uniqueUsername;
            break;
          }
          
          counter++;
          uniqueUsername = `${newUsername}_${counter}`;
        }
      }
      
      // Username ni yangilash
      const updateQuery = 'UPDATE employees SET username = $1 WHERE id = $2';
      await pool.query(updateQuery, [newUsername, id]);
      
      console.log(`🔧 ${email || 'Email yo\'q'} - Yangi username: ${newUsername}`);
      updatedCount++;
    }
    
    console.log('\n📈 NATIJALAR:');
    console.log('=' + '='.repeat(20));
    console.log(`✅ Yangilandi: ${updatedCount} ta employee`);
    console.log(`📋 Allaqachon mavjud: ${alreadyHasUsername} ta employee`);
    console.log(`📊 Jami: ${employees.rows.length} ta employee`);
    
    // Yangilangan ma'lumotlarni ko'rsatish
    if (updatedCount > 0) {
      console.log('\n🔍 YANGILANGAN EMPLOYEELAR:');
      console.log('=' + '='.repeat(35));
      
      const updatedQuery = `
        SELECT 
          email,
          username,
          name,
          surname
        FROM employees 
        WHERE is_active = true AND username IS NOT NULL
        ORDER BY email
        LIMIT 10;
      `;
      
      const updatedResult = await pool.query(updatedQuery);
      
      updatedResult.rows.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.email || 'Email yo\'q'} - Username: ${emp.username}`);
      });
      
      if (updatedResult.rows.length < employees.rows.length) {
        console.log(`... va yana ${employees.rows.length - updatedResult.rows.length} ta employee`);
      }
    }
    
  } catch (error) {
    console.error('❌ Xato:', error.message);
  } finally {
    await pool.end();
  }
}

// Scriptni ishga tushirish
generateEmployeeUsernames()
  .then(() => {
    console.log('\n✅ Username yaratish muvaffaqiyatli yakunlandi!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Username yaratish xato bilan yakunlandi:', error.message);
    process.exit(1);
  });