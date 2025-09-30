// CORS Proxy Middleware - Render.com uchun optimizatsiya qilingan
const corsProxy = (req, res, next) => {
    // Ruxsat berilgan originlar ro'yxati
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180',
        'http://localhost:5181',
        'http://localhost:5182',
        'http://localhost:5183',
        'http://localhost:4173',
        'https://freyabackend-parfa7zy7-muhammads-projects-3a6ae627.vercel.app',
        'https://freya-web-frontend.vercel.app',
        'https://freya-frontend.onrender.com',
        'https://freyasalon-6f0b3dc79e01.herokuapp.com',
        'https://freyajs.vercel.app',
        'https://freya-admin.vercel.app',
        'https://freya-admin.onrender.com',
        'https://freyajs-git-main-muhammads-projects-3a6ae627.vercel.app',
        'https://freyajs-muhammads-projects-3a6ae627.vercel.app'
    ];
    
    const origin = req.headers.origin;
    
    // Barcha originlarga ruxsat berish
    res.header('Access-Control-Allow-Origin', '*');
    
    // CORS headerlarini to'liq o'rnatish
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 soat
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
    
    // CORS debug
    
    // OPTIONS so'rovlari uchun
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
};

module.exports = corsProxy;