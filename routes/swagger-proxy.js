const express = require('express');
const router = express.Router();

// Swagger UI uchun CORS-free proxy endpoint
router.all('/proxy/*', (req, res) => {
    // CORS headerlarini o'rnatish
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // OPTIONS so'rovlari uchun
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Asl endpoint ga yo'naltirish
    const targetPath = req.path.replace('/proxy', '');
    const targetUrl = `${req.protocol}://${req.get('host')}${targetPath}`;
    
    // So'rovni asl endpoint ga yo'naltirish
    const http = require('http');
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(targetUrl);
    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: req.method,
        headers: req.headers
    };
    
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const proxyReq = protocol.request(options, (proxyRes) => {
        // Response headerlarini nusxalash
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });
        
        // CORS headerlarini qayta o'rnatish
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        res.status(proxyRes.statusCode);
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    });
    
    // Request body ni yo'naltirish
    if (req.body) {
        proxyReq.write(JSON.stringify(req.body));
    }
    
    proxyReq.end();
});

module.exports = router;