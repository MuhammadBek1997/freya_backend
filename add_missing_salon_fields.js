const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMissingSalonFields() {
    try {
        console.log('🔧 Adding missing fields to salons table...\n');

        // 1. Add is_top field
        console.log('1. Adding is_top field...');
        try {
            await pool.query(`
                ALTER TABLE salons 
                ADD COLUMN IF NOT EXISTS is_top BOOLEAN DEFAULT false
            `);
            console.log('✅ is_top field added');
        } catch (error) {
            console.log('⚠️ is_top field might already exist:', error.message);
        }

        // 2. Add multilingual name fields
        console.log('\n2. Adding multilingual name fields...');
        const nameFields = ['salon_name_uz', 'salon_name_en', 'salon_name_ru'];
        for (const field of nameFields) {
            try {
                await pool.query(`
                    ALTER TABLE salons 
                    ADD COLUMN IF NOT EXISTS ${field} TEXT
                `);
                console.log(`✅ ${field} field added`);
            } catch (error) {
                console.log(`⚠️ ${field} field might already exist:`, error.message);
            }
        }

        // 3. Add multilingual description fields
        console.log('\n3. Adding multilingual description fields...');
        const descFields = ['salon_description_uz', 'salon_description_en', 'salon_description_ru'];
        for (const field of descFields) {
            try {
                await pool.query(`
                    ALTER TABLE salons 
                    ADD COLUMN IF NOT EXISTS ${field} TEXT
                `);
                console.log(`✅ ${field} field added`);
            } catch (error) {
                console.log(`⚠️ ${field} field might already exist:`, error.message);
            }
        }

        // 4. Add multilingual title fields
        console.log('\n4. Adding multilingual title fields...');
        const titleFields = ['salon_title_uz', 'salon_title_en', 'salon_title_ru'];
        for (const field of titleFields) {
            try {
                await pool.query(`
                    ALTER TABLE salons 
                    ADD COLUMN IF NOT EXISTS ${field} TEXT
                `);
                console.log(`✅ ${field} field added`);
            } catch (error) {
                console.log(`⚠️ ${field} field might already exist:`, error.message);
            }
        }

        // 5. Add JSON fields
        console.log('\n5. Adding JSON fields...');
        const jsonFields = [
            'salon_payment',
            'work_schedule', 
            'salon_additionals',
            'salon_photos'
        ];
        
        for (const field of jsonFields) {
            try {
                await pool.query(`
                    ALTER TABLE salons 
                    ADD COLUMN IF NOT EXISTS ${field} JSONB DEFAULT '[]'::jsonb
                `);
                console.log(`✅ ${field} field added`);
            } catch (error) {
                console.log(`⚠️ ${field} field might already exist:`, error.message);
            }
        }

        // 6. Update existing salons with default values
        console.log('\n6. Updating existing salons with default values...');
        
        const updateResult = await pool.query(`
            UPDATE salons SET
                is_top = CASE 
                    WHEN name = 'Yangi salon' THEN true 
                    ELSE false 
                END,
                salon_name_uz = COALESCE(salon_name_uz, name),
                salon_name_en = COALESCE(salon_name_en, 
                    CASE 
                        WHEN name = 'Yangi salon' THEN 'New Salon'
                        WHEN name LIKE '%salon%' THEN REPLACE(name, 'salon', 'Salon')
                        ELSE name || ' Salon'
                    END
                ),
                salon_name_ru = COALESCE(salon_name_ru,
                    CASE 
                        WHEN name = 'Yangi salon' THEN 'Новый салон'
                        WHEN name LIKE '%salon%' THEN REPLACE(name, 'salon', 'Салон')
                        ELSE name || ' Салон'
                    END
                ),
                salon_description_uz = COALESCE(salon_description_uz, description),
                salon_description_en = COALESCE(salon_description_en,
                    CASE 
                        WHEN description = 'Salon haqida malumot' THEN 'Information about salon'
                        ELSE COALESCE(description, 'Salon information')
                    END
                ),
                salon_description_ru = COALESCE(salon_description_ru,
                    CASE 
                        WHEN description = 'Salon haqida malumot' THEN 'Информация о салоне'
                        ELSE COALESCE(description, 'Информация о салоне')
                    END
                ),
                salon_title_uz = COALESCE(salon_title_uz, 'Salon'),
                salon_title_en = COALESCE(salon_title_en, 'Salon'),
                salon_title_ru = COALESCE(salon_title_ru, 'Салон'),
                salon_payment = COALESCE(salon_payment, 'null'::jsonb),
                work_schedule = COALESCE(work_schedule, '[]'::jsonb),
                salon_additionals = COALESCE(salon_additionals, '[]'::jsonb),
                salon_photos = COALESCE(salon_photos, '[]'::jsonb)
            WHERE salon_name_uz IS NULL 
               OR salon_name_en IS NULL 
               OR salon_name_ru IS NULL
               OR salon_description_uz IS NULL
               OR salon_description_en IS NULL
               OR salon_description_ru IS NULL
               OR salon_title_uz IS NULL
               OR salon_title_en IS NULL
               OR salon_title_ru IS NULL
               OR salon_payment IS NULL
               OR work_schedule IS NULL
               OR salon_additionals IS NULL
               OR salon_photos IS NULL
        `);

        console.log(`✅ Updated ${updateResult.rowCount} salons with default values`);

        // 7. Verify the updated structure
        console.log('\n7. Verifying updated structure...');
        const verifyResult = await pool.query(`
            SELECT id, name, is_top, is_private,
                   salon_name_uz, salon_name_en, salon_name_ru,
                   salon_description_uz, salon_description_en, salon_description_ru,
                   salon_title_uz, salon_title_en, salon_title_ru,
                   salon_payment, work_schedule, salon_additionals, salon_photos
            FROM salons 
            ORDER BY created_at
        `);

        console.log(`\nFound ${verifyResult.rows.length} salons with updated structure:`);
        verifyResult.rows.forEach((salon, index) => {
            console.log(`\n--- Salon ${index + 1} ---`);
            console.log(`ID: ${salon.id}`);
            console.log(`Name: ${salon.name}`);
            console.log(`Is Top: ${salon.is_top}`);
            console.log(`Is Private: ${salon.is_private}`);
            console.log(`Name UZ: ${salon.salon_name_uz}`);
            console.log(`Name EN: ${salon.salon_name_en}`);
            console.log(`Name RU: ${salon.salon_name_ru}`);
            console.log(`Description UZ: ${salon.salon_description_uz}`);
            console.log(`Description EN: ${salon.salon_description_en}`);
            console.log(`Description RU: ${salon.salon_description_ru}`);
            console.log(`Title UZ: ${salon.salon_title_uz}`);
            console.log(`Title EN: ${salon.salon_title_en}`);
            console.log(`Title RU: ${salon.salon_title_ru}`);
            console.log(`Payment: ${JSON.stringify(salon.salon_payment)}`);
            console.log(`Work Schedule: ${JSON.stringify(salon.work_schedule)}`);
            console.log(`Additionals: ${JSON.stringify(salon.salon_additionals)}`);
            console.log(`Photos: ${JSON.stringify(salon.salon_photos)}`);
        });

        console.log('\n✅ Missing fields added and existing data updated successfully!');

    } catch (error) {
        console.error('❌ Error adding missing salon fields:', error);
    } finally {
        await pool.end();
    }
}

addMissingSalonFields();