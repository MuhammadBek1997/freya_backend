const axios = require('axios');

async function testSalonTypes() {
    const ports = [3013, 3000, 5000, 8000];
    
    for (const port of ports) {
        try {
            console.log(`🔍 Testing port ${port}...`);
            
            // First test if server is running
            const healthResponse = await axios.get(`http://localhost:${port}/api/health`, {
                timeout: 2000
            });
            
            console.log(`✅ Server running on port ${port}`);
            
            // Now test salons endpoint
            const response = await axios.get(`http://localhost:${port}/api/salons`, {
                params: {
                    current_language: 'en',
                    page: 1,
                    limit: 10
                },
                timeout: 5000
            });
            
            if (response.data && response.data.salons) {
                console.log('✅ Salons API response received successfully');
                console.log(`📊 Found ${response.data.salons.length} salons`);
                
                const allTypes = [];
                
                response.data.salons.forEach((salon, index) => {
                    console.log(`\n🏪 Salon ${index + 1}: ${salon.salon_name_en || salon.salon_name}`);
                    
                    if (salon.salon_types && Array.isArray(salon.salon_types)) {
                        console.log(`   Types: ${salon.salon_types.map(t => t.type).join(', ')}`);
                        
                        salon.salon_types.forEach(type => {
                            if (type.type && !allTypes.includes(type.type)) {
                                allTypes.push(type.type);
                            }
                        });
                    } else {
                        console.log('   Types: No types found');
                    }
                });
                
                console.log('\n📋 All unique salon types found:');
                allTypes.forEach(type => console.log(`  - ${type}`));
                
                // Check for Russian characters
                const russianTypes = allTypes.filter(type => /[а-яё]/i.test(type));
                
                if (russianTypes.length > 0) {
                    console.log('\n❌ Russian types still found:');
                    russianTypes.forEach(type => console.log(`  - ${type}`));
                } else {
                    console.log('\n✅ All salon types are now in English!');
                }
                
                return; // Success, exit function
                
            } else {
                console.log('❌ No salon data received from API');
            }
            
        } catch (error) {
            console.log(`❌ Port ${port} not accessible: ${error.message}`);
        }
    }
    
    console.log('\n❌ Could not connect to any server port');
}

testSalonTypes();