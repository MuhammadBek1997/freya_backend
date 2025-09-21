// CORS Proxy Middleware - Render.com uchun optimizatsiya qilingan
const corsProxy = (req, res, next) => {
    // Ruxsat berilgan originlar ro'yxati
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://freyabackend-parfa7zy7-muhammads-projects-3a6ae627.vercel.app',
        'https://freya-web-frontend.vercel.app',
        'https://freya-frontend.onrender.com',
        'https://freya-web-frontend.vercel.app',
        'https://freyasalon-6f0b3dc79e01.herokuapp.com'
    ];
    
    const origin = req.headers.origin;
    
    // Origin tekshirish va CORS headerlarini o'rnatish
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        // Development uchun barcha originlarga ruxsat berish
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    // CORS headerlarini to'liq o'rnatish
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 soat
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
    
    // CORS debug uchun log
    console.log('CORS Debug:', {
        origin: origin,
        method: req.method,
        url: req.url,
        allowed: allowedOrigins.includes(origin)
    });
    
    // OPTIONS so'rovlari uchun
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
};

module.exports = corsProxy;