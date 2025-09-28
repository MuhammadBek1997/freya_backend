const https = require('https');

function checkFinalAPI() {
    const url = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/salons';
    
    https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                
                console.log('🎯 API Javob Tekshiruvi:');
                console.log('='.repeat(50));
                
                if (response.data && response.data.length > 0) {
                    response.data.forEach((salon, index) => {
                        console.log(`\n${index + 1}. ${salon.name}:`);
                        console.log('   Salon Comfort:');
                        
                        const comfortNames = salon.salon_comfort.map(c => c.name);
                        
                        // kids mavjudligini tekshirish
                        const hasKids = comfortNames.includes('kids');
                        const hasAllow14 = comfortNames.includes('allow14');
                        const hasAllow16 = comfortNames.includes('allow16');
                        
                        console.log(`   - Comfort ro'yxati: ${comfortNames.join(', ')}`);
                        console.log(`   - Kids mavjud: ${hasKids ? '✅ HA' : '❌ YO\'Q'}`);
                        console.log(`   - Allow14 mavjud: ${hasAllow14 ? '❌ HA (muammo!)' : '✅ YO\'Q'}`);
                        console.log(`   - Allow16 mavjud: ${hasAllow16 ? '❌ HA (muammo!)' : '✅ YO\'Q'}`);
                    });
                    
                    console.log('\n' + '='.repeat(50));
                    console.log('📊 XULOSA:');
                    
                    const allSalons = response.data;
                    const salonsWithKids = allSalons.filter(s => s.salon_comfort.some(c => c.name === 'kids'));
                    const salonsWithAllow14 = allSalons.filter(s => s.salon_comfort.some(c => c.name === 'allow14'));
                    const salonsWithAllow16 = allSalons.filter(s => s.salon_comfort.some(c => c.name === 'allow16'));
                    
                    console.log(`- Jami salonlar: ${allSalons.length}`);
                    console.log(`- Kids bilan salonlar: ${salonsWithKids.length}`);
                    console.log(`- Allow14 bilan salonlar: ${salonsWithAllow14.length}`);
                    console.log(`- Allow16 bilan salonlar: ${salonsWithAllow16.length}`);
                    
                    if (salonsWithAllow14.length === 0 && salonsWithAllow16.length === 0 && salonsWithKids.length > 0) {
                        console.log('\n🎉 MUVAFFAQIYAT! Barcha o\'zgarishlar to\'g\'ri amalga oshirildi!');
                    } else {
                        console.log('\n⚠️ Hali ham muammolar mavjud!');
                    }
                } else {
                    console.log('❌ Ma\'lumotlar topilmadi');
                }
                
            } catch (error) {
                console.error('❌ JSON parse xatolik:', error.message);
            }
        });
        
    }).on('error', (error) => {
        console.error('❌ Request xatolik:', error.message);
    });
}

checkFinalAPI();