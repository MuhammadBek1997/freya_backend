const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database fayli yo'li
const dbPath = path.join(__dirname, 'freya_chat.db');

console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Barcha jadvallarni ko'rish
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err.message);
    return;
  }
  
  console.log('\n=== DATABASE TABLES ===');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // Salons jadvalini tekshirish
  const hasSalonsTable = tables.some(table => table.name === 'salons');
  
  if (hasSalonsTable) {
    console.log('\n✅ salons jadvali mavjud');
    
    // Salons jadvalining strukturasini tekshirish
    db.all("PRAGMA table_info(salons)", (err, columns) => {
      if (err) {
        console.error('Error getting table info:', err.message);
        return;
      }
      
      console.log('\n=== SALONS TABLE STRUCTURE ===');
      columns.forEach(column => {
        console.log(`${column.name}: ${column.type} (nullable: ${column.notnull === 0})`);
      });
      
      // salon_photos ustuni mavjudligini tekshirish
      const hasPhotosColumn = columns.some(col => col.name === 'salon_photos');
      
      if (hasPhotosColumn) {
        console.log('\n✅ salon_photos ustuni mavjud');
        
        // Mavjud salon_photos ma'lumotlarini ko'rish
        db.all("SELECT id, salon_name, salon_photos FROM salons LIMIT 5", (err, rows) => {
          if (err) {
            console.error('Error fetching salon photos:', err.message);
            return;
          }
          
          console.log('\n=== SALON PHOTOS DATA ===');
          rows.forEach(row => {
            console.log(`Salon ${row.id} (${row.salon_name}): ${row.salon_photos || 'NULL'}`);
          });
          
          db.close();
        });
      } else {
        console.log('\n❌ salon_photos ustuni mavjud emas');
        console.log('salon_photos ustunini qo\'shish...');
        
        // salon_photos ustunini qo'shish
        db.run("ALTER TABLE salons ADD COLUMN salon_photos TEXT", (err) => {
          if (err) {
            console.error('Error adding salon_photos column:', err.message);
          } else {
            console.log('✅ salon_photos ustuni muvaffaqiyatli qo\'shildi');
          }
          
          db.close();
        });
      }
    });
  } else {
    console.log('\n❌ salons jadvali mavjud emas');
    console.log('Database schema ni tekshiring yoki yarating');
    db.close();
  }
});