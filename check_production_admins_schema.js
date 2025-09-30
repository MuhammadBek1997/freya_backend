const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function checkAdminsSchema() {
    console.log('🔍 Checking admins table schema in production...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Check admins table schema
        console.log('\n📋 Admins table schema:');
        const schemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position
        `);

        if (schemaResult.rows.length > 0) {
            console.log('Columns:');
            schemaResult.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
            });
        } else {
            console.log('❌ No columns found for admins table');
        }

        // Check all records in admins table
        console.log('\n📊 All records in admins table:');
        const allAdmins = await client.query('SELECT * FROM admins ORDER BY id');
        
        if (allAdmins.rows.length > 0) {
            console.log(`Found ${allAdmins.rows.length} records:`);
            allAdmins.rows.forEach((admin, index) => {
                console.log(`\n   Record ${index + 1}:`);
                Object.keys(admin).forEach(key => {
                    console.log(`     ${key}: ${admin[key]}`);
                });
            });
        } else {
            console.log('❌ No records found in admins table');
        }

        // Check if there's an employee1_1 by username
        console.log('\n🔍 Searching for employee1_1 by username:');
        const employee1_1 = await client.query('SELECT * FROM admins WHERE username = $1', ['employee1_1']);
        
        if (employee1_1.rows.length > 0) {
            console.log('✅ Found employee1_1:');
            const emp = employee1_1.rows[0];
            Object.keys(emp).forEach(key => {
                console.log(`   ${key}: ${emp[key]}`);
            });
        } else {
            console.log('❌ employee1_1 not found');
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

checkAdminsSchema();