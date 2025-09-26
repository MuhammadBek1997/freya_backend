const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkSchedulesStructure() {
    try {
        console.log('🔍 Checking schedules table...\n');
        
        // Check schedules table structure
        console.log('📅 SCHEDULES TABLE STRUCTURE:');
        const schedulesStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'schedules'
            ORDER BY ordinal_position
        `);
        
        console.log(`Found ${schedulesStructure.rows.length} columns:`);
        schedulesStructure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check actual data
        console.log('\n📊 SCHEDULES DATA:');
        const schedulesData = await pool.query(`
            SELECT * FROM schedules LIMIT 5
        `);
        
        console.log(`Total schedules: ${schedulesData.rows.length}`);
        schedulesData.rows.forEach((schedule, index) => {
            console.log(`${index + 1}. Schedule ID: ${schedule.id}`);
            console.log(`   Columns: ${Object.keys(schedule).join(', ')}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Database connection closed');
    }
}

checkSchedulesStructure();