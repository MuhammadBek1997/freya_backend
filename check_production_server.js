const axios = require('axios');

const PRODUCTION_URL = 'https://freya-backend-production.up.railway.app';

async function checkProductionServer() {
    console.log('🔍 Checking production server status...');
    console.log('🌐 Production URL:', PRODUCTION_URL);

    try {
        // Test 1: Basic connectivity
        console.log('\n📡 Testing basic connectivity...');
        
        try {
            const response = await axios.get(PRODUCTION_URL, {
                timeout: 10000,
                validateStatus: () => true
            });
            
            console.log(`✅ Server responded with status: ${response.status}`);
            console.log(`📋 Response headers:`, response.headers);
            console.log(`📄 Response data:`, JSON.stringify(response.data, null, 2));
            
        } catch (connectError) {
            console.log(`❌ Connection error: ${connectError.message}`);
            
            if (connectError.code === 'ENOTFOUND') {
                console.log('🚨 DNS resolution failed - the domain might not exist');
            } else if (connectError.code === 'ECONNREFUSED') {
                console.log('🚨 Connection refused - server might be down');
            } else if (connectError.code === 'ETIMEDOUT') {
                console.log('🚨 Connection timeout - server might be slow or unreachable');
            }
        }

        // Test 2: Try different common endpoints
        console.log('\n🔍 Testing common endpoints...');
        
        const commonEndpoints = [
            '/',
            '/health',
            '/api',
            '/status'
        ];

        for (const endpoint of commonEndpoints) {
            try {
                console.log(`\n   Testing: ${PRODUCTION_URL}${endpoint}`);
                const response = await axios.get(`${PRODUCTION_URL}${endpoint}`, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                console.log(`   Status: ${response.status}`);
                console.log(`   Response:`, JSON.stringify(response.data, null, 2));
                
            } catch (endpointError) {
                console.log(`   Error: ${endpointError.message}`);
            }
        }

        // Test 3: Check if it's a Railway.app issue
        console.log('\n🚂 Checking Railway.app status...');
        
        try {
            const railwayResponse = await axios.get('https://railway.app', {
                timeout: 5000,
                validateStatus: () => true
            });
            console.log(`Railway.app status: ${railwayResponse.status}`);
        } catch (railwayError) {
            console.log(`Railway.app error: ${railwayError.message}`);
        }

        // Test 4: Try to ping the domain
        console.log('\n🏓 Testing domain resolution...');
        
        try {
            const dns = require('dns').promises;
            const addresses = await dns.lookup('freya-backend-production.up.railway.app');
            console.log(`✅ Domain resolves to: ${addresses.address}`);
        } catch (dnsError) {
            console.log(`❌ DNS lookup failed: ${dnsError.message}`);
        }

        // Test 5: Check if we can reach any Railway subdomain
        console.log('\n🔍 Testing Railway subdomain pattern...');
        
        const railwayUrls = [
            'https://freya-backend-production.up.railway.app',
            'https://freya-backend.up.railway.app',
            'https://freya-production.up.railway.app'
        ];

        for (const url of railwayUrls) {
            try {
                console.log(`\n   Testing: ${url}`);
                const response = await axios.get(url, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                console.log(`   Status: ${response.status}`);
                if (response.status !== 404) {
                    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
                }
                
            } catch (urlError) {
                console.log(`   Error: ${urlError.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }

    console.log('\n🔍 Server check completed!');
}

checkProductionServer();