const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkTableStructure() {
    try {
        console.log('🔍 Checking table structures...\n');
        
        // Check salons table structure
        console.log('📍 SALONS TABLE STRUCTURE:');
        const salonsStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'salons'
            ORDER BY ordinal_position
        `);
        
        salonsStructure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check employees table structure
        console.log('\n👥 EMPLOYEES TABLE STRUCTURE:');
        const employeesStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);
        
        employeesStructure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check schedules table structure
        console.log('\n📅 SCHEDULES TABLE STRUCTURE:');
        const schedulesStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'schedules'
            ORDER BY ordinal_position
        `);
        
        schedulesStructure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check users table structure
        console.log('\n👤 USERS TABLE STRUCTURE:');
        const usersStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        usersStructure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check admins table structure
        console.log('\n🔑 ADMINS TABLE STRUCTURE:');
        const adminsStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins'
            ORDER BY ordinal_position
        `);
        
        adminsStructure.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // List all tables
        console.log('\n📋 ALL TABLES:');
        const allTables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        allTables.rows.forEach(table => {
            console.log(`- ${table.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Database connection closed');
    }
}

checkTableStructure();