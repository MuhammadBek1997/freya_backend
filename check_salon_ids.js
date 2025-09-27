const { pool } = require('./config/database');

async function checkSalonIds() {
    try {
        console.log('Checking salon IDs...');
        
        const result = await pool.query('SELECT id, name FROM salons ORDER BY created_at');
        
        console.log('Salons found:');
        result.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ID: ${salon.id}, Name: ${salon.name}`);
        });
        
        console.log(`\nTotal salons: ${result.rows.length}`);
        
    } catch (error) {
        console.error('Error checking salon IDs:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

checkSalonIds();