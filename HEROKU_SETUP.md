# Heroku Deployment Yo'riqnomasi

## Muammo
Heroku da server ishlamayapti va "Server xatosi yuz berdi!" xabari chiqayapti.

## Sabab
DATABASE_URL environment variable to'g'ri o'rnatilmagan.

## Yechim

### 1. Heroku CLI orqali environment variables o'rnatish

```bash
# Heroku CLI bilan login qiling
heroku login

# Loyihangizga o'ting
heroku git:remote -a freyasalon-6f0b3dc79e01

# Database URL ni o'rnating (PostgreSQL addon qo'shganingizdan keyin)
heroku addons:create heroku-postgresql:mini

# Boshqa environment variables ni o'rnating
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Eskiz SMS sozlamalari
heroku config:set ESKIZ_EMAIL=test@eskiz.uz
heroku config:set ESKIZ_PASSWORD=j6DWtQjjpLDNjWEk74Sx
heroku config:set ESKIZ_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEwNjY3NDYsImlhdCI6MTc1ODQ3NDc0Niwicm9sZSI6InVzZXIiLCJzaWduIjoiY2Y0MjBjNzQ5ODQ0NjhkMjVlMDI2ODkyNTI1NTZlZTgzZTc5OWUxMjIxMzFiMGNlYTBkYzAxZmE4MTIxMjRkMyIsInN1YiI6IjExOTE5In0.kufQYF5VAmLecgb9sA4Ej_NRtj4EHgiLK7WpniDYlL0
heroku config:set ESKIZ_BASE_URL=https://notify.eskiz.uz/api

# Click Payment sozlamalari
heroku config:set CLICK_MERCHANT_ID=your_merchant_id
heroku config:set CLICK_SERVICE_ID=your_service_id
heroku config:set CLICK_SECRET_KEY=your_secret_key

# Environment variables ni tekshiring
heroku config
```

### 2. Heroku Dashboard orqali o'rnatish

1. https://dashboard.heroku.com/ ga kiring
2. `freyasalon-6f0b3dc79e01` app ni tanlang
3. Settings tab ga o'ting
4. Config Vars bo'limida quyidagi variables ni qo'shing:

```
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com

# Eskiz SMS Configuration
ESKIZ_EMAIL=test@eskiz.uz
ESKIZ_PASSWORD=j6DWtQjjpLDNjWEk74Sx
ESKIZ_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEwNjY3NDYsImlhdCI6MTc1ODQ3NDc0Niwicm9sZSI6InVzZXIiLCJzaWduIjoiY2Y0MjBjNzQ5ODQ0NjhkMjVlMDI2ODkyNTI1NTZlZTgzZTc5OWUxMjIxMjRkMyIsInN1YiI6IjExOTE5In0.kufQYF5VAmLecgb9sA4Ej_NRtj4EHgiLK7WpniDYlL0
ESKIZ_BASE_URL=https://notify.eskiz.uz/api

# Click Payment Configuration
CLICK_MERCHANT_ID=your_merchant_id
CLICK_SERVICE_ID=your_service_id
CLICK_SECRET_KEY=your_secret_key
```

### 3. Database tekshirish

Deployment dan keyin quyidagi URL larga tashrif buyuring:

- `https://freyasalon-6f0b3dc79e01.herokuapp.com/` - Asosiy sahifa
- `https://freyasalon-6f0b3dc79e01.herokuapp.com/api/health` - Health check
- `https://freyasalon-6f0b3dc79e01.herokuapp.com/api/db-test` - Database ulanishini tekshirish

### 4. Loglarni tekshirish

```bash
heroku logs --tail -a freyasalon-6f0b3dc79e01
```

## Muhim eslatmalar

1. PostgreSQL addon qo'shganingizdan keyin DATABASE_URL avtomatik o'rnatiladi
2. JWT_SECRET ni production da o'zgartiring
3. FRONTEND_URL ni to'g'ri domain bilan almashtiring
4. Barcha environment variables o'rnatilganidan keyin app ni qayta deploy qiling

## Deployment

```bash
git add .
git commit -m "Fix Heroku deployment configuration"
git push heroku main
```