console.log('🔍 Testing server.js loading...');

try {
  console.log('Loading server.js...');
  const app = require('./server.js');
  console.log('✅ Server loaded successfully');
  
  // Check if userRoutes are registered
  const routes = [];
  app._router.stack.forEach(function(middleware) {
    if (middleware.route) {
      routes.push(middleware.route.path);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(function(handler) {
        if (handler.route) {
          routes.push(handler.route.path);
        }
      });
    }
  });
  
  console.log('Total routes found:', routes.length);
  const userRoutes = routes.filter(route => route.includes('user') || route.includes('favourite'));
  console.log('User-related routes:', userRoutes);
  
  if (userRoutes.length > 0) {
    console.log('✅ User routes are registered');
  } else {
    console.log('❌ No user routes found');
  }
  
} catch (error) {
  console.error('❌ Error loading server:', error.message);
  console.error('Stack:', error.stack);
}