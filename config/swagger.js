const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Freya API',
    version: '1.0.0',
    description: 'API dokumentatsiyasi Freya loyihasi uchun',
  },
  servers: [
        {
            url: 'http://localhost:5000',
            description: 'Local Development server (CORS enabled)'
        }
    ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Login qilib olingan JWT tokenni kiriting. Format: Bearer {token}'
      },
    },
    schemas: {
      LoginResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Muvaffaqiyatli login'
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzM0NzA5MjAwLCJleHAiOjE3MzQ3OTU2MDB9.abc123def456ghi789',
            description: 'JWT token - bu tokenni Authorization headerga Bearer {token} formatida qo\'shing'
          },
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614174000'
              },
              username: {
                type: 'string',
                example: 'superadmin'
              },
              email: {
                type: 'string',
                example: 'superadmin@freya.com'
              },
              full_name: {
                type: 'string',
                example: 'Super Administrator'
              },
              role: {
                type: 'string',
                example: 'superadmin'
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Xato xabari',
          },
          error: {
            type: 'string',
            description: 'Xato kodi',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Muvaffaqiyat holati',
          },
          message: {
            type: 'string',
            description: 'Muvaffaqiyat xabari',
          },
          data: {
            type: 'object',
            description: 'Qaytarilgan ma\'lumotlar',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./routes/*.js'],
};

const specs = swaggerJSDoc(options);

// Swagger UI konfiguratsiyasi
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
        requestInterceptor: (req) => {
            // CORS headers qo'shish
            req.headers['Access-Control-Allow-Origin'] = '*';
            req.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
            req.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
            req.headers['Access-Control-Allow-Credentials'] = 'true';
            
            // Content-Type ni to'g'ri o'rnatish
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                req.headers['Content-Type'] = 'application/json';
            }
            
            return req;
        },
        // CORS uchun qo'shimcha sozlamalar
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options'],
        tryItOutEnabled: true
    }
};

module.exports = {
  swaggerUi,
  specs,
  swaggerUiOptions,
};