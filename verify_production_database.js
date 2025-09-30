const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function verifyProductionDatabase() {
    console.log('🔍 Verifying production database connection and schema...');
    console.log('🌐 Database URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Check database name and basic info
        console.log('\n📋 Database Information:');
        const dbInfo = await client.query('SELECT current_database(), current_user, version()');
        console.log('Database:', dbInfo.rows[0].current_database);
        console.log('User:', dbInfo.rows[0].current_user);
        console.log('Version:', dbInfo.rows[0].version);

        // List all tables
        console.log('\n📊 All tables in database:');
        const tables = await client.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        if (tables.rows.length > 0) {
            tables.rows.forEach(table => {
                console.log(`   - ${table.table_name} (${table.table_type})`);
            });
        } else {
            console.log('❌ No tables found');
        }

        // Check if there are multiple admins tables or similar
        console.log('\n🔍 Searching for admin/employee related tables:');
        const adminTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%admin%' OR table_name LIKE '%employee%' OR table_name LIKE '%user%')
            ORDER BY table_name
        `);
        
        if (adminTables.rows.length > 0) {
            console.log('Found admin/employee/user tables:');
            for (const table of adminTables.rows) {
                console.log(`\n   📋 Table: ${table.table_name}`);
                
                // Get schema for each table
                const schema = await client.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `, [table.table_name]);
                
                schema.rows.forEach(col => {
                    console.log(`      - ${col.column_name}: ${col.data_type}`);
                });
                
                // Get count of records
                try {
                    const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
                    console.log(`      Records: ${count.rows[0].count}`);
                } catch (countError) {
                    console.log(`      Records: Error counting - ${countError.message}`);
                }
            }
        }

        // Check for UUID extensions
        console.log('\n🔍 Checking for UUID extensions:');
        const extensions = await client.query(`
            SELECT extname, extversion 
            FROM pg_extension 
            WHERE extname LIKE '%uuid%'
        `);
        
        if (extensions.rows.length > 0) {
            console.log('UUID extensions found:');
            extensions.rows.forEach(ext => {
                console.log(`   - ${ext.extname} (version: ${ext.extversion})`);
            });
        } else {
            console.log('No UUID extensions found');
        }

        // Try to find the employee with UUID that the server returns
        console.log('\n🔍 Searching for employee with UUID from server response...');
        const uuidEmployee = '161d697c-caf3-4af9-8ef1-e0201fcd858a';
        
        // Check all tables for this UUID
        for (const table of adminTables.rows) {
            try {
                const result = await client.query(`
                    SELECT * FROM ${table.table_name} 
                    WHERE id = $1 OR id::text = $1
                `, [uuidEmployee]);
                
                if (result.rows.length > 0) {
                    console.log(`✅ Found UUID employee in table: ${table.table_name}`);
                    console.log('Employee data:', result.rows[0]);
                } else {
                    console.log(`❌ UUID employee not found in: ${table.table_name}`);
                }
            } catch (searchError) {
                console.log(`❌ Error searching in ${table.table_name}:`, searchError.message);
            }
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

verifyProductionDatabase();