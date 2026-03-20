import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'CampusBite API',
            version: '1.0.0',
            description: `
## CampusBite REST API

Campus food ordering platform API. Supports three roles:

- **Student** — Browse outlets, order food, track orders, view QR for pickup
- **Owner** — Manage menus, confirm orders, scan QR codes
- **Admin** — Platform-wide management and analytics

### Authentication
All protected endpoints require a Bearer token in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### Refresh Tokens
Access tokens expire in **15 minutes**. Use \`POST /api/v1/auth/refresh\` to get a new access token using the refresh token stored in an \`HttpOnly\` cookie.
            `.trim(),
            contact: {
                name: 'CampusBite Support',
                email: 'support@campusbite.app',
            },
            license: { name: 'MIT' },
        },
        servers: [
            { url: 'http://localhost:5001', description: 'Local Development' },
            { url: 'https://api.campusbite.app', description: 'Production' },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Access Token (expires in 15m)',
                },
            },
            schemas: {
                // ─── Auth ─────────────────────────────────────────────────────
                RegisterRequest: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        name: { type: 'string', example: 'Arjun Sharma' },
                        email: { type: 'string', format: 'email', example: 'arjun@bennett.edu.in' },
                        password: { type: 'string', minLength: 6, example: 'SecurePass123' },
                        enrollmentNumber: { type: 'string', example: 'E22CSE001' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', example: 'arjun@bennett.edu.in' },
                        password: { type: 'string', example: 'SecurePass123' },
                        enrollmentNumber: { type: 'string', example: 'E22CSE001' },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Login successful' },
                        data: {
                            type: 'object',
                            properties: {
                                token: { type: 'string', description: 'Short-lived JWT access token (15m)' },
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                                role: { type: 'string', enum: ['Student', 'Owner', 'Admin'] },
                            },
                        },
                    },
                },
                // ─── Orders ───────────────────────────────────────────────────
                CreateOrderRequest: {
                    type: 'object',
                    required: ['outletId', 'items'],
                    properties: {
                        outletId: { type: 'string', example: '3' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    menuItemId: { type: 'string', example: '12' },
                                    quantity: { type: 'integer', minimum: 1, example: 2 },
                                },
                            },
                        },
                        notes: { type: 'string', example: 'Extra spicy please' },
                        scheduledTime: { type: 'string', format: 'date-time' },
                    },
                },
                OrderStatusUpdate: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['preparing', 'ready', 'completed', 'cancelled'],
                            example: 'ready',
                        },
                    },
                },
                // ─── Payments ─────────────────────────────────────────────────
                PaymentRequest: {
                    type: 'object',
                    required: ['orderId', 'amount', 'paymentMethod'],
                    properties: {
                        orderId: { type: 'integer', example: 42 },
                        amount: { type: 'number', example: 150.00 },
                        paymentMethod: { type: 'string', enum: ['card', 'upi', 'cash'], example: 'upi' },
                    },
                },
                // ─── Common ───────────────────────────────────────────────────
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operation successful' },
                        data: { type: 'object' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Unauthorized' },
                    },
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'array', items: {} },
                        meta: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', example: 0 },
                                size: { type: 'integer', example: 20 },
                                totalElements: { type: 'integer', example: 150 },
                                totalPages: { type: 'integer', example: 8 },
                                hasNext: { type: 'boolean' },
                                hasPrev: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    // Glob pattern to scan for JSDoc annotations
    apis: ['./src/routes/v1/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
