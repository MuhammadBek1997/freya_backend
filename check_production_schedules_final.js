const { Pool } = require('pg');
require('dotenv').config({ path: './.env.production' });

// Production PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkProductionSchedules() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Connecting to production database...');
        console.log(`📍 Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not found'}`);
        
        // Test connection
        await client.query('SELECT NOW()');
        console.log('✅ Successfully connected to production database');
        
        // Check if the table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'schedules'
            );
        `);
        
        if (tableExists.rows[0].exists) {
            console.log('✅ Schedules table exists in production');
            
            // Get current columns
            const columns = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'schedules' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `);
            
            console.log('\n📋 Production table structure:');
            columns.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
            
            // Check if employee_list column exists
            const hasEmployeeList = columns.rows.some(col => col.column_name === 'employee_list');
            const hasEmployeeId = columns.rows.some(col => col.column_name === 'employee_id');
            
            console.log('\n🔍 Column analysis:');
            console.log(`  - employee_list exists: ${hasEmployeeList ? '✅' : '❌'}`);
            console.log(`  - employee_id exists: ${hasEmployeeId ? '⚠️ (old format)' : '✅ (removed)'}`);
            
            if (!hasEmployeeList) {
                console.log('\n⚠️  Production database needs migration!');
                console.log('   The schedules table still uses old structure.');
                return false;
            }
            
            // Get sample data
            const sampleData = await client.query(`
                SELECT id, employee_list, name, title, price, created_at
                FROM schedules 
                LIMIT 3;
            `);
            
            console.log('\n📊 Sample production data:');
            if (sampleData.rows.length > 0) {
                sampleData.rows.forEach((row, index) => {
                    console.log(`  ${index + 1}. ID: ${row.id}`);
                    console.log(`     employee_list: ${JSON.stringify(row.employee_list)}`);
                    console.log(`     name: ${row.name || 'null'}`);
                    console.log(`     title: ${row.title || 'null'}`);
                    console.log(`     price: ${row.price || 'null'}`);
                    console.log('');
                });
            } else {
                console.log('  No data found in schedules table');
            }
            
            // Count total records
            const count = await client.query('SELECT COUNT(*) FROM schedules');
            console.log(`📈 Total schedules in production: ${count.rows[0].count}`);
            
            return true;
            
        } else {
            console.log('❌ Schedules table does not exist in production');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error checking production schedules:', error.message);
        return false;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
checkProductionSchedules()
    .then((success) => {
        if (success) {
            console.log('\n✅ Production schedules check completed successfully');
        } else {
            console.log('\n❌ Production schedules check failed');
        }
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('❌ Check failed:', error);
        process.exit(1);
    });