const axios = require('axios');
const jwt = require('jsonwebtoken');

const PRODUCTION_URL = 'https://freya-backend-production.up.railway.app';

async function investigateProductionAuth() {
    console.log('🔍 Investigating production authentication system...');
    console.log('🌐 Production URL:', PRODUCTION_URL);

    try {
        // Test 1: Check what endpoints are available
        console.log('\n📋 Testing available authentication endpoints...');
        
        const authEndpoints = [
            '/auth/employee/login',
            '/auth/admin/login', 
            '/auth/login',
            '/employee/login',
            '/admin/login',
            '/api/auth/employee/login',
            '/api/employee/login'
        ];

        for (const endpoint of authEndpoints) {
            try {
                console.log(`\n🔍 Testing endpoint: ${endpoint}`);
                const response = await axios.post(`${PRODUCTION_URL}${endpoint}`, {
                    username: 'employee1_1',
                    password: 'employee123'
                }, {
                    timeout: 5000,
                    validateStatus: () => true // Accept all status codes
                });

                console.log(`   Status: ${response.status}`);
                console.log(`   Response:`, JSON.stringify(response.data, null, 2));

                if (response.status === 200 && response.data.token) {
                    console.log('✅ Login successful on this endpoint!');
                    
                    // Decode the token
                    try {
                        const decoded = jwt.decode(response.data.token);
                        console.log('   Token payload:', JSON.stringify(decoded, null, 2));
                    } catch (decodeError) {
                        console.log('   Token decode error:', decodeError.message);
                    }
                }
            } catch (endpointError) {
                console.log(`   Error: ${endpointError.message}`);
            }
        }

        // Test 2: Try the working endpoint with different credentials
        console.log('\n🔍 Testing different credentials on working endpoint...');
        
        const credentials = [
            { username: 'employee1_1', password: 'employee123' },
            { username: 'employee1', password: 'employee123' },
            { username: 'admin', password: 'admin123' },
            { username: 'employee1_1', password: 'password' },
            { username: 'employee1_1', password: '123456' }
        ];

        for (const cred of credentials) {
            try {
                console.log(`\n   Testing: ${cred.username} / ${cred.password}`);
                const response = await axios.post(`${PRODUCTION_URL}/auth/employee/login`, cred, {
                    timeout: 5000,
                    validateStatus: () => true
                });

                console.log(`   Status: ${response.status}`);
                if (response.status === 200) {
                    console.log('✅ Login successful!');
                    console.log('   User data:', JSON.stringify(response.data.user, null, 2));
                    
                    // Test the token immediately
                    if (response.data.token) {
                        console.log('   Testing token with /messages/conversations...');
                        try {
                            const chatResponse = await axios.get(`${PRODUCTION_URL}/messages/conversations`, {
                                headers: {
                                    'Authorization': `Bearer ${response.data.token}`,
                                    'Content-Type': 'application/json'
                                },
                                timeout: 5000,
                                validateStatus: () => true
                            });
                            console.log(`   Chat API Status: ${chatResponse.status}`);
                            console.log(`   Chat API Response:`, JSON.stringify(chatResponse.data, null, 2));
                        } catch (chatError) {
                            console.log(`   Chat API Error: ${chatError.message}`);
                        }
                    }
                } else {
                    console.log(`   Failed: ${response.data?.message || 'Unknown error'}`);
                }
            } catch (credError) {
                console.log(`   Error: ${credError.message}`);
            }
        }

        // Test 3: Check server info/health endpoints
        console.log('\n🔍 Checking server information...');
        
        const infoEndpoints = [
            '/health',
            '/status', 
            '/info',
            '/version',
            '/api/health',
            '/api/status'
        ];

        for (const endpoint of infoEndpoints) {
            try {
                const response = await axios.get(`${PRODUCTION_URL}${endpoint}`, {
                    timeout: 5000,
                    validateStatus: () => true
                });

                if (response.status === 200) {
                    console.log(`✅ ${endpoint}:`, JSON.stringify(response.data, null, 2));
                }
            } catch (infoError) {
                // Ignore errors for info endpoints
            }
        }

        // Test 4: Check if there are any API documentation endpoints
        console.log('\n🔍 Checking for API documentation...');
        
        const docEndpoints = [
            '/docs',
            '/api-docs',
            '/swagger',
            '/api/docs'
        ];

        for (const endpoint of docEndpoints) {
            try {
                const response = await axios.get(`${PRODUCTION_URL}${endpoint}`, {
                    timeout: 5000,
                    validateStatus: () => true
                });

                if (response.status === 200) {
                    console.log(`✅ Documentation found at: ${endpoint}`);
                    console.log(`   Content-Type: ${response.headers['content-type']}`);
                }
            } catch (docError) {
                // Ignore errors for doc endpoints
            }
        }

    } catch (error) {
        console.error('❌ Investigation error:', error.message);
    }

    console.log('\n🔍 Investigation completed!');
}

investigateProductionAuth();