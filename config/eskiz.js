require('dotenv').config();

const eskizConfig = {
    email: process.env.ESKIZ_EMAIL || '',
    password: process.env.ESKIZ_PASSWORD || '',
    token: process.env.ESKIZ_TOKEN || '',
    baseUrl: process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api',
    endpoints: {
        auth: '/auth/login',
        sendSms: '/message/sms/send',
        getBalance: '/user/get-limit',
        refreshToken: '/auth/refresh'
    }
};

module.exports = eskizConfig;