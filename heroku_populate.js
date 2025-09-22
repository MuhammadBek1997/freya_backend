const { Pool } = require('pg');

// Heroku PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function populateHerokuDatabase() {
    try {
        console.log('🚀 Heroku database\'ga ma\'lumotlar qo\'shish boshlandi...\n');

        // 1. Database connection test
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful\n');

        // 2. Check existing data
        const existingSalons = await pool.query('SELECT COUNT(*) FROM salons');
        console.log(`📊 Mavjud salonlar: ${existingSalons.rows[0].count}\n`);

        // 3. Add sample salons if none exist (using existing schema)
        if (parseInt(existingSalons.rows[0].count) === 0) {
            console.log('🏢 Salonlar qo\'shilmoqda...');
            
            const salons = [
                {
                    name: 'Beauty Palace',
                    address: 'Amir Temur ko\'chasi 15',
                    city: 'Toshkent',
                    district: 'Yunusobod tumani'
                },
                {
                    name: 'Luxury Spa',
                    address: 'Buyuk Ipak Yo\'li 45',
                    city: 'Toshkent',
                    district: 'Mirzo Ulug\'bek tumani'
                },
                {
                    name: 'Private Luxury Salon',
                    address: 'Navoi ko\'chasi 78',
                    city: 'Toshkent',
                    district: 'Shayxontohur tumani'
                },
                {
                    name: 'Elite Beauty Center',
                    address: 'Mustaqillik ko\'chasi 12',
                    city: 'Toshkent',
                    district: 'Chilonzor tumani'
                },
                {
                    name: 'Modern Style Salon',
                    address: 'Bobur ko\'chasi 25',
                    city: 'Toshkent',
                    district: 'Yakkasaroy tumani'
                }
            ];

            for (const salon of salons) {
                const result = await pool.query(`
                    INSERT INTO salons (name, address, city, district, created_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    RETURNING id, name
                `, [
                    salon.name,
                    salon.address,
                    salon.city,
                    salon.district
                ]);
                
                console.log(`   ✅ ${result.rows[0].name} (ID: ${result.rows[0].id})`);
            }
        } else {
            console.log('ℹ️  Salonlar allaqachon mavjud');
        }

        // 4. Final check
        const finalCount = await pool.query('SELECT COUNT(*) FROM salons');
        console.log(`\n🎉 Yakuniy natija: ${finalCount.rows[0].count} ta salon mavjud`);
        
        // 5. Show some sample data
        const sampleData = await pool.query('SELECT id, name, address, city FROM salons LIMIT 3');
        console.log('\n📋 Namuna ma\'lumotlar:');
        sampleData.rows.forEach(salon => {
            console.log(`   - ${salon.name} (${salon.city}, ${salon.address})`);
        });
        
        console.log('\n✅ Heroku database muvaffaqiyatli to\'ldirildi!');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

// Run the script
populateHerokuDatabase();