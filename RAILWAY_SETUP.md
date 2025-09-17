# Railway Deployment Guide - Freya Backend

## 🚀 Railway ga Deploy qilish

### 1. Railway CLI o'rnatish
```bash
npm install -g @railway/cli
```

### 2. Railway ga login qilish
```bash
railway login
```

### 3. Loyihani Railway ga ulash
```bash
# Backend papkasida
cd backend
railway link
```

### 4. Environment Variables o'rnatish

Railway dashboard da yoki CLI orqali quyidagi environment variables ni o'rnating:

```bash
# Database
railway variables set DATABASE_URL="your_postgresql_url_here"

# JWT
railway variables set JWT_SECRET="your_jwt_secret_here"
railway variables set JWT_EXPIRES_IN="7d"

# Server
railway variables set NODE_ENV="production"
railway variables set PORT="5000"

# Frontend
railway variables set FRONTEND_URL="https://your-frontend-url.com"

# Click Payment (ixtiyoriy)
railway variables set CLICK_MERCHANT_ID="your_merchant_id"
railway variables set CLICK_SECRET_KEY="your_secret_key"

# SMS Service (ixtiyoriy)
railway variables set SMS_API_KEY="your_sms_api_key"
```

### 5. Deploy qilish
```bash
# Avtomatik deploy
railway up

# Yoki git orqali
git add .
git commit -m "Railway deployment setup"
git push origin main
```

### 6. Domain olish
```bash
# Custom domain o'rnatish
railway domain
```

## 📋 Konfiguratsiya fayllar

### railway.json
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

## 🔍 Test qilish

Deploy qilgandan so'ng quyidagi endpoint larni test qiling:

1. **Asosiy sahifa**: `https://your-app.railway.app/`
2. **Health check**: `https://your-app.railway.app/api/health`
3. **Database test**: `https://your-app.railway.app/api/db-test`
4. **Swagger docs**: `https://your-app.railway.app/api-docs`

## 🛠️ Debugging

### Loglarni ko'rish
```bash
railway logs
```

### Service holatini tekshirish
```bash
railway status
```

### Environment variables ko'rish
```bash
railway variables
```

## ⚠️ Muhim eslatmalar

1. **Database**: PostgreSQL database Railway da yarating yoki tashqi database ishlatishingiz mumkin
2. **Environment Variables**: Barcha kerakli environment variables o'rnatilganligini tekshiring
3. **CORS**: Frontend URL ni to'g'ri o'rnating
4. **SSL**: Railway avtomatik HTTPS ta'minlaydi
5. **Logs**: Xatolarni kuzatish uchun loglarni muntazam tekshiring

## 🔗 Foydali linklar

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Custom Domains](https://docs.railway.app/deploy/custom-domains)