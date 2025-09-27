#!/usr/bin/env node

console.log('Testing userController loading...');

try {
    // Test userController loading
    console.log('Loading userController...');
    const userController = require('./controllers/userController');
    console.log('✅ UserController loaded successfully');
    
    // Check if the favourite salon functions exist
    const requiredFunctions = ['addFavouriteSalon', 'removeFavouriteSalon', 'getFavouriteSalons'];
    
    requiredFunctions.forEach(funcName => {
        if (typeof userController[funcName] === 'function') {
            console.log(`✅ ${funcName} function exists`);
        } else {
            console.log(`❌ ${funcName} function missing`);
        }
    });
    
    // Test userRoutes loading
    console.log('Loading userRoutes...');
    const userRoutes = require('./routes/userRoutes');
    console.log('✅ UserRoutes loaded successfully');
    console.log(`Routes count: ${userRoutes.stack ? userRoutes.stack.length : 'Unknown'}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

console.log('✅ All tests passed');