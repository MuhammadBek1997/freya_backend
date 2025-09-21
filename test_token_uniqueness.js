const { generateToken } = require('./middleware/authMiddleware');

// Test token uniqueness
function testTokenUniqueness() {
    console.log('🔐 Token uniqueness test boshlandi...\n');

    // Test data for different user types
    const testUsers = [
        { id: 1, username: 'superadmin', role: 'superadmin' },
        { id: 1, username: 'admin1', role: 'admin', salon_id: 1 },
        { id: 1, username: 'employee1', role: 'employee', salon_id: 1 },
        { id: 1, username: 'user1', role: 'user' }
    ];

    const tokens = [];

    // Generate tokens for each user type
    testUsers.forEach((user, index) => {
        console.log(`\n📝 ${user.role.toUpperCase()} uchun token yaratilmoqda...`);
        
        // Generate multiple tokens for same user to test uniqueness
        for (let i = 0; i < 3; i++) {
            const token = generateToken(user);
            tokens.push({
                userType: user.role,
                userId: user.id,
                token: token,
                tokenNumber: i + 1
            });
            
            // Decode token to show payload
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(token);
            
            console.log(`   Token ${i + 1}:`);
            console.log(`     - Token ID: ${decoded.tokenId}`);
            console.log(`     - Session ID: ${decoded.sessionId}`);
            console.log(`     - User Type: ${decoded.userType}`);
            console.log(`     - IAT: ${decoded.iat}`);
            
            // Small delay to ensure different timestamps
            const start = Date.now();
            while (Date.now() - start < 100) {
                // Simple delay loop
            }
        }
    });

    // Check for duplicates
    console.log('\n🔍 Token uniqueness tekshirilmoqda...');
    const tokenStrings = tokens.map(t => t.token);
    const uniqueTokens = [...new Set(tokenStrings)];
    
    console.log(`\n📊 Natijalar:`);
    console.log(`   - Jami yaratilgan tokenlar: ${tokenStrings.length}`);
    console.log(`   - Unique tokenlar: ${uniqueTokens.length}`);
    console.log(`   - Duplicate tokenlar: ${tokenStrings.length - uniqueTokens.length}`);
    
    if (tokenStrings.length === uniqueTokens.length) {
        console.log('\n✅ Barcha tokenlar UNIQUE!');
    } else {
        console.log('\n❌ Ba\'zi tokenlar duplicate!');
    }

    // Show token structure analysis
    console.log('\n🔬 Token tuzilishi tahlili:');
    tokens.forEach((tokenData, index) => {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(tokenData.token);
        
        if (index < 4) { // Show first 4 tokens
            console.log(`\n${tokenData.userType.toUpperCase()} Token ${tokenData.tokenNumber}:`);
            console.log(`   - Token ID pattern: ${decoded.tokenId.split('_')[0]}_${decoded.tokenId.split('_')[1]}_[timestamp]_[random]`);
            console.log(`   - Session ID pattern: ${decoded.sessionId.split('_')[0]}_[timestamp]_[random]`);
        }
    });

    console.log('\n🎯 Test yakunlandi!');
}

// Run test
if (require.main === module) {
    testTokenUniqueness();
}

module.exports = { testTokenUniqueness };