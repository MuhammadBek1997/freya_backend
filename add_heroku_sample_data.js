const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Heroku PostgreSQL connection
const client = new Client({
    connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
    ssl: {
        rejectUnauthorized: false
    }
});

async function addHerokuSampleData() {
    try {
        await client.connect();
        console.log('✅ Heroku PostgreSQL ga ulanish muvaffaqiyatli');

        console.log('🏢 SALONLAR YARATISH...\n');

        // 1. Beauty Palace (Public)
        const salon1Result = await client.query(`
            INSERT INTO salons (
                salon_name, salon_phone, salon_instagram, salon_rating, 
                salon_description, salon_types, private_salon, location, 
                is_active, is_private, description_uz, description_ru, description_en,
                address_uz, address_ru, address_en
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            ) RETURNING id, salon_name
        `, [
            'Beauty Palace',
            '+998712345678',
            '@beautypalace_uz',
            4.5,
            'Zamonaviy go\'zallik saloni. Professional xizmatlar va yuqori sifat.',
            JSON.stringify([
                { "id": 1, "name_uz": "Soch kesish", "name_ru": "Стрижка", "name_en": "Haircut" },
                { "id": 2, "name_uz": "Manikür", "name_ru": "Маникюр", "name_en": "Manicure" }
            ]),
            false,
            JSON.stringify({
                "lat": 41.2995,
                "lng": 69.2401,
                "address": "Toshkent, Yunusobod tumani, Amir Temur ko'chasi 15"
            }),
            true,
            false,
            'Zamonaviy go\'zallik saloni. Professional xizmatlar va yuqori sifat.',
            'Современный салон красоты. Профессиональные услуги и высокое качество.',
            'Modern beauty salon. Professional services and high quality.',
            'Toshkent, Yunusobod tumani, Amir Temur ko\'chasi 15',
            'Ташкент, Юнусабадский район, улица Амира Темура 15',
            'Tashkent, Yunusobod district, Amir Temur street 15'
        ]);
        console.log(`   ✅ ${salon1Result.rows[0].salon_name} yaratildi (ID: ${salon1Result.rows[0].id})`);

        // 2. Elite Style (Public)
        const salon2Result = await client.query(`
            INSERT INTO salons (
                salon_name, salon_phone, salon_instagram, salon_rating, 
                salon_description, salon_types, private_salon, location, 
                is_active, is_private, description_uz, description_ru, description_en,
                address_uz, address_ru, address_en
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            ) RETURNING id, salon_name
        `, [
            'Elite Style',
            '+998712345679',
            '@elitestyle_uz',
            4.8,
            'Eksklyuziv stilistik xizmatlar. VIP mijozlar uchun maxsus yondashuv.',
            JSON.stringify([
                { "id": 1, "name_uz": "VIP soch kesish", "name_ru": "VIP стрижка", "name_en": "VIP Haircut" },
                { "id": 2, "name_uz": "Stilist xizmati", "name_ru": "Услуги стилиста", "name_en": "Stylist service" }
            ]),
            false,
            JSON.stringify({
                "lat": 41.3111,
                "lng": 69.2797,
                "address": "Toshkent, Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li 45"
            }),
            true,
            false,
            'Eksklyuziv stilistik xizmatlar. VIP mijozlar uchun maxsus yondashuv.',
            'Эксклюзивные стилистические услуги. Особый подход для VIP клиентов.',
            'Exclusive styling services. Special approach for VIP clients.',
            'Toshkent, Mirzo Ulug\'bek tumani, Buyuk Ipak Yo\'li 45',
            'Ташкент, район Мирзо Улугбека, Великий Шелковый путь 45',
            'Tashkent, Mirzo Ulugbek district, Great Silk Road 45'
        ]);
        console.log(`   ✅ ${salon2Result.rows[0].salon_name} yaratildi (ID: ${salon2Result.rows[0].id})`);

        // 3. Private Luxury Salon (Private)
        const salon3Result = await client.query(`
            INSERT INTO salons (
                salon_name, salon_phone, salon_instagram, salon_rating, 
                salon_description, salon_types, private_salon, location, 
                is_active, is_private, description_uz, description_ru, description_en,
                address_uz, address_ru, address_en
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            ) RETURNING id, salon_name
        `, [
            'Private Luxury Salon',
            '+998712345680',
            '@privateluxury_uz',
            5.0,
            'Maxfiy hashamatli salon. Faqat VIP mijozlar uchun.',
            JSON.stringify([
                { "id": 1, "name_uz": "Premium xizmat", "name_ru": "Премиум услуга", "name_en": "Premium service" },
                { "id": 2, "name_uz": "Shaxsiy stilist", "name_ru": "Личный стилист", "name_en": "Personal stylist" }
            ]),
            true,
            JSON.stringify({
                "lat": 41.3256,
                "lng": 69.2285,
                "address": "Toshkent, Shayxontohur tumani, Maxfiy manzil"
            }),
            true,
            true,
            'Maxfiy hashamatli salon. Faqat VIP mijozlar uchun.',
            'Частный роскошный салон. Только для VIP клиентов.',
            'Private luxury salon. VIP clients only.',
            'Toshkent, Shayxontohur tumani, Maxfiy manzil',
            'Ташкент, Шайхантахурский район, Частный адрес',
            'Tashkent, Shaykhantakhur district, Private address'
        ]);
        console.log(`   🔒 ${salon3Result.rows[0].salon_name} yaratildi (ID: ${salon3Result.rows[0].id}, Private: true)`);

        console.log('\n👥 ADMINLAR YARATISH...\n');

        // Adminlar yaratish
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const salons = [salon1Result.rows[0], salon2Result.rows[0], salon3Result.rows[0]];
        
        for (const salon of salons) {
            const adminUsername = `admin_${salon.salon_name.toLowerCase().replace(/\s+/g, '_')}`;
            const adminEmail = `${adminUsername}@freya.uz`;
            
            const adminResult = await client.query(`
                INSERT INTO admins (salon_id, username, email, password, full_name, phone)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, username
            `, [
                salon.id,
                adminUsername,
                adminEmail,
                hashedPassword,
                `${salon.salon_name} Administrator`,
                '+998901234567'
            ]);
            
            console.log(`   ✅ ${salon.salon_name} uchun admin yaratildi: ${adminResult.rows[0].username}`);
        }

        console.log('\n👨‍💼 EMPLOYEELAR YARATISH...\n');

        // Employee ma'lumotlari
        const employeeData = [
            // Beauty Palace employees
            [
                { name: 'Malika Karimova', phone: '+998901111111', waiting: true },
                { name: 'Gulnoza Rahimova', phone: '+998901111112', waiting: false },
                { name: 'Sevara Toshmatova', phone: '+998901111113', waiting: false },
                { name: 'Nigora Alimova', phone: '+998901111114', waiting: false }
            ],
            // Elite Style employees
            [
                { name: 'Jasur Abdullayev', phone: '+998901111121', waiting: true },
                { name: 'Bobur Karimov', phone: '+998901111122', waiting: false },
                { name: 'Sardor Rahmonov', phone: '+998901111123', waiting: false },
                { name: 'Akmal Tursunov', phone: '+998901111124', waiting: false }
            ],
            // Private Luxury employees
            [
                { name: 'Malika Nazarova', phone: '+998901111131', waiting: true },
                { name: 'Feruza Yusupova', phone: '+998901111132', waiting: false },
                { name: 'Zarina Qodirova', phone: '+998901111133', waiting: false },
                { name: 'Gulnora Hasanova', phone: '+998901111134', waiting: false }
            ]
        ];

        const employeePassword = await bcrypt.hash('employee123', 10);

        for (let i = 0; i < salons.length; i++) {
            const salon = salons[i];
            const employees = employeeData[i];
            
            console.log(`   🏢 ${salon.salon_name} uchun employeelar:`);
            
            for (const emp of employees) {
                const empResult = await client.query(`
                    INSERT INTO employees (
                        salon_id, employee_name, employee_phone, employee_password,
                        employee_description, employee_rating, is_waiting, is_active
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id, employee_name, is_waiting
                `, [
                    salon.id,
                    emp.name,
                    emp.phone,
                    employeePassword,
                    `Professional ${emp.name}`,
                    4.5,
                    emp.waiting,
                    true
                ]);
                
                const waitingIcon = emp.waiting ? '⏳' : '✅';
                console.log(`      ${waitingIcon} ${empResult.rows[0].employee_name} yaratildi (ID: ${empResult.rows[0].id}, Waiting: ${empResult.rows[0].is_waiting})`);
            }
        }

        console.log('\n📊 YAKUNIY NATIJALAR:');
        console.log('✅ Yaratildi:');
        console.log('   - 3 ta salon');
        console.log('   - 3 ta admin');
        console.log('   - 12 ta employee');
        console.log('   - 2 ta public salon');
        console.log('   - 1 ta private salon');
        console.log('   - Har bir salonda 4 ta employee (1 tasi waiting=true)');

        console.log('\n🔑 LOGIN MA\'LUMOTLARI:');
        console.log('\nAdminlar:');
        console.log('   Beauty Palace:');
        console.log('     Username: admin_beauty_palace');
        console.log('     Password: admin123');
        console.log('   Elite Style:');
        console.log('     Username: admin_elite_style');
        console.log('     Password: admin123');
        console.log('   Private Luxury Salon:');
        console.log('     Username: admin_private_luxury_salon');
        console.log('     Password: admin123');

        console.log('\nEmployeelar:');
        console.log('   Barcha employeelar uchun parol: employee123');
        console.log('   Login uchun telefon raqamlarini ishlating');

        console.log('\n🎉 Heroku PostgreSQL ga na\'muna ma\'lumotlar muvaffaqiyatli qo\'shildi!');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
        process.exit(0);
    }
}

addHerokuSampleData();