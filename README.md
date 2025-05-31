# NestJS Backend Sample Application

A robust backend application built with NestJS, PostgreSQL, and Prisma, featuring user authentication, post management, comments, and login tracking.

## Architecture

### Tech Stack
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Containerization**: Docker & Docker Compose

### System Components
1. **Authentication System**
   - JWT-based authentication
   - User registration and login
   - Login tracking and analytics
   - Weekly login rankings

2. **User Management**
   - User registration
   - Profile management
   - Secure password handling with bcrypt

3. **Content Management**
   - Post creation and management
   - Comment system with pagination
   - User-post and user-comment relationships

4. **Database Schema**
   ```
   User
   ├── id (PK)
   ├── emailId (unique)
   ├── password (hashed)
   ├── username
   ├── createdAt
   ├── updatedAt
   ├── posts (1:N)
   ├── comments (1:N)
   └── logins (1:N)

   Post
   ├── id (PK)
   ├── title
   ├── content
   ├── createdAt
   ├── updatedAt
   ├── authorId (FK)
   └── comments (1:N)

   Comment
   ├── id (PK)
   ├── content
   ├── createdAt
   ├── updatedAt
   ├── authorId (FK)
   └── postId (FK)

   LoginRecord
   ├── id (PK)
   ├── userId (FK)
   ├── ipAddress
   └── loginAt
   ```

## API Documentation

### Authentication APIs

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```
Response: `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "createdAt": "2024-03-20T10:00:00Z"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
Response: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Login Records
```http
GET /api/auth/login-records/:userId
Authorization: Bearer <token>
```
Response: `200 OK`
```json
{
  "records": [
    {
      "userId": 1,
      "username": "username",
      "loginAt": "2024-03-20 15:30:45",
      "ipAddress": "127.0.0.1"
    }
  ],
  "total": 1
}
```

#### Get Weekly Rankings
```http
GET /api/auth/rankings
Authorization: Bearer <token>
```
Response: `200 OK`
```json
{
  "rankings": [
    {
      "username": "user1",
      "loginCount": 15,
      "rank": 1,
      "usersWithSameRank": 1
    }
  ],
  "totalUsers": 1
}
```

### Post APIs

#### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Post Title",
  "content": "Post content"
}
```
Response: `201 Created`
```json
{
  "id": 1,
  "title": "Post Title",
  "content": "Post content",
  "authorId": 1,
  "createdAt": "2024-03-20T10:00:00Z"
}
```

#### Get Posts
```http
GET /api/posts?cursor=1&limit=10
Authorization: Bearer <token>
```
Response: `200 OK`
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Post Title",
      "content": "Post content",
      "author": {
        "username": "username"
      },
      "createdAt": "2024-03-20T10:00:00Z"
    }
  ],
  "nextCursor": 2,
  "total": 1
}
```

### Comment APIs

#### Create Comment
```http
POST /api/posts/:postId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Comment content"
}
```
Response: `201 Created`
```json
{
  "id": 1,
  "content": "Comment content",
  "authorId": 1,
  "postId": 1,
  "createdAt": "2024-03-20T10:00:00Z"
}
```

#### Get Comments
```http
GET /api/posts/:postId/comments?cursor=1
Authorization: Bearer <token>
```
Response: `200 OK`
```json
{
  "comments": [
    {
      "id": 1,
      "content": "Comment content",
      "author": {
        "username": "username"
      },
      "createdAt": "2024-03-20T10:00:00Z"
    }
  ],
  "nextCursor": 2,
  "total": 1
}
```

## Setup and Running

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)
- PostgreSQL (for local development)

### Environment Setup
1. Copy environment file:
   ```bash
   cp .env.example .env
   ```
2. Update environment variables in `.env` if needed

### Running with Docker

1. **First-time Setup**
   ```bash
   # Make entrypoint script executable
   chmod +x docker-entrypoint.sh

   # Build and start services
   docker-compose up -d --build

   # Create initial database and run migrations
   docker-compose exec app npx prisma migrate dev --name init
   ```

2. **Verify Service**
   ```bash
   # Check if service is running
   curl http://localhost:3001/api/health
   ```

3. **Useful Commands**
   ```bash
   # View logs
   docker-compose logs -f

   # Stop services
   docker-compose down

   # Restart services
   docker-compose restart
   ```

### Development

1. **Database Management**
   ```bash
   # Create new migration
   docker-compose exec app npx prisma migrate dev --name your_migration_name

   # View database
   docker-compose exec app npx prisma studio

   # Reset database (development only)
   docker-compose exec app npx prisma migrate reset
   ```

## Security Features

1. **Authentication**
   - JWT-based authentication
   - Password hashing with bcrypt
   - Token expiration (20 minutes)

2. **Rate Limiting**
   - Login attempts limited
   - API request rate limiting

3. **Data Protection**
   - Input validation
   - SQL injection prevention (Prisma)
   - XSS protection

## Error Handling

The API uses standard HTTP status codes:
- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
