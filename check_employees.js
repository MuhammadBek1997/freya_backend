const pool = require('./config/database');

async function checkEmployees() {
    try {
        console.log('Employees jadvalini tekshirish...');
        
        // Employees jadvalining strukturasini ko'rish
        const structureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nEmployees jadval strukturasi:');
        console.table(structureResult.rows);
        
        // Employees jadvalidagi ma'lumotlarni ko'rish
        const dataResult = await pool.query('SELECT * FROM employees LIMIT 5');
        
        console.log('\nEmployees jadvalidagi ma\'lumotlar:');
        console.table(dataResult.rows);
        
        // Jami employees soni
        const countResult = await pool.query('SELECT COUNT(*) as total FROM employees');
        console.log(`\nJami employees soni: ${countResult.rows[0].total}`);
        
    } catch (error) {
        console.error('Xato:', error.message);
    } finally {
        process.exit(0);
    }
}

checkEmployees();