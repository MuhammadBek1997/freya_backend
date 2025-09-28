require('dotenv').config();
const jwt = require('jsonwebtoken');
const { query } = require('./config/database');

async function debugAuth() {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODczZjIyLTJjNDktNDVkNS1iYmY2LWFkNzE4OGIwN2U0OCIsInVzZXJuYW1lIjoiYWRtaW4xIiwicm9sZSI6ImFkbWluIiwidG9rZW5JZCI6IkFEXzY4ODczZjIyLTJjNDktNDVkNS1iYmY2LWFkNzE4OGIwN2U0OF8xNzU4OTk2OTI2NDUyX3l1eDNnMGtwOHVlIiwiaWF0IjoxNzU4OTk2OTI2LCJ1c2VyVHlwZSI6ImFkbWluIiwic2Vzc2lvbklkIjoiQURfMTc1ODk5NjkyNjQ1Ml8zZzZ5MGlhayIsImV4cCI6MTc1OTYwMTcyNn0.6-WnNHejAx1H87UnKKx2D_co64IJay-eoxxombh22cg';
        
        console.log('🔍 Token debug boshlandi...\n');
        
        // 1. Token decode
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded:', JSON.stringify(decoded, null, 2));
        
        // 2. Role check
        console.log(`\n🎭 Role: ${decoded.role}`);
        
        // 3. Admin table check
        if (decoded.role === 'admin' || decoded.role === 'superadmin') {
            console.log('\n🔍 Admin jadvalidan qidirilmoqda...');
            const result = await query(
                'SELECT id, username, email, password_hash, full_name, salon_id, is_active, created_at, updated_at FROM admins WHERE id = $1 AND is_active = true',
                [decoded.id]
            );
            
            console.log(`📊 Admin query natijasi: ${result.rows.length} ta qator topildi`);
            if (result.rows.length > 0) {
                console.log('✅ Admin topildi:', {
                    id: result.rows[0].id,
                    username: result.rows[0].username,
                    is_active: result.rows[0].is_active
                });
                
                const user = { ...result.rows[0], role: decoded.role };
                console.log('\n🎯 req.user ga o\'rnatilishi kerak bo\'lgan obyekt:');
                console.log(JSON.stringify(user, null, 2));
            } else {
                console.log('❌ Admin topilmadi');
            }
        }
        
        // 4. User table check (fallback)
        console.log('\n🔍 User jadvalidan ham qidirilmoqda...');
        const userId = decoded.userId || decoded.id;
        const userResult = await query(
            'SELECT id, phone, email, password_hash, first_name, last_name, full_name, username, registration_step, phone_verified, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
            [userId]
        );
        
        console.log(`📊 User query natijasi: ${userResult.rows.length} ta qator topildi`);
        if (userResult.rows.length > 0) {
            console.log('✅ User topildi:', {
                id: userResult.rows[0].id,
                phone: userResult.rows[0].phone,
                is_active: userResult.rows[0].is_active
            });
        } else {
            console.log('❌ User topilmadi');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Debug xatosi:', error);
        process.exit(1);
    }
}

debugAuth();