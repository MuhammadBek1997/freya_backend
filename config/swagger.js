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
      url: 'https://freya-backend.onrender.com',
      description: 'Production server'
    },
    {
      url: 'http://localhost:4444',
      description: 'Development server'
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
      Salon: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Salon ID si',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          name: {
            type: 'string',
            description: 'Salon nomi',
            example: 'Beauty Salon'
          },
          description: {
            type: 'string',
            description: 'Salon tavsifi',
            example: 'Professional beauty salon with experienced staff'
          },
          address: {
            type: 'string',
            description: 'Salon manzili',
            example: 'Tashkent, Yunusobod tumani, Amir Temur ko\'chasi 1'
          },
          phone: {
            type: 'string',
            description: 'Salon telefon raqami',
            example: '+998901234567'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Salon email manzili',
            example: 'salon@example.com'
          },
          working_hours: {
            type: 'object',
            description: 'Ish vaqtlari',
            example: {
              monday: '09:00-18:00',
              tuesday: '09:00-18:00',
              wednesday: '09:00-18:00',
              thursday: '09:00-18:00',
              friday: '09:00-18:00',
              saturday: '10:00-16:00',
              sunday: 'closed'
            }
          },
          location: {
            type: 'object',
            properties: {
              latitude: {
                type: 'number',
                format: 'float',
                description: 'Kenglik',
                example: 41.2995
              },
              longitude: {
                type: 'number',
                format: 'float',
                description: 'Uzunlik',
                example: 69.2401
              }
            }
          },
          rating: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 5,
            description: 'Salon reytingi',
            example: 4.5
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri'
            },
            description: 'Salon rasmlari URL lari',
            example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
          },
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                name: {
                  type: 'string'
                },
                price: {
                  type: 'number'
                },
                duration: {
                  type: 'integer',
                  description: 'Davomiyligi (daqiqalarda)'
                }
              }
            },
            description: 'Salon xizmatlari'
          },
          is_active: {
            type: 'boolean',
            description: 'Salon faol holati',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Yaratilgan vaqt',
            example: '2024-01-01T00:00:00.000Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Yangilangan vaqt',
            example: '2024-01-01T00:00:00.000Z'
          }
        },
        required: ['id', 'name', 'address', 'phone']
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Foydalanuvchi ID si',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          username: {
            type: 'string',
            description: 'Foydalanuvchi nomi',
            example: 'john_doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email manzili',
            example: 'john@example.com'
          },
          full_name: {
            type: 'string',
            description: 'To\'liq ismi',
            example: 'John Doe'
          },
          phone: {
            type: 'string',
            description: 'Telefon raqami',
            example: '+998901234567'
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'superadmin'],
            description: 'Foydalanuvchi roli',
            example: 'user'
          },
          is_active: {
            type: 'boolean',
            description: 'Faol holati',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Yaratilgan vaqt'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Yangilangan vaqt'
          }
        },
        required: ['id', 'username', 'email', 'role']
      },
      Employee: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Xodim ID si'
          },
          salon_id: {
            type: 'string',
            format: 'uuid',
            description: 'Salon ID si'
          },
          name: {
            type: 'string',
            description: 'Xodim ismi'
          },
          position: {
            type: 'string',
            description: 'Lavozimi'
          },
          phone: {
            type: 'string',
            description: 'Telefon raqami'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email manzili'
          },
          specialization: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Mutaxassisligi'
          },
          rating: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 5,
            description: 'Reyting'
          },
          is_active: {
            type: 'boolean',
            description: 'Faol holati'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Yaratilgan vaqt'
          }
        },
        required: ['id', 'salon_id', 'name', 'position']
      },
      Service: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Xizmat ID si'
          },
          name: {
            type: 'string',
            description: 'Xizmat nomi'
          },
          description: {
            type: 'string',
            description: 'Xizmat tavsifi'
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Narxi'
          },
          duration: {
            type: 'integer',
            description: 'Davomiyligi (daqiqalarda)'
          },
          category: {
            type: 'string',
            description: 'Kategoriya'
          },
          is_active: {
            type: 'boolean',
            description: 'Faol holati'
          }
        },
        required: ['id', 'name', 'price', 'duration']
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

// Swagger UI konfiguratsiyasi (soddalashtirilgan)
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Freya API Documentation',
  swaggerOptions: {
    requestInterceptor: (req) => {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.headers['Content-Type'] = 'application/json';
      }
      return req;
    },
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options'],
    tryItOutEnabled: true,
    validatorUrl: null, // Disable validator
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1
  }
};

module.exports = {
  swaggerUi,
  specs,
  swaggerUiOptions,
};