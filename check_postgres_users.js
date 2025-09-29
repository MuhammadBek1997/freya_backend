const { query } = require('./config/database');

async function checkUsers() {
  try {
    console.log('PostgreSQL ma\'lumotlar bazasidagi users jadval strukturasini tekshirish...');
    
    // Jadval strukturasini ko'rish
    const structure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users jadval strukturasi:');
    console.log(structure.rows);
    
    // Foydalanuvchilarni ko'rish
    const result = await query('SELECT * FROM users LIMIT 5');
    
    console.log('\nTopilgan foydalanuvchilar:');
    console.log(result.rows);
    
    if (result.rows.length > 0) {
      console.log('\nBirinchi foydalanuvchi ma\'lumotlari:');
      console.log('ID:', result.rows[0].id);
      console.log('Phone:', result.rows[0].phone);
    }
    
  } catch (error) {
    console.error('Xato:', error.message);
  }
  
  process.exit(0);
}

checkUsers();