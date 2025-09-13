const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Freya Backend API',
      version: '1.0.0',
      description: 'Freya loyihasi uchun backend API dokumentatsiyasi',
      contact: {
        name: 'Freya Development Team',
        email: 'support@freya.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.freya.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Salon: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Salon ID'
            },
            salon_name: {
              type: 'string',
              description: 'Salon nomi'
            },
            salon_phone: {
              type: 'string',
              description: 'Salon telefon raqami'
            },
            salon_add_phone: {
              type: 'string',
              description: 'Qo\'shimcha telefon raqami'
            },
            salon_instagram: {
              type: 'string',
              description: 'Instagram profili'
            },
            salon_rating: {
              type: 'string',
              description: 'Salon reytingi'
            },
            salon_description: {
              type: 'string',
              description: 'Salon tavsifi'
            },
            salon_format: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  selected: {
                    type: 'boolean'
                  },
                  format: {
                    type: 'string',
                    enum: ['corporative', 'private']
                  }
                }
              },
              description: 'Salon formati'
            },
            is_active: {
              type: 'boolean',
              description: 'Salon faol holati'
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
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Foydalanuvchi nomi'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email manzil'
            },
            full_name: {
              type: 'string',
              description: 'To\'liq ism'
            },
            phone: {
              type: 'string',
              description: 'Telefon raqami'
            },
            is_active: {
              type: 'boolean',
              description: 'Faol holat'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Yaratilgan vaqt'
            }
          }
        },
        Admin: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Admin ID'
            },
            username: {
              type: 'string',
              description: 'Admin nomi'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email manzil'
            },
            full_name: {
              type: 'string',
              description: 'To\'liq ism'
            },
            role: {
              type: 'string',
              description: 'Admin roli'
            },
            is_active: {
              type: 'boolean',
              description: 'Faol holat'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Xato xabari'
            },
            error: {
              type: 'string',
              description: 'Xato tafsilotlari'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Muvaffaqiyat xabari'
            },
            data: {
              type: 'object',
              description: 'Qaytarilgan ma\'lumotlar'
            }
          }
        }
      }
    }
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};