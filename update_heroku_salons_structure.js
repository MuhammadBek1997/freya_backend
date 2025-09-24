const { Client } = require('pg');

// Heroku PostgreSQL connection
const client = new Client({
    connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateHerokuSalonsStructure() {
    try {
        await client.connect();
        console.log('✅ Heroku PostgreSQL ga ulanish muvaffaqiyatli');

        console.log('1. Salons jadvalini yaratish...');
        
        // Salons jadvalini yaratish
        await client.query(`
            CREATE TABLE IF NOT EXISTS salons (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_logo VARCHAR(255),
                salon_name VARCHAR(255) NOT NULL,
                salon_phone VARCHAR(20),
                salon_add_phone VARCHAR(20),
                salon_instagram VARCHAR(100),
                salon_rating DECIMAL(3,2) DEFAULT 0.00,
                comments JSONB DEFAULT '[]',
                salon_payment JSONB DEFAULT '[]',
                salon_description TEXT,
                salon_types JSONB DEFAULT '[]',
                private_salon BOOLEAN DEFAULT false,
                work_schedule JSONB DEFAULT '[]',
                salon_title VARCHAR(255),
                salon_additionals JSONB DEFAULT '[]',
                sale_percent INTEGER DEFAULT 0,
                sale_limit INTEGER DEFAULT 0,
                location JSONB,
                salon_orient JSONB,
                salon_photos JSONB DEFAULT '[]',
                salon_comfort JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                salon_format JSONB DEFAULT '[]',
                is_top BOOLEAN DEFAULT false,
                is_personal BOOLEAN DEFAULT false,
                is_private BOOLEAN DEFAULT false,
                description_uz TEXT,
                description_ru TEXT,
                description_en TEXT,
                address_uz TEXT,
                address_ru TEXT,
                address_en TEXT
            )
        `);
        console.log('✅ Salons jadvali yaratildi');

        console.log('2. Admins jadvalini yaratish...');
        
        // Admins jadvalini yaratish
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Admins jadvali yaratildi');

        console.log('3. Employees jadvalini yaratish...');
        
        // Employees jadvalini yaratish
        await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                employee_name VARCHAR(255) NOT NULL,
                employee_phone VARCHAR(20) UNIQUE NOT NULL,
                employee_password VARCHAR(255) NOT NULL,
                employee_photo VARCHAR(255),
                employee_description TEXT,
                employee_rating DECIMAL(3,2) DEFAULT 0.00,
                employee_services JSONB DEFAULT '[]',
                employee_schedule JSONB DEFAULT '[]',
                is_waiting BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Employees jadvali yaratildi');

        console.log('4. Schedules jadvalini yaratish...');
        
        // Schedules jadvalini yaratish
        await client.query(`
            CREATE TABLE IF NOT EXISTS schedules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                client_name VARCHAR(255) NOT NULL,
                client_phone VARCHAR(20) NOT NULL,
                service_name VARCHAR(255) NOT NULL,
                service_price DECIMAL(10,2) NOT NULL,
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Schedules jadvali yaratildi');

        console.log('5. Translation jadvallarini yaratish...');
        
        // Salon translations
        await client.query(`
            CREATE TABLE IF NOT EXISTS salon_translations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                language VARCHAR(5) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                translated_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(salon_id, language, field_name)
            )
        `);
        console.log('✅ Salon translations jadvali yaratildi');

        // Employee translations
        await client.query(`
            CREATE TABLE IF NOT EXISTS employee_translations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                language VARCHAR(5) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                translated_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, language, field_name)
            )
        `);
        console.log('✅ Employee translations jadvali yaratildi');

        console.log('🎉 Heroku PostgreSQL strukturasi muvaffaqiyatli yangilandi!');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

updateHerokuSalonsStructure();