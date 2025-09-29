const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate test token for user
function generateTestToken() {
  const userId = '6165fd4a-8861-488b-b6ab-55c884df7391'; // UUID for existing user
  const phone = '+99890444001';
  
  // Create payload similar to what the app would create
  const payload = {
    userId: userId,
    id: userId,
    phone: phone,
    role: 'user'
  };
  
  // Generate token with same logic as authMiddleware
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  
  const enhancedPayload = {
    ...payload,
    tokenId: `US_${userId}_${timestamp}_${randomSuffix}`,
    iat: Math.floor(timestamp / 1000),
    userType: 'user',
    sessionId: `US_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  };
  
  const token = jwt.sign(enhancedPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  console.log('Generated token for user:', userId);
  console.log('Token:', token);
  console.log('\\nTest curl command:');
  console.log(`curl -X POST "http://localhost:3033/api/user-chat/send" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{"receiver_id":"33e5cc80-aa9a-44f4-8731-66b338df6dc7","receiver_type":"employee","message_text":"Salom! Men sizning xizmatlaringiz haqida ma'lumot olmoqchiman."}'`);
  
  return token;
}

// Script'ni ishga tushirish
if (require.main === module) {
  generateTestToken();
}

module.exports = { generateTestToken };