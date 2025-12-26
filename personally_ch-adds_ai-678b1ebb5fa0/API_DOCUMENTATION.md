# API Documentation

This document provides comprehensive documentation for all API endpoints in the Adds-ai project.

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [Article Management](#article-management)
- [Site Management](#site-management)
- [Company Management](#company-management)
- [Page Management](#page-management)
- [Tag Management](#tag-management)
- [Profile Management](#profile-management)
- [Contact Management](#contact-management)
- [AI Generation Endpoints](#ai-generation-endpoints)
- [Cron Jobs](#cron-jobs)
- [Freestar Integration](#freestar-integration)

---

## Authentication Endpoints

### User Registration
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "nicename": "john_doe",
    "phone": "+1234567890",
    "company": "Company Name"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": { "id": "uuid", "email": "user@example.com", ... },
      "company": { "id": "uuid", "name": "Company Name" }
    }
  }
  ```

### User Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate user and return JWT token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": { "user": { ... } }
  }
  ```

### Check Email Availability
- **Endpoint**: `GET /api/auth/check-availability?email=user@example.com`
- **Description**: Check if an email is already registered
- **Response**: 
  ```json
  {
    "success": true,
    "available": true
  }
  ```

### Verify Registration OTP
- **Endpoint**: `POST /api/auth/verify-registration-otp`
- **Description**: Verify OTP sent during registration
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```

### Send Registration OTP
- **Endpoint**: `POST /api/auth/send-registration-otp`
- **Description**: Send OTP for registration verification
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Forgot Password
- **Endpoint**: `POST /api/auth/forgot-password`
- **Description**: Send password reset email
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Description**: Reset password using reset token
- **Request Body**:
  ```json
  {
    "token": "reset_token_here",
    "password": "newPassword123"
  }
  ```

### Verify OTP
- **Endpoint**: `POST /api/auth/verify-otp`
- **Description**: Verify OTP for various operations
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "type": "reset_password"
  }
  ```

### Refresh Token
- **Endpoint**: `POST /api/auth/refresh`
- **Description**: Refresh expired JWT token
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully"
  }
  ```

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Description**: Logout user and invalidate session
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### Verify Token
- **Endpoint**: `GET /api/auth/verify`
- **Description**: Verify if current JWT token is valid
- **Response**: 
  ```json
  {
    "success": true,
    "valid": true,
    "user": { ... }
  }
  ```

### Cleanup Sessions
- **Endpoint**: `POST /api/auth/cleanup-sessions`
- **Description**: Clean up expired sessions
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Sessions cleaned up successfully"
  }
  ```

### Get Sessions
- **Endpoint**: `GET /api/auth/sessions`
- **Description**: Get user's active sessions
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "created_at": "2024-01-01T00:00:00Z", ... }
    ]
  }
  ```

---

## Article Management

### Get All Articles
- **Endpoint**: `GET /api/articles/get`
- **Description**: Retrieve all articles with pagination and search
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `search` (optional): Search term for title/content
  - `status` (optional): Filter by status (true/false)
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "title": "Article Title",
        "content": "Article content...",
        "status": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```

### Get Article by Slug
- **Endpoint**: `GET /api/articles/get/[slug]`
- **Description**: Retrieve a specific article by its slug
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "title": "Article Title",
      "slug": "article-slug",
      "content": "Article content...",
      "status": true
    }
  }
  ```

### Search Articles
- **Endpoint**: `GET /api/articles/get/search?q=search_term`
- **Description**: Search articles by title or content
- **Query Parameters**:
  - `q`: Search query string
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "title": "Article Title", "slug": "article-slug" }
    ]
  }
  ```

### Get Articles by Author
- **Endpoint**: `GET /api/articles/getByAuthor/[author]`
- **Description**: Retrieve articles by specific author
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "title": "Article Title", "author": "author_name" }
    ]
  }
  ```

### Get Articles by Tag
- **Endpoint**: `GET /api/articles/getByTag/[slug]`
- **Description**: Retrieve articles by specific tag
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "title": "Article Title", "tags": ["tag1", "tag2"] }
    ]
  }
  ```

### Save Article
- **Endpoint**: `POST /api/articles/save`
- **Description**: Create or update an article
- **Request Body**:
  ```json
  {
    "title": "Article Title",
    "content": "Article content...",
    "status": true,
    "tags": ["tag1", "tag2"],
    "site_id": "site_uuid"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Article saved successfully",
    "data": { "id": "uuid", "title": "Article Title" }
  }
  ```

