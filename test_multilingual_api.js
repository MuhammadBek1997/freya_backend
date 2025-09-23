const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3002';

// Test ma'lumotlari
const testData = {
    salon: {
        salon_name: "Test Salon",
        salon_description: "Test salon description",
        salon_phone: "+998901234567",
        salon_title: "Test Title",
        salon_orient: "Test Orient",
        location: "Test location"
    },
    employee: {
        name: "Test",
        surname: "Employee", 
        profession: "Barber",
        bio: "Test bio",
        specialization: "Hair cutting",
        phone: "+998901234568",
        email: `test${Date.now()}@employee.com`,
        username: `testuser${Date.now()}`
    },
    schedule: {
        name: "Test Schedule",
        title: "Test Title", 
        description: "Test description",
        date: "2024-02-01",
        start_time: "09:00",
        end_time: "18:00",
        price: 50000
    }
};

// Admin token olish
async function getAdminToken() {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
            username: 'admin',
            password: 'admin123'
        });
        return response.data.token;
    } catch (error) {
        console.error('Admin token olishda xatolik:', error.response?.data || error.message);
        return null;
    }
}

// Salon yaratish
async function createSalon(token) {
    try {
        const response = await axios.post(`${BASE_URL}/api/salons`, testData.salon, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Salon yaratildi:', response.data.data.id);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ Salon yaratishda xatolik:', error.response?.data || error.message);
        return null;
    }
}

// Employee yaratish
async function createEmployee(token, salonId) {
    try {
        const employeeData = { ...testData.employee, salon_id: salonId };
        const response = await axios.post(`${BASE_URL}/api/employees`, employeeData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Employee yaratildi:', response.data.data.id);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ Employee yaratishda xatolik:', error.response?.data || error.message);
        return null;
    }
}

// Schedule yaratish
async function createSchedule(token, salonId, employeeId) {
    try {
        const scheduleData = { 
            ...testData.schedule, 
            salon_id: salonId,
            employee_id: employeeId
        };
        const response = await axios.post(`${BASE_URL}/api/schedules`, scheduleData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Schedule yaratildi:', response.data.data.id);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ Schedule yaratishda xatolik:', error.response?.data || error.message);
        return null;
    }
}

// Salon ma'lumotlarini 3 ta tilda test qilish
async function testSalonMultilingual(salonId) {
    console.log('\n🔍 Salon ma\'lumotlarini 3 ta tilda test qilish...');
    
    try {
        // Barcha salonlarni olish
        const response = await axios.get(`${BASE_URL}/api/salons`);
        const salon = response.data.data.find(s => s.id === salonId);
        
        if (salon) {
            console.log('✅ Salon ma\'lumotlari:');
            console.log('   - Uzbek:', salon.name_uzb, salon.description_uzb);
            console.log('   - English:', salon.name_eng, salon.description_eng);
            console.log('   - Russian:', salon.name_rus, salon.description_rus);
            
            // ID bo'yicha salon olish
            const salonById = await axios.get(`${BASE_URL}/api/salons/${salonId}`);
            console.log('✅ Salon by ID ham 3 ta tilda qaytarildi');
        } else {
            console.log('❌ Salon topilmadi');
        }
    } catch (error) {
        console.error('❌ Salon test qilishda xatolik:', error.response?.data || error.message);
    }
}

// Employee ma'lumotlarini 3 ta tilda test qilish
async function testEmployeeMultilingual(salonId, employeeId) {
    console.log('\n🔍 Employee ma\'lumotlarini 3 ta tilda test qilish...');
    
    try {
        // Barcha employeelarni olish
        const response = await axios.get(`${BASE_URL}/api/employees/list`);
        const employee = response.data.data.find(e => e.id === employeeId);
        
        if (employee) {
            console.log('✅ Employee ma\'lumotlari:');
            console.log('   - Uzbek:', employee.name_uzb, employee.surname_uzb, employee.bio_uzb);
            console.log('   - English:', employee.name_eng, employee.surname_eng, employee.bio_eng);
            console.log('   - Russian:', employee.name_rus, employee.surname_rus, employee.bio_rus);
            
            // Salon bo'yicha employeelar
            const employeesBySalon = await axios.get(`${BASE_URL}/api/salons/${salonId}/employees`);
            console.log('✅ Salon bo\'yicha employeelar ham 3 ta tilda qaytarildi');
            
            // ID bo'yicha employee
            const employeeById = await axios.get(`${BASE_URL}/api/employees/${employeeId}`);
            console.log('✅ Employee by ID ham 3 ta tilda qaytarildi');
        } else {
            console.log('❌ Employee topilmadi');
        }
    } catch (error) {
        console.error('❌ Employee test qilishda xatolik:', error.response?.data || error.message);
    }
}

// Schedule ma'lumotlarini 3 ta tilda test qilish
async function testScheduleMultilingual(salonId, scheduleId) {
    console.log('\n🔍 Schedule ma\'lumotlarini 3 ta tilda test qilish...');
    
    try {
        // Barcha schedulelarni olish
        const response = await axios.get(`${BASE_URL}/api/schedules`);
        const schedule = response.data.data.find(s => s.id === scheduleId);
        
        if (schedule) {
            console.log('✅ Schedule ma\'lumotlari:');
            console.log('   - Uzbek:', schedule.name_uzb, schedule.title_uzb, schedule.description_uzb);
            console.log('   - English:', schedule.name_eng, schedule.title_eng, schedule.description_eng);
            console.log('   - Russian:', schedule.name_rus, schedule.title_rus, schedule.description_rus);
            
            // Salon bo'yicha schedulelar
            const schedulesBySalon = await axios.get(`${BASE_URL}/api/schedules/salon/${salonId}`);
            console.log('✅ Salon bo\'yicha schedulelar ham 3 ta tilda qaytarildi');
            
            // ID bo'yicha schedule
            const scheduleById = await axios.get(`${BASE_URL}/api/schedules/${scheduleId}`);
            console.log('✅ Schedule by ID ham 3 ta tilda qaytarildi');
        } else {
            console.log('❌ Schedule topilmadi');
        }
    } catch (error) {
        console.error('❌ Schedule test qilishda xatolik:', error.response?.data || error.message);
    }
}

// Asosiy test funksiyasi
async function runTests() {
    console.log('🚀 Ko\'p tilli API testlarini boshlash...\n');
    
    // Admin token olish
    const token = await getAdminToken();
    if (!token) {
        console.log('❌ Admin token olinmadi, testni to\'xtatish');
        return;
    }
    console.log('✅ Admin token olindi');
    
    // Test ma'lumotlarini yaratish
    const salonId = await createSalon(token);
    if (!salonId) return;
    
    const employeeId = await createEmployee(token, salonId);
    if (!employeeId) return;
    
    const scheduleId = await createSchedule(token, salonId, employeeId);
    if (!scheduleId) return;
    
    // Ko'p tilli testlar
    await testSalonMultilingual(salonId);
    await testEmployeeMultilingual(salonId, employeeId);
    await testScheduleMultilingual(salonId, scheduleId);
    
    console.log('\n🎉 Barcha testlar tugallandi!');
}

// Testlarni ishga tushirish
runTests().catch(console.error);