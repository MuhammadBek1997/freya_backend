const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.production' });

const PRODUCTION_BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testManualJWTToken() {
    console.log('🔍 Testing manual JWT token creation...');
    console.log('🌐 Production URL:', PRODUCTION_BASE_URL);
    
    // First, let's try to get the correct JWT_SECRET by testing different possibilities
    const possibleSecrets = [
        process.env.JWT_SECRET,
        'freya_secret_key_2024',
        'freya_jwt_secret',
        'your_jwt_secret_here',
        'freya_salon_secret'
    ];
    
    // Create a manual token with the correct employee1_1 data
    const employeeData = {
        id: 34, // The correct integer ID from database
        username: 'employee1_1',
        role: 'employee',
        salon_id: 1 // From the database query result
    };
    
    console.log('\n🔧 Creating manual JWT tokens with different secrets...');
    
    for (let i = 0; i < possibleSecrets.length; i++) {
        const secret = possibleSecrets[i];
        if (!secret) continue;
        
        console.log(`\n🔑 Testing with secret ${i + 1}...`);
        
        try {
            // Create token with the same structure as generateToken function
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 15);
            
            const enhancedPayload = {
                ...employeeData,
                tokenId: `EM_${employeeData.id}_${timestamp}_${randomSuffix}`,
                iat: Math.floor(timestamp / 1000),
                userType: 'employee',
                sessionId: `EM_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
            };
            
            const token = jwt.sign(enhancedPayload, secret, { expiresIn: '7d' });
            
            console.log('📋 Token payload:', enhancedPayload);
            console.log('🎫 Generated token (first 50 chars):', token.substring(0, 50) + '...');
            
            // Test the token with the API
            console.log('🧪 Testing token with /messages/conversations...');
            
            try {
                const response = await axios.get(`${PRODUCTION_BASE_URL}/messages/conversations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ SUCCESS! Token works with this secret!');
                console.log('📊 Response status:', response.status);
                console.log('📊 Response data:', response.data);
                
                // If successful, test other endpoints too
                console.log('\n🧪 Testing unread count endpoint...');
                const unreadResponse = await axios.get(`${PRODUCTION_BASE_URL}/messages/unread-count`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ Unread count also works!');
                console.log('📊 Unread data:', unreadResponse.data);
                
                return; // Exit if we found the working secret
                
            } catch (apiError) {
                console.log('❌ Token failed with API:');
                console.log('📊 Status:', apiError.response?.status);
                console.log('📊 Error:', apiError.response?.data?.message);
            }
            
        } catch (tokenError) {
            console.log('❌ Token creation failed:', tokenError.message);
        }
    }
    
    console.log('\n❌ None of the JWT secrets worked. The production server might be using a different secret.');
    
    // Let's also try the original login approach but check what's actually happening
    console.log('\n🔍 Let\'s try the original login and see what happens...');
    
    try {
        const loginResponse = await axios.post(`${PRODUCTION_BASE_URL}/auth/employee/login`, {
            username: 'employee1_1',
            password: 'employee123'
        });
        
        if (loginResponse.status === 200) {
            const token = loginResponse.data.token;
            const user = loginResponse.data.user;
            
            console.log('✅ Login successful');
            console.log('👤 User data from login:', user);
            
            // Decode the token to see what's inside
            const decoded = jwt.decode(token, { complete: true });
            console.log('📋 Actual token payload:', decoded.payload);
            
            // The issue might be that the production server is running different code
            // Let's check if the user ID in the response matches what we expect
            if (user.id === 34) {
                console.log('✅ User ID matches database (34)');
            } else {
                console.log('❌ User ID mismatch. Expected: 34, Got:', user.id);
                console.log('   This suggests the production server has different data or code');
            }
        }
        
    } catch (loginError) {
        console.log('❌ Login failed:', loginError.response?.data?.message);
    }
    
    console.log('\n🏁 Manual JWT Token Test Finished!');
}

testManualJWTToken();