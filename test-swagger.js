const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

// Test the swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'Test swagger configuration',
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['./routes/*.js'],
};

console.log('Current working directory:', process.cwd());
console.log('Looking for files matching:', './routes/*.js');

// Check if files exist
const glob = require('glob');
const files = glob.sync('./routes/*.js');
console.log('Found files:', files);

// Check if paymentCardRoutes.js exists
const paymentCardFile = './routes/paymentCardRoutes.js';
if (fs.existsSync(paymentCardFile)) {
  console.log('paymentCardRoutes.js exists');
  const content = fs.readFileSync(paymentCardFile, 'utf8');
  const swaggerComments = content.match(/\/\*\*[\s\S]*?\*\//g);
  console.log('Found swagger comments:', swaggerComments ? swaggerComments.length : 0);
} else {
  console.log('paymentCardRoutes.js does not exist');
}

try {
  const specs = swaggerJSDoc(options);
  console.log('Generated swagger spec paths:', Object.keys(specs.paths || {}));
  
  // Check if payment-cards paths exist
  const paymentPaths = Object.keys(specs.paths || {}).filter(path => path.includes('payment-cards'));
  console.log('Payment card paths found:', paymentPaths);
  
  // Write the generated spec to a file for inspection
  fs.writeFileSync('./test-swagger-output.json', JSON.stringify(specs, null, 2));
  console.log('Generated swagger spec written to test-swagger-output.json');
} catch (error) {
  console.error('Error generating swagger spec:', error);
}