const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.production' });

const PRODUCTION_BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function debugEmployeeToken() {
    console.log('🔍 Starting Employee Token Debug...');
    console.log('🌐 Production URL:', PRODUCTION_BASE_URL);
    
    try {
        // 1. Login as employee1_1
        console.log('\n📝 1. Employee Login...');
        const loginResponse = await axios.post(`${PRODUCTION_BASE_URL}/auth/employee/login`, {
            username: 'employee1_1',
            password: 'employee123'
        });
        
        if (loginResponse.status === 200) {
            console.log('✅ Employee login successful!');
            const token = loginResponse.data.token;
            const user = loginResponse.data.user;
            
            console.log('👤 Employee Info:');
            console.log('   - ID:', user.id);
            console.log('   - Username:', user.username);
            console.log('   - Email:', user.email);
            console.log('   - Role:', user.role);
            console.log('   - Salon ID:', user.salon_id);
            console.log('   - Is Active:', user.is_active);
            
            // 2. Decode the JWT token
            console.log('\n🔍 2. JWT Token Analysis...');
            try {
                const decoded = jwt.decode(token, { complete: true });
                console.log('📋 Token Header:', decoded.header);
                console.log('📋 Token Payload:', decoded.payload);
                
                // Verify token with JWT_SECRET (if available)
                if (process.env.JWT_SECRET) {
                    try {
                        const verified = jwt.verify(token, process.env.JWT_SECRET);
                        console.log('✅ Token verification successful');
                        console.log('📋 Verified payload:', verified);
                    } catch (verifyError) {
                        console.log('❌ Token verification failed:', verifyError.message);
                    }
                } else {
                    console.log('⚠️ JWT_SECRET not available for verification');
                }
            } catch (decodeError) {
                console.log('❌ Token decode error:', decodeError.message);
            }
            
            // 3. Test API calls with detailed headers
            console.log('\n🧪 3. API Call Tests...');
            
            // Test conversations endpoint with detailed logging
            console.log('\n💬 Testing /messages/conversations...');
            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };
                
                console.log('📤 Request config:', {
                    url: `${PRODUCTION_BASE_URL}/messages/conversations`,
                    headers: config.headers
                });
                
                const conversationsResponse = await axios.get(`${PRODUCTION_BASE_URL}/messages/conversations`, config);
                
                console.log('✅ Conversations request successful!');
                console.log('📊 Status:', conversationsResponse.status);
                console.log('📊 Data:', conversationsResponse.data);
                
            } catch (convError) {
                console.log('❌ Conversations request failed:');
                console.log('📊 Status:', convError.response?.status);
                console.log('📊 Status Text:', convError.response?.statusText);
                console.log('📊 Error Data:', convError.response?.data);
                console.log('📊 Error Headers:', convError.response?.headers);
                
                if (convError.response?.status === 401) {
                    console.log('\n🔍 401 Error Analysis:');
                    console.log('   - This suggests authentication failed');
                    console.log('   - Token might not be properly formatted');
                    console.log('   - Or employee might not be found in database');
                }
            }
            
            // Test unread count endpoint
            console.log('\n🔔 Testing /messages/unread-count...');
            try {
                const unreadResponse = await axios.get(`${PRODUCTION_BASE_URL}/messages/unread-count`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ Unread count request successful!');
                console.log('📊 Data:', unreadResponse.data);
                
            } catch (unreadError) {
                console.log('❌ Unread count request failed:');
                console.log('📊 Status:', unreadError.response?.status);
                console.log('📊 Error Data:', unreadError.response?.data);
            }
            
        } else {
            console.log('❌ Employee login failed!');
            console.log('📊 Status:', loginResponse.status);
        }
        
    } catch (error) {
        console.log('❌ Login error:', error.response?.data?.message || error.message);
        console.log('📊 Status:', error.response?.status);
    }
    
    console.log('\n🏁 Employee Token Debug Finished!');
}

debugEmployeeToken();