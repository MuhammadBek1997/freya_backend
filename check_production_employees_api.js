const axios = require('axios');

const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

// Test different employee credentials that might exist
const testCredentials = [
  { username: 'employee1', password: 'employee123' },
  { username: 'employee1', password: 'password123' },
  { username: 'employee1_1', password: 'employee123' },
  { username: 'employee1_1', password: 'password123' },
  { username: 'ali_stilist', password: 'password123' },
  { username: 'emp1_1', password: 'employee123' },
  { username: 'emp1_1', password: 'password123' },
  { username: 'admin', password: 'admin123' },
  { username: 'admin', password: 'password123' }
];

async function checkProductionEmployees() {
  console.log('🔍 Checking production employees via API...');
  console.log('🌐 Base URL:', BASE_URL);
  
  for (const cred of testCredentials) {
    console.log(`\n🧪 Testing: ${cred.username} / ${cred.password}`);
    
    try {
      // Try employee login
      const response = await axios.post(`${BASE_URL}/auth/employee/login`, {
        username: cred.username,
        password: cred.password
      });
      
      console.log('✅ EMPLOYEE LOGIN SUCCESS!');
      console.log('👤 User:', response.data.user.username);
      console.log('📧 Email:', response.data.user.email);
      console.log('🎭 Role:', response.data.user.role);
      console.log('🏢 Salon ID:', response.data.user.salon_id);
      console.log('🔑 Token received');
      
    } catch (employeeError) {
      // Try admin login if employee fails
      try {
        const adminResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
          username: cred.username,
          password: cred.password
        });
        
        console.log('✅ ADMIN LOGIN SUCCESS!');
        console.log('👤 User:', adminResponse.data.user.username);
        console.log('📧 Email:', adminResponse.data.user.email);
        console.log('🎭 Role:', adminResponse.data.user.role);
        console.log('🏢 Salon ID:', adminResponse.data.user.salon_id);
        
      } catch (adminError) {
        console.log('❌ Both employee and admin login failed');
        console.log('📊 Employee error:', employeeError.response?.status, employeeError.response?.data?.message);
        console.log('📊 Admin error:', adminError.response?.status, adminError.response?.data?.message);
      }
    }
  }
  
  console.log('\n🏁 Production employee check completed!');
}

checkProductionEmployees();