# Heroku'da Swagger CORS Muammosini Hal Qilish

## Muammo
Heroku'da Swagger UI ishlamayapti va CORS xatosi qaytarayapti.

## Hal Qilingan Muammolar

### 1. CSP (Content Security Policy) Sozlamalari
- Heroku domainlari CSP'ga qo'shildi
- Swagger UI uchun kerakli CDN'lar ruxsat etildi
- `https://*.herokuapp.com` domainlari qo'shildi

### 2. CORS Konfiguratsiyasi
- Production va Development uchun alohida CORS sozlamalari
- Heroku domainlari CORS'ga qo'shildi
- Swagger UI uchun maxsus CORS headers

### 3. Swagger UI Konfiguratsiyasi
- Request interceptor'ga CORS headers qo'shildi
- Heroku server URL'i qo'shildi
- Production uchun maxsus CSP headers

## O'zgarishlar

### server.js
```javascript
// CSP sozlamalari Heroku uchun yangilandi
connectSrc: [..., "https://*.herokuapp.com", "https://freya-salon-backend-cc373ce6622a.herokuapp.com"]

// CORS konfiguratsiyasi production uchun
const corsOptions = {
    origin: function (origin, callback) {
        if (process.env.NODE_ENV === 'production') {
            // Faqat ruxsat etilgan domainlar
        } else {
            // Development'da barcha domainlar
        }
    }
}

// Swagger UI uchun maxsus middleware
app.use('/api-docs', (req, res, next) => {
    // CORS va CSP headers
}, swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
```

### config/swagger.js
```javascript
// Heroku server qo'shildi
servers: [
    {
        url: 'https://freya-salon-backend-cc373ce6622a.herokuapp.com',
        description: 'Production server (Heroku)'
    }
]

// Request interceptor'ga CORS headers qo'shildi
requestInterceptor: (req) => {
    req.headers['Access-Control-Allow-Origin'] = '*';
    req.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    req.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
}
```

### Procfile
```
web: NODE_ENV=production node heroku-deploy.js
```

### heroku-deploy.js
- Environment variables tekshirish
- Production mode o'rnatish
- Server ishga tushirish

## Deployment Qadamlari

1. **Environment Variables O'rnatish**
```bash
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your_database_url
heroku config:set JWT_SECRET=your_jwt_secret
```

2. **Deploy Qilish**
```bash
git add .
git commit -m "Fix Swagger CORS issues for Heroku"
git push heroku main
```

3. **Tekshirish**
- Swagger UI: `https://your-app.herokuapp.com/api-docs`
- API Health: `https://your-app.herokuapp.com/api/health`

## Muhim Eslatmalar

1. **Production'da CORS** - Faqat ruxsat etilgan domainlarga ruxsat beriladi
2. **Development'da CORS** - Barcha domainlarga ruxsat beriladi
3. **CSP Headers** - Swagger UI uchun kerakli CDN'lar ruxsat etilgan
4. **Environment Variables** - Production'da to'liq o'rnatilishi kerak

## Test Qilish

```bash
# Swagger UI
curl https://your-app.herokuapp.com/api-docs

# Swagger JSON
curl https://your-app.herokuapp.com/api/swagger.json

# API Health
curl https://your-app.herokuapp.com/api/health
```

## Xatoliklar

Agar hali ham CORS xatosi bo'lsa:

1. Browser console'ni tekshiring
2. Network tab'da request headers'ni ko'ring
3. Heroku logs'ni tekshiring: `heroku logs --tail`
4. Environment variables'ni tekshiring: `heroku config`

## Qo'shimcha Sozlamalar

Frontend domain qo'shish uchun:
```javascript
const allowedOrigins = [
    'https://freya-salon-backend-cc373ce6622a.herokuapp.com',
    'https://your-frontend-domain.com', // Bu yerga frontend domain qo'shing
    'https://*.herokuapp.com'
];
```