const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function recreate6Salons() {
    try {
        console.log('🔄 Recreating 6 salons with specified structure...\n');

        // 1. Delete all existing admins first (to avoid foreign key constraint)
        console.log('1. Deleting all existing admins...');
        const deleteAdminsResult = await pool.query('DELETE FROM admins');
        console.log(`✅ Deleted ${deleteAdminsResult.rowCount} existing admins`);

        // 2. Delete all existing salons
        console.log('2. Deleting all existing salons...');
        const deleteResult = await pool.query('DELETE FROM salons');
        console.log(`✅ Deleted ${deleteResult.rowCount} existing salons`);

        // 3. Create 6 new salons with the specified structure
        console.log('\n3. Creating 6 new salons...');

        const salonsData = [
            {
                name: "Yangi salon",
                description: "Salon haqida malumot",
                address: "Test manzil",
                phone: "+998901234567",
                email: null,
                working_hours: {},
                is_active: true,
                salon_types: [
                    { "type": "Салон красоты", "selected": true },
                    { "type": "Фитнес", "selected": false },
                    { "type": "Функциональные тренировки", "selected": false },
                    { "type": "Йога", "selected": false },
                    { "type": "Массаж", "selected": false }
                ],
                location: { "lat": 41, "long": 64 },
                salon_orient: { "lat": 41, "long": 64 },
                salon_comfort: [
                    { "name": "parking", "isActive": false },
                    { "name": "cafee", "isActive": false },
                    { "name": "onlyFemale", "isActive": false },
                    { "name": "water", "isActive": false },
                    { "name": "pets", "isActive": false },
                    { "name": "bath", "isActive": false },
                    { "name": "towel", "isActive": false },
                    { "name": "kids", "isActive": true }
                ],
                is_top: true,
                is_private: true,
                salon_name_uz: "Yangi salon",
                salon_name_en: "New Salon",
                salon_name_ru: "Новый салон",
                salon_description_uz: "Salon haqida malumot",
                salon_description_en: "Information about salon",
                salon_description_ru: "Информация о салоне",
                salon_title_uz: "Salon",
                salon_title_en: "Salon",
                salon_title_ru: "Салон",
                salon_payment: null,
                work_schedule: [],
                salon_additionals: [],
                salon_photos: []
            },
            {
                name: "Go'zallik saloni",
                description: "Professional go'zallik xizmatlari",
                address: "Toshkent, Amir Temur ko'chasi 15",
                phone: "+998901234568",
                email: "info@gozallik.uz",
                working_hours: {"monday": {"open": "09:00", "close": "18:00"}},
                is_active: true,
                salon_types: [
                    { "type": "Салон красоты", "selected": true },
                    { "type": "Фитнес", "selected": false },
                    { "type": "Функциональные тренировки", "selected": false },
                    { "type": "Йога", "selected": false },
                    { "type": "Массаж", "selected": true }
                ],
                location: { "lat": 41.2995, "long": 69.2401 },
                salon_orient: { "lat": 41.2995, "long": 69.2401 },
                salon_comfort: [
                    { "name": "parking", "isActive": true },
                    { "name": "cafee", "isActive": true },
                    { "name": "onlyFemale", "isActive": true },
                    { "name": "water", "isActive": true },
                    { "name": "pets", "isActive": false },
                    { "name": "bath", "isActive": false },
                    { "name": "towel", "isActive": true },
                    { "name": "kids", "isActive": true }
                ],
                is_top: false,
                is_private: false,
                salon_name_uz: "Go'zallik saloni",
                salon_name_en: "Beauty Salon",
                salon_name_ru: "Салон красоты",
                salon_description_uz: "Professional go'zallik xizmatlari",
                salon_description_en: "Professional beauty services",
                salon_description_ru: "Профессиональные услуги красоты",
                salon_title_uz: "Go'zallik",
                salon_title_en: "Beauty",
                salon_title_ru: "Красота",
                salon_payment: null,
                work_schedule: [],
                salon_additionals: [],
                salon_photos: []
            },
            {
                name: "Fitness Club Premium",
                description: "Zamonaviy fitnes markazi",
                address: "Toshkent, Mustaqillik ko'chasi 45",
                phone: "+998901234569",
                email: "contact@fitnesspremium.uz",
                working_hours: {"monday": {"open": "06:00", "close": "22:00"}},
                is_active: true,
                salon_types: [
                    { "type": "Салон красоты", "selected": false },
                    { "type": "Фитнес", "selected": true },
                    { "type": "Функциональные тренировки", "selected": true },
                    { "type": "Йога", "selected": true },
                    { "type": "Массаж", "selected": false }
                ],
                location: { "lat": 41.3111, "long": 69.2797 },
                salon_orient: { "lat": 41.3111, "long": 69.2797 },
                salon_comfort: [
                    { "name": "parking", "isActive": true },
                    { "name": "cafee", "isActive": true },
                    { "name": "onlyFemale", "isActive": false },
                    { "name": "water", "isActive": true },
                    { "name": "pets", "isActive": false },
                    { "name": "bath", "isActive": true },
                    { "name": "towel", "isActive": true },
                    { "name": "kids", "isActive": true }
                ],
                is_top: true,
                is_private: false,
                salon_name_uz: "Fitness Club Premium",
                salon_name_en: "Fitness Club Premium",
                salon_name_ru: "Фитнес Клуб Премиум",
                salon_description_uz: "Zamonaviy fitnes markazi",
                salon_description_en: "Modern fitness center",
                salon_description_ru: "Современный фитнес центр",
                salon_title_uz: "Fitnes",
                salon_title_en: "Fitness",
                salon_title_ru: "Фитнес",
                salon_payment: null,
                work_schedule: [],
                salon_additionals: [],
                salon_photos: []
            },
            {
                name: "Yoga Studio Harmony",
                description: "Tinchlik va muvozanat uchun yoga",
                address: "Toshkent, Bobur ko'chasi 23",
                phone: "+998901234570",
                email: "hello@yogaharmony.uz",
                working_hours: {"monday": {"open": "07:00", "close": "21:00"}},
                is_active: true,
                salon_types: [
                    { "type": "Салон красоты", "selected": false },
                    { "type": "Фитнес", "selected": false },
                    { "type": "Функциональные тренировки", "selected": false },
                    { "type": "Йога", "selected": true },
                    { "type": "Массаж", "selected": true }
                ],
                location: { "lat": 41.2856, "long": 69.2034 },
                salon_orient: { "lat": 41.2856, "long": 69.2034 },
                salon_comfort: [
                    { "name": "parking", "isActive": false },
                    { "name": "cafee", "isActive": false },
                    { "name": "onlyFemale", "isActive": true },
                    { "name": "water", "isActive": true },
                    { "name": "pets", "isActive": false },
                    { "name": "bath", "isActive": false },
                    { "name": "towel", "isActive": true },
                    { "name": "kids", "isActive": true }
                ],
                is_top: false,
                is_private: true,
                salon_name_uz: "Yoga Studio Harmony",
                salon_name_en: "Yoga Studio Harmony",
                salon_name_ru: "Йога Студия Гармония",
                salon_description_uz: "Tinchlik va muvozanat uchun yoga",
                salon_description_en: "Yoga for peace and balance",
                salon_description_ru: "Йога для покоя и баланса",
                salon_title_uz: "Yoga",
                salon_title_en: "Yoga",
                salon_title_ru: "Йога",
                salon_payment: null,
                work_schedule: [],
                salon_additionals: [],
                salon_photos: []
            },
            {
                name: "Spa & Wellness Center",
                description: "To'liq dam olish va tiklanish markazi",
                address: "Toshkent, Shota Rustaveli ko'chasi 67",
                phone: "+998901234571",
                email: "info@spawellness.uz",
                working_hours: {"monday": {"open": "10:00", "close": "20:00"}},
                is_active: true,
                salon_types: [
                    { "type": "Салон красоты", "selected": true },
                    { "type": "Фитнес", "selected": false },
                    { "type": "Функциональные тренировки", "selected": false },
                    { "type": "Йога", "selected": false },
                    { "type": "Массаж", "selected": true }
                ],
                location: { "lat": 41.3264, "long": 69.2285 },
                salon_orient: { "lat": 41.3264, "long": 69.2285 },
                salon_comfort: [
                    { "name": "parking", "isActive": true },
                    { "name": "cafee", "isActive": true },
                    { "name": "onlyFemale", "isActive": false },
                    { "name": "water", "isActive": true },
                    { "name": "pets", "isActive": false },
                    { "name": "bath", "isActive": true },
                    { "name": "towel", "isActive": true },
                    { "name": "kids", "isActive": true }
                ],
                is_top: true,
                is_private: false,
                salon_name_uz: "Spa & Wellness Center",
                salon_name_en: "Spa & Wellness Center",
                salon_name_ru: "Спа и Велнес Центр",
                salon_description_uz: "To'liq dam olish va tiklanish markazi",
                salon_description_en: "Complete relaxation and recovery center",
                salon_description_ru: "Полный центр отдыха и восстановления",
                salon_title_uz: "Spa",
                salon_title_en: "Spa",
                salon_title_ru: "Спа",
                salon_payment: null,
                work_schedule: [],
                salon_additionals: [],
                salon_photos: []
            },
            {
                name: "Elite Hair Studio",
                description: "Eksklyuziv soch uslublari",
                address: "Toshkent, Navoi ko'chasi 89",
                phone: "+998901234572",
                email: "studio@elitehair.uz",
                working_hours: {"monday": {"open": "09:00", "close": "19:00"}},
                is_active: true,
                salon_types: [
                    { "type": "Салон красоты", "selected": true },
                    { "type": "Фитнес", "selected": false },
                    { "type": "Функциональные тренировки", "selected": false },
                    { "type": "Йога", "selected": false },
                    { "type": "Массаж", "selected": false }
                ],
                location: { "lat": 41.2646, "long": 69.2163 },
                salon_orient: { "lat": 41.2646, "long": 69.2163 },
                salon_comfort: [
                    { "name": "parking", "isActive": true },
                    { "name": "cafee", "isActive": false },
                    { "name": "onlyFemale", "isActive": false },
                    { "name": "water", "isActive": true },
                    { "name": "pets", "isActive": false },
                    { "name": "bath", "isActive": false },
                    { "name": "towel", "isActive": false },
                    { "name": "kids", "isActive": true }
                ],
                is_top: false,
                is_private: true,
                salon_name_uz: "Elite Hair Studio",
                salon_name_en: "Elite Hair Studio",
                salon_name_ru: "Элитная Студия Волос",
                salon_description_uz: "Eksklyuziv soch uslublari",
                salon_description_en: "Exclusive hair styling",
                salon_description_ru: "Эксклюзивные прически",
                salon_title_uz: "Soch",
                salon_title_en: "Hair",
                salon_title_ru: "Волосы",
                salon_payment: null,
                work_schedule: [],
                salon_additionals: [],
                salon_photos: []
            }
        ];

        for (let i = 0; i < salonsData.length; i++) {
            const salon = salonsData[i];
            
            const insertResult = await pool.query(`
                INSERT INTO salons (
                    name, description, address, phone, email, working_hours, is_active,
                    salon_types, location, salon_orient, salon_comfort, is_top, is_private,
                    salon_name_uz, salon_name_en, salon_name_ru,
                    salon_description_uz, salon_description_en, salon_description_ru,
                    salon_title_uz, salon_title_en, salon_title_ru,
                    salon_payment, work_schedule, salon_additionals, salon_photos
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                ) RETURNING id, name
            `, [
                salon.name, salon.description, salon.address, salon.phone, salon.email,
                JSON.stringify(salon.working_hours), salon.is_active,
                JSON.stringify(salon.salon_types), JSON.stringify(salon.location),
                JSON.stringify(salon.salon_orient), JSON.stringify(salon.salon_comfort),
                salon.is_top, salon.is_private,
                salon.salon_name_uz, salon.salon_name_en, salon.salon_name_ru,
                salon.salon_description_uz, salon.salon_description_en, salon.salon_description_ru,
                salon.salon_title_uz, salon.salon_title_en, salon.salon_title_ru,
                JSON.stringify(salon.salon_payment), JSON.stringify(salon.work_schedule),
                JSON.stringify(salon.salon_additionals), JSON.stringify(salon.salon_photos)
            ]);

            console.log(`✅ Created salon ${i + 1}: ${insertResult.rows[0].name} (ID: ${insertResult.rows[0].id})`);
        }

        // 4. Verify the created salons
        console.log('\n4. Verifying created salons...');
        const verifyResult = await pool.query(`
            SELECT id, name, is_top, is_private,
                   salon_name_uz, salon_name_en, salon_name_ru,
                   salon_description_uz, salon_description_en, salon_description_ru
            FROM salons 
            ORDER BY created_at
        `);

        console.log(`\n📊 Summary:`);
        console.log(`- Total salons created: ${verifyResult.rows.length}`);
        console.log(`- Private salons: ${verifyResult.rows.filter(s => s.is_private).length}`);
        console.log(`- Corporate salons: ${verifyResult.rows.filter(s => !s.is_private).length}`);
        console.log(`- Top salons: ${verifyResult.rows.filter(s => s.is_top).length}`);

        console.table(verifyResult.rows.map(salon => ({
            name: salon.name,
            is_top: salon.is_top,
            is_private: salon.is_private,
            name_uz: salon.salon_name_uz,
            name_en: salon.salon_name_en,
            name_ru: salon.salon_name_ru
        })));

        console.log('\n✅ Successfully recreated 6 salons with specified structure!');

    } catch (error) {
        console.error('❌ Error recreating salons:', error);
    } finally {
        await pool.end();
    }
}

recreate6Salons();