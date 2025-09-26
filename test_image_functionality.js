const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

// Test data
const testUser = {
    phone: '+998991111111',
    password: 'testpassword123',
    full_name: 'Test User',
    email: 'testuser@example.com',
    username: 'testuser123'
};

// Sample base64 image (small PNG)
const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testImageFunctionality() {
    try {
        console.log('🚀 Starting image functionality test...\n');

        // Step 1: Register user (step 1)
        console.log('📝 Step 1: Registering user...');
        const registerStep1Response = await axios.post(`${BASE_URL}/users/register/step1`, {
            phone: testUser.phone,
            password: testUser.password
        });
        
        console.log('✅ Registration step 1 successful');
        console.log('Verification code:', registerStep1Response.data.verificationCode);
        
        const verificationCode = registerStep1Response.data.verificationCode;

        // Step 2: Complete registration (step 2)
        console.log('\n📝 Step 2: Completing registration...');
        const registerStep2Response = await axios.post(`${BASE_URL}/users/register/step2`, {
            phone: testUser.phone,
            verificationCode: verificationCode,
            full_name: testUser.full_name,
            email: testUser.email,
            username: testUser.username
        });
        
        console.log('✅ Registration step 2 successful');
        console.log('User ID:', registerStep2Response.data.user.id);

        // Step 3: Login to get token
        console.log('\n🔐 Step 3: Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
            phone: testUser.phone,
            password: testUser.password
        });
        
        console.log('✅ Login successful');
        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        console.log('Token received:', token.substring(0, 20) + '...');

        // Step 4: Test image upload
        console.log('\n📸 Step 4: Testing image upload...');
        const uploadResponse = await axios.post(`${BASE_URL}/users/upload-image`, {
            image: sampleImageBase64
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Image upload successful');
        console.log('Image URL:', uploadResponse.data.imageUrl);

        // Step 5: Test profile retrieval
        console.log('\n👤 Step 5: Testing profile retrieval...');
        const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Profile retrieval successful');
        console.log('Profile has image:', !!profileResponse.data.user.image);
        if (profileResponse.data.user.image) {
            console.log('Image data length:', profileResponse.data.user.image.length);
        }

        // Step 6: Test image retrieval
        console.log('\n🖼️ Step 6: Testing image retrieval...');
        const imageResponse = await axios.get(`${BASE_URL}/users/image`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Image retrieval successful');
        console.log('Image data received:', !!imageResponse.data.image);

        // Step 7: Test image deletion
        console.log('\n🗑️ Step 7: Testing image deletion...');
        const deleteResponse = await axios.delete(`${BASE_URL}/users/image`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Image deletion successful');
        console.log('Delete message:', deleteResponse.data.message);

        // Step 8: Verify image is deleted
        console.log('\n🔍 Step 8: Verifying image deletion...');
        const profileAfterDeleteResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Profile check after deletion successful');
        console.log('Profile has image after deletion:', !!profileAfterDeleteResponse.data.user.image);

        console.log('\n🎉 All image functionality tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testImageFunctionality();