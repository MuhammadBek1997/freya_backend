# 🚂 Railway Deployment Guide - Freya Backend

## 🎯 Nima uchun Railway?

- ✅ **100% BEPUL** - 500 soat/oy (Heroku'dan yaxshiroq)
- ✅ **PostgreSQL database** bepul
- ✅ **Avtomatik deployment** GitHub'dan
- ✅ **Environment variables** oson sozlash
- ✅ **Custom domain** qo'llab-quvvatlaydi
- ✅ **Tez va ishonchli**

## 📋 Qadamlar

### 1. Railway Account Yaratish

1. https://railway.app ga o'ting
2. **"Start a New Project"** tugmasini bosing
3. **GitHub** orqali ro'yxatdan o'ting
4. **"Deploy from GitHub repo"** ni tanlang

### 2. Repository Ulash

1. **freyaProject** repository'ni tanlang
2. **freya_backend** papkasini ko'rsating
3. **Deploy** tugmasini bosing

### 3. Environment Variables Qo'shish

Railway dashboard'da **Variables** bo'limiga o'ting va quyidagilarni qo'shing:

```bash
# Database (Railway avtomatik beradi)
DATABASE_URL=postgresql://...

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Eskiz SMS Service
ESKIZ_EMAIL=fayzullindmr@gmail.com
ESKIZ_PASSWORD=rlPJjmkaqRvZshRoNpcIiCFtC5GiNzI7k7YNe8fs
ESKIZ_BASE_URL=https://notify.eskiz.uz/api

# Click Payment (ixtiyoriy)
CLICK_MERCHANT_ID=your_merchant_id
CLICK_SERVICE_ID=your_service_id
CLICK_SECRET_KEY=your_secret_key

# Node Environment
NODE_ENV=production
```

### 4. Database Yaratish

1. Railway dashboard'da **"+ New"** tugmasini bosing
2. **"Database"** → **"PostgreSQL"** ni tanlang
3. Database yaratilgandan keyin **DATABASE_URL** avtomatik qo'shiladi

### 5. Database Schema Yaratish

Railway database'iga ulanib, schema yaratish kerak:

```sql
-- Salonlar jadvali
CREATE TABLE salons (
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

-- Boshqa jadvallar ham kerak bo'lsa qo'shiladi...
```

### 6. Test Qilish

Deployment tugagandan keyin:

1. **Railway URL** ni oling (masalan: https://freya-backend-production.up.railway.app)
2. Health check: `https://your-app.up.railway.app/api/health`
3. Salonlar: `https://your-app.up.railway.app/api/salons`

## 🛠️ Deployment Buyruqlari

Agar manual deployment kerak bo'lsa:

```bash
# Railway CLI o'rnatish
npm install -g @railway/cli

# Login qilish
railway login

# Project yaratish
railway init

# Deploy qilish
railway up
```

## 🔧 Sozlamalar

### railway.json fayli (allaqachon mavjud):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

## 📊 Railway vs Heroku

| Xususiyat | Railway | Heroku |
|-----------|---------|--------|
| Bepul plan | ✅ 500 soat/oy | ❌ To'lov kerak |
| Database | ✅ PostgreSQL bepul | ❌ To'lov kerak |
| Deployment | ✅ Avtomatik | ✅ Avtomatik |
| Custom domain | ✅ Bepul | ❌ To'lov kerak |
| SSL | ✅ Avtomatik | ✅ Avtomatik |

## 🚀 Keyingi Qadamlar

1. Railway'da account yarating
2. Repository'ni ulang
3. Environment variables qo'shing
4. Database yarating va schema qo'shing
5. Test qiling!

**Natija**: 15-20 daqiqada to'liq ishlaydigan backend! 🎉