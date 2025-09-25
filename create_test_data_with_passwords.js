const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

// Parollarni saqlash uchun
const passwords = {
    superadmin: 'superadmin123',
    admins: [],
    employees: [],
    users: []
};

async function clearAllData() {
    console.log('🗑️ Barcha ma\'lumotlarni o\'chirish...');
    
    try {
        // Barcha jadvallarni tozalash (PostgreSQL uchun)
        await pool.query('TRUNCATE TABLE appointments CASCADE');
        await pool.query('TRUNCATE TABLE schedules CASCADE');
        await pool.query('TRUNCATE TABLE employee_comments CASCADE');
        await pool.query('TRUNCATE TABLE employee_posts CASCADE');
        await pool.query('TRUNCATE TABLE employee_translations CASCADE');
        await pool.query('TRUNCATE TABLE employees CASCADE');
        await pool.query('TRUNCATE TABLE salon_translations CASCADE');
        await pool.query('TRUNCATE TABLE salons CASCADE');
        await pool.query('TRUNCATE TABLE messages CASCADE');
        await pool.query('TRUNCATE TABLE user_chats CASCADE');
        await pool.query('TRUNCATE TABLE users CASCADE');
        await pool.query('TRUNCATE TABLE admins CASCADE');
        
        console.log('✅ Barcha ma\'lumotlar o\'chirildi');
    } catch (error) {
        console.error('❌ Ma\'lumotlarni o\'chirishda xatolik:', error);
        throw error;
    }
}

async function createSuperAdmin() {
    console.log('👑 Superadmin yaratish...');
    
    const hashedPassword = await bcrypt.hash(passwords.superadmin, 10);
    
    await pool.query(`
        INSERT INTO admins (phone, password, role, username, full_name, email)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, ['+998901234567', hashedPassword, 'super_admin', 'superadmin', 'Super Admin', 'superadmin@freya.uz']);
    
    console.log('✅ Superadmin yaratildi');
}

async function createSalons() {
    console.log('🏢 6ta salon yaratish...');
    
    const salons = [
        // Private salonlar
        {
            name: 'Luxury Beauty Private',
            phone: '+998901111111',
            instagram: '@luxury_beauty_private',
            description: 'Eksklyuziv go\'zallik saloni',
            type: 'private',
            latitude: 41.2995,
            longitude: 69.2401,
            address: 'Toshkent, Chilonzor tumani'
        },
        {
            name: 'Elite Style Private',
            phone: '+998901111112',
            instagram: '@elite_style_private',
            description: 'Premium uslub saloni',
            type: 'private',
            latitude: 41.3111,
            longitude: 69.2797,
            address: 'Toshkent, Yunusobod tumani'
        },
        // Corporative salonlar
        {
            name: 'Beauty Corp Center',
            phone: '+998902222221',
            instagram: '@beauty_corp_center',
            description: 'Korporativ go\'zallik markazi',
            type: 'corporative',
            latitude: 41.2856,
            longitude: 69.2034,
            address: 'Toshkent, Mirobod tumani'
        },
        {
            name: 'Style Corporate Hub',
            phone: '+998902222222',
            instagram: '@style_corporate_hub',
            description: 'Korporativ uslub markazi',
            type: 'corporative',
            latitude: 41.3264,
            longitude: 69.2285,
            address: 'Toshkent, Shayxontohur tumani'
        },
        {
            name: 'Glamour Business',
            phone: '+998902222223',
            instagram: '@glamour_business',
            description: 'Biznes-klass go\'zallik saloni',
            type: 'corporative',
            latitude: 41.2646,
            longitude: 69.2163,
            address: 'Toshkent, Yakkasaroy tumani'
        },
        {
            name: 'Professional Beauty',
            phone: '+998902222224',
            instagram: '@professional_beauty',
            description: 'Professional go\'zallik xizmatlari',
            type: 'corporative',
            latitude: 41.3475,
            longitude: 69.2896,
            address: 'Toshkent, Olmazor tumani'
        }
    ];
    
    const salonIds = [];
    
    for (let i = 0; i < salons.length; i++) {
        const salon = salons[i];
        
        // Salon yaratish
        const salonResult = await pool.query(`
            INSERT INTO salons (salon_name, salon_phone, salon_instagram, salon_description, private_salon, location, address_uz)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `, [salon.name, salon.phone, salon.instagram, salon.description, salon.type === 'private', 
            JSON.stringify({lat: salon.latitude, long: salon.longitude}), salon.address]);
        
        const salonId = salonResult.rows[0].id;
        salonIds.push(salonId);
        
        // Admin yaratish
        const adminPassword = `admin${i + 1}123`;
        passwords.admins.push({
            phone: salon.phone,
            password: adminPassword,
            salon: salon.name
        });
        
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
        
        await pool.query(`
            INSERT INTO admins (phone, password, role, username, full_name, salon_id, email)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [salon.phone, hashedAdminPassword, 'salon_admin', `admin${i + 1}`, `Admin ${i + 1}`, salonId, `admin${i + 1}@freya.uz`]);
        
        console.log(`✅ ${salon.name} saloni yaratildi (${salon.type})`);
    }
    
    return salonIds;
}

