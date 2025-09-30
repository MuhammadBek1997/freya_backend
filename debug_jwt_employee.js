const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query } = require('./config/database');
require('dotenv').config();

async function debugJWTEmployee() {
  try {
    console.log('🔍 Debugging JWT Employee Authentication...\n');
    
    // Step 1: Login and get token
    console.log('1. Employee Login...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/employee/login', {
      username: 'employee1_1',
      password: 'employee123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('🔑 Token received:', token.substring(0, 50) + '...');
    
    // Step 2: Decode token
    console.log('\n2. Decoding token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('📄 Decoded token:', JSON.stringify(decoded, null, 2));
    
    // Step 3: Test database query
    console.log('\n3. Testing database query...');
    console.log('🔍 Looking for employee with ID:', decoded.id);
    console.log('🔍 Role from token:', decoded.role);
    
    const result = await query(
      'SELECT id, name, phone, email, position, salon_id, is_active FROM employees WHERE id = $1 AND is_active = true',
      [decoded.id]
    );
    
    console.log('📊 Query result:');
    console.log('- Rows found:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('✅ Employee found in database!');
      console.log('📋 Employee data:', JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ Employee not found or not active');
    }
    
    // Step 4: Test the verifyAuth middleware manually
    console.log('\n4. Testing verifyAuth middleware logic...');
    
    let user = null;
    
    if (decoded.role === 'employee') {
      const result = await query(
        'SELECT id, name, surname, phone, email, username, password, salon_id, profession, is_active, created_at, updated_at FROM employees WHERE id = $1 AND is_active = true',
        [decoded.id]
      );
      if (result.rows.length > 0) {
        user = { ...result.rows[0], role: 'employee' };
        console.log('✅ verifyAuth would succeed');
        console.log('👤 User object:', JSON.stringify(user, null, 2));
      } else {
        console.log('❌ verifyAuth would fail - employee not found');
      }
    }
    
    // Step 5: Test actual API call
    console.log('\n5. Testing actual API call...');
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const conversationsResponse = await axios.get('http://localhost:8080/api/user-chat/conversations', { headers });
      console.log('✅ API call successful!');
      console.log('📊 Response:', conversationsResponse.data);
    } catch (error) {
      console.log('❌ API call failed:', error.response?.data?.message || error.message);
      console.log('📊 Status:', error.response?.status);
      console.log('📊 Full error response:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.response?.data || error.message);
  }
}

debugJWTEmployee();