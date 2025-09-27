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
      url: 'https://freya-salon-backend-cc373ce6622a.herokuapp.com',
      description: 'Production server (Heroku) - Default'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server (Local)'
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
            description: 'Xodim ID si',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          salon_id: {
            type: 'string',
            format: 'uuid',
            description: 'Salon ID si',
            example: '987fcdeb-51a2-43d1-9f12-123456789abc'
          },
          name: {
            type: 'string',
            description: 'Xodim ismi',
            example: 'Aziza Karimova'
          },
          position: {
            type: 'string',
            description: 'Lavozimi',
            example: 'Sartarosh'
          },
          phone: {
            type: 'string',
            description: 'Telefon raqami',
            example: '+998901234567'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email manzili',
            example: 'aziza@salon.com'
          },
          specialization: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Mutaxassisligi',
            example: ['Soch kesish', 'Soch bo\'yash', 'Manikur']
          },
          rating: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 5,
            description: 'Reyting',
            example: 4.5
          },
          is_active: {
            type: 'boolean',
            description: 'Faol holati',
            example: true
          },
          is_waiting: {
            type: 'boolean',
            description: 'Kutish holati',
            example: false
          },
          avatar_url: {
            type: 'string',
            format: 'uri',
            description: 'Avatar rasm URL manzili',
            example: 'https://example.com/avatar.jpg'
          },
          bio: {
            type: 'string',
            description: 'Qisqacha ma\'lumot',
            example: 'Professional sartarosh, 5 yillik tajriba'
          },
          work_schedule: {
            type: 'object',
            description: 'Ish jadvali',
            example: {
              monday: '09:00-18:00',
              tuesday: '09:00-18:00',
              wednesday: '09:00-18:00',
              thursday: '09:00-18:00',
              friday: '09:00-18:00',
              saturday: '10:00-16:00',
              sunday: 'off'
            }
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
                  type: 'number',
                  format: 'float'
                },
                duration: {
                  type: 'integer',
                  description: 'Davomiyligi (daqiqalarda)'
                }
              }
            },
            description: 'Xodim xizmatlari'
          },
          comments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                comment: {
                  type: 'string'
                },
                rating: {
                  type: 'number',
                  format: 'float',
                  minimum: 1,
                  maximum: 5
                },
                created_at: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            },
            description: 'Xodim haqidagi izohlar'
          },
          posts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                title: {
                  type: 'string'
                },
                content: {
                  type: 'string'
                },
                image_url: {
                  type: 'string',
                  format: 'uri'
                },
                created_at: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            },
            description: 'Xodim postlari'
          },
          name_uz: {
            type: 'string',
            description: 'Xodim ismi (o\'zbek tilida)',
            example: 'Aziza Karimova'
          },
          name_en: {
            type: 'string',
            description: 'Xodim ismi (ingliz tilida)',
            example: 'Aziza Karimova'
          },
          name_ru: {
            type: 'string',
            description: 'Xodim ismi (rus tilida)',
            example: 'Азиза Каримова'
          },
          position_uz: {
            type: 'string',
            description: 'Lavozimi (o\'zbek tilida)',
            example: 'Sartarosh'
          },
          position_en: {
            type: 'string',
            description: 'Lavozimi (ingliz tilida)',
            example: 'Hairdresser'
          },
          position_ru: {
            type: 'string',
            description: 'Lavozimi (rus tilida)',
            example: 'Парикмахер'
          },
          bio_uz: {
            type: 'string',
            description: 'Qisqacha ma\'lumot (o\'zbek tilida)',
            example: 'Professional sartarosh, 5 yillik tajriba'
          },
          bio_en: {
            type: 'string',
            description: 'Qisqacha ma\'lumot (ingliz tilida)',
            example: 'Professional hairdresser with 5 years experience'
          },
          bio_ru: {
            type: 'string',
            description: 'Qisqacha ma\'lumot (rus tilida)',
            example: 'Профессиональный парикмахер с 5-летним опытом'
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
      Schedule: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Jadval ID si',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          salon_id: {
            type: 'string',
            format: 'uuid',
            description: 'Salon ID si',
            example: '987fcdeb-51a2-43d1-9f12-123456789abc'
          },
          name: {
            type: 'string',
            description: 'Jadval nomi',
            example: 'Soch olish'
          },
          title: {
            type: 'string',
            description: 'Jadval sarlavhasi',
            example: 'Erkaklar soch olish xizmati'
          },
          date: {
            type: 'string',
            format: 'date',
            description: 'Jadval sanasi',
            example: '2025-09-28'
          },
          repeat: {
            type: 'boolean',
            description: 'Takrorlanish holati',
            example: false
          },
          repeat_value: {
            type: 'integer',
            description: 'Takrorlanish qiymati',
            example: null
          },
          employee_list: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Xodimlar ro\'yxati',
            example: ['456e7890-f12b-34c5-d678-901234567890']
          },
          price: {
            type: 'number',
            format: 'decimal',
            description: 'Xizmat narxi',
            example: 50000
          },
          full_pay: {
            type: 'number',
            format: 'decimal',
            description: 'To\'liq to\'lov',
            example: null
          },
          deposit: {
            type: 'number',
            format: 'decimal',
            description: 'Oldindan to\'lov',
            example: null
          },
          is_active: {
            type: 'boolean',
            description: 'Faollik holati',
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
        required: ['id', 'salon_id', 'name', 'date', 'price']
      },
      Appointment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Appointment ID si',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          application_number: {
            type: 'string',
            description: 'Ariza raqami',
            example: 'APP000001'
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            description: 'Foydalanuvchi ID si',
            example: '456e7890-f12b-34c5-d678-901234567890'
          },
          phone_number: {
            type: 'string',
            description: 'Telefon raqami',
            example: '+998901234567'
          },
          application_date: {
            type: 'string',
            format: 'date',
            description: 'Ariza sanasi',
            example: '2024-01-15'
          },
          application_time: {
            type: 'string',
            description: 'Ariza vaqti',
            example: '10:00'
          },
          schedule_id: {
            type: 'string',
            format: 'uuid',
            description: 'Jadval ID si',
            example: '789e0123-f45b-67c8-d901-234567890123'
          },
          employee_id: {
            type: 'string',
            format: 'uuid',
            description: 'Xodim ID si',
            example: '012e3456-f78b-90c1-d234-567890123456'
          },
          service_name: {
            type: 'string',
            description: 'Xizmat nomi',
            example: 'Soch kesish'
          },
          service_price: {
            type: 'number',
            format: 'float',
            description: 'Xizmat narxi',
            example: 50000
          },
          status: {
            type: 'string',
            enum: ['pending', 'accepted', 'cancelled', 'done', 'ignored'],
            description: 'Appointment holati',
            example: 'pending'
          },
          notes: {
            type: 'string',
            description: 'Qo\'shimcha izohlar',
            example: 'Qisqa soch kesish'
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
        required: ['id', 'application_number', 'user_id', 'phone_number', 'application_date', 'application_time', 'schedule_id', 'employee_id', 'service_name', 'service_price', 'status']
      },
      AppointmentCreate: {
        type: 'object',
        properties: {
          phone_number: {
            type: 'string',
            description: 'Telefon raqami',
            example: '+998901234567'
          },
          application_date: {
            type: 'string',
            format: 'date',
            description: 'Ariza sanasi',
            example: '2024-01-15'
          },
          application_time: {
            type: 'string',
            description: 'Ariza vaqti',
            example: '10:00'
          },
          schedule_id: {
            type: 'string',
            format: 'uuid',
            description: 'Jadval ID si (bu orqali salon_id va employee_id aniqlanadi)',
            example: '789e0123-f45b-67c8-d901-234567890123'
          },
          service_name: {
            type: 'string',
            description: 'Xizmat nomi',
            example: 'Soch kesish'
          },
          service_price: {
            type: 'number',
            format: 'float',
            description: 'Xizmat narxi',
            example: 50000
          },
          notes: {
            type: 'string',
            description: 'Qo\'shimcha izohlar',
            example: 'Qisqa soch kesish'
          }
        },
        required: ['phone_number', 'application_date', 'application_time', 'schedule_id', 'service_name', 'service_price']
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

// Swagger UI konfiguratsiyasi (Heroku uchun yaxshilangan)
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Freya API Documentation',
  swaggerOptions: {
      requestInterceptor: (req) => {
        // CORS headers qo'shish
        req.headers = req.headers || {};
        req.headers['Access-Control-Allow-Origin'] = '*';
        req.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
        req.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
        
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          req.headers['Content-Type'] = 'application/json';
        }
        return req;
      },
      responseInterceptor: (res) => {
        // 500 xatosini aniqlash
        if (res.status >= 500) {
          console.error('Swagger 500 Error:', {
            status: res.status,
            statusText: res.statusText,
            url: res.url,
            response: res
          });
        }
        
        return res;
      },
    onComplete: () => {
      // Swagger UI loaded successfully
    },
    onFailure: (error) => {
      console.error('Swagger UI error:', error);
    },
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options'],
    tryItOutEnabled: true,
    validatorUrl: null, // Disable validator
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    showRequestHeaders: true,
    showCommonExtensions: true
  }
};

module.exports = {
  swaggerUi,
  specs,
  swaggerUiOptions,
};