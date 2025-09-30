const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com';

async function checkProductionChatAPIs() {
    try {
        console.log('🔍 Production server\'da chat API\'larini tekshirish...');
        console.log('🌐 Server URL:', PRODUCTION_URL);

        // 1. Employee login - turli parollar bilan test
        console.log('\n1️⃣ Employee1_1 bilan login qilish...');
        
        const testPasswords = [
            'password123',
            'employee123', 
            'admin123',
            '123456',
            'freya123',
            'employee1_1'
        ];

        let loginResponse = null;
        let correctPassword = null;

        for (const testPassword of testPasswords) {
            try {
                console.log(`🔐 Parol test qilish: "${testPassword}"`);
                loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/employee/login`, {
                    username: 'employee1_1',
                    password: testPassword
                });
                
                correctPassword = testPassword;
                console.log(`✅ To'g'ri parol topildi: "${testPassword}"`);
                break;
            } catch (error) {
                console.log(`❌ Noto'g'ri parol: "${testPassword}"`);
            }
        }

        if (!loginResponse) {
            console.log('❌ Hech qanday parol mos kelmadi. Test to\'xtatildi.');
            return;
        }

        const { token, user: employee } = loginResponse.data;
        console.log('✅ Login muvaffaqiyatli!');
        console.log('Employee ID:', employee.id);
        console.log('Salon ID:', employee.salon_id);
        console.log('Role:', employee.role);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Message endpoints (employee uchun)
        console.log('\n2️⃣ Message endpoint\'larini tekshirish...');
        
        // Get conversations
        try {
            const conversationsResponse = await axios.get(`${PRODUCTION_URL}/api/messages/conversations`, { headers });
            console.log('✅ Messages Conversations API mavjud');
            console.log('Conversations count:', conversationsResponse.data.length || 'N/A');
            if (conversationsResponse.data.length > 0) {
                console.log('Sample conversation:', conversationsResponse.data[0]);
            }
        } catch (error) {
            console.log('❌ Messages Conversations API:', error.response?.status, error.response?.data?.message || error.message);
        }

        // Get unread count
        try {
            const unreadResponse = await axios.get(`${PRODUCTION_URL}/api/messages/unread-count`, { headers });
            console.log('✅ Messages Unread Count API mavjud');
            console.log('Unread count:', unreadResponse.data.count);
        } catch (error) {
            console.log('❌ Messages Unread Count API:', error.response?.status, error.response?.data?.message || error.message);
        }

        // 3. User Chat endpoints (user token kerak)
        console.log('\n3️⃣ User Chat endpoint\'larini tekshirish...');
        
        // Test user login
        try {
            const userLoginResponse = await axios.post(`${PRODUCTION_URL}/api/users/login`, {
                phone: '+998901234567',
                password: 'password123'
            });
            
            const userToken = userLoginResponse.data.token;
            const userHeaders = { Authorization: `Bearer ${userToken}` };
            
            console.log('✅ Test user login muvaffaqiyatli');
            
            // User chat conversations
            try {
                const userConversationsResponse = await axios.get(`${PRODUCTION_URL}/api/user-chat/conversations`, { headers: userHeaders });
                console.log('✅ User Chat Conversations API mavjud');
                console.log('User conversations count:', userConversationsResponse.data.length || 'N/A');
            } catch (error) {
                console.log('❌ User Chat Conversations API:', error.response?.status, error.response?.data?.message || error.message);
            }

            // User chat unread count
            try {
                const userUnreadResponse = await axios.get(`${PRODUCTION_URL}/api/user-chat/unread-count`, { headers: userHeaders });
                console.log('✅ User Chat Unread Count API mavjud');
                console.log('User unread count:', userUnreadResponse.data.count);
            } catch (error) {
                console.log('❌ User Chat Unread Count API:', error.response?.status, error.response?.data?.message || error.message);
            }

        } catch (error) {
            console.log('❌ Test user login failed:', error.response?.status, error.response?.data?.message || error.message);
        }

        // 4. Salon va Employee endpoints
        console.log('\n4️⃣ Salon va Employee endpoint\'larini tekshirish...');
        
        // Salon info
        try {
            const salonResponse = await axios.get(`${PRODUCTION_URL}/api/salons/${employee.salon_id}`);
            console.log('✅ Salon API mavjud');
            console.log('Salon:', salonResponse.data.name);
        } catch (error) {
            console.log('❌ Salon API:', error.response?.status, error.response?.data?.message || error.message);
        }

        // Employees by salon
        try {
            const employeesResponse = await axios.get(`${PRODUCTION_URL}/api/employees/salon/${employee.salon_id}`);
            console.log('✅ Employees by Salon API mavjud');
            console.log('Employees count:', employeesResponse.data.length || 'N/A');
        } catch (error) {
            console.log('❌ Employees by Salon API:', error.response?.status, error.response?.data?.message || error.message);
        }

        // 5. Test message sending
        console.log('\n5️⃣ Message yuborish test...');
        
        try {
            const testMessage = await axios.post(`${PRODUCTION_URL}/api/messages/send`, {
                receiver_id: 'test-user-id',
                content: 'Test message from employee1_1',
                message_type: 'text'
            }, { headers });
            console.log('✅ Message sending API mavjud');
        } catch (error) {
            console.log('❌ Message sending API:', error.response?.status, error.response?.data?.message || error.message);
        }

        // 6. Swagger documentation
        console.log('\n6️⃣ Swagger documentation tekshirish...');
        try {
            const swaggerResponse = await axios.get(`${PRODUCTION_URL}/api-docs`);
            console.log('✅ Swagger documentation mavjud');
        } catch (error) {
            console.log('❌ Swagger documentation:', error.response?.status, error.message);
        }

        console.log('\n✅ Production chat API\'lari tekshiruvi tugadi!');

    } catch (error) {
        console.error('❌ Xatolik:', error.response?.data || error.message);
    }
}

checkProductionChatAPIs();