async function createEmployees(salonIds) {
    console.log('👥 Corporative salonlarda hodimlar yaratish...');
    
    // Faqat corporative salonlar uchun (oxirgi 4ta salon)
    const corporativeSalonIds = salonIds.slice(2);
    
    for (let salonIndex = 0; salonIndex < corporativeSalonIds.length; salonIndex++) {
        const salonId = corporativeSalonIds[salonIndex];
        
        for (let empIndex = 1; empIndex <= 4; empIndex++) {
            const employeePassword = `emp${salonIndex + 1}_${empIndex}123`;
            const phone = `+99890333${salonIndex + 1}${empIndex.toString().padStart(2, '0')}`;
            
            passwords.employees.push({
                phone: phone,
                password: employeePassword,
                salon: `Salon ${salonIndex + 3}`,
                name: `Employee${salonIndex + 1}_${empIndex}`
            });
            
            const hashedPassword = await bcrypt.hash(employeePassword, 10);
            
            await pool.query(`
                INSERT INTO employees (salon_id, employee_name, employee_phone, employee_password, profession, experience_years, rating, email)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                salonId,
                `Employee${salonIndex + 1}_${empIndex}`,
                phone,
                hashedPassword,
                ['Soch olish', 'Manikur', 'Pedikur', 'Kosmetolog'][empIndex - 1],
                Math.floor(Math.random() * 10) + 1,
                (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0 rating
                `emp${salonIndex + 1}_${empIndex}@freya.uz`
            ]);
        }
        
        console.log(`✅ Salon ${salonIndex + 3}da 4ta hodim yaratildi`);
    }
}

async function createSchedules() {
    console.log('📅 Hodimlar uchun schedule yaratish...');
    
    const employees = await pool.query('SELECT id, salon_id FROM employees');
    
    const timeSlots = [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '16:00' },
        { start: '16:00', end: '19:00' },
        { start: '19:00', end: '22:00' }
    ];
    
    for (const employee of employees.rows) {
        for (let i = 0; i < 4; i++) {
            const dayOfWeek = (i % 7) + 1; // 1-7 (Monday-Sunday)
            const timeSlot = timeSlots[i];
            
            await pool.query(`
                INSERT INTO schedules (employee_id, day_of_week, start_time, end_time)
                VALUES ($1, $2, $3, $4)
            `, [employee.id, dayOfWeek, timeSlot.start, timeSlot.end]);
        }
    }
    
    console.log('✅ Barcha hodimlar uchun schedule yaratildi');
}

async function createUsers() {
    console.log('👤 10ta user yaratish...');
    
    for (let i = 1; i <= 10; i++) {
        const userPassword = `user${i}123`;
        const phone = `+99890444${i.toString().padStart(3, '0')}`;
        
        passwords.users.push({
            phone: phone,
            password: userPassword,
            name: `User${i}`
        });
        
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        
        await pool.query(`
            INSERT INTO users (phone, password_hash, full_name, first_name, last_name, registration_step, is_verified, latitude, longitude, address, email)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
            phone,
            hashedPassword,
            `User${i} Surname${i}`,
            `User${i}`,
            `Surname${i}`,
            2, // To'liq ro'yxatdan o'tgan
            true, // Telefon tasdiqlangan
            41.2995 + (Math.random() - 0.5) * 0.1, // Toshkent atrofida
            69.2401 + (Math.random() - 0.5) * 0.1,
            `Toshkent, User${i} manzili`,
            `user${i}@freya.uz`
        ]);
    }
    
    console.log('✅ 10ta user yaratildi');
}

function displayPasswords() {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 BARCHA PAROLLAR');
    console.log('='.repeat(60));
    
    console.log('\n👑 SUPERADMIN:');
    console.log(`Telefon: +998901234567`);
    console.log(`Parol: ${passwords.superadmin}`);
    
    console.log('\n🏢 SALON ADMINLARI:');
    passwords.admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.salon}`);
        console.log(`   Telefon: ${admin.phone}`);
        console.log(`   Parol: ${admin.password}`);
    });
    
    console.log('\n👥 HODIMLAR:');
    passwords.employees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name} (${emp.salon})`);
        console.log(`   Telefon: ${emp.phone}`);
        console.log(`   Parol: ${emp.password}`);
    });
    
    console.log('\n👤 USERLAR:');
    passwords.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Telefon: ${user.phone}`);
        console.log(`   Parol: ${user.password}`);
    });
    
    console.log('\n' + '='.repeat(60));
}

async function main() {
    try {
        console.log('🚀 Test ma\'lumotlarini yaratish boshlandi...\n');
        
        await clearAllData();
        await createSuperAdmin();
        const salonIds = await createSalons();
        await createEmployees(salonIds);
        await createSchedules();
        await createUsers();
        
        console.log('\n✅ Barcha test ma\'lumotlari muvaffaqiyatli yaratildi!');
        
        displayPasswords();
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
    } finally {
        await pool.end();
    }
}

main();