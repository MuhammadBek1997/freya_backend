# Heroku Manual Setup - Freya Backend

## ⚠️ Muhim Muammolar va Yechimlar

### 1. ✅ Hal Qilingan Muammolar:
- **Salonlar bo'sh array qaytaradi** ✅ YECHILDI - Database'ga ma'lumotlar qo'shildi
- **Database schema muammolari** ✅ YECHILDI - Schema tekshirildi va to'g'rilandi
- **App nomi muammosi** ✅ YECHILDI - To'g'ri app nomi aniqlandi (freyasalon)

### 2. 🚨 ASOSIY MUAMMO: Heroku Account Suspended

**Account**: s1ismoil04@gmail.com
**Sabab**: Non-payment (to'lov qilmaslik)
**Natija**: Barcha Heroku xizmatlari to'xtatilgan

**Yechim**: https://dashboard.heroku.com/account/pay-balance ga o'tib to'lovni amalga oshirish kerak

### 3. 📊 Database Holati:
- ✅ Database connection ishlaydi (to'lov keyin)
- ✅ 5 ta salon qo'shildi (Beauty Palace, Luxury Spa, va boshqalar)
- ✅ Schema to'g'ri (id, name, address, city, district columns)

## 🚨 Muhim: SMS Xatosini Tuzatish

Hozirda Heroku deployment'ida SMS funksiyasi ishlamayapti. Quyidagi qadamlarni bajaring:

## 1. Heroku Dashboard orqali Environment Variables o'rnatish

1. **Heroku Dashboard'ga kiring**: https://dashboard.heroku.com/
2. **App'ni tanlang**: `freyasalon-6f0b3dc79e01`
3. **Settings** tab'ga o'ting
4. **Config Vars** bo'limida **Reveal Config Vars** tugmasini bosing
5. Quyidagi variables'larni qo'shing yoki yangilang:

### Asosiy Sozlamalar
```
NODE_ENV=production
PORT=(Heroku avtomatik o'rnatadi)
DATABASE_URL=postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l
```

### JWT Sozlamalari
```
JWT_SECRET=freya_super_secret_jwt_key_2024_production
JWT_EXPIRES_IN=7d
```

### Frontend URL
```
FRONTEND_URL=https://freya-admin.vercel.app
```

### 🔥 Eskiz SMS Sozlamalari (MUHIM!)
```
ESKIZ_EMAIL=test@eskiz.uz
ESKIZ_PASSWORD=j6DWtQjjpLDNjWEk74Sx
ESKIZ_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEwNjY3NDYsImlhdCI6MTc1ODQ3NDc0Niwicm9sZSI6InVzZXIiLCJzaWduIjoiY2Y0MjBjNzQ5ODQ0NjhkMjVlMDI2ODkyNTI1NTZlZTgzZTc5OWUxMjIxMjRkMyIsInN1YiI6IjExOTE5In0.kufQYF5VAmLecgb9sA4Ej_NRtj4EHgiLK7WpniDYlL0
ESKIZ_BASE_URL=https://notify.eskiz.uz/api
```

### Click Payment Sozlamalari
```
CLICK_MERCHANT_ID=your_merchant_id
CLICK_SERVICE_ID=your_service_id
CLICK_SECRET_KEY=your_secret_key
CLICK_BASE_URL=https://api.click.uz/v2/merchant
```

### File Upload Sozlamalari
```
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880
```

## 2. App'ni Qayta Deploy Qilish

Environment variables qo'shgandan keyin:

1. **Deploy** tab'ga o'ting
2. **Manual deploy** bo'limida
3. **Deploy Branch** tugmasini bosing
4. Yoki GitHub'dan avtomatik deploy sozlang

## 3. Test Qilish

Deploy tugagandan keyin quyidagi URL'larni test qiling:

### Health Check
```
https://freyasalon-6f0b3dc79e01.herokuapp.com/api/health
```

### SMS Test
```bash
curl -X POST https://freyasalon-6f0b3dc79e01.herokuapp.com/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998901234567"}'
```

Muvaffaqiyatli javob:
```json
{
  "success": true,
  "message": "Parolni tiklash kodi yuborildi",
  "data": {
    "phone": "+998901234567",
    "smsStatus": "yuborildi",
    "verificationCode": "123456"
  }
}
```

## 4. Loglarni Tekshirish

Agar muammo bo'lsa, Heroku Dashboard'da:
1. **More** tugmasini bosing
2. **View logs** ni tanlang
3. Xatolarni tekshiring

## 5. Muhim Eslatmalar

- ✅ DATABASE_URL yangi Heroku PostgreSQL bilan yangilandi
- ✅ Eskiz SMS sozlamalari to'liq qo'shildi
- ✅ Health endpoint ishlayapti
- ❌ SMS funksiyasi environment variables kerak

## 6. Backup Plan

Agar Heroku ishlamasa, quyidagi alternativalar mavjud:
- **Render**: render.yaml fayli tayyor
- **Railway**: railway.json fayli tayyor
- **Vercel**: vercel.json fayli tayyor

Barcha deployment fayllari loyihada mavjud va test qilingan.