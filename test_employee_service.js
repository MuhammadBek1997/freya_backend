require('dotenv').config();
const employeeTranslationService = require('./services/employeeTranslationService');

async function testEmployeeService() {
    try {
        console.log('🧪 EMPLOYEE TRANSLATION SERVICE TESTI\n');

        // Service mavjudligini tekshirish
        console.log('Service object:', employeeTranslationService);
        console.log('Service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(employeeTranslationService)));

        // getEmployeeByLanguage funksiyasini test qilish
        const testEmployeeId = '208c0d66-c2bc-4e12-8632-7d9687feace2'; // Mavjud employee ID
        
        console.log(`\n🔍 Testing getEmployeeByLanguage for employee: ${testEmployeeId}`);
        
        const result = await employeeTranslationService.getEmployeeByLanguage(testEmployeeId, 'uz');
        console.log('✅ Result:', result);
        
    } catch (error) {
        console.error('❌ Xatolik:', error);
        console.error('Stack:', error.stack);
    }
}

testEmployeeService();