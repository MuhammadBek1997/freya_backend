#!/bin/bash

# Heroku Deployment Script for Freya Backend
echo "🚀 Heroku deployment boshlandi..."

# Heroku remote qo'shish
echo "📡 Heroku remote qo'shilmoqda..."
heroku git:remote -a freyasalon-6f0b3dc79e01

# Environment variables o'rnatish
echo "⚙️ Environment variables o'rnatilmoqda..."

# Asosiy sozlamalar
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=freya_super_secret_jwt_key_2024_production
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set FRONTEND_URL=https://freya-admin.vercel.app

# Eskiz SMS sozlamalari
heroku config:set ESKIZ_EMAIL=test@eskiz.uz
heroku config:set ESKIZ_PASSWORD=j6DWtQjjpLDNjWEk74Sx
heroku config:set ESKIZ_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEwNjY3NDYsImlhdCI6MTc1ODQ3NDc0Niwicm9sZSI6InVzZXIiLCJzaWduIjoiY2Y0MjBjNzQ5ODQ0NjhkMjVlMDI2ODkyNTI1NTZlZTgzZTc5OWUxMjIxMjRkMyIsInN1YiI6IjExOTE5In0.kufQYF5VAmLecgb9sA4Ej_NRtj4EHgiLK7WpniDYlL0
heroku config:set ESKIZ_BASE_URL=https://notify.eskiz.uz/api

# Click Payment sozlamalari
heroku config:set CLICK_MERCHANT_ID=your_merchant_id
heroku config:set CLICK_SERVICE_ID=your_service_id
heroku config:set CLICK_SECRET_KEY=your_secret_key

# File upload sozlamalari
heroku config:set UPLOAD_PATH=uploads/
heroku config:set MAX_FILE_SIZE=5242880

echo "📋 Environment variables tekshirilmoqda..."
heroku config

echo "🔄 Deployment boshlandi..."
git add .
git commit -m "Update Heroku deployment with Eskiz SMS and new database"
git push heroku main

echo "🏥 Health check..."
sleep 10
curl https://freyasalon-6f0b3dc79e01.herokuapp.com/api/health

echo "✅ Deployment yakunlandi!"
echo "🌐 URL: https://freyasalon-6f0b3dc79e01.herokuapp.com/"