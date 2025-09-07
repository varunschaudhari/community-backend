# System Users Documentation

This document describes the separate system user authentication and management system that has been implemented alongside the existing community user system.

## Overview

The system user functionality provides a separate authentication and authorization system for administrative and system-level users. This is completely separate from the community user system and has different login endpoints, models, and permissions.

## Key Features

### 🔐 Separate Authentication System
- **Different Login Endpoint**: `/api/system/auth/login`
- **Separate JWT Secret**: Uses `SYSTEM_JWT_SECRET` environment variable
- **Shorter Token Expiry**: 8 hours (vs 24 hours for community users)
- **Enhanced Security**: 12-character minimum password, account lockout after 5 failed attempts

### 👥 System User Model
- **Employee ID**: Required unique identifier (format: ABC1234 or ABCD123456)
- **Department**: IT, HR, Finance, Operations, Security, Management, Support
- **System Roles**: System Admin, System Manager, System Operator, System Viewer
- **Access Levels**: 1-5 (higher number = more access)
- **Permissions**: Granular permission system for system operations

### 🛡️ Security Features
- **Account Lockout**: Temporary lockout after 5 failed login attempts
- **Password Expiry**: 90-day password expiration
- **Two-Factor Authentication**: Ready for implementation
- **IP Tracking**: Last login IP address tracking
- **Rate Limiting**: 5 attempts per 15-minute window

## API Endpoints

### Authentication Endpoints

#### System Login
```http
POST /api/system/auth/login
Content-Type: application/json

{
  "username": "sysadmin",
  "password": "SystemAdmin123!@#"
}
```

#### System Register (Admin Only)
```http
POST /api/system/auth/register
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "username": "newsysuser",
  "password": "NewPassword123!@#",
  "email": "newsysuser@company.com",
  "employeeId": "SYS0005",
  "department": "IT",
  "designation": "System Operator",
  "firstName": "New",
  "lastName": "User",
  "phone": "9876543216",
  "systemRole": "System Operator",
  "accessLevel": 3,
  "permissions": ["system:read", "logs:view", "monitoring:view"]
}
```

#### Get System Profile
```http
GET /api/system/auth/profile
Authorization: Bearer <system_token>
```

#### Change Password
```http
POST /api/system/auth/change-password
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!@#",
  "newPassword": "NewPassword123!@#"
}
```

### System User Management Endpoints

#### Get All System Users
```http
GET /api/system/users?page=1&limit=10&department=IT&systemRole=System Admin
Authorization: Bearer <system_token>
```

#### Get System User by ID
```http
GET /api/system/users/:id
Authorization: Bearer <system_token>
```

#### Update System User
```http
PUT /api/system/users/:id
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "department": "Security",
  "accessLevel": 4,
  "permissions": ["system:read", "system:write", "security:manage"]
}
```

#### Deactivate System User
```http
POST /api/system/users/:id/deactivate
Authorization: Bearer <system_token>
```

#### Reset System User Password
```http
POST /api/system/users/:id/reset-password
Authorization: Bearer <system_token>
Content-Type: application/json

{
  "newPassword": "NewPassword123!@#"
}
```

## System Roles and Permissions

### System Roles
1. **System Admin** (Access Level 5)
   - Full system access
   - Can manage all system users
   - Can perform all system operations

2. **System Manager** (Access Level 4)
   - Management-level access
   - Can manage users and system settings
   - Cannot delete critical system data

3. **System Operator** (Access Level 3)
   - Operational access
   - Can monitor and perform maintenance
   - Limited user management

4. **System Viewer** (Access Level 2)
   - Read-only access
   - Can view logs and monitoring data
   - Cannot modify system settings

### Available Permissions
- `system:read` - Read system information
- `system:write` - Modify system settings
- `system:delete` - Delete system data
- `users:manage` - Manage system users
- `database:backup` - Create database backups
- `database:restore` - Restore database backups
- `logs:view` - View system logs
- `logs:export` - Export system logs
- `settings:system` - Modify system settings
- `settings:security` - Modify security settings
- `reports:generate` - Generate system reports
- `maintenance:schedule` - Schedule system maintenance
- `backup:create` - Create system backups
- `backup:restore` - Restore system backups
- `monitoring:view` - View system monitoring
- `alerts:manage` - Manage system alerts

## Environment Variables

Add these to your `.env` file:

```env
# System JWT Secret (different from regular JWT secret)
SYSTEM_JWT_SECRET=your-system-secret-key-change-in-production

# Regular JWT Secret (for community users)
JWT_SECRET=your-regular-secret-key-change-in-production
```

## Seeding System Users

Run the seeding script to create initial system users:

```bash
cd community-backend
node scripts/seedSystemUsers.js
```

This will create the following default system users:

| Username | Role | Password | Department |
|----------|------|----------|------------|
| sysadmin | System Admin | SystemAdmin123!@# | IT |
| sysmanager | System Manager | SystemManager123!@# | IT |
| sysoperator | System Operator | SystemOperator123!@# | IT |
| sysviewer | System Viewer | SystemViewer123!@# | IT |
| hrmanager | System Manager | HRManager123!@# | HR |
| financeadmin | System Manager | FinanceAdmin123!@# | Finance |

**⚠️ Important**: Change these default passwords in production!

## Usage Examples

### 1. System Admin Login
```javascript
const response = await fetch('/api/system/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'sysadmin',
    password: 'SystemAdmin123!@#'
  })
});

const data = await response.json();
const token = data.data.token;
```

### 2. Access Protected System Endpoint
```javascript
const response = await fetch('/api/system/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. Check System User Permissions
```javascript
const response = await fetch('/api/system/auth/permissions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('User permissions:', data.data.permissions);
```

## Differences from Community Users

| Feature | Community Users | System Users |
|---------|----------------|--------------|
| Login Endpoint | `/api/auth/login` | `/api/system/auth/login` |
| JWT Secret | `JWT_SECRET` | `SYSTEM_JWT_SECRET` |
| Token Expiry | 24 hours | 8 hours |
| Password Length | 8 characters | 12 characters |
| Account Lockout | No | Yes (5 attempts) |
| Password Expiry | No | Yes (90 days) |
| Employee ID | No | Yes (required) |
| Department | No | Yes (required) |
| Access Levels | No | Yes (1-5) |
| System Permissions | No | Yes (granular) |

## Security Considerations

1. **Separate Secrets**: Use different JWT secrets for community and system users
2. **Strong Passwords**: System users require 12+ character passwords
3. **Account Lockout**: Prevents brute force attacks
4. **Password Expiry**: Forces regular password changes
5. **IP Tracking**: Monitor login locations
6. **Rate Limiting**: Prevent rapid login attempts
7. **Role-Based Access**: Granular permission system

## Troubleshooting

### Common Issues

1. **"Invalid system token"**
   - Check if using correct JWT secret
   - Verify token hasn't expired
   - Ensure token is for system user (not community user)

2. **"Account is temporarily locked"**
   - Wait 2 hours or contact system admin
   - System admin can unlock account via API

3. **"Password has expired"**
   - Contact system admin to reset password
   - Or use change password endpoint if still valid

4. **"Access denied"**
   - Check user permissions
   - Verify system role and access level
   - Ensure user is active and verified

### Health Check

Test system authentication service:

```bash
curl http://localhost:5000/api/system/auth/health
```

## Future Enhancements

1. **Two-Factor Authentication**: Implement TOTP support
2. **Session Management**: Track active sessions
3. **Audit Logging**: Log all system user actions
4. **Password Policies**: Configurable password requirements
5. **SSO Integration**: Single sign-on support
6. **API Key Management**: For system-to-system authentication
