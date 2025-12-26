import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Adds AI API',
      version: '1.0.0',
      description: 'AI-powered website creation platform API documentation',
      contact: {
        name: 'Adds AI Support',
        email: 'support@adds.ai',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.adds.ai',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth-token',
          description: 'Authentication cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier',
              example: 'user-uuid-123',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            nicename: {
              type: 'string',
              description: 'User display name',
              example: 'johndoe',
            },
            status: {
              type: 'boolean',
              description: 'User active status',
              example: true,
            },
            roleId: {
              type: 'string',
              description: 'User role ID',
              example: 'role-uuid-123',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            role: {
              $ref: '#/components/schemas/Role',
            },
            metas: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/UserMeta',
              },
            },
          },
        },
        UserMeta: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User meta unique identifier',
            },
            user_id: {
              type: 'string',
              description: 'Associated user ID',
            },
            meta_key: {
              type: 'string',
              description: 'Meta data key',
              example: 'first_name',
            },
            meta_value: {
              type: 'string',
              description: 'Meta data value',
              example: 'John',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Role unique identifier',
            },
            name: {
              type: 'string',
              description: 'Role name',
              example: 'User',
            },
            status: {
              type: 'boolean',
              description: 'Role active status',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Site: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Site unique identifier',
              example: 'site-uuid-123',
            },
            domain: {
              type: 'string',
              description: 'Site domain name',
              example: 'example.com',
            },
            site_name: {
              type: 'string',
              description: 'Site display name',
              example: 'My Awesome Site',
            },
            status: {
              type: 'boolean',
              description: 'Site active status',
              example: true,
            },
            user_id: {
              type: 'string',
              description: 'Owner user ID',
              example: 'user-uuid-123',
            },
            company_id: {
              type: 'string',
              description: 'Associated company ID',
              example: 'company-uuid-123',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Site creation timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Site last update timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            site_meta: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SiteMeta',
              },
            },
            company: {
              $ref: '#/components/schemas/Company',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            articles: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Article',
              },
            },
          },
        },
        SiteMeta: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Site meta unique identifier',
            },
            site_id: {
              type: 'string',
              description: 'Associated site ID',
            },
            meta_key: {
              type: 'string',
              description: 'Meta data key',
              example: 'tagline',
            },
            meta_value: {
              type: 'string',
              description: 'Meta data value',
              example: 'The best site ever',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Article: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Article unique identifier',
              example: 'article-uuid-123',
            },
            title: {
              type: 'string',
              description: 'Article title',
              example: 'How to Build a Website',
            },
            content: {
              type: 'string',
              description: 'Article content in HTML format',
              example: '<p>This is the article content...</p>',
            },
            meta_description: {
              type: 'string',
              description: 'Article meta description for SEO',
              example: 'Learn how to build a website from scratch with this comprehensive guide.',
            },
            meta_keywords: {
              type: 'string',
              description: 'Article meta keywords for SEO',
              example: 'website, build, tutorial',
            },
            meta_title: {
              type: 'string',
              description: 'Article meta title for SEO',
              example: 'How to Build a Website - Complete Guide',
            },
            image_url: {
              type: 'string',
              description: 'Article featured image URL',
              example: 'https://cdn.example.com/images/article-image.jpg',
            },
            slug: {
              type: 'string',
              description: 'Article URL slug',
              example: 'how-to-build-a-website',
            },
            published: {
              type: 'boolean',
              description: 'Article publication status',
              example: true,
            },
            status: {
              type: 'boolean',
              description: 'Article active status',
              example: true,
            },
            site_id: {
              type: 'string',
              description: 'Associated site ID',
              example: 'site-uuid-123',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Article creation timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Article last update timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            site: {
              $ref: '#/components/schemas/Site',
            },
            article_tags: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ArticleTag',
              },
            },
          },
        },
        ArticleTag: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Article tag unique identifier',
            },
            tag_id: {
              type: 'string',
              description: 'Associated tag ID',
            },
            article_id: {
              type: 'string',
              description: 'Associated article ID',
            },
            status: {
              type: 'boolean',
              description: 'Article tag active status',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
            tag: {
              $ref: '#/components/schemas/Tag',
            },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Company unique identifier',
              example: 'company-uuid-123',
            },
            name: {
              type: 'string',
              description: 'Company name',
              example: 'Acme Corp',
            },
            phone: {
              type: 'string',
              description: 'Company phone number',
              example: '+1234567890',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Company email address',
              example: 'contact@acme.com',
            },
            address: {
              type: 'string',
              description: 'Company address',
              example: '123 Main St, City, State, ZIP',
            },
            vat: {
              type: 'string',
              description: 'Company VAT number',
              example: 'VAT123456',
            },
            user_id: {
              type: 'string',
              description: 'Associated user ID',
              example: 'user-uuid-123',
            },
            status: {
              type: 'boolean',
              description: 'Company active status',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Company creation timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Company last update timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            sites: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Site',
              },
            },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Tag unique identifier',
              example: 'tag-uuid-123',
            },
            name: {
              type: 'string',
              description: 'Tag name',
              example: 'Web Development',
            },
            slug: {
              type: 'string',
              description: 'Tag URL slug',
              example: 'web-development',
            },
            description: {
              type: 'string',
              description: 'Tag description',
              example: 'Articles about web development',
            },
            status: {
              type: 'boolean',
              description: 'Tag active status',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Tag creation timestamp',
              example: '2023-01-01T00:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Tag last update timestamp',
              example: '2023-01-01T00:00:00Z',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Operation success status',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./app/api/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
