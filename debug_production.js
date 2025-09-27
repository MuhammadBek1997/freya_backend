require('dotenv').config({ path: '.env.production' });
const { pool } = require('./config/database');

async function debugProduction() {
    try {
        console.log('🔍 Debug production environment...');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
        console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined');
        
        // Test database connection
        const testQuery = await pool.query('SELECT NOW(), current_database()');
        console.log('✅ Database connection successful');
        console.log('Current time:', testQuery.rows[0].now);
        console.log('Current database:', testQuery.rows[0].current_database);
        
        // Check schedules table structure
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            ORDER BY ordinal_position
        `);
        console.log('📋 Schedules table structure:');
        tableInfo.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        // Check total count
        const countResult = await pool.query('SELECT COUNT(*) as total FROM schedules');
        console.log('📊 Total schedules in database:', countResult.rows[0].total);
        
        // Check recent schedules
        const recentSchedules = await pool.query(`
            SELECT id, name, title, date, employee_list, created_at 
            FROM schedules 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log('🕒 Recent schedules:');
        recentSchedules.rows.forEach((schedule, index) => {
            console.log(`${index + 1}. ID: ${schedule.id}`);
            console.log(`   Name: ${schedule.name}`);
            console.log(`   Title: ${schedule.title}`);
            console.log(`   Date: ${schedule.date}`);
            console.log(`   Employee List: ${JSON.stringify(schedule.employee_list)}`);
            console.log(`   Created: ${schedule.created_at}`);
            console.log('   ---');
        });
        
        // Test the exact controller query
        console.log('🎯 Testing controller query...');
        const controllerQuery = `SELECT * FROM schedules WHERE 1=1 ORDER BY created_at DESC LIMIT 10 OFFSET 0`;
        const controllerResult = await pool.query(controllerQuery);
        console.log('Controller query returned:', controllerResult.rows.length, 'rows');
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    } finally {
        process.exit(0);
    }
}

debugProduction();