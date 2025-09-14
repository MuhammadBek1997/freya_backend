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
      url: 'http://localhost:7002',
      description: 'Development server',
    },
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
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 5px; margin: 10px 0; }
    .swagger-ui .auth-wrapper { background: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #10b981; }
    .swagger-ui .authorization__btn { background: #10b981; border-color: #10b981; }
    .swagger-ui .authorization__btn:hover { background: #059669; }
  `,
  customSiteTitle: 'Freya API Documentation'
};

module.exports = {
  swaggerUi,
  specs,
  swaggerUiOptions,
};