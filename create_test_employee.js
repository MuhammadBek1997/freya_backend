const jwt = require('jsonwebtoken');

// John Doe employee uchun token yaratish
const employeeData = {
    id: '4199742e-f1c2-429b-82a6-1218b99bdf34',
    role: 'employee',
    name: 'John Doe',
    email: 'john.doe@example.com'
};

const token = jwt.sign(employeeData, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production', {
    expiresIn: '24h'
});

console.log('John Doe employee uchun token:');
console.log(token);

process.exit(0);