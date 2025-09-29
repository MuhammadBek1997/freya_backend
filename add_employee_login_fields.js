const { Pool } = require('pg');

// Heroku production database connection
const pool = new Pool({
    connectionString: 'postgres://uefhovlhferv7t:pf59bcec9eba0168cce78a7f8728a7a6cf66489256b0dc9829bc4a1e5b46f68d7@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dchto8v0bjnhh7',
    ssl: {
        rejectUnauthorized: false
    }
});

async function addEmployeeLoginFields() {
    try {
        console.log('🔍 Checking and adding employee login fields...\n');

        // Check current table structure
        const structureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);

        console.log('📋 CURRENT EMPLOYEES TABLE STRUCTURE:');
        const existingColumns = [];
        structureResult.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            existingColumns.push(col.column_name);
        });
        console.log('');

        // Check which columns we need to add
        const requiredColumns = [
            { name: 'username', type: 'VARCHAR(100)', nullable: true },
            { name: 'password_hash', type: 'VARCHAR(255)', nullable: true },
            { name: 'full_name', type: 'VARCHAR(255)', nullable: true }
        ];

        const columnsToAdd = requiredColumns.filter(col => !existingColumns.includes(col.name));

        if (columnsToAdd.length === 0) {
            console.log('✅ All required columns already exist!');
        } else {
            console.log('🔧 Adding missing columns:');
            
            for (const column of columnsToAdd) {
                try {
                    await pool.query(`
                        ALTER TABLE employees 
                        ADD COLUMN ${column.name} ${column.type} ${column.nullable ? '' : 'NOT NULL'}
                    `);
                    console.log(`   ✅ Added column: ${column.name}`);
                } catch (error) {
                    console.log(`   ❌ Failed to add column ${column.name}: ${error.message}`);
                }
            }
        }

        // Check final structure
        const finalStructureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 FINAL EMPLOYEES TABLE STRUCTURE:');
        finalStructureResult.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });

        console.log('\n✅ Employee table is now ready for login functionality!');

    } catch (error) {
        console.error('❌ Error updating employee table:', error.message);
    } finally {
        await pool.end();
    }
}

addEmployeeLoginFields();