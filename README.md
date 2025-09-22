# Freya Backend API

Freya admin panel va Flutter mobile app uchun backend API. Express.js, PostgreSQL va Heroku bilan ishlab chiqilgan.

## Texnologiyalar

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time communication
- **Eskiz.uz** - SMS service
- **Heroku/Railway/Render/Vercel** - Cloud deployment

## O'rnatish

### 1. Loyihani klonlash
```bash
git clone <repository-url>
cd backend
```

### 2. Dependencies o'rnatish
```bash
npm install
```

### 3. Environment variables sozlash
`.env` faylini yarating va quyidagi ma'lumotlarni kiriting:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/freya_db
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:3000

# Eskiz.uz SMS Configuration
ESKIZ_EMAIL=test@eskiz.uz
ESKIZ_PASSWORD=j6DWtQjjpLDNjWEk74Sx
ESKIZ_TOKEN=your_eskiz_token
ESKIZ_BASE_URL=https://notify.eskiz.uz/api

# Click Payment Configuration
CLICK_MERCHANT_ID=your_merchant_id
CLICK_SERVICE_ID=your_service_id
CLICK_SECRET_KEY=your_secret_key
```

### 4. PostgreSQL database sozlash

1. PostgreSQL o'rnating
2. Database yarating:
```sql
CREATE DATABASE freya_db;
```

3. Schema faylini ishga tushiring:
```bash
psql -d freya_db -f config/schema.sql
```

### 5. Serverni ishga tushirish

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server `http://localhost:5000` da ishga tushadi.

## API Endpoints

### Admin Panel API

#### Authentication
- `POST /api/admin/login` - Admin kirish
- `POST /api/admin/register` - Admin ro'yxatdan o'tish

#### Dashboard
- `GET /api/admin/dashboard` - Dashboard ma'lumotlari
- `GET /api/admin/analytics` - Analitika

#### User Management
- `GET /api/admin/users` - Barcha foydalanuvchilar
- `GET /api/admin/users/:id` - Foydalanuvchi ma'lumotlari
- `PUT /api/admin/users/:id` - Foydalanuvchini yangilash
- `DELETE /api/admin/users/:id` - Foydalanuvchini o'chirish

#### Content Management
- `GET /api/admin/content` - Barcha kontent
- `POST /api/admin/content` - Kontent yaratish
- `PUT /api/admin/content/:id` - Kontentni yangilash
- `DELETE /api/admin/content/:id` - Kontentni o'chirish

### Mobile App API

#### Authentication
- `POST /api/mobile/auth/login` - Foydalanuvchi kirish
- `POST /api/mobile/auth/register` - Ro'yxatdan o'tish
- `POST /api/mobile/auth/forgot-password` - Parolni unutish
- `POST /api/mobile/auth/reset-password` - Parolni tiklash

#### Profile
- `GET /api/mobile/profile` - Profil ma'lumotlari
- `PUT /api/mobile/profile` - Profilni yangilash
- `POST /api/mobile/profile/avatar` - Avatar yuklash

#### Content
- `GET /api/mobile/content` - Kontent ro'yxati
- `GET /api/mobile/content/:id` - Kontent ma'lumotlari

#### Favorites
- `POST /api/mobile/favorites/:id` - Sevimlilar ro'yxatiga qo'shish
- `DELETE /api/mobile/favorites/:id` - Sevimlilardan o'chirish
- `GET /api/mobile/favorites` - Sevimlilar ro'yxati

#### Notifications
- `GET /api/mobile/notifications` - Bildirishnomalar
- `PUT /api/mobile/notifications/:id/read` - Bildirishnomani o'qilgan deb belgilash

## Heroku ga deploy qilish

### 1. Heroku CLI o'rnatish
[Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) ni o'rnating.

### 2. Heroku app yaratish
```bash
heroku create your-app-name
```

### 3. PostgreSQL addon qo'shish
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### 4. Environment variables sozlash
```bash
heroku config:set JWT_SECRET=your_super_secret_jwt_key_here
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
```

### 5. Deploy qilish
```bash
git add .
git commit -m "Initial commit"
git push heroku main
```

### 6. Database schema o'rnatish
```bash
heroku pg:psql < config/schema.sql
```

## Loyiha strukturasi

```
backend/
├── config/
│   ├── database.js      # Database konfiguratsiyasi
│   └── schema.sql       # Database schema
├── controllers/
│   ├── adminController.js   # Admin API logic
│   └── mobileController.js  # Mobile API logic
├── middleware/
│   └── authMiddleware.js    # Authentication middleware
├── routes/
│   ├── adminRoutes.js       # Admin routes
│   └── mobileRoutes.js      # Mobile routes
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── Procfile                 # Heroku configuration
├── README.md
└── server.js               # Main server file
```

## Deployment

Loyiha quyidagi platformalarda deploy qilish uchun tayyor:

### 1. Render
```bash
# render.yaml fayli mavjud
# GitHub repository'ni Render'ga ulang
# Environment variables'larni sozlang
```

### 2. Railway
```bash
# railway.json fayli mavjud
# GitHub repository'ni Railway'ga ulang
# PostgreSQL service qo'shing
```

### 3. Vercel
```bash
# vercel.json fayli mavjud
npm install -g vercel
vercel --prod
```

### 4. Heroku
```bash
# Procfile mavjud
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

Batafsil ma'lumot uchun `DEPLOYMENT.md` faylini ko'ring.

## Xavfsizlik

- Barcha parollar bcryptjs bilan hash qilinadi
- JWT tokenlar bilan authentication
- Helmet.js bilan HTTP headers himoyasi
- CORS sozlamalari
- Input validation

## Monitoring va Logging

- Morgan middleware bilan HTTP request logging
- Console.log bilan error tracking
- Database query performance monitoring

## Qo'llab-quvvatlash

Savollar yoki muammolar uchun issue yarating yoki email yuboring.

## Litsenziya

ISC# freya_backend
