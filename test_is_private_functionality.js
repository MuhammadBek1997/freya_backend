const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testIsPrivateFunctionality() {
    try {
        console.log('🧪 Testing is_private functionality...\n');

        // 1. Check current salon data with is_private field
        console.log('1. Current salon data:');
        const salonsResult = await pool.query(`
            SELECT id, name, is_private, 
                   CASE 
                       WHEN is_private = true THEN 'Private' 
                       ELSE 'Corporate' 
                   END as salon_type_display
            FROM salons 
            ORDER BY id
        `);
        
        console.table(salonsResult.rows);

        // 2. Test creating a new private salon
        console.log('\n2. Testing salon creation with is_private = true:');
        const newPrivateSalon = await pool.query(`
            INSERT INTO salons (
                name, phone, email, description, address, working_hours, 
                salon_types, location, salon_orient, salon_comfort, is_private
            ) VALUES (
                'Test Private Salon', 
                '+998901234567', 
                'test@private.com', 
                'Test private salon description',
                'Test address',
                '{"monday": {"open": "09:00", "close": "18:00"}}',
                '[{"type": "Beauty Salon", "selected": true}]',
                '{"lat": "41.2995", "lng": "69.2401"}',
                '{"comfort": 5, "price": 3}',
                '{"comfort": 5, "price": 3}',
                true
            ) RETURNING id, name, is_private
        `);
        
        console.log('Created private salon:', newPrivateSalon.rows[0]);

        // 3. Test creating a new corporate salon
        console.log('\n3. Testing salon creation with is_private = false:');
        const newCorporateSalon = await pool.query(`
            INSERT INTO salons (
                name, phone, email, description, address, working_hours, 
                salon_types, location, salon_orient, salon_comfort, is_private
            ) VALUES (
                'Test Corporate Salon', 
                '+998901234568', 
                'test@corporate.com', 
                'Test corporate salon description',
                'Test address 2',
                '{"monday": {"open": "08:00", "close": "20:00"}}',
                '[{"type": "Fitness", "selected": true}]',
                '{"lat": "41.3111", "lng": "69.2797"}',
                '{"comfort": 4, "price": 4}',
                '{"comfort": 4, "price": 4}',
                false
            ) RETURNING id, name, is_private
        `);
        
        console.log('Created corporate salon:', newCorporateSalon.rows[0]);

        // 4. Test filtering by is_private
        console.log('\n4. Testing filtering by is_private:');
        
        // Get only private salons
        const privateSalons = await pool.query(`
            SELECT id, name, is_private 
            FROM salons 
            WHERE is_private = true 
            ORDER BY id
        `);
        console.log('\nPrivate salons (is_private = true):');
        console.table(privateSalons.rows);

        // Get only corporate salons
        const corporateSalons = await pool.query(`
            SELECT id, name, is_private 
            FROM salons 
            WHERE is_private = false 
            ORDER BY id
        `);
        console.log('\nCorporate salons (is_private = false):');
        console.table(corporateSalons.rows);

        // 5. Summary
        console.log('\n5. Summary:');
        const summary = await pool.query(`
            SELECT 
                COUNT(*) as total_salons,
                COUNT(CASE WHEN is_private = true THEN 1 END) as private_salons,
                COUNT(CASE WHEN is_private = false THEN 1 END) as corporate_salons
            FROM salons
        `);
        console.table(summary.rows);

        // 6. Clean up test data
        console.log('\n6. Cleaning up test data...');
        await pool.query(`
            DELETE FROM salons 
            WHERE name IN ('Test Private Salon', 'Test Corporate Salon')
        `);
        console.log('✅ Test data cleaned up successfully');

        console.log('\n✅ is_private functionality test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing is_private functionality:', error);
    } finally {
        await pool.end();
    }
}

testIsPrivateFunctionality();