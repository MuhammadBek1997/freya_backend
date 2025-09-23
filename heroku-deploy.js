#!/usr/bin/env node

/**
 * Heroku deployment uchun maxsus konfiguratsiya
 * Bu script Heroku'da CORS va Swagger muammolarini hal qiladi
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Heroku deployment uchun konfiguratsiya...');

// Environment variables tekshirish
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Quyidagi environment variables mavjud emas:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    process.exit(1);
}

// Production environment o'rnatish
process.env.NODE_ENV = 'production';

console.log('✅ Environment variables tekshirildi');
console.log('✅ Production mode o\'rnatildi');

// Server ishga tushirish
console.log('🌟 Server ishga tushirilmoqda...');
require('./server.js');