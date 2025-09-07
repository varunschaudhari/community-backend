# Login Routes Separation Documentation

## 🎯 **Complete Separation Confirmed**

The system users and normal users login routes are **completely separate** as requested. Here's the detailed breakdown:

## 🔐 **Normal Users (Community Users) Login Routes**

### Base Path: `/api/auth`

| Route | Method | Description | Access |
|-------|--------|-------------|---------|
| `/api/auth/login` | POST | Community user login | Public |
| `/api/auth/register` | POST | Community user registration | Public |
| `/api/auth/profile` | GET | Get community user profile | Private |
| `/api/auth/logout` | POST | Community user logout | Private |
| `/api/auth/validate` | GET | Validate community user token | Private |
| `/api/auth/admin` | GET | Admin-only endpoint | Private (Admin) |
| `/api/auth/member` | GET | Member-only endpoint | Private (Member) |
| `/api/auth/moderator` | GET | Moderator+ endpoint | Private (Moderator+) |
| `/api/auth/health` | GET | Community auth health check | Public |

### **Controller**: `authController.js`
### **Middleware**: `authMiddleware.js`
### **Model**: `User.js`
### **JWT Secret**: `JWT_SECRET`

---

## 🔧 **System Users Login Routes**

### Base Path: `/api/system/auth`

| Route | Method | Description | Access |
|-------|--------|-------------|---------|
| `/api/system/auth/login` | POST | System user login | Public |
| `/api/system/auth/register` | POST | System user registration | Private (System Admin) |
| `/api/system/auth/profile` | GET | Get system user profile | Private (System Users) |
| `/api/system/auth/logout` | POST | System user logout | Private (System Users) |
| `/api/system/auth/validate` | GET | Validate system user token | Private (System Users) |
| `/api/system/auth/change-password` | POST | Change system user password | Private (System Users) |
| `/api/system/auth/admin` | GET | System Admin-only endpoint | Private (System Admin) |
| `/api/system/auth/manager` | GET | System Manager+ endpoint | Private (System Manager+) |
| `/api/system/auth/operator` | GET | System Operator+ endpoint | Private (System Operator+) |
| `/api/system/auth/high-access` | GET | High access level endpoint | Private (Level 4+) |
| `/api/system/auth/system-write` | GET | System write permission endpoint | Private (system:write) |
| `/api/system/auth/backup-access` | GET | Backup permission endpoint | Private (backup:*) |
| `/api/system/auth/permissions` | GET | Get system user permissions | Private (System Users) |
| `/api/system/auth/access-info` | GET | Get detailed access info | Private (System Users) |
| `/api/system/auth/health` | GET | System auth health check | Public |

### **Controller**: `systemAuthController.js`
### **Middleware**: `systemAuthMiddleware.js`
### **Model**: `SystemUser.js`
### **JWT Secret**: `SYSTEM_JWT_SECRET`

---

## 🚀 **Usage Examples**

### **Community User Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"varun","password":"varun123"}'
```

### **System User Login**
```bash
curl -X POST http://localhost:5000/api/system/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sysadmin","password":"SystemAdmin123!@#"}'
```

---

## 🔒 **Security Separation**

### **Different JWT Secrets**
- **Community Users**: Uses `JWT_SECRET` environment variable
- **System Users**: Uses `SYSTEM_JWT_SECRET` environment variable

### **Different Token Expiry**
- **Community Users**: 24 hours
- **System Users**: 8 hours (shorter for security)

### **Different Authentication Middleware**
- **Community Users**: `authenticateToken` from `authMiddleware.js`
- **System Users**: `authenticateSystemToken` from `systemAuthMiddleware.js`

### **Different Authorization**
- **Community Users**: Role-based (`authorizeRoles`)
- **System Users**: Role + Access Level + Permissions (`authorizeSystemRoles`, `authorizeSystemAccessLevel`, `authorizeSystemPermissions`)

---

## 📊 **Route Mounting in app.js**

```javascript
// API routes
app.use('/api/auth', authRoutes);           // Community users
app.use('/api/system/auth', systemAuthRoutes); // System users
```

---

## 🎯 **Key Differences**

| Feature | Community Users | System Users |
|---------|----------------|--------------|
| **Base Path** | `/api/auth` | `/api/system/auth` |
| **Login Endpoint** | `/api/auth/login` | `/api/system/auth/login` |
| **Controller** | `authController` | `systemAuthController` |
| **Middleware** | `authMiddleware` | `systemAuthMiddleware` |
| **Model** | `User` | `SystemUser` |
| **JWT Secret** | `JWT_SECRET` | `SYSTEM_JWT_SECRET` |
| **Token Expiry** | 24 hours | 8 hours |
| **Password Length** | 8+ characters | 12+ characters |
| **Account Lockout** | No | Yes (5 attempts) |
| **Password Expiry** | No | Yes (90 days) |
| **Rate Limiting** | Basic | Enhanced |
| **User Type** | `community` | `system` |

---

## ✅ **Separation Confirmed**

The login routes are **completely separate** with:

1. ✅ **Different base paths** (`/api/auth` vs `/api/system/auth`)
2. ✅ **Different controllers** (`authController` vs `systemAuthController`)
3. ✅ **Different middleware** (`authMiddleware` vs `systemAuthMiddleware`)
4. ✅ **Different models** (`User` vs `SystemUser`)
5. ✅ **Different JWT secrets** (`JWT_SECRET` vs `SYSTEM_JWT_SECRET`)
6. ✅ **Different authentication logic**
7. ✅ **Different authorization systems**
8. ✅ **Different security features**

**The separation is complete and secure!** 🔒
