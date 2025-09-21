const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function addSampleData() {
    try {
        console.log('🚀 Na\'muna ma\'lumotlar qo\'shish boshlandi...\n');

        // 1. Avval mavjud ma'lumotlarni tekshirish
        const existingSalons = await pool.query('SELECT COUNT(*) FROM salons');
        const existingEmployees = await pool.query('SELECT COUNT(*) FROM employees');
        const existingAdmins = await pool.query('SELECT COUNT(*) FROM admins');

        console.log(`📊 Mavjud ma'lumotlar:`);
        console.log(`   - Salonlar: ${existingSalons.rows[0].count}`);
        console.log(`   - Employeelar: ${existingEmployees.rows[0].count}`);
        console.log(`   - Adminlar: ${existingAdmins.rows[0].count}\n`);

        // 2. Superadmin mavjudligini tekshirish
        const superadminCheck = await pool.query('SELECT id FROM admins WHERE role = $1', ['superadmin']);
        let superadminId;
        
        if (superadminCheck.rows.length === 0) {
            console.log('⚠️  Superadmin topilmadi, yangi superadmin yaratilmoqda...');
            const hashedPassword = await bcrypt.hash('superadmin123', 10);
            const superadminResult = await pool.query(`
                INSERT INTO admins (username, password_hash, role, full_name, email)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `, ['superadmin', hashedPassword, 'superadmin', 'Super Administrator', 'superadmin@freya.uz']);
            superadminId = superadminResult.rows[0].id;
            console.log(`✅ Superadmin yaratildi (ID: ${superadminId})\n`);
        } else {
            superadminId = superadminCheck.rows[0].id;
            console.log(`✅ Superadmin mavjud (ID: ${superadminId})\n`);
        }

        // 3. Salonlar yaratish
        console.log('🏢 Salonlar yaratilmoqda...');
        
        const salons = [
            {
                salon_name: 'Beauty Palace',
                salon_description: 'Zamonaviy go\'zallik saloni. Professional xizmatlar va yuqori sifat.',
                salon_phone: '+998712345678',
                salon_instagram: '@beautypalace_uz',
                private_salon: false,
                salon_rating: 4.5,
                location: { address: 'Toshkent, Yunusobod tumani, Amir Temur ko\'chasi 15', lat: 41.2995, lng: 69.2401 }
            },
            {
                salon_name: 'Elite Style',
                salon_description: 'Eksklyuziv stilistik xizmatlar. VIP mijozlar uchun maxsus yondashuv.',
                salon_phone: '+998712345679',
                salon_instagram: '@elitestyle_uz',
                private_salon: false,
                salon_rating: 4.8,
                location: { address: 'Toshkent, Mirzo Ulug\'bek tumani, Buyuk Ipak Yo\'li 45', lat: 41.3111, lng: 69.2797 }
            },
            {
                salon_name: 'Private Luxury Salon',
                salon_description: 'Shaxsiy salon. Faqat maxsus mijozlar uchun.',
                salon_phone: '+998712345680',
                salon_instagram: '@privateluxury_uz',
                private_salon: true,
                salon_rating: 4.9,
                location: { address: 'Toshkent, Shayxontohur tumani, Navoi ko\'chasi 78', lat: 41.3193, lng: 69.2684 }
            }
        ];

        const createdSalons = [];
        for (let i = 0; i < salons.length; i++) {
            const salon = salons[i];
            const result = await pool.query(`
                INSERT INTO salons (salon_name, salon_description, salon_phone, salon_instagram, private_salon, salon_rating, location)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [salon.salon_name, salon.salon_description, salon.salon_phone, salon.salon_instagram, 
                salon.private_salon, salon.salon_rating, JSON.stringify(salon.location)]);
            
            createdSalons.push(result.rows[0]);
            console.log(`   ✅ ${salon.salon_name} yaratildi (ID: ${result.rows[0].id}, Private: ${salon.private_salon})`);
        }

        console.log(`\n👥 Adminlar yaratilmoqda...`);

        // 4. Har bir salon uchun admin yaratish (private salon uchun admin/employee bitta odam)
        const createdAdmins = [];
        for (let i = 0; i < createdSalons.length; i++) {
            const salon = createdSalons[i];
            const username = `admin_${salon.salon_name.toLowerCase().replace(/\s+/g, '_')}`;
            
            // Mavjud adminni tekshirish
            const existingAdmin = await pool.query(`
                SELECT * FROM admins WHERE username = $1
            `, [username]);
            
            let admin;
            if (existingAdmin.rows.length > 0) {
                admin = existingAdmin.rows[0];
                console.log(`   ⚠️  ${salon.salon_name} admini allaqachon mavjud (ID: ${admin.id})`);
            } else {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                
                const adminResult = await pool.query(`
                    INSERT INTO admins (username, password_hash, role, full_name, email)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `, [
                    username,
                    hashedPassword,
                    'admin',
                    `${salon.salon_name} Administrator`,
                    `admin@${salon.salon_name.toLowerCase().replace(/\s+/g, '')}.uz`
                ]);
                
                admin = adminResult.rows[0];
                console.log(`   ✅ ${salon.salon_name} admini yaratildi (ID: ${admin.id})`);
            }
            
            createdAdmins.push(admin);
        }

        console.log(`\n👨‍💼 Employeelar yaratilmoqda...`);

        // 5. Har bir salon uchun 4 ta employee yaratish
        const employeeNames = [
            ['Aziza Karimova', 'Dilnoza Rahimova', 'Sevara Toshmatova', 'Nigora Alimova'],
            ['Jasur Abdullayev', 'Bobur Karimov', 'Sardor Rahmonov', 'Akmal Tursunov'],
            ['Malika Nazarova', 'Feruza Yusupova', 'Zarina Qodirova', 'Gulnora Hasanova']
        ];

        const specialties = [
            'Soch kesish va styling',
            'Manikür va pedikür',
            'Kosmetologiya',
            'Massaj terapiyasi',
            'Kirpik extension',
            'Permanent makeup',
            'Facial tozalash',
            'Eyebrow shaping'
        ];

        let totalEmployees = 0;
        for (let salonIndex = 0; salonIndex < createdSalons.length; salonIndex++) {
            const salon = createdSalons[salonIndex];
            const admin = createdAdmins[salonIndex];
            
            console.log(`\n   🏢 ${salon.salon_name} uchun employeelar:`);
            
            for (let empIndex = 0; empIndex < 4; empIndex++) {
                const isWaiting = empIndex === 0; // Birinchi employee waiting=true
                const email = `${employeeNames[salonIndex][empIndex].toLowerCase().replace(/\s+/g, '.')}@${salon.salon_name.toLowerCase().replace(/\s+/g, '')}.uz`;
                
                // Mavjud employeeni tekshirish
                const existingEmployee = await pool.query(`
                    SELECT * FROM employees WHERE email = $1
                `, [email]);
                
                let employee;
                if (existingEmployee.rows.length > 0) {
                    employee = existingEmployee.rows[0];
                    console.log(`      ⚠️  ${employee.name} ${employee.surname} allaqachon mavjud (ID: ${employee.id})`);
                } else {
                    const hashedPassword = await bcrypt.hash('employee123', 10);
                    
                    // Private salon uchun birinchi employee admin ham bo'ladi
                    const isAdminEmployee = salon.private_salon && empIndex === 0;
                    
                    const employeeResult = await pool.query(`
                        INSERT INTO employees (name, surname, phone, email, password, salon_id, is_waiting)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING *
                    `, [
                        employeeNames[salonIndex][empIndex].split(' ')[0],
                        employeeNames[salonIndex][empIndex].split(' ')[1] || '',
                        `+99871234${String(salonIndex * 4 + empIndex + 1).padStart(4, '0')}`,
                        email,
                        hashedPassword,
                        salon.id,
                        isWaiting
                    ]);
                    
                    employee = employeeResult.rows[0];
                    console.log(`      ${isWaiting ? '⏳' : '✅'} ${employee.name} ${employee.surname} yaratildi (ID: ${employee.id}, Waiting: ${isWaiting}${salon.private_salon && empIndex === 0 ? ', Admin ham' : ''})`);
                }
                
                totalEmployees++;
                
                // Private salon uchun birinchi employee admin rolini ham oladi
                if (salon.private_salon && empIndex === 0) {
                    console.log(`         🔑 Bu employee admin rolini ham bajaradi`);
                }
            }
        }

        console.log(`\n📊 YAKUNIY NATIJALAR:`);
        console.log(`✅ Yaratildi:`);
        console.log(`   - ${createdSalons.length} ta salon`);
        console.log(`   - ${createdAdmins.length} ta admin`);
        console.log(`   - ${totalEmployees} ta employee`);
        console.log(`   - ${createdSalons.filter(s => !s.private_salon).length} ta public salon`);
        console.log(`   - ${createdSalons.filter(s => s.private_salon).length} ta private salon`);
        console.log(`   - Har bir salonda 4 ta employee (1 tasi waiting=true)`);
        console.log(`   - Private salonda admin va employee bitta odam`);

        console.log(`\n🔐 LOGIN MA'LUMOTLARI:`);
        console.log(`\nSuperadmin:`);
        console.log(`   Username: superadmin`);
        console.log(`   Password: superadmin123`);
        
        console.log(`\nAdminlar:`);
        createdAdmins.forEach((admin, index) => {
            console.log(`   ${createdSalons[index].salon_name}:`);
            console.log(`     Username: ${admin.username}`);
            console.log(`     Password: admin123`);
        });
        
        console.log(`\nEmployeelar:`);
        console.log(`   Barcha employeelar uchun parol: employee123`);
        console.log(`   Login uchun telefon raqamlarini ishlating`);

        console.log(`\n🎉 Na'muna ma'lumotlar muvaffaqiyatli qo'shildi!`);

    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
    }
}

// Script ishga tushirish
if (require.main === module) {
    addSampleData();
}

module.exports = { addSampleData };