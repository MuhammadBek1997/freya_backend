const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

async function testAllAPIsMultilingual() {
    console.log('Barcha API\'larni ko\'p tilda test qilish...\n');
    
    const languages = ['uz', 'en', 'ru'];
    
    for (const lang of languages) {
        console.log(`\n=== ${lang.toUpperCase()} tilida test ===`);
        
        try {
            // Xodimlar API'sini test qilish
            console.log(`\n1. Xodimlar API'si (${lang}):`);
            const employeesResponse = await axios.get(`${BASE_URL}/employees/list?current_language=${lang}&limit=2`);
            console.log(`Status: ${employeesResponse.status}`);
            console.log(`Xodimlar soni: ${employeesResponse.data.data.length}`);
            if (employeesResponse.data.data.length > 0) {
                const employee = employeesResponse.data.data[0];
                console.log(`Birinchi xodim: ${employee[`name_${lang}`]} ${employee[`surname_${lang}`]} - ${employee[`profession_${lang}`]}`);
                console.log(`Salon: ${employee.salon_name}`);
            }
            
            // Jadvallar API'sini test qilish
            console.log(`\n2. Jadvallar API'si (${lang}):`);
            const schedulesResponse = await axios.get(`${BASE_URL}/schedules?current_language=${lang}&limit=2`);
            console.log(`Status: ${schedulesResponse.status}`);
            console.log(`Jadvallar soni: ${schedulesResponse.data.data.length}`);
            if (schedulesResponse.data.data.length > 0) {
                const schedule = schedulesResponse.data.data[0];
                console.log(`Birinchi jadval: ${schedule[`name_${lang}`]} - ${schedule[`title_${lang}`]}`);
                console.log(`Salon: ${schedule.salon_name}`);
                console.log(`Narx: ${schedule.price}`);
            }
            
            // Salonlar API'sini test qilish
            console.log(`\n3. Salonlar API'si (${lang}):`);
            const salonsResponse = await axios.get(`${BASE_URL}/salons?current_language=${lang}&limit=2`);
            console.log(`Status: ${salonsResponse.status}`);
            console.log(`Salonlar soni: ${salonsResponse.data.data.length}`);
            if (salonsResponse.data.data.length > 0) {
                const salon = salonsResponse.data.data[0];
                console.log(`Birinchi salon: ${salon[`salon_name_${lang}`] || salon.salon_name}`);
                console.log(`Manzil: ${salon[`address_${lang}`] || salon.address}`);
            }
            
        } catch (error) {
            console.error(`${lang} tilida xatolik:`, error.response?.status, error.response?.data || error.message);
        }
    }
    
    console.log('\n=== Test yakunlandi ===');
}

testAllAPIsMultilingual();