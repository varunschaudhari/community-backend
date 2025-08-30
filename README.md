# Community App Backend API

A complete Node.js/Express backend API with JWT authentication, role-based authorization, and MongoDB integration.

## 🚀 Features

- **JWT Authentication** with secure token management
- **Role-based Authorization** (admin, moderator, member)
- **Password Hashing** with bcrypt (salt rounds: 10)
- **MongoDB Integration** with Mongoose ODM
- **Input Validation** and error handling
- **Rate Limiting** for API protection
- **CORS Support** for frontend integration
- **Security Headers** with Helmet
- **Request Logging** with Morgan
- **Environment Configuration** with dotenv

## 📁 Project Structure

```
community-backend/
├── models/
│   └── User.js                 # User model with Mongoose schema
├── controllers/
│   └── authController.js       # Authentication controller functions
├── middlewares/
│   └── authMiddleware.js       # JWT auth and role-based middleware
├── routes/
│   └── authRoutes.js           # Authentication routes
├── scripts/
│   └── seedUsers.js            # Database seeding script
├── app.js                      # Main Express application
├── package.json                # Dependencies and scripts
├── env.example                 # Environment variables template
└── README.md                   # This file
```

## 🛠️ Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd community-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/community-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

5. **Seed the database** (optional)
   ```bash
   node scripts/seedUsers.js
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔐 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "email": "admin@community.com",
      "role": "admin",
      "verified": true
    },
    "expiresIn": "24h"
  }
}
```

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### POST `/api/auth/logout`
Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### GET `/api/auth/validate`
Validate JWT token.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### Role-based Endpoints

#### GET `/api/auth/admin`
Admin-only endpoint.

#### GET `/api/auth/member`
Member-only endpoint.

#### GET `/api/auth/moderator`
Moderator or Admin endpoint.

### Utility Endpoints

#### GET `/health`
Health check endpoint.

#### GET `/`
API information endpoint.

## 🔧 Middleware

### Authentication Middleware

```javascript
const { authenticateToken } = require('./middlewares/authMiddleware');

// Protect routes
app.get('/protected', authenticateToken, (req, res) => {
  // req.user contains user information
  res.json({ user: req.user });
});
```

### Role-based Authorization

```javascript
const { authorizeRoles } = require('./middlewares/authMiddleware');

// Single role
app.get('/admin-only', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Multiple roles
app.get('/moderator', authenticateToken, authorizeRoles(['admin', 'moderator']), (req, res) => {
  res.json({ message: 'Moderator access granted' });
});
```

## 📊 Sample Users

After running the seed script, you'll have these test users:

| Username | Password | Role | Verified |
|----------|----------|------|----------|
| admin | admin123 | admin | ✅ |
| moderator | moderator123 | moderator | ✅ |
| member1 | member123 | member | ✅ |
| member2 | member123 | member | ✅ |
| unverified | unverified123 | member | ❌ |

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: 24-hour expiration
- **Input Validation**: Comprehensive validation for all inputs
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable CORS settings
- **Security Headers**: Helmet.js for security headers
- **Error Handling**: Graceful error handling without exposing sensitive data

## 🧪 Testing

### Manual Testing with cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Admin endpoint
curl -X GET http://localhost:3001/api/auth/admin \
  -H "Authorization: Bearer TOKEN"
```

### Automated Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/community-app
JWT_SECRET=your-super-secure-production-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type (development only)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🔧 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

### Adding New Routes

1. Create controller function in `controllers/`
2. Create route in `routes/`
3. Add middleware for authentication/authorization as needed
4. Update main `app.js` to include new routes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔗 Related Projects

- [Community App Frontend](https://github.com/your-username/community-frontend) - React frontend application
