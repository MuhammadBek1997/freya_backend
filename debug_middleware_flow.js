const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('./config/database');

const API_BASE_URL = 'http://localhost:8080/api';

async function debugMiddlewareFlow() {
    console.log('🔍 Starting Middleware Flow Debug...\n');

    try {
        // Step 1: Login and get token
        console.log('1️⃣ Employee Login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/employee/login`, {
            username: 'employee1_1',
            password: 'employee123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

        // Step 2: Decode token
        console.log('\n2️⃣ Token Analysis...');
        const decoded = jwt.decode(token);
        console.log('Decoded token payload:', JSON.stringify(decoded, null, 2));

        // Step 3: Verify token signature
        console.log('\n3️⃣ Token Signature Verification...');
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            console.log('✅ Token signature is valid');
            console.log('Verified payload:', JSON.stringify(verified, null, 2));
        } catch (error) {
            console.log('❌ Token signature verification failed:', error.message);
            return;
        }

        // Step 4: Manual middleware simulation
        console.log('\n4️⃣ Manual Middleware Simulation...');
        
        // Extract user ID and role from token
        const userId = decoded.id;
        const userRole = decoded.role;
        
        console.log('User ID from token:', userId, '(type:', typeof userId, ')');
        console.log('User role from token:', userRole);

        // Step 5: Database query simulation (exactly like middleware)
        console.log('\n5️⃣ Database Query Simulation...');
        
        try {
            // This is exactly what authMiddleware.js does
            const userQuery = `
                SELECT id, username, email, full_name, role, salon_id, is_active, created_at, updated_at
                FROM admins 
                WHERE id = $1 AND is_active = true
            `;
            
            console.log('Executing query:', userQuery);
            console.log('With parameter:', userId);
            
            const userResult = await pool.query(userQuery, [userId]);
            
            if (userResult.rows.length === 0) {
                console.log('❌ No user found in database with ID:', userId);
                
                // Let's check what users actually exist
                console.log('\n🔍 Checking existing users in admins table...');
                const allUsersResult = await pool.query('SELECT id, username, role FROM admins WHERE is_active = true');
                console.log('Active users in admins table:');
                allUsersResult.rows.forEach(user => {
                    console.log(`  - ID: ${user.id} (${typeof user.id}), Username: ${user.username}, Role: ${user.role}`);
                });
            } else {
                console.log('✅ User found in database:', userResult.rows[0]);
            }
            
        } catch (dbError) {
            console.log('❌ Database query error:', dbError.message);
        }

        // Step 6: Test actual API call
        console.log('\n6️⃣ Actual API Call Test...');
        try {
            const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ API call successful:', response.data);
        } catch (apiError) {
            console.log('❌ API call failed:', apiError.response?.status, apiError.response?.data);
            
            // Let's check the exact error from the server logs
            console.log('Full error response:', apiError.response?.data);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

debugMiddlewareFlow();