### Update Article
- **Endpoint**: `PUT /api/articles/update`
- **Description**: Update an existing article
- **Request Body**:
  ```json
  {
    "id": "article_uuid",
    "title": "Updated Title",
    "content": "Updated content...",
    "status": true
  }
  ```

### Delete Article
- **Endpoint**: `DELETE /api/articles/delete`
- **Description**: Delete an article
- **Request Body**:
  ```json
  {
    "id": "article_uuid"
  }
  ```

---

## Article Generation (AI)

### Generate Article Title
- **Endpoint**: `POST /api/articles/generate/title`
- **Description**: Generate article title using AI
- **Request Body**:
  ```json
  {
    "topic": "Main topic",
    "keywords": ["keyword1", "keyword2"],
    "tone": "professional"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "title": "Generated Article Title"
    }
  }
  ```

### Generate Single Article
- **Endpoint**: `POST /api/articles/generate/single-article`
- **Description**: Generate complete article content using AI
- **Request Body**:
  ```json
  {
    "title": "Article Title",
    "keywords": ["keyword1", "keyword2"],
    "wordCount": 800,
    "tone": "professional"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "content": "Generated article content...",
      "fallback": false
    }
  }
  ```

### Generate Multiple Articles
- **Endpoint**: `POST /api/articles/generate/article`
- **Description**: Generate multiple articles using AI
- **Request Body**:
  ```json
  {
    "count": 5,
    "topic": "Main topic",
    "keywords": ["keyword1", "keyword2"]
  }
  ```

### Generate Article Image
- **Endpoint**: `POST /api/articles/generate/image`
- **Description**: Generate image for article using AI
- **Request Body**:
  ```json
  {
    "prompt": "Image description",
    "style": "realistic",
    "size": "1024x1024"
  }
  ```

---

## Site Management

### Create Site
- **Endpoint**: `POST /api/site/create`
- **Description**: Create a new website with domain and SSL
- **Request Body**:
  ```json
  {
    "domain": "example.com",
    "site_name": "My Website",
    "company_id": "company_uuid",
    "user_id": "user_uuid"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Site created successfully",
    "data": {
      "id": "uuid",
      "domain": "example.com",
      "ssl_status": "installed"
    }
  }
  ```

### Get All Sites
- **Endpoint**: `GET /api/site/get-all`
- **Description**: Retrieve all sites with pagination
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `search` (optional): Search term
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "domain": "example.com",
        "site_name": "My Website",
        "status": true,
        "ssl_status": "installed"
      }
    ]
  }
  ```

### Get Site Data
- **Endpoint**: `GET /api/site/data?domain=example.com`
- **Description**: Get site information by domain
- **Query Parameters**:
  - `domain`: Domain name
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "domain": "example.com",
      "site_name": "My Website",
      "company": { "name": "Company Name" }
    }
  }
  ```

### Update Site
- **Endpoint**: `PUT /api/site/update`
- **Description**: Update site information
- **Request Body**:
  ```json
  {
    "id": "site_uuid",
    "site_name": "Updated Site Name",
    "status": true
  }
  ```

### Delete Site
- **Endpoint**: `DELETE /api/site/delete`
- **Description**: Delete a site
- **Request Body**:
  ```json
  {
    "id": "site_uuid"
  }
  ```

### Validate Site
- **Endpoint**: `POST /api/site/validate`
- **Description**: Validate site configuration
- **Request Body**:
  ```json
  {
    "domain": "example.com"
  }
  ```

### Publish Site
- **Endpoint**: `POST /api/site/publish`
- **Description**: Publish site changes
- **Request Body**:
  ```json
  {
    "id": "site_uuid"
  }
  ```

---

## Company Management

