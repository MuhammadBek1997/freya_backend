const jwt = require('jsonwebtoken');
const { query } = require('./config/database');
require('dotenv').config();

async function debugEmployeeAuth() {
  try {
    console.log('🔍 Debugging Employee Authentication...\n');
    
    // Test token from the previous login
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE2MWQ2OTdjLWNhZjMtNGFmOS04ZWYxLWUwMjAxZmNkODU4YSIsInVzZXJuYW1lIjoiZW1wbG95ZWUxXzEiLCJyb2xlIjoiZW1wbG95ZWUiLCJzYWxvbl9pZCI6Ijc0NzBiZmE5LWQxZDMtNDJmMS04NmQ1LThiOWYyOWFhYTdjMiIsInRva2VuSWQiOiJFTV8xNjFkNjk3Yy1jYWYzLTRhZjktOGVmMS1lMDIwMWZjZDg1OGFfMTc1OTIxOTQ3MzkxNV9jaGIwdmFobGJqIiwiaWF0IjoxNzU5MjE5NDczLCJ1c2VyVHlwZSI6ImVtcGxveWVlIiwic2Vzc2lvbklkIjoiRU1fMTc1OTIxOTQ3MzkxNV80d3JmcWQ3ayIsImV4cCI6MTc1OTgyNDI3M30.OetqCvqKw83wqtgAbcjf2vceGR4VGXVDiF6W7FbgM_o';
    
    console.log('1. Decoding token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('📄 Decoded token:', JSON.stringify(decoded, null, 2));
    
    console.log('\n2. Checking employee in database...');
    console.log('🔍 Looking for employee with ID:', decoded.id);
    console.log('🔍 Role from token:', decoded.role);
    
    // Test the exact query from verifyAuth middleware
    const result = await query(
      'SELECT id, name, surname, phone, email, username, password, salon_id, profession, is_active, created_at, updated_at FROM employees WHERE id = $1 AND is_active = true',
      [decoded.id]
    );
    
    console.log('📊 Query result:');
    console.log('- Rows found:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('✅ Employee found!');
      console.log('📋 Employee data:', JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ Employee not found or not active');
      
      // Let's check if the employee exists at all
      const checkResult = await query(
        'SELECT id, name, surname, phone, email, username, password, salon_id, profession, is_active FROM employees WHERE id = $1',
        [decoded.id]
      );
      
      console.log('\n🔍 Checking if employee exists (ignoring is_active):');
      console.log('- Rows found:', checkResult.rows.length);
      
      if (checkResult.rows.length > 0) {
        console.log('📋 Employee data (including inactive):', JSON.stringify(checkResult.rows[0], null, 2));
      } else {
        console.log('❌ Employee does not exist in database');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugEmployeeAuth();