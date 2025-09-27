# Favourite Salons va Recommended Salons API Dokumentatsiyasi

## Yangi Qo'shilgan Endpointlar

### 1. Favourite Salon Qo'shish
**POST** `/api/users/favourites/add`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "salon_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Salon muvaffaqiyatli sevimlilarga qo'shildi",
  "favourite_salons": [1, 2, 3]
}
```

---

### 2. Favourite Salon Olib Tashlash
**POST** `/api/users/favourites/remove`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "salon_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Salon sevimlilardan olib tashlandi",
  "favourite_salons": [2, 3]
}
```

---

### 3. Favourite Salonlarni Olish
**GET** `/api/users/favourites?current_language=uz&page=1&limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `current_language` (optional): uz, ru, en (default: uz)
- `page` (optional): sahifa raqami (default: 1)
- `limit` (optional): sahifadagi elementlar soni (default: 10)

**Response (200):**
```json
{
  "success": true,
  "favourite_salons": [
    {
      "id": 1,
      "name": "Beauty Salon",
      "description": "Eng yaxshi salon",
      "address": "Toshkent, Chilonzor",
      "phone": "+998901234567",
      "type": "beauty",
      "rating": 4.5,
      "image_url": "https://example.com/salon1.jpg"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

### 4. Recommended Salonlar Olish
**GET** `/api/salons/recommended?current_language=uz&page=1&limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `current_language` (optional): uz, ru, en (default: uz)
- `page` (optional): sahifa raqami (default: 1)
- `limit` (optional): sahifadagi elementlar soni (default: 10)

**Response (200):**
```json
{
  "success": true,
  "recommended_salons": [
    {
      "id": 2,
      "name": "Elite Salon",
      "description": "Yuqori sifatli xizmatlar",
      "address": "Toshkent, Yunusobod",
      "phone": "+998901234568",
      "type": "beauty",
      "rating": 4.8,
      "image_url": "https://example.com/salon2.jpg"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_count": 15,
    "has_next": true,
    "has_prev": false
  },
  "recommendation_basis": "Sizning sevimli salonlaringiz asosida tavsiya etilgan"
}
```

## Xatolik Kodlari

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Salon ID talab qilinadi"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Token yaroqsiz"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Salon topilmadi"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "Bu salon allaqachon sevimlilarda mavjud"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Server xatoligi"
}
```

## Algoritm Haqida

### Recommended Salons Algoritmi:
1. **Foydalanuvchi sevimli salonlari mavjud bo'lsa:**
   - Sevimli salonlarning turlarini aniqlaydi
   - O'sha turlardagi boshqa salonlarni tavsiya qiladi
   - Sevimli salonlarni natijadan chiqarib tashlaydi

2. **Foydalanuvchi sevimli salonlari yo'q bo'lsa:**
   - Eng yuqori reytingli salonlarni tavsiya qiladi

3. **Barcha holatlarda:**
   - Paginatsiya qo'llab-quvvatlanadi
   - Ko'p tillilik qo'llab-quvvatlanadi
   - Salon ma'lumotlari to'liq qaytariladi

## Test Qilish

1. Avval login qiling:
```bash
curl -X POST https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your_email", "password": "your_password"}'
```

2. Token oling va test_favourite_salons.js faylida o'rnating

3. Testni ishga tushiring:
```bash
node test_favourite_salons.js
```

## Swagger Dokumentatsiya

Barcha endpointlar Swagger UI'da ham mavjud:
- https://freya-salon-backend-cc373ce6622a.herokuapp.com/api-docs

## Database O'zgarishlari

`users` jadvaliga yangi ustun qo'shildi:
- `favourite_salons` (JSONB) - foydalanuvchi sevimli salonlarining ID'lari ro'yxati
- Default qiymat: `[]` (bo'sh array)