const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3001';

async function testLoginTokens() {
    console.log('🔐 Login token uniqueness test boshlandi...\n');

    const loginTests = [
        {
            type: 'superadmin',
            endpoint: '/api/auth/superadmin/login',
            credentials: { username: 'testsuperadmin', password: 'superadmin123' }
        },
        {
            type: 'admin',
            endpoint: '/api/auth/admin/login',
            credentials: { username: 'admin', password: 'admin123' }
        },
        {
            type: 'employee',
            endpoint: '/api/auth/employee/login',
            credentials: { username: 'ali_stilist', password: 'password123' }
        }
    ];

    const tokens = [];

    for (const test of loginTests) {
        console.log(`\n📝 ${test.type.toUpperCase()} login test...`);
        
        try {
            // Multiple login attempts for same user
            for (let i = 0; i < 3; i++) {
                const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.credentials);
                
                if (response.data.token) {
                    const token = response.data.token;
                    const decoded = jwt.decode(token);
                    
                    tokens.push({
                        userType: test.type,
                        token: token,
                        attempt: i + 1
                    });
                    
                    console.log(`   Attempt ${i + 1}:`);
                    console.log(`     - Token ID: ${decoded.tokenId}`);
                    console.log(`     - Session ID: ${decoded.sessionId}`);
                    console.log(`     - User Type: ${decoded.userType}`);
                    console.log(`     - User ID: ${decoded.id}`);
                    
                    // Small delay between requests
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
                    console.log(`   ❌ Login failed for ${test.type}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Error testing ${test.type}: ${error.response?.data?.message || error.message}`);
        }
    }

    // Analyze token uniqueness
    console.log('\n🔍 Token uniqueness tahlili...');
    const tokenStrings = tokens.map(t => t.token);
    const uniqueTokens = [...new Set(tokenStrings)];
    
    console.log(`\n📊 Natijalar:`);
    console.log(`   - Jami login attempts: ${tokens.length}`);
    console.log(`   - Unique tokenlar: ${uniqueTokens.length}`);
    console.log(`   - Duplicate tokenlar: ${tokenStrings.length - uniqueTokens.length}`);
    
    if (tokenStrings.length === uniqueTokens.length) {
        console.log('\n✅ Barcha login tokenlar UNIQUE!');
    } else {
        console.log('\n❌ Ba\'zi tokenlar duplicate!');
        
        // Find duplicates
        const duplicates = tokenStrings.filter((token, index) => 
            tokenStrings.indexOf(token) !== index
        );
        console.log(`   Duplicate tokenlar: ${duplicates.length}`);
    }

    // Show token patterns by user type
    console.log('\n🔬 User type bo\'yicha token pattern tahlili:');
    const groupedTokens = tokens.reduce((acc, tokenData) => {
        if (!acc[tokenData.userType]) acc[tokenData.userType] = [];
        acc[tokenData.userType].push(tokenData);
        return acc;
    }, {});

    Object.keys(groupedTokens).forEach(userType => {
        console.log(`\n${userType.toUpperCase()}:`);
        groupedTokens[userType].forEach((tokenData, index) => {
            const decoded = jwt.decode(tokenData.token);
            const prefix = decoded.tokenId.split('_')[0];
            console.log(`   Token ${index + 1}: ${prefix}_[user_id]_[timestamp]_[random]`);
        });
    });

    console.log('\n🎯 Login token test yakunlandi!');
}

// Run test
if (require.main === module) {
    testLoginTokens().catch(console.error);
}

module.exports = { testLoginTokens };