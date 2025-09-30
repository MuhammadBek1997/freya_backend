const axios = require('axios');

const API_BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

// Test ma'lumotlari
const EMPLOYEE_CREDENTIALS = {
  username: 'employee1_1',
  password: 'employee123'
};

let authToken = null;
let employeeData = null;

// 1. Employee login qilish
async function testEmployeeLogin() {
  console.log('\n🔐 1. Employee Login Test...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/employee/login`, EMPLOYEE_CREDENTIALS);
    
    console.log('📊 Full response:', JSON.stringify(response.data, null, 2));
    
    // Check if login was successful based on response structure
    if (response.data.message && response.data.message.includes('muvaffaqiyatli')) {
      authToken = response.data.token;
      employeeData = response.data.employee || response.data.user;
      console.log('✅ Employee login successful!');
      console.log('👤 Employee:', employeeData.username);
      console.log('🏢 Salon ID:', employeeData.salon_id);
      console.log('🎭 Role:', employeeData.role);
      console.log('🔑 Token:', authToken ? 'Present' : 'Missing');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

// 2. Conversations olish
async function testFetchConversations() {
  console.log('\n💬 2. Fetch Conversations Test...');
  try {
    const response = await axios.get(`${API_BASE_URL}/user-chat/conversations`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Conversations fetched successfully!');
    console.log('📊 Total conversations:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('📋 Sample conversations:');
      response.data.slice(0, 3).forEach((conv, index) => {
        console.log(`  ${index + 1}. User ID: ${conv.user_id}, Name: ${conv.user_name || 'N/A'}`);
        console.log(`     Last message: ${conv.last_message || 'No messages'}`);
        console.log(`     Unread count: ${conv.unread_count || 0}`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ Fetch conversations error:', error.response?.data?.message || error.message);
    console.log('📊 Status:', error.response?.status);
    return [];
  }
}

// 3. Specific user bilan messages olish
async function testFetchMessages(userId) {
  console.log(`\n📨 3. Fetch Messages Test (User ID: ${userId})...`);
  try {
    const response = await axios.get(`${API_BASE_URL}/user-chat/conversation/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Messages fetched successfully!');
    console.log('📊 Total messages:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('📋 Recent messages:');
      response.data.slice(-3).forEach((msg, index) => {
        const isFromEmployee = msg.sender_id === employeeData.id;
        console.log(`  ${index + 1}. ${isFromEmployee ? '👨‍💼 Employee' : '👤 User'}: ${msg.message_text}`);
        console.log(`     Time: ${new Date(msg.created_at).toLocaleString()}`);
      });
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ Fetch messages error:', error.response?.data?.message || error.message);
    console.log('📊 Status:', error.response?.status);
    return [];
  }
}

// 4. Xabar yuborish
async function testSendMessage(userId, messageText) {
  console.log(`\n📤 4. Send Message Test (User ID: ${userId})...`);
  try {
    const response = await axios.post(`${API_BASE_URL}/user-chat/send`, {
      receiver_id: userId,
      receiver_type: 'user',
      message_text: messageText
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Message sent successfully!');
    console.log('📨 Message:', messageText);
    console.log('📊 Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Send message error:', error.response?.data?.message || error.message);
    console.log('📊 Status:', error.response?.status);
    return false;
  }
}

// 5. Unread count olish
async function testUnreadCount() {
  console.log('\n🔔 5. Unread Count Test...');
  try {
    const response = await axios.get(`${API_BASE_URL}/user-chat/unread-count`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Unread count fetched successfully!');
    console.log('🔔 Unread messages:', response.data.unread_count || 0);
    return response.data.unread_count || 0;
  } catch (error) {
    console.log('❌ Unread count error:', error.response?.data?.message || error.message);
    console.log('📊 Status:', error.response?.status);
    return 0;
  }
}

// Main test function
async function runCompleteTest() {
  console.log('🚀 Starting Complete Chat Flow Test...');
  console.log('🌐 API Base URL:', API_BASE_URL);
  
  // 1. Login
  const loginSuccess = await testEmployeeLogin();
  if (!loginSuccess) {
    console.log('\n❌ Test failed at login step. Exiting...');
    return;
  }
  
  // 2. Fetch conversations
  const conversations = await testFetchConversations();
  
  // 3. Unread count
  await testUnreadCount();
  
  // 4. Test messages with first user (if available)
  if (conversations.length > 0) {
    const firstUserId = conversations[0].user_id;
    await testFetchMessages(firstUserId);
    
    // 5. Send test message
    const testMessage = `Test message from employee at ${new Date().toLocaleTimeString()}`;
    await testSendMessage(firstUserId, testMessage);
    
    // 6. Fetch messages again to see the new message
    console.log('\n🔄 6. Fetching messages again to verify sent message...');
    await testFetchMessages(firstUserId);
  } else {
    console.log('\n⚠️ No conversations found. Cannot test message functionality.');
  }
  
  console.log('\n🎉 Complete Chat Flow Test Finished!');
  console.log('\n📋 Summary:');
  console.log(`✅ Employee Login: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Conversations: ${conversations.length} found`);
  console.log('✅ All chat APIs tested');
}

// Run the test
runCompleteTest().catch(error => {
  console.error('💥 Test failed with error:', error.message);
});