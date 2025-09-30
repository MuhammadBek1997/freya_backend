const axios = require('axios');

// Use local backend instead of production
const API_BASE_URL = 'http://localhost:8080/api';

async function testLocalEmployeeChat() {
  try {
    console.log('🚀 Starting Local Employee Chat Test...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    
    // Step 1: Employee Login
    console.log('\n📝 1. Employee Login Test...');
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/employee/login`, {
      username: 'employee1_1',
      password: 'employee123'
    });
    
    console.log('✅ Employee login successful!');
    console.log('👤 Employee:', loginResponse.data.user.username);
    console.log('🏢 Salon ID:', loginResponse.data.user.salon_id);
    console.log('🎭 Role:', loginResponse.data.user.role);
    console.log('🔑 Token: Present');
    
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test Chat APIs (employee uses /messages endpoint)
    console.log('\n💬 2. Fetch Conversations Test...');
    
    try {
      const conversationsResponse = await axios.get(`${API_BASE_URL}/messages/conversations`, { headers });
      console.log('✅ Conversations fetched successfully!');
      console.log('📊 Conversations count:', conversationsResponse.data.conversations?.length || 0);
    } catch (error) {
      console.log('❌ Fetch conversations error:', error.response?.data?.message || error.message);
      console.log('📊 Status:', error.response?.status);
    }
    
    console.log('\n📊 3. Unread Count Test...');
    
    try {
      const unreadResponse = await axios.get(`${API_BASE_URL}/messages/unread-count`, { headers });
      console.log('✅ Unread count fetched successfully!');
      console.log('📊 Unread count:', unreadResponse.data.unreadCount);
    } catch (error) {
      console.log('❌ Unread count error:', error.response?.data?.message || error.message);
      console.log('📊 Status:', error.response?.status);
    }
    
    console.log('\n🎯 Complete Local Employee Chat Test Finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLocalEmployeeChat();