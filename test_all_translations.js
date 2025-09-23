const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://127.0.0.1:3000/api';

async function testAllTranslations() {
    try {
        console.log('🧪 BARCHA TARJIMALARNI TEST QILISH\n');

        const languages = ['uz', 'en', 'ru'];
        
        // 1. Salonlarni test qilish
        console.log('🏢 SALONLAR TESTI:');
        for (const lang of languages) {
            try {
                const response = await axios.get(`${BASE_URL}/salons`, {
                    headers: { 'Accept-Language': lang }
                });
                
                const salons = response.data.data;
                console.log(`\n${lang.toUpperCase()} tili (${salons.length} ta salon):`);
                
                if (salons.length > 0) {
                    const salon = salons[0];
                    console.log(`  - Salon nomi: ${salon[`salon_name_${lang}`] || salon.salon_name}`);
                    console.log(`  - Tavsif: ${salon[`salon_description_${lang}`] || salon.salon_description}`);
                    console.log(`  - Sarlavha: ${salon[`salon_title_${lang}`] || salon.salon_title}`);
                }
            } catch (error) {
                console.log(`  ❌ ${lang.toUpperCase()} xatolik: ${error.message}`);
            }
        }

        // 2. Xodimlarni test qilish
        console.log('\n\n👥 XODIMLAR TESTI:');
        for (const lang of languages) {
            try {
                const response = await axios.get(`${BASE_URL}/employees/list`, {
                    headers: { 'Accept-Language': lang }
                });
                
                const employees = response.data.data;
                console.log(`\n${lang.toUpperCase()} tili (${employees.length} ta xodim):`);
                
                if (employees.length > 0) {
                    const employee = employees[0];
                    console.log(`  - Ism: ${employee[`name_${lang}`] || employee.name}`);
                    console.log(`  - Familiya: ${employee[`surname_${lang}`] || employee.surname || 'N/A'}`);
                    console.log(`  - Kasb: ${employee[`profession_${lang}`] || employee.profession || 'N/A'}`);
                    console.log(`  - Bio: ${employee[`bio_${lang}`] || employee.bio || 'N/A'}`);
                }
            } catch (error) {
                console.log(`  ❌ ${lang.toUpperCase()} xatolik: ${error.message}`);
            }
        }

        // 3. Jadvallarni test qilish
        console.log('\n\n📅 JADVALLAR TESTI:');
        for (const lang of languages) {
            try {
                const response = await axios.get(`${BASE_URL}/schedules`, {
                    headers: { 'Accept-Language': lang }
                });
                
                const schedules = response.data.data;
                console.log(`\n${lang.toUpperCase()} tili (${schedules.length} ta jadval):`);
                
                if (schedules.length > 0) {
                    const schedule = schedules[0];
                    console.log(`  - Nom: ${schedule[`name_${lang}`] || schedule.name}`);
                    console.log(`  - Sarlavha: ${schedule[`title_${lang}`] || schedule.title}`);
                }
            } catch (error) {
                console.log(`  ❌ ${lang.toUpperCase()} xatolik: ${error.message}`);
            }
        }

        // 4. Bitta salonni batafsil test qilish
        console.log('\n\n🔍 BATAFSIL SALON TESTI:');
        try {
            const salonsResponse = await axios.get(`${BASE_URL}/salons`);
            const firstSalon = salonsResponse.data.data[0];
            
            if (firstSalon) {
                console.log(`\nSalon ID: ${firstSalon.id}`);
                
                for (const lang of languages) {
                    try {
                        const response = await axios.get(`${BASE_URL}/salons/${firstSalon.id}`, {
                            headers: { 'Accept-Language': lang }
                        });
                        
                        const salon = response.data.data;
                        console.log(`\n${lang.toUpperCase()} tili:`);
                        console.log(`  - Nom: ${salon[`salon_name_${lang}`] || salon.salon_name}`);
                        console.log(`  - Tavsif: ${salon[`salon_description_${lang}`] || salon.salon_description}`);
                        console.log(`  - Sarlavha: ${salon[`salon_title_${lang}`] || salon.salon_title}`);
                    } catch (error) {
                        console.log(`  ❌ ${lang.toUpperCase()} xatolik: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Batafsil test xatolik: ${error.message}`);
        }

        console.log('\n\n✅ BARCHA TESTLAR YAKUNLANDI!');
        
    } catch (error) {
        console.error('❌ Umumiy test xatolik:', error.message);
    }
}

testAllTranslations();