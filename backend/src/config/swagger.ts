import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MenaLink API',
      version: '1.0.0',
      description: 'API REST pour la plateforme de services à domicile MenaLink (Maroc)',
      contact: { name: 'MenaLink Dev', email: 'dev@menalink.ma' },
      license: { name: 'Proprietary' },
    },
    servers: [
      { url: '/api/v1', description: 'Current environment' },
      { url: 'http://localhost:4000/api/v1', description: 'Local development' },
      { url: 'https://menalink-api-staging.up.railway.app/api/v1', description: 'Staging' },
      { url: 'https://menalink-api.up.railway.app/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via POST /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Données invalides' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string', example: '+212600000001' },
            role: { type: 'string', enum: ['CLIENT', 'PROVIDER', 'ADMIN'] },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            clientId: { type: 'string', format: 'uuid' },
            providerId: { type: 'string', format: 'uuid' },
            serviceType: { type: 'string', enum: ['CLEANING', 'PLUMBING', 'ELECTRICAL', 'PAINTING', 'GARDENING', 'MOVING'] },
            status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'] },
            scheduledDate: { type: 'string', format: 'date-time' },
            address: { type: 'string' },
            totalAmount: { type: 'number', example: 350 },
            providerAmount: { type: 'number', example: 297.5 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Provider: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            bio: { type: 'string' },
            services: { type: 'array', items: { type: 'string' } },
            rating: { type: 'number', example: 4.7 },
            reviewCount: { type: 'integer', example: 23 },
            isAvailable: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            hourlyRate: { type: 'number', example: 80 },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentification et gestion des sessions' },
      { name: 'Users', description: 'Gestion des utilisateurs' },
      { name: 'Providers', description: 'Profils et disponibilité des prestataires' },
      { name: 'Bookings', description: 'Réservations de services' },
      { name: 'Payments', description: 'Paiements et transactions' },
      { name: 'Earnings', description: 'Revenus et retraits prestataires' },
      { name: 'Reviews', description: 'Avis et évaluations' },
      { name: 'Admin', description: 'Back-office administration' },
      { name: 'Health', description: 'Monitoring et santé API' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
