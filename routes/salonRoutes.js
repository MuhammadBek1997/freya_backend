const express = require('express');
const router = express.Router();
const {
    createSalon,
    getAllSalons,
    getSalonById,
    updateSalon,
    deleteSalon,
    addSalonComment,
    getSalonComments,
    getNearbySalons,
    getSalonsByTypes,
    getRecommendedSalons,
    uploadSalonPhotos,
    deleteSalonPhoto
} = require('../controllers/salonController');
const { verifySuperAdmin, verifyAdmin, verifyUser } = require('../middleware/authMiddleware');
const { languageDetection } = require('../middleware/languageMiddleware');

/**
 * @swagger
 * tags:
 *   name: Salons
 *   description: Salon boshqaruvi API
 */




/**
 * @swagger
 * /api/salons:
 *   get:
 *     summary: Barcha salonlarni olish
 *     tags: [Salons]
 *     parameters:
 *       - $ref: '#/components/parameters/LanguageParam'
 *       - $ref: '#/components/parameters/AcceptLanguageHeader'
 *       - in: query
 *         name: current_language
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, uz, ru]
 *           default: ru
 *         description: Javob tili (en, uz, ru)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sahifadagi elementlar soni
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Qidiruv so'zi
 *     responses:
 *       200:
 *         description: Salonlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 salons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salon'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', languageDetection, getAllSalons);



/**
 * @swagger
 * /api/salons/{id}:
 *   get:
 *     summary: ID bo'yicha salonni olish
 *     tags: [Salons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *       - $ref: '#/components/parameters/LanguageParam'
 *       - $ref: '#/components/parameters/AcceptLanguageHeader'
 *       - in: query
 *         name: current_language
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, uz, ru]
 *           default: ru
 *         description: Javob tili (en, uz, ru)
 *     responses:
 *       200:
 *         description: Salon ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Salon'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/salons/nearby:
 *   get:
 *     summary: Yaqin atrofdagi salonlarni olish
 *     tags: [Salons]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Foydalanuvchi kenglik koordinatasi
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Foydalanuvchi uzunlik koordinatasi
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: float
 *           default: 10
 *         description: Qidiruv radiusi (km)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sahifadagi elementlar soni
 *     responses:
 *       200:
 *         description: Yaqin atrofdagi salonlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Salon'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             description: Masofa (km)
 *                           distance_text:
 *                             type: string
 *                             description: Masofa matni
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 search_params:
 *                   type: object
 *                   properties:
 *                     user_location:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     radius:
 *                       type: number
 *                     radius_text:
 *                       type: string
 *       400:
 *         description: Noto'g'ri parametrlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/nearby', languageDetection, getNearbySalons);

router.get('/:id', languageDetection, getSalonById);


/**
 * @swagger
 * /api/salons:
 *   post:
 *     summary: Yangi salon yaratish
 *     tags: [Salons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salon_name
 *             properties:
 *               salon_name:
 *                 type: string
 *                 description: Salon nomi
 *               salon_phone:
 *                 type: string
 *                 description: Salon telefon raqami
 *               salon_add_phone:
 *                 type: string
 *                 description: Salon qo'shimcha telefon raqami
 *               salon_instagram:
 *                 type: string
 *                 description: Salon Instagram sahifasi
 *               salon_rating:
 *                 type: number
 *                 description: Salon reytingi
 *               comments:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Salon izohlari
 *               salon_payment:
 *                 type: object
 *                 description: To'lov usullari
 *               salon_description:
 *                 type: string
 *                 description: Salon tavsifi
 *               salon_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Salon turlari
 *               private_salon:
 *                 type: boolean
 *                 description: Shaxsiy salon
 *               work_schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Ish jadvali
 *               salon_title:
 *                 type: string
 *                 description: Salon sarlavhasi
 *               salon_additionals:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Qo'shimcha xizmatlar
 *               sale_percent:
 *                 type: integer
 *                 description: Chegirma foizi
 *               sale_limit:
 *                 type: integer
 *                 description: Chegirma limiti
 *               location:
 *                 type: object
 *                 description: Salon joylashuvi
 *               salon_orient:
 *                 type: object
 *                 description: Salon yo'nalishi
 *               salon_photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Salon rasmlari
 *               salon_comfort:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Salon qulayliklari
 *     responses:
 *       201:
 *         description: Salon muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Salon'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', verifySuperAdmin, createSalon);

/**
 * @swagger
 * /api/salons/{id}:
 *   put:
 *     summary: Salonni yangilash
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Salon nomi
 *               address:
 *                 type: string
 *                 description: Salon manzili
 *               phone:
 *                 type: string
 *                 description: Salon telefon raqami
 *               description:
 *                 type: string
 *                 description: Salon tavsifi
 *               image_url:
 *                 type: string
 *                 description: Salon rasmi URL
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Salon'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', verifyAdmin, updateSalon);

/**
 * @swagger
 * /api/salons/{id}:
 *   delete:
 *     summary: Salonni o'chirish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Salon muvaffaqiyatli o'chirildi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', verifySuperAdmin, deleteSalon);


/**
 * @swagger
 * /api/salons/{id}/comments:
 *   get:
 *     summary: Salon izohlarini olish
 *     tags: [Salons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Salon izohlari
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/comments', getSalonComments);

/**
 * @swagger
 * /api/salons/{id}/comments:
 *   post:
 *     summary: Salon uchun izoh qo'shish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - author_name
 *               - rating
 *             properties:
 *               content:
 *                 type: string
 *                 description: Izoh matni
 *               author_name:
 *                 type: string
 *                 description: Muallif ismi
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Baho (1-5)
 *     responses:
 *       201:
 *         description: Izoh muvaffaqiyatli qo'shildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/comments', verifySuperAdmin, addSalonComment);

/**
 * @swagger
 * /api/salons/filter/types:
 *   get:
 *     summary: Salon turlariga ko'ra salonlarni filtrlash
 *     tags: [Salons]
 *     parameters:
 *       - $ref: '#/components/parameters/LanguageParam'
 *       - $ref: '#/components/parameters/AcceptLanguageHeader'
 *       - in: query
 *         name: current_language
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, uz, ru]
 *           default: ru
 *         description: Javob tili (en, uz, ru)
 *       - in: query
 *         name: salon_types
 *         required: true
 *         schema:
 *           type: string
 *         description: Salon turlari (vergul bilan ajratilgan, masalan "Beauty Salon,Fitness")
         example: "Beauty Salon,Fitness"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sahifadagi elementlar soni
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Qidiruv so'zi
 *     responses:
 *       200:
 *         description: Filtrlangan salonlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 salons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salon'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     salon_types:
 *                       type: array
 *                       items:
 *                         type: string
 *                     search:
 *                       type: string
 *       400:
 *         description: Noto'g'ri parametrlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/filter/types', languageDetection, getSalonsByTypes);

/**
 * @swagger
 * /api/salons/recommended:
 *   get:
 *     summary: User favourite salonlari asosida tavsiya qilingan salonlar
 *     description: Foydalanuvchi favourite qilgan salonlar turlariga asoslangan holda boshqa salonlarni tavsiya qilish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: current_language
 *         schema:
 *           type: string
 *           enum: [ru, uz, en]
 *           default: ru
 *         description: Tarjima tili
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Sahifadagi elementlar soni
 *     responses:
 *       200:
 *         description: Tavsiya qilingan salonlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 salons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salon'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 recommendation_info:
 *                   type: object
 *                   properties:
 *                     based_on_types:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Tavsiya asosidagi salon turlari
 *                     user_favorites_count:
 *                       type: integer
 *                       description: Foydalanuvchi favourite salonlari soni
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/recommended', verifyUser, languageDetection, getRecommendedSalons);

/**
 * @swagger
 * /api/salons/{id}/photos:
 *   post:
 *     summary: Salon rasmlarini yuklash
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photos
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Base64 formatdagi rasmlar massivi
 *     responses:
 *       200:
 *         description: Rasmlar muvaffaqiyatli yuklandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     salon_id:
 *                       type: string
 *                     salon_photos:
 *                       type: array
 *                       items:
 *                         type: string
 *                     added_photos_count:
 *                       type: integer
 *                     total_photos_count:
 *                       type: integer
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       404:
 *         description: Salon topilmadi
 *       500:
 *         description: Server xatosi
 */
router.post('/:salon_id/photos', verifySuperAdmin, uploadSalonPhotos);

/**
 * @swagger
 * /api/salons/{id}/photos/{photo_index}:
 *   delete:
 *     summary: Salon rasmini o'chirish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *       - in: path
 *         name: photo_index
 *         required: true
 *         schema:
 *           type: integer
 *         description: O'chiriladigan rasm indeksi
 *     responses:
 *       200:
 *         description: Rasm muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     salon_id:
 *                       type: string
 *                     salon_photos:
 *                       type: array
 *                       items:
 *                         type: string
 *                     deleted_photo_index:
 *                       type: integer
 *                     remaining_photos_count:
 *                       type: integer
 *       400:
 *         description: Noto'g'ri rasm indeksi
 *       404:
 *         description: Salon topilmadi
 *       500:
 *         description: Server xatosi
 */
router.delete('/:salon_id/photos/:photo_index', verifySuperAdmin, deleteSalonPhoto);

module.exports = router;