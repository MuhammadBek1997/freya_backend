const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Memory storage for Heroku compatibility
const storage = multer.memoryStorage();

// Fayl filtri - faqat rasmlar
const fileFilter = (req, file, cb) => {
    // Ruxsat etilgan MIME turlari
    const allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm fayllari ruxsat etilgan (JPEG, PNG, GIF, WebP)'), false);
    }
};

// Multer konfiguratsiyasi
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB maksimal hajm
        files: 1 // Faqat bitta fayl
    }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Fayl hajmi juda katta. Maksimal 5MB ruxsat etilgan.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Faqat bitta fayl yuklash mumkin.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Kutilmagan fayl maydoni.'
            });
        }
    }
    
    if (error.message.includes('Faqat rasm fayllari')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Fayl yuklashda xatolik yuz berdi.'
    });
};

// Base64 formatida image qaytarish (buffer uchun)
const getImageAsBase64 = (imageData, mimeType = 'image/jpeg') => {
    try {
        if (!imageData) {
            return null;
        }
        
        // Agar imageData string bo'lsa (database'dan kelgan base64), uni qaytarish
        if (typeof imageData === 'string') {
            return imageData;
        }
        
        // Agar buffer bo'lsa, base64 ga o'tkazish
        if (Buffer.isBuffer(imageData)) {
            return `data:${mimeType};base64,${imageData.toString('base64')}`;
        }
        
        return null;
    } catch (error) {
        console.error('Base64 ga o\'tkazishda xatolik:', error);
        return null;
    }
};

// Memory storage uchun eski rasm o'chirish funksiyasi (hech narsa qilmaydi)
const deleteOldImage = (imagePath) => {
    // Memory storage ishlatganimiz uchun fayl o'chirish shart emas
    console.log('Memory storage: eski rasm avtomatik tozalanadi');
};

module.exports = {
    upload: upload.single('image'),
    handleUploadError,
    getImageAsBase64,
    deleteOldImage
};