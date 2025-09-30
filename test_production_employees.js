const axios = require('axios');

const PRODUCTION_BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testProductionEmployees() {
    console.log('🔍 Testing Production Employees...');
    console.log('🌐 Production URL:', PRODUCTION_BASE_URL);
    
    // Test common employee usernames
    const testEmployees = [
        { username: 'employee1', password: 'password123' },
        { username: 'employee1_1', password: 'password123' },
        { username: 'employee', password: 'password123' },
        { username: 'admin', password: 'password123' },
        { username: 'test_employee', password: 'password123' },
        { username: 'salon_employee', password: 'password123' },
        { username: 'employee_1', password: 'password123' },
        { username: 'emp1', password: 'password123' }
    ];
    
    let foundEmployees = [];
    
    for (const employee of testEmployees) {
        try {
            console.log(`\n🧪 Testing: ${employee.username}`);
            const response = await axios.post(`${PRODUCTION_BASE_URL}/auth/employee/login`, {
                username: employee.username,
                password: employee.password
            });
            
            if (response.status === 200) {
                console.log(`✅ ${employee.username} login successful!`);
                const empData = {
                    username: response.data.employee.username,
                    salon_id: response.data.employee.salon_id,
                    role: response.data.employee.role,
                    id: response.data.employee.id
                };
                console.log('👤 Employee data:', empData);
                foundEmployees.push(empData);
                
                // Test if this employee can access chat
                const token = response.data.token;
                try {
                    const chatResponse = await axios.get(`${PRODUCTION_BASE_URL}/messages/conversations`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log('💬 Chat access: ✅ Working');
                    console.log('📊 Conversations:', chatResponse.data.conversations?.length || 0);
                } catch (chatError) {
                    console.log('💬 Chat access: ❌ Failed -', chatError.response?.data?.message || chatError.message);
                }
            }
        } catch (error) {
            console.log(`❌ ${employee.username}: ${error.response?.data?.message || error.message}`);
        }
    }
    
    // Also test admin login
    console.log('\n🔐 Testing Admin Access...');
    const adminCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'admin', password: 'password123' },
        { username: 'superadmin', password: 'admin123' }
    ];
    
    for (const admin of adminCredentials) {
        try {
            const adminResponse = await axios.post(`${PRODUCTION_BASE_URL}/auth/admin/login`, {
                username: admin.username,
                password: admin.password
            });
            
            if (adminResponse.status === 200) {
                console.log(`✅ Admin ${admin.username} login successful!`);
                console.log('👑 Admin data:', {
                    username: adminResponse.data.admin.username,
                    role: adminResponse.data.admin.role
                });
                break;
            }
        } catch (adminError) {
            console.log(`❌ Admin ${admin.username}: ${adminError.response?.data?.message || adminError.message}`);
        }
    }
    
    console.log('\n📋 Summary:');
    console.log('Found employees:', foundEmployees.length);
    if (foundEmployees.length > 0) {
        console.table(foundEmployees);
    }
    
    console.log('\n🏁 Production Employee Test Finished!');
}

testProductionEmployees();