### Get Companies
- **Endpoint**: `GET /api/companies/get`
- **Description**: Retrieve all companies with pagination and search
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `search` (optional): Search term
  - `status` (optional): Filter by status (true/false)
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Company Name",
        "email": "company@example.com",
        "phone": "+1234567890",
        "status": true,
        "user": { "id": "uuid", "email": "user@example.com" },
        "sites": [{ "id": "uuid", "domain": "example.com" }],
        "_count": { "sites": 1 }
      }
    ],
    "pagination": { ... }
  }
  ```

### Update Company
- **Endpoint**: `PUT /api/companies/update`
- **Description**: Update company information
- **Request Body**:
  ```json
  {
    "id": "company_uuid",
    "name": "Updated Company Name",
    "email": "updated@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "vat": "VAT123456"
  }
  ```

### Delete Company
- **Endpoint**: `DELETE /api/companies/delete`
- **Description**: Delete a company (only if no sites registered)
- **Request Body**:
  ```json
  {
    "id": "company_uuid"
  }
  ```

### Toggle Company Status
- **Endpoint**: `PUT /api/companies/toggle-status`
- **Description**: Enable/disable a company (only if no sites registered)
- **Request Body**:
  ```json
  {
    "id": "company_uuid"
  }
  ```

---

## Page Management

### Get All Pages
- **Endpoint**: `GET /api/pages/getall`
- **Description**: Retrieve all static pages
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "title": "Page Title",
        "slug": "page-slug",
        "content": "Page content...",
        "status": true
      }
    ]
  }
  ```

### Get Page by Type
- **Endpoint**: `GET /api/pages/get/[page_type]`
- **Description**: Retrieve page by type (e.g., about, contact, privacy)
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "title": "About Us",
      "content": "About page content...",
      "type": "about"
    }
  }
  ```

### Save Page
- **Endpoint**: `POST /api/pages/save`
- **Description**: Create or update a static page
- **Request Body**:
  ```json
  {
    "title": "Page Title",
    "content": "Page content...",
    "type": "about",
    "status": true,
    "site_id": "site_uuid"
  }
  ```

---

## Tag Management

### Get Tags
- **Endpoint**: `GET /api/tags/get`
- **Description**: Retrieve all available tags
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "Technology",
        "slug": "technology",
        "count": 15
      }
    ]
  }
  ```

---

## Profile Management

### Get/Update Profile
- **Endpoint**: `GET/PUT /api/profile`
- **Description**: Retrieve or update user profile information
- **Request Body** (PUT):
  ```json
  {
    "nicename": "new_nicename",
    "phone": "+1234567890",
    "company": "Company Name"
  }
  ```

---

## Contact Management

### Submit Contact Form
- **Endpoint**: `POST /api/contact`
- **Description**: Submit contact form and send notifications
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "General Inquiry",
    "message": "Hello, I have a question..."
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Contact form submitted successfully"
  }
  ```

---

## AI Generation Endpoints

### Generate Logo
- **Endpoint**: `POST /api/generate-logo-ai`
- **Description**: Generate company logo using OpenAI DALL-E
- **Request Body**:
  ```json
  {
    "company_name": "Company Name",
    "industry": "Technology",
    "style": "modern",
    "colors": ["blue", "white"]
  }
  ```

### Generate Favicon
- **Endpoint**: `POST /api/generate-favicon-ai`
- **Description**: Generate favicon using OpenAI DALL-E
- **Request Body**:
  ```json
  {
    "company_name": "Company Name",
    "style": "minimal",
    "colors": ["blue", "white"]
  }
  ```

### Generate Image
- **Endpoint**: `POST /api/generate-image`
- **Description**: Generate custom images using AI
- **Request Body**:
  ```json
  {
    "prompt": "A modern office building",
    "style": "realistic",
    "size": "1024x1024"
  }
  ```

---

## Cron Jobs

### Cleanup Sessions
- **Endpoint**: `POST /api/cron/cleanup-sessions`
- **Description**: Automated cleanup of expired sessions
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Cron job completed successfully"
  }
  ```

---

## Freestar Integration

### Freestar API
- **Endpoint**: Various endpoints under `/api/freestar/`
- **Description**: Integration with Freestar advertising platform
- **Note**: Specific endpoints depend on Freestar API documentation

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE" // Optional
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Or use HTTP-only cookies for automatic authentication.

---

## Rate Limiting

Some endpoints may have rate limiting applied to prevent abuse. Check response headers for rate limit information.

---

## Pagination

Endpoints that return lists support pagination with the following query parameters:
- `page`: Page number (starts from 1)
- `limit`: Number of items per page

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- IDs are UUIDs unless otherwise specified
- File uploads are handled through DigitalOcean Spaces integration
- SSL certificates are automatically managed through Let's Encrypt
- DNS management is handled through Cloudflare API
