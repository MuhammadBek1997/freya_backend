const axios = require('axios');

const PRODUCTION_BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testProductionChat() {
    console.log('🚀 Starting Production Chat Test...');
    console.log('🌐 Production URL:', PRODUCTION_BASE_URL);
    
    try {
        // 1. Test employee1 login
        console.log('\n📝 1. Employee Login Test...');
        const loginResponse = await axios.post(`${PRODUCTION_BASE_URL}/auth/employee/login`, {
            username: 'employee1_1',
            password: 'employee123'
        });
        
        if (loginResponse.status === 200) {
            console.log('✅ Employee login successful!');
            console.log('👤 Employee:', loginResponse.data.user.username);
            console.log('🏢 Salon ID:', loginResponse.data.user.salon_id);
            console.log('🎭 Role:', loginResponse.data.user.role);
            console.log('🔑 Token: Present');
            
            const token = loginResponse.data.token;
            
            // 2. Test conversations endpoint
            console.log('\n💬 2. Fetch Conversations Test...');
            try {
                const conversationsResponse = await axios.get(`${PRODUCTION_BASE_URL}/messages/conversations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('✅ Conversations fetched successfully!');
                console.log('📊 Conversations count:', conversationsResponse.data.conversations?.length || 0);
                if (conversationsResponse.data.conversations?.length > 0) {
                    console.log('💬 Sample conversation:', conversationsResponse.data.conversations[0]);
                }
            } catch (convError) {
                console.log('❌ Fetch conversations error:', convError.response?.data?.message || convError.message);
                console.log('📊 Status:', convError.response?.status);
            }
            
            // 3. Test unread count endpoint
            console.log('\n🔔 3. Unread Count Test...');
            try {
                const unreadResponse = await axios.get(`${PRODUCTION_BASE_URL}/messages/unread-count`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('✅ Unread count fetched successfully!');
                console.log('📈 Unread count:', unreadResponse.data.unreadCount);
            } catch (unreadError) {
                console.log('❌ Unread count error:', unreadError.response?.data?.message || unreadError.message);
                console.log('📊 Status:', unreadError.response?.status);
            }
            
            // 4. Test user chat endpoints (for users to contact employee1_1)
            console.log('\n👥 4. User Chat Endpoints Test...');
            try {
                const userChatResponse = await axios.get(`${PRODUCTION_BASE_URL}/user-chat/conversations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('✅ User chat conversations accessible!');
                console.log('📊 User conversations count:', userChatResponse.data.conversations?.length || 0);
            } catch (userChatError) {
                console.log('❌ User chat error:', userChatError.response?.data?.message || userChatError.message);
                console.log('📊 Status:', userChatError.response?.status);
            }
            
        } else {
            console.log('❌ Employee login failed!');
            console.log('📊 Status:', loginResponse.status);
        }
        
    } catch (error) {
        console.log('❌ Login error:', error.response?.data?.message || error.message);
        console.log('📊 Status:', error.response?.status);
    }
    
    console.log('\n🏁 Production Chat Test Finished!');
}

testProductionChat();