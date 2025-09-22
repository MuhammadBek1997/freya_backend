#!/usr/bin/env node

/**
 * Railway Deployment Helper Script
 * Bu script Railway deployment jarayonini osonlashtiradi
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚂 Railway Deployment Helper');
console.log('================================');

// Railway CLI mavjudligini tekshirish
function checkRailwayCLI() {
    try {
        execSync('railway --version', { stdio: 'ignore' });
        console.log('✅ Railway CLI mavjud');
        return true;
    } catch (error) {
        console.log('❌ Railway CLI topilmadi');
        console.log('📦 O\'rnatish: npm install -g @railway/cli');
        return false;
    }
}

// Package.json mavjudligini tekshirish
function checkPackageJson() {
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
        console.log('✅ package.json mavjud');
        return true;
    } else {
        console.log('❌ package.json topilmadi');
        return false;
    }
}

// Railway.json mavjudligini tekshirish
function checkRailwayConfig() {
    const railwayPath = path.join(__dirname, 'railway.json');
    if (fs.existsSync(railwayPath)) {
        console.log('✅ railway.json konfiguratsiyasi mavjud');
        return true;
    } else {
        console.log('❌ railway.json topilmadi');
        return false;
    }
}

// Environment variables ro'yxati
function showRequiredEnvVars() {
    console.log('\n📋 Kerakli Environment Variables:');
    console.log('================================');
    
    const requiredVars = [
        'DATABASE_URL (Railway avtomatik beradi)',
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'FRONTEND_URL',
        'ESKIZ_EMAIL',
        'ESKIZ_PASSWORD',
        'NODE_ENV=production'
    ];
    
    requiredVars.forEach((varName, index) => {
        console.log(`${index + 1}. ${varName}`);
    });
}

// Deployment qo'llanma
function showDeploymentSteps() {
    console.log('\n🚀 Deployment Qadamlari:');
    console.log('========================');
    
    const steps = [
        'https://railway.app ga o\'ting',
        'GitHub orqali ro\'yxatdan o\'ting',
        '"Deploy from GitHub repo" ni tanlang',
        'freyaProject repository\'ni tanlang',
        'freya_backend papkasini ko\'rsating',
        'Environment variables qo\'shing',
        'PostgreSQL database yarating',
        'Deploy tugmasini bosing!'
    ];
    
    steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
    });
}

// Database schema script
function createDatabaseScript() {
    const schemaSQL = `
-- Freya Salon Database Schema
-- Railway PostgreSQL uchun

CREATE TABLE IF NOT EXISTS salons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test ma'lumotlari qo'shish
INSERT INTO salons (name, address, city, district, phone, email, description) VALUES
('Freya Beauty Salon', 'Amir Temur ko\'chasi 15', 'Toshkent', 'Yunusobod', '+998901234567', 'info@freyasalon.uz', 'Zamonaviy go\'zallik saloni'),
('Elite Beauty Center', 'Mustaqillik ko\'chasi 25', 'Toshkent', 'Mirobod', '+998901234568', 'elite@beauty.uz', 'Premium go\'zallik markazi'),
('Luxury Spa Salon', 'Bobur ko\'chasi 10', 'Toshkent', 'Shayxontohur', '+998901234569', 'luxury@spa.uz', 'Hashamatli spa salon'),
('Modern Beauty Studio', 'Navoi ko\'chasi 30', 'Toshkent', 'Olmazor', '+998901234570', 'modern@studio.uz', 'Zamonaviy go\'zallik studiyasi'),
('Royal Beauty Palace', 'Abdulla Qodiriy ko\'chasi 5', 'Toshkent', 'Yakkasaroy', '+998901234571', 'royal@palace.uz', 'Qirollik go\'zallik saroyi');

-- Indekslar yaratish
CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);
CREATE INDEX IF NOT EXISTS idx_salons_district ON salons(district);
CREATE INDEX IF NOT EXISTS idx_salons_name ON salons(name);
`;

    fs.writeFileSync(path.join(__dirname, 'railway_schema.sql'), schemaSQL);
    console.log('✅ railway_schema.sql fayli yaratildi');
}

// Asosiy funksiya
function main() {
    console.log('\n🔍 Tekshiruvlar:');
    console.log('================');
    
    const hasPackageJson = checkPackageJson();
    const hasRailwayConfig = checkRailwayConfig();
    const hasRailwayCLI = checkRailwayCLI();
    
    if (hasPackageJson && hasRailwayConfig) {
        console.log('\n✅ Loyiha Railway deployment uchun tayyor!');
        
        // Database schema yaratish
        createDatabaseScript();
        
        // Qo'llanma ko'rsatish
        showDeploymentSteps();
        showRequiredEnvVars();
        
        console.log('\n🌐 Foydali linklar:');
        console.log('==================');
        console.log('Railway Dashboard: https://railway.app/dashboard');
        console.log('Railway Docs: https://docs.railway.app');
        console.log('GitHub Repository: https://github.com/your-username/freyaProject');
        
        console.log('\n🎉 Muvaffaqiyat bilan deployment qiling!');
        
    } else {
        console.log('\n❌ Ba\'zi fayllar etishmayapti. Iltimos tekshiring.');
    }
}

// Script ishga tushirish
if (require.main === module) {
    main();
}

module.exports = {
    checkRailwayCLI,
    checkPackageJson,
    checkRailwayConfig,
    showRequiredEnvVars,
    showDeploymentSteps,
    createDatabaseScript
};