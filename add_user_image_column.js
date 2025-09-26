const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database fayli yo'li
const dbPath = process.env.NODE_ENV === 'production' 
    ? process.env.DATABASE_URL 
    : path.join(__dirname, 'freya_chat.db');

console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database ulanishida xatolik:', err.message);
        return;
    }
    console.log('SQLite database ga ulandi.');
});

// Users jadvaliga image ustuni qo'shish
const addImageColumn = () => {
    return new Promise((resolve, reject) => {
        // Avval ustun mavjudligini tekshirish
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                reject(err);
                return;
            }

            const imageColumnExists = columns.some(col => col.name === 'image');
            
            if (imageColumnExists) {
                console.log('Image ustuni allaqachon mavjud.');
                resolve();
                return;
            }

            // Image ustunini qo'shish
            const sql = `ALTER TABLE users ADD COLUMN image TEXT`;
            
            db.run(sql, (err) => {
                if (err) {
                    console.error('Image ustuni qo\'shishda xatolik:', err.message);
                    reject(err);
                } else {
                    console.log('Image ustuni muvaffaqiyatli qo\'shildi.');
                    resolve();
                }
            });
        });
    });
};

// Jadval strukturasini tekshirish
const checkTableStructure = () => {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('\nUsers jadvali strukturasi:');
            columns.forEach(col => {
                console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
            });
            resolve();
        });
    });
};

// Asosiy funksiya
const main = async () => {
    try {
        console.log('Users jadvaliga image ustuni qo\'shilmoqda...\n');
        
        await addImageColumn();
        await checkTableStructure();
        
        console.log('\nMigration muvaffaqiyatli yakunlandi!');
        
    } catch (error) {
        console.error('Migration xatolik:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Database yopishda xatolik:', err.message);
            } else {
                console.log('Database aloqasi yopildi.');
            }
        });
    }
};

main();