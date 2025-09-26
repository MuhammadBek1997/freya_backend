const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSalonStructureDetailed() {
    try {
        console.log('🔍 Checking detailed salon structure...\n');

        // 1. Check table structure
        console.log('1. Current salons table structure:');
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position
        `);
        console.table(tableStructure.rows);

        // 2. Check current salon data
        console.log('\n2. Current salon data:');
        const salonsData = await pool.query(`
            SELECT id, name, description, address, phone, email, 
                   working_hours, is_active, created_at, updated_at,
                   salon_types, location, salon_orient, salon_comfort,
                   is_private
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log(`Found ${salonsData.rows.length} salons:`);
        salonsData.rows.forEach((salon, index) => {
            console.log(`\n--- Salon ${index + 1} ---`);
            console.log(`ID: ${salon.id}`);
            console.log(`Name: ${salon.name}`);
            console.log(`Description: ${salon.description}`);
            console.log(`Address: ${salon.address}`);
            console.log(`Phone: ${salon.phone}`);
            console.log(`Email: ${salon.email}`);
            console.log(`Working Hours: ${JSON.stringify(salon.working_hours)}`);
            console.log(`Is Active: ${salon.is_active}`);
            console.log(`Is Private: ${salon.is_private}`);
            console.log(`Salon Types: ${JSON.stringify(salon.salon_types)}`);
            console.log(`Location: ${JSON.stringify(salon.location)}`);
            console.log(`Salon Orient: ${JSON.stringify(salon.salon_orient)}`);
            console.log(`Salon Comfort: ${JSON.stringify(salon.salon_comfort)}`);
            console.log(`Created: ${salon.created_at}`);
            console.log(`Updated: ${salon.updated_at}`);
        });

        // 3. Check for missing fields that are in the target structure
        console.log('\n3. Checking for missing fields in target structure:');
        const requiredFields = [
            'is_top', 'salon_name_uz', 'salon_name_en', 'salon_name_ru',
            'salon_description_uz', 'salon_description_en', 'salon_description_ru',
            'salon_title_uz', 'salon_title_en', 'salon_title_ru',
            'salon_payment', 'work_schedule', 'salon_additionals', 'salon_photos'
        ];

        const missingFields = [];
        for (const field of requiredFields) {
            const fieldExists = tableStructure.rows.some(row => row.column_name === field);
            if (!fieldExists) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            console.log('Missing fields:', missingFields);
        } else {
            console.log('All required fields exist in the table.');
        }

        // 4. Summary
        console.log('\n4. Summary:');
        console.log(`- Total salons: ${salonsData.rows.length}`);
        console.log(`- Missing fields: ${missingFields.length}`);
        console.log(`- Fields to add: ${missingFields.join(', ')}`);

    } catch (error) {
        console.error('❌ Error checking salon structure:', error);
    } finally {
        await pool.end();
    }
}

checkSalonStructureDetailed();