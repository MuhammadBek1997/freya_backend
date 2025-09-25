const { pool } = require('./config/database');

async function checkAdminsTable() {
    try {
        console.log('Admins jadval strukturasini tekshirish...');
        
        // Jadval strukturasini olish
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position
        `);
        
        console.log('\nAdmins jadval ustunlari:');
        structure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Mavjud adminlarni ko'rsatish
        const admins = await pool.query('SELECT * FROM admins LIMIT 5');
        console.log('\nMavjud adminlar:');
        console.log(admins.rows);
        
    } catch (error) {
        console.error('Xato:', error);
    } finally {
        await pool.end();
    }
}

checkAdminsTable();