# Vercel'ga Deploy qilish bo'yicha yo'riqnoma

## 1. Vercel'da Environment Variables sozlash

Vercel dashboard'da loyihangizga kirib, Settings > Environment Variables bo'limida quyidagi o'zgaruvchilarni qo'shing:

```
DATABASE_URL = postgresql://username:password@host:port/database
ESKIZ_EMAIL = your_eskiz_email
ESKIZ_PASSWORD = your_eskiz_password
JWT_SECRET = your_jwt_secret_key
NODE_ENV = production
```

## 2. Deploy qilish

1. Backend papkasini Vercel'ga yuklang
2. Build Command: `npm install`
3. Output Directory: bo'sh qoldiring
4. Install Command: `npm install`

## 3. Tekshirish

Deploy qilingandan so'ng:
- `https://your-project.vercel.app/` - Asosiy sahifa
- `https://your-project.vercel.app/api/health` - API health check
- `https://your-project.vercel.app/api-docs` - Swagger documentation

## 4. Muammolar va yechimlar

### 404 xatosi
- vercel.json fayli to'g'ri sozlanganligini tekshiring
- Environment variables to'g'ri kiritilganligini tekshiring

### Database ulanish xatosi
- DATABASE_URL to'g'ri formatda ekanligini tekshiring
- Database server Vercel'dan kirish uchun ochiq ekanligini tekshiring

### Swagger ishlamayotgan bo'lsa
- `/api-docs` route'i to'g'ri ishlayotganligini tekshiring
- Static files to'g'ri serve qilinayotganligini tekshiring