const { pool } = require('./config/database');

async function migrateSchedulesTable() {
    const client = await pool.connect();
    
    try {
        console.log('Starting schedules table migration...');
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Check if the table exists and get its current structure
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'schedules'
            );
        `);
        
        if (tableExists.rows[0].exists) {
            console.log('Schedules table exists. Checking current structure...');
            
            // Get current columns
            const columns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'schedules' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `);
            
            console.log('Current columns:', columns.rows);
            
            // Check if we need to migrate from old structure
            const hasEmployeeId = columns.rows.some(col => col.column_name === 'employee_id');
            const hasEmployeeList = columns.rows.some(col => col.column_name === 'employee_list');
            
            if (hasEmployeeId && !hasEmployeeList) {
                console.log('Migrating from old structure to new structure...');
                
                // Add new columns
                await client.query(`
                    ALTER TABLE schedules 
                    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
                    ADD COLUMN IF NOT EXISTS repeat VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS repeat_value INTEGER,
                    ADD COLUMN IF NOT EXISTS employee_list JSONB DEFAULT '[]',
                    ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
                    ADD COLUMN IF NOT EXISTS full_pay DECIMAL(10,2),
                    ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2);
                `);
                
                // Migrate existing data
                console.log('Migrating existing data...');
                await client.query(`
                    UPDATE schedules 
                    SET 
                        name = COALESCE(name, 'Услуга'),
                        title = COALESCE(title, 'Описание услуги'),
                        employee_list = CASE 
                            WHEN employee_id IS NOT NULL THEN jsonb_build_array(employee_id::text)
                            ELSE '[]'::jsonb
                        END,
                        price = COALESCE(price, 0),
                        full_pay = COALESCE(full_pay, 0),
                        deposit = COALESCE(deposit, 0)
                    WHERE name IS NULL OR employee_list IS NULL OR price IS NULL;
                `);
                
                // Remove old columns that are no longer needed
                const hasStartTime = columns.rows.some(col => col.column_name === 'start_time');
                const hasEndTime = columns.rows.some(col => col.column_name === 'end_time');
                const hasDayOfWeek = columns.rows.some(col => col.column_name === 'day_of_week');
                const hasIsAvailable = columns.rows.some(col => col.column_name === 'is_available');
                
                if (hasStartTime) {
                    await client.query('ALTER TABLE schedules DROP COLUMN IF EXISTS start_time');
                }
                if (hasEndTime) {
                    await client.query('ALTER TABLE schedules DROP COLUMN IF EXISTS end_time');
                }
                if (hasDayOfWeek) {
                    await client.query('ALTER TABLE schedules DROP COLUMN IF EXISTS day_of_week');
                }
                if (hasIsAvailable) {
                    await client.query('ALTER TABLE schedules RENAME COLUMN is_available TO is_active');
                }
                
                // Finally, drop the employee_id column
                await client.query('ALTER TABLE schedules DROP COLUMN IF EXISTS employee_id');
                
                console.log('Migration completed successfully!');
            } else if (hasEmployeeList) {
                console.log('Table already has new structure. No migration needed.');
            } else {
                console.log('Unknown table structure. Please check manually.');
            }
        } else {
            console.log('Schedules table does not exist. Creating new table...');
            
            // Create new table with correct structure
            await client.query(`
                CREATE TABLE schedules (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    title VARCHAR(255),
                    date DATE NOT NULL,
                    repeat VARCHAR(50),
                    repeat_value INTEGER,
                    employee_list JSONB DEFAULT '[]',
                    price DECIMAL(10,2) NOT NULL,
                    full_pay DECIMAL(10,2),
                    deposit DECIMAL(10,2),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            
            console.log('New schedules table created successfully!');
        }
        
        // Commit transaction
        await client.query('COMMIT');
        console.log('Migration transaction committed.');
        
    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('Migration failed, rolling back:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration
migrateSchedulesTable()
    .then(() => {
        console.log('Schedules table migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });