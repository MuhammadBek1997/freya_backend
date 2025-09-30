const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('./config/database');

const API_BASE_URL = 'http://localhost:8080/api';

async function debugTokenVerification() {
  try {
    console.log('🔍 Starting Token Verification Debug...\n');

    // 1. Login and get token
    console.log('1. Employee Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/employee/login`, {
      username: 'employee1_1',
      password: 'employee123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('📋 User data:', loginResponse.data.user);
    console.log('🎫 Token:', token.substring(0, 50) + '...');

    // 2. Decode token
    console.log('\n2. Decoding Token...');
    const decoded = jwt.decode(token);
    console.log('📋 Decoded token:', decoded);

    // 3. Verify token signature
    console.log('\n3. Verifying Token Signature...');
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token signature valid');
      console.log('📋 Verified payload:', verified);
    } catch (error) {
      console.log('❌ Token signature invalid:', error.message);
      return;
    }

    // 4. Test database query with token data
    console.log('\n4. Testing Database Query...');
    console.log('🔍 Looking for employee with ID:', decoded.id);
    console.log('🔍 Role from token:', decoded.role);

    const result = await query(
      'SELECT id, username, email, full_name, role, salon_id, is_active FROM admins WHERE id = $1 AND role = $2 AND is_active = true',
      [decoded.id, 'employee']
    );

    if (result.rows.length > 0) {
      console.log('✅ Employee found in database');
      console.log('📋 Employee data:', result.rows[0]);
    } else {
      console.log('❌ Employee not found in database');
      
      // Check if employee exists with different criteria
      console.log('\n🔍 Checking all employees in admins table...');
      const allEmployees = await query(
        'SELECT id, username, email, full_name, role, salon_id, is_active FROM admins WHERE role = $1',
        ['employee']
      );
      console.log('📋 All employees:', allEmployees.rows);
    }

    // 5. Test actual API call
    console.log('\n5. Testing API Call with Token...');
    try {
      const apiResponse = await axios.get(`${API_BASE_URL}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ API call successful');
      console.log('📋 Response:', apiResponse.data);
    } catch (error) {
      console.log('❌ API call failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugTokenVerification();