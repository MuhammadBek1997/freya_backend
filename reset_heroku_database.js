const { Client } = require('pg');

// Heroku PostgreSQL connection
const client = new Client({
    connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
    ssl: {
        rejectUnauthorized: false
    }
});

async function resetHerokuDatabase() {
    try {
        await client.connect();
        console.log('✅ Heroku PostgreSQL ga ulanish muvaffaqiyatli\n');

        console.log('🗑️ BARCHA JADVALLARNI O\'CHIRISH...\n');

        // Barcha jadvallarni olish
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('Mavjud jadvallar:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Jadvallarni ketma-ket o'chirish (foreign key constraint lar bilan)
        const tablesToDrop = [
            'employee_translations',
            'salon_translations', 
            'schedules',
            'employees',
            'admins',
            'salons',
            'user_favorites',
            'user_sessions',
            'messages',
            'users'
        ];

        console.log('\nJadvallarni o\'chirish:');
        for (const tableName of tablesToDrop) {
            try {
                await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
                console.log(`   ✅ ${tableName} jadvali o'chirildi`);
            } catch (error) {
                console.log(`   ⚠️ ${tableName} jadvalini o'chirishda xatolik: ${error.message}`);
            }
        }

        // Qolgan jadvallarni ham o'chirish
        const remainingTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        if (remainingTables.rows.length > 0) {
            console.log('\nQolgan jadvallarni o\'chirish:');
            for (const table of remainingTables.rows) {
                try {
                    await client.query(`DROP TABLE IF EXISTS ${table.table_name} CASCADE;`);
                    console.log(`   ✅ ${table.table_name} jadvali o'chirildi`);
                } catch (error) {
                    console.log(`   ⚠️ ${table.table_name} jadvalini o'chirishda xatolik: ${error.message}`);
                }
            }
        }

        console.log('\n🏗️ YANGI JADVAL STRUKTURASINI YARATISH...\n');

        // UUID extension ni yoqish
        try {
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
            console.log('   ✅ UUID extension yoqildi');
        } catch (error) {
            console.log('   ⚠️ UUID extension xatoligi:', error.message);
        }

        // 1. Salons jadvali
        await client.query(`
            CREATE TABLE salons (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                salon_name VARCHAR(255) NOT NULL,
                salon_phone VARCHAR(20),
                salon_instagram VARCHAR(100),
                salon_rating DECIMAL(3,2) DEFAULT 0.0,
                salon_description TEXT,
                salon_types JSONB,
                private_salon BOOLEAN DEFAULT false,
                location JSONB,
                is_active BOOLEAN DEFAULT true,
                is_private BOOLEAN DEFAULT false,
                description_uz TEXT,
                description_ru TEXT,
                description_en TEXT,
                address_uz TEXT,
                address_ru TEXT,
                address_en TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ salons jadvali yaratildi');

        // 2. Admins jadvali
        await client.query(`
            CREATE TABLE admins (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ admins jadvali yaratildi');

        // 3. Employees jadvali
        await client.query(`
            CREATE TABLE employees (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                employee_name VARCHAR(255) NOT NULL,
                employee_phone VARCHAR(20),
                employee_password VARCHAR(255),
                employee_description TEXT,
                employee_rating DECIMAL(3,2) DEFAULT 0.0,
                is_waiting BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ employees jadvali yaratildi');

        // 4. Schedules jadvali
        await client.query(`
            CREATE TABLE schedules (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ schedules jadvali yaratildi');

        // 5. Salon translations jadvali
        await client.query(`
            CREATE TABLE salon_translations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                language_code VARCHAR(5) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                field_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(salon_id, language_code, field_name)
            );
        `);
        console.log('   ✅ salon_translations jadvali yaratildi');

        // 6. Employee translations jadvali
        await client.query(`
            CREATE TABLE employee_translations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                language_code VARCHAR(5) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                field_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, language_code, field_name)
            );
        `);
        console.log('   ✅ employee_translations jadvali yaratildi');

        console.log('\n🎉 Heroku PostgreSQL muvaffaqiyatli qayta tiklandi!');
        console.log('✅ Barcha eski jadvallar o\'chirildi');
        console.log('✅ Yangi jadval strukturasi yaratildi');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
        process.exit(0);
    }
}

resetHerokuDatabase();