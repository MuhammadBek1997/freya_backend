const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function findUuidEmployee() {
    console.log('🔍 Searching for UUID employee in production database...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const targetUuid = '161d697c-caf3-4af9-8ef1-e0201fcd858a';
    const targetSalonUuid = '7470bfa9-d1d3-42f1-86d5-8b9f29aaa7c2';

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Get all tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log(`\n🔍 Searching for UUID ${targetUuid} in all tables...`);

        for (const table of tables.rows) {
            const tableName = table.table_name;
            console.log(`\n📋 Checking table: ${tableName}`);

            try {
                // Get all columns for this table
                const columns = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `, [tableName]);

                // Look for UUID or text columns that might contain our target UUID
                const searchableColumns = columns.rows.filter(col => 
                    col.data_type === 'uuid' || 
                    col.data_type === 'character varying' || 
                    col.data_type === 'text'
                );

                if (searchableColumns.length > 0) {
                    console.log(`   Searchable columns: ${searchableColumns.map(c => c.column_name).join(', ')}`);

                    // Search in each column
                    for (const col of searchableColumns) {
                        try {
                            const searchQuery = `
                                SELECT * FROM ${tableName} 
                                WHERE ${col.column_name}::text = $1
                            `;
                            const result = await client.query(searchQuery, [targetUuid]);

                            if (result.rows.length > 0) {
                                console.log(`✅ FOUND UUID in ${tableName}.${col.column_name}!`);
                                console.log('Data:', JSON.stringify(result.rows[0], null, 2));
                            }
                        } catch (searchError) {
                            // Ignore search errors for individual columns
                        }
                    }

                    // Also search for the salon UUID
                    for (const col of searchableColumns) {
                        try {
                            const searchQuery = `
                                SELECT * FROM ${tableName} 
                                WHERE ${col.column_name}::text = $1
                            `;
                            const result = await client.query(searchQuery, [targetSalonUuid]);

                            if (result.rows.length > 0) {
                                console.log(`✅ FOUND salon UUID in ${tableName}.${col.column_name}!`);
                                console.log('Data:', JSON.stringify(result.rows[0], null, 2));
                            }
                        } catch (searchError) {
                            // Ignore search errors for individual columns
                        }
                    }
                }

                // Also check if there are any records with username 'employee1_1'
                const usernameColumns = columns.rows.filter(col => 
                    col.column_name.toLowerCase().includes('username') ||
                    col.column_name.toLowerCase().includes('name') ||
                    col.column_name.toLowerCase().includes('email')
                );

                for (const col of usernameColumns) {
                    try {
                        const searchQuery = `
                            SELECT * FROM ${tableName} 
                            WHERE ${col.column_name}::text ILIKE '%employee1_1%'
                        `;
                        const result = await client.query(searchQuery);

                        if (result.rows.length > 0) {
                            console.log(`✅ FOUND employee1_1 in ${tableName}.${col.column_name}!`);
                            console.log('Data:', JSON.stringify(result.rows[0], null, 2));
                        }
                    } catch (searchError) {
                        // Ignore search errors
                    }
                }

            } catch (tableError) {
                console.log(`❌ Error checking table ${tableName}:`, tableError.message);
            }
        }

        // Let's also check if there might be a view or function that generates this data
        console.log('\n🔍 Checking for views...');
        const views = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
        `);

        if (views.rows.length > 0) {
            console.log('Found views:');
            views.rows.forEach(view => {
                console.log(`   - ${view.table_name}`);
            });
        } else {
            console.log('No views found');
        }

        // Check for functions
        console.log('\n🔍 Checking for functions...');
        const functions = await client.query(`
            SELECT routine_name, routine_type 
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
        `);

        if (functions.rows.length > 0) {
            console.log('Found functions/procedures:');
            functions.rows.forEach(func => {
                console.log(`   - ${func.routine_name} (${func.routine_type})`);
            });
        } else {
            console.log('No functions found');
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

findUuidEmployee();