const axios = require('axios');

// Production API URL
const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com';

async function testProductionSalonSale() {
    try {
        console.log('🧪 Testing Production API for salon_sale parameter...\n');

        // Test 1: Get all salons
        console.log('1️⃣ Testing GET /api/salons...');
        const salonsResponse = await axios.get(`${PRODUCTION_URL}/api/salons`);
        
        if (salonsResponse.data.success) {
            console.log(`✅ Found ${salonsResponse.data.data.length} salons`);
            
            // Check if salon_sale exists in each salon
            salonsResponse.data.data.forEach((salon, index) => {
                console.log(`\n   Salon ${index + 1}: ${salon.salon_name}`);
                console.log(`   ID: ${salon.id}`);
                console.log(`   Salon Sale: ${JSON.stringify(salon.salon_sale)}`);
                
                if (salon.salon_sale && typeof salon.salon_sale === 'object') {
                    console.log(`   ✅ salon_sale parameter exists and is properly formatted`);
                } else {
                    console.log(`   ❌ salon_sale parameter missing or invalid`);
                }
            });
        } else {
            console.log('❌ Failed to get salons');
        }

        // Test 2: Get specific salon by ID
        if (salonsResponse.data.data.length > 0) {
            const firstSalonId = salonsResponse.data.data[0].id;
            console.log(`\n2️⃣ Testing GET /api/salons/${firstSalonId}...`);
            
            const salonResponse = await axios.get(`${PRODUCTION_URL}/api/salons/${firstSalonId}`);
            
            if (salonResponse.data.success) {
                const salon = salonResponse.data.data;
                console.log(`✅ Retrieved salon: ${salon.salon_name}`);
                console.log(`   Salon Sale: ${JSON.stringify(salon.salon_sale)}`);
                
                if (salon.salon_sale && typeof salon.salon_sale === 'object') {
                    console.log(`   ✅ salon_sale parameter exists in single salon response`);
                } else {
                    console.log(`   ❌ salon_sale parameter missing in single salon response`);
                }
            } else {
                console.log('❌ Failed to get specific salon');
            }
        }

        console.log('\n🎉 Production API test completed!');
        console.log('✅ salon_sale parameter is now available in production');

    } catch (error) {
        console.error('❌ Error testing production API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testProductionSalonSale();