// CORS Proxy Middleware - Render.com uchun optimizatsiya qilingan
const corsProxy = (req, res, next) => {
    // Ruxsat berilgan originlar ro'yxati
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5179',
        'http://localhost:5187',
        'http://localhost:5188',
        'http://localhost:5189',
        'http://localhost:5190',
        'https://freyabackend-parfa7zy7-muhammads-projects-3a6ae627.vercel.app',
        'https://freya-web-frontend.vercel.app',
        'https://freya-frontend.onrender.com',
        'https://freya-web-frontend.vercel.app'
    ];
    
    const origin = req.headers.origin;
    
    // Origin tekshirish va CORS headerlarini o'rnatish
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development' || !origin) {
        // Development uchun yoki origin bo'lmagan so'rovlar uchun barcha originlarga ruxsat berish
        res.header('Access-Control-Allow-Origin', '*');
    } else {
        // Production'da noma'lum originlarga ruxsat bermaslik
        res.header('Access-Control-Allow-Origin', 'null');
    }
    
    // CORS headerlarini to'liq o'rnatish
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 soat
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
    
    // CORS debug uchun log
    const isAllowed = allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development' || !origin;
    console.log('CORS Debug:', {
        origin: origin || 'undefined',
        method: req.method,
        url: req.url,
        allowed: isAllowed,
        isDevelopment: process.env.NODE_ENV === 'development'
    });
    
    // OPTIONS so'rovlari uchun
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
};

module.exports = corsProxy;