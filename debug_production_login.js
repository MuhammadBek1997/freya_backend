const axios = require('axios');

const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function debugLogin() {
  try {
    console.log('🔍 Debug Production Login...');
    console.log('🌐 URL:', `${BASE_URL}/auth/employee/login`);
    console.log('📝 Credentials: username=employee1, password=employee123');
    
    const response = await axios.post(`${BASE_URL}/auth/employee/login`, {
      username: 'employee1',
      password: 'employee123'
    });
    
    console.log('✅ Login successful!');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('📊 Status:', error.response?.status);
    console.log('📋 Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('🔍 Full error:', error.message);
    
    // Try with different credentials
    console.log('\n🔄 Trying with email instead of username...');
    try {
      const emailResponse = await axios.post(`${BASE_URL}/auth/employee/login`, {
        username: 'employee1@freyasalon.uz',
        password: 'employee123'
      });
      
      console.log('✅ Email login successful!');
      console.log('📋 Response data:', JSON.stringify(emailResponse.data, null, 2));
      
    } catch (emailError) {
      console.log('❌ Email login also failed!');
      console.log('📊 Status:', emailError.response?.status);
      console.log('📋 Error data:', JSON.stringify(emailError.response?.data, null, 2));
    }
  }
}

debugLogin();