const { pool } = require('./config/database');

async function testMiddlewareQuery() {
    console.log('🔍 Testing Middleware Query...\n');

    try {
        // This is the exact query from verifyAuth middleware
        const query = `
            SELECT id, username, email, full_name, role, salon_id, is_active, created_at, updated_at 
            FROM admins 
            WHERE id = $1 AND role = $2 AND is_active = true
        `;
        
        const userId = 34;
        const userRole = 'employee';
        
        console.log('Query:', query);
        console.log('Parameters:', [userId, userRole]);
        
        const result = await pool.query(query, [userId, userRole]);
        
        console.log('Query result:');
        console.log('- Rows found:', result.rows.length);
        if (result.rows.length > 0) {
            console.log('- User data:', result.rows[0]);
        } else {
            console.log('- No rows found');
            
            // Let's check what happens without the role filter
            console.log('\n🔍 Testing without role filter...');
            const queryWithoutRole = `
                SELECT id, username, email, full_name, role, salon_id, is_active, created_at, updated_at 
                FROM admins 
                WHERE id = $1 AND is_active = true
            `;
            
            const resultWithoutRole = await pool.query(queryWithoutRole, [userId]);
            console.log('Without role filter:');
            console.log('- Rows found:', resultWithoutRole.rows.length);
            if (resultWithoutRole.rows.length > 0) {
                console.log('- User data:', resultWithoutRole.rows[0]);
            }
        }
        
    } catch (error) {
        console.error('❌ Query failed:', error.message);
    }
    
    process.exit();
}

testMiddlewareQuery();