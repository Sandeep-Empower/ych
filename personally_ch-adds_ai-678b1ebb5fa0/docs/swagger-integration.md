# Swagger API Documentation Integration

This document describes the Swagger/OpenAPI integration for the Adds AI project.

## Overview

The project now includes comprehensive API documentation using Swagger/OpenAPI 3.0. This provides:

- Interactive API documentation
- Request/response schemas
- Authentication details
- Try-it-out functionality
- Comprehensive data models

## Accessing the Documentation

### Swagger UI Interface
Visit the interactive Swagger UI at:
```
http://localhost:3001/swagger.html
```

Alternative React-based UI (if available):
```
http://localhost:3001/docs
```

Quick redirect page:
```
http://localhost:3001/api-docs
```

### Raw OpenAPI Specification
Get the raw OpenAPI JSON specification at:
```
http://localhost:3001/api/docs
```

## Project Structure

### Configuration
- `lib/swagger.ts` - Main Swagger configuration with schemas and settings
- `app/api/docs/route.ts` - API endpoint serving the OpenAPI specification
- `app/docs/page.tsx` - Swagger UI React component page

### Dependencies Added
- `swagger-ui-express` - Swagger UI middleware
- `swagger-jsdoc` - JSDoc to OpenAPI converter
- `swagger-ui-react` - React component for Swagger UI
- `@types/swagger-ui-express` - TypeScript types
- `@types/swagger-jsdoc` - TypeScript types
- `@types/swagger-ui-react` - TypeScript types

## API Documentation Coverage

### Authentication APIs
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify` - Verify JWT token

### Site Management APIs
- `POST /api/site/create` - Create new site
- `GET /api/site/data` - Get site data by domain
- `GET /api/site/get-all` - Get all sites

### Article APIs
- `POST /api/articles/generate/article` - Generate articles using AI
- `POST /api/articles/save` - Save articles to site

### Utility APIs
- `POST /api/generate-logo-ai` - Generate logo using AI
- `POST /api/generate-image` - Generate image using AI
- `POST /api/generate-favicon-ai` - Generate favicon using AI

### Profile APIs
- `GET /api/profile` - Get user profile information

## Data Models

The following schemas are defined for consistent API responses:

- `User` - User account information
- `UserMeta` - User metadata key-value pairs
- `Role` - User roles and permissions
- `Site` - Website information
- `SiteMeta` - Site metadata key-value pairs
- `Article` - Article content and metadata
- `ArticleTag` - Article-tag relationships
- `Company` - Company information
- `Tag` - Content tags
- `Error` - Standard error response format
- `Success` - Standard success response format

## Security Schemes

The API supports two authentication methods:

1. **Bearer Token Authentication**
   - Header: `Authorization: Bearer <token>`
   - Used for API access with JWT tokens

2. **Cookie Authentication**
   - Cookie: `auth-token`
   - Used for browser-based authentication

## Adding Documentation to New Endpoints

When creating new API endpoints, add Swagger documentation using JSDoc comments:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Brief description
 *     description: Detailed description
 *     tags:
 *       - Category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: value
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
export async function POST(req: NextRequest) {
  // Your implementation
}
```

## Best Practices

1. **Use Consistent Schemas**: Reference existing schemas when possible
2. **Provide Examples**: Include realistic examples in all schema properties
3. **Document All Parameters**: Include all query parameters, headers, and body fields
4. **Use Proper HTTP Status Codes**: Document all possible response codes
5. **Group Related Endpoints**: Use tags to organize endpoints logically
6. **Security Documentation**: Specify required authentication for protected endpoints

## Development Notes

- The Swagger configuration automatically scans `./app/api/**/*.ts` for JSDoc comments
- Schemas are defined in `lib/swagger.ts` and can be referenced using `$ref`
- The development server runs on port 3001 if port 3000 is occupied
- All endpoints should follow RESTful conventions where possible

## Troubleshooting

### Swagger UI Not Loading
If the React-based Swagger UI at `/docs` is not loading properly:

1. **Use the Static HTML Version**: Visit `/swagger.html` which uses CDN-based Swagger UI
2. **Check Console Errors**: Open browser developer tools to check for JavaScript errors
3. **Verify API Endpoint**: Ensure `/api/docs` returns valid JSON
4. **Clear Browser Cache**: Try hard refresh (Ctrl+F5) or clear browser cache

### Common Issues
- **CSS Not Loading**: The static HTML version includes all necessary CSS via CDN
- **React Component Issues**: The dynamic import might fail in some environments
- **CORS Issues**: Ensure the API endpoints are accessible from the same domain

## Future Enhancements

- Add request/response validation using the OpenAPI schema
- Implement API versioning
- Add more detailed error codes and messages
- Include rate limiting documentation
- Add webhook documentation if applicable
- Improve React-based Swagger UI reliability
