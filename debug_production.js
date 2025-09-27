#!/usr/bin/env node

console.log('🔍 Production Debug Script');
console.log('NODE_ENV:', process.env.NODE_ENV);

try {
    console.log('1. Testing userController loading...');
    const userController = require('./controllers/userController');
    console.log('✅ UserController loaded');
    
    // Check functions
    const functions = ['addFavouriteSalon', 'removeFavouriteSalon', 'getFavouriteSalons'];
    functions.forEach(func => {
        console.log(`${func}: ${typeof userController[func]}`);
    });
    
    console.log('2. Testing userRoutes loading...');
    const userRoutes = require('./routes/userRoutes');
    console.log('✅ UserRoutes loaded');
    console.log('Routes count:', userRoutes.stack ? userRoutes.stack.length : 'Unknown');
    
    console.log('3. Testing middleware loading...');
    const authMiddleware = require('./middleware/authMiddleware');
    console.log('✅ AuthMiddleware loaded');
    
    const phoneValidation = require('./middleware/phoneValidationMiddleware');
    console.log('✅ PhoneValidationMiddleware loaded');
    
    console.log('4. Testing Express app creation...');
    const express = require('express');
    const app = express();
    
    app.use('/api/users', userRoutes);
    console.log('✅ UserRoutes registered to Express app');
    
    // List all routes
    console.log('5. Registered routes:');
    let routeCount = 0;
    app._router.stack.forEach(function(middleware) {
        if (middleware.route) {
            console.log(`  ${middleware.route.path}`);
            routeCount++;
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(function(handler) {
                if (handler.route) {
                    const basePath = middleware.regexp.source.replace(/\\\//g, '/').replace(/\\\?/g, '').replace(/\$/, '');
                    console.log(`  ${basePath}${handler.route.path}`);
                    routeCount++;
                }
            });
        }
    });
    console.log(`Total routes: ${routeCount}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

console.log('✅ All production tests passed');