const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mavjud employee ma'lumotlari (jadvaldan olingan)
const employeeData = {
    id: '239953f4-19a6-42be-8f24-744446f202dd', // Mavjud employee ID
    role: 'employee',
    name: 'Test Employee',
    email: 'test@employee.com'
};

// Token yaratish
const token = jwt.sign(
    employeeData,
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);

console.log('Employee Token:');
console.log(token);
console.log('\nToken ma\'lumotlari:');
console.log(jwt.decode(token));