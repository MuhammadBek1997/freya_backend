const { Pool } = require('pg');
require('dotenv').config({ path: './.env.production' });

// Production PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateProductionSchedules() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Starting production schedules table migration...');
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Check current table structure
        const columns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Current production table structure:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        const hasEmployeeList = columns.rows.some(col => col.column_name === 'employee_list');
        const hasMasterId = columns.rows.some(col => col.column_name === 'master_id');
        const hasEmployeeId = columns.rows.some(col => col.column_name === 'employee_id');
        
        if (hasEmployeeList) {
            console.log('✅ Table already has employee_list column. No migration needed.');
            await client.query('COMMIT');
            return true;
        }
        
        console.log('\n🔄 Migrating production schedules table...');
        
        // Step 1: Add new columns
        console.log('1️⃣ Adding new columns...');
        await client.query(`
            ALTER TABLE schedules 
            ADD COLUMN IF NOT EXISTS salon_id UUID,
            ADD COLUMN IF NOT EXISTS name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS title VARCHAR(255),
            ADD COLUMN IF NOT EXISTS date DATE,
            ADD COLUMN IF NOT EXISTS repeat VARCHAR(50),
            ADD COLUMN IF NOT EXISTS repeat_value INTEGER,
            ADD COLUMN IF NOT EXISTS employee_list JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS full_pay DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        
        // Step 2: Migrate existing data
        console.log('2️⃣ Migrating existing data...');
        
        // Convert master_id to employee_list
        if (hasMasterId) {
            await client.query(`
                UPDATE schedules 
                SET 
                    employee_list = CASE 
                        WHEN master_id IS NOT NULL THEN jsonb_build_array(master_id::text)
                        ELSE '[]'::jsonb
                    END,
                    name = COALESCE(name, 'Xizmat'),
                    title = COALESCE(title, 'Xizmat tavsifi'),
                    date = CASE 
                        WHEN day IS NOT NULL THEN 
                            CASE day
                                WHEN 'Monday' THEN CURRENT_DATE + INTERVAL '1 day' * (1 - EXTRACT(DOW FROM CURRENT_DATE))
                                WHEN 'Tuesday' THEN CURRENT_DATE + INTERVAL '1 day' * (2 - EXTRACT(DOW FROM CURRENT_DATE))
                                WHEN 'Wednesday' THEN CURRENT_DATE + INTERVAL '1 day' * (3 - EXTRACT(DOW FROM CURRENT_DATE))
                                WHEN 'Thursday' THEN CURRENT_DATE + INTERVAL '1 day' * (4 - EXTRACT(DOW FROM CURRENT_DATE))
                                WHEN 'Friday' THEN CURRENT_DATE + INTERVAL '1 day' * (5 - EXTRACT(DOW FROM CURRENT_DATE))
                                WHEN 'Saturday' THEN CURRENT_DATE + INTERVAL '1 day' * (6 - EXTRACT(DOW FROM CURRENT_DATE))
                                WHEN 'Sunday' THEN CURRENT_DATE + INTERVAL '1 day' * (0 - EXTRACT(DOW FROM CURRENT_DATE))
                                ELSE CURRENT_DATE
                            END
                        ELSE CURRENT_DATE
                    END,
                    price = COALESCE(price, 0),
                    full_pay = COALESCE(full_pay, 0),
                    deposit = COALESCE(deposit, 0),
                    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
                    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
                WHERE employee_list IS NULL OR employee_list = '[]'::jsonb;
            `);
        } else if (hasEmployeeId) {
            await client.query(`
                UPDATE schedules 
                SET 
                    employee_list = CASE 
                        WHEN employee_id IS NOT NULL THEN jsonb_build_array(employee_id::text)
                        ELSE '[]'::jsonb
                    END,
                    name = COALESCE(name, 'Xizmat'),
                    title = COALESCE(title, 'Xizmat tavsifi'),
                    date = CURRENT_DATE,
                    price = COALESCE(price, 0),
                    full_pay = COALESCE(full_pay, 0),
                    deposit = COALESCE(deposit, 0),
                    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
                    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
                WHERE employee_list IS NULL OR employee_list = '[]'::jsonb;
            `);
        }
        
        // Step 3: Remove old columns
        console.log('3️⃣ Removing old columns...');
        if (hasMasterId) {
            await client.query('ALTER TABLE schedules DROP COLUMN IF EXISTS master_id');
        }
        if (hasEmployeeId) {
            await client.query('ALTER TABLE schedules DROP COLUMN IF EXISTS employee_id');
        }
        
        // Remove other old columns
        await client.query(`
            ALTER TABLE schedules 
            DROP COLUMN IF EXISTS day,
            DROP COLUMN IF EXISTS start_time,
            DROP COLUMN IF EXISTS end_time;
        `);
        
        // Step 4: Make required columns NOT NULL
        console.log('4️⃣ Setting column constraints...');
        await client.query(`
            ALTER TABLE schedules 
            ALTER COLUMN name SET NOT NULL,
            ALTER COLUMN date SET NOT NULL,
            ALTER COLUMN price SET NOT NULL;
        `);
        
        // Commit transaction
        await client.query('COMMIT');
        console.log('✅ Production migration completed successfully!');
        
        // Verify the migration
        const newColumns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'schedules' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n📋 New production table structure:');
        newColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Get sample data
        const sampleData = await client.query(`
            SELECT id, employee_list, name, title, price
            FROM schedules 
            LIMIT 3;
        `);
        
        console.log('\n📊 Sample migrated data:');
        if (sampleData.rows.length > 0) {
            sampleData.rows.forEach((row, index) => {
                console.log(`  ${index + 1}. ID: ${row.id}`);
                console.log(`     employee_list: ${JSON.stringify(row.employee_list)}`);
                console.log(`     name: ${row.name}`);
                console.log(`     title: ${row.title}`);
                console.log(`     price: ${row.price}`);
                console.log('');
            });
        }
        
        return true;
        
    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('❌ Production migration failed, rolling back:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
migrateProductionSchedules()
    .then(() => {
        console.log('\n🎉 Production schedules table migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Production migration failed:', error);
        process.exit(1);
    });