const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// System User Schema - for administrative and system-level users
const systemUserSchema = new mongoose.Schema({
  // Authentication & Basic Info
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [12, 'System user password must be at least 12 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },

  // System User Specific Information
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{2,4}\d{4,6}$/, 'Employee ID must be in format: ABC1234 or ABCD123456']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['IT', 'HR', 'Finance', 'Operations', 'Security', 'Management', 'Support']
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
    maxlength: [100, 'Designation cannot exceed 100 characters']
  },

  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },

  // System Access & Permissions (Unified with Community Users)
  systemRole: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Moderator', 'Member', 'Guest'],
    default: 'Member',
    required: true
  },
  // Reference to Role model for detailed permissions (same as community users)
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: false
  },
  accessLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
    required: true
  },

  // Security & Access Control
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  passwordExpiry: {
    type: Date,
    default: function () {
      // Password expires in 90 days
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },

  // System fields
  verified: {
    type: Boolean,
    default: false,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  lastLoginIP: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
systemUserSchema.index({ username: 1 });
systemUserSchema.index({ email: 1 });
systemUserSchema.index({ employeeId: 1 });
systemUserSchema.index({ department: 1 });
systemUserSchema.index({ systemRole: 1 });
systemUserSchema.index({ accessLevel: 1 });
systemUserSchema.index({ verified: 1 });
systemUserSchema.index({ isActive: 1 });
systemUserSchema.index({ lockUntil: 1 });

// Virtual for account lock status
systemUserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password before saving
systemUserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with salt rounds of 12 for system users (higher security)
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update the updatedAt field
systemUserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to compare password
systemUserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
systemUserSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
systemUserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to check if password is expired
systemUserSchema.methods.isPasswordExpired = function () {
  return this.passwordExpiry && this.passwordExpiry < new Date();
};

// Instance method to get public profile (without sensitive data)
systemUserSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.twoFactorSecret;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

// Instance method to check permission (unified with community users)
systemUserSchema.methods.hasPermission = async function (permission) {
  try {
    // If user has a roleId, populate the role and check permissions
    if (this.roleId) {
      await this.populate('roleId');
      return this.roleId && this.roleId.permissions.includes(permission);
    }

    // Fallback: check role-based permissions (basic check)
    const rolePermissions = {
      'Super Admin': ['users:read', 'users:create', 'users:update', 'users:delete', 'roles:read', 'roles:create', 'roles:update', 'roles:delete', 'analytics:read', 'settings:read', 'settings:update', 'community:read', 'community:create', 'community:update', 'community:delete', 'events:read', 'events:create', 'events:update', 'events:delete', 'documents:read', 'documents:create', 'documents:update', 'documents:delete', 'notifications:read', 'notifications:create', 'notifications:update', 'notifications:delete'],
      'Admin': ['users:read', 'users:create', 'users:update', 'analytics:read', 'community:read', 'community:create', 'community:update', 'events:read', 'events:create', 'events:update', 'documents:read', 'documents:create', 'documents:update', 'notifications:read', 'notifications:create'],
      'Moderator': ['users:read', 'users:update', 'analytics:read', 'community:read', 'community:update', 'events:read', 'events:create', 'events:update', 'documents:read', 'documents:create', 'notifications:read', 'notifications:create'],
      'Member': ['users:read', 'community:read', 'events:read', 'events:create', 'events:update', 'documents:read', 'documents:create', 'documents:update', 'notifications:read', 'notifications:create'],
      'Guest': ['community:read', 'events:read']
    };

    return rolePermissions[this.systemRole] && rolePermissions[this.systemRole].includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Instance method to check if user can access system
systemUserSchema.methods.canAccessSystem = function () {
  return this.isActive && this.verified && !this.isLocked && !this.isPasswordExpired();
};

// Static method to find user by username
systemUserSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase() });
};

// Static method to find user by email
systemUserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by employee ID
systemUserSchema.statics.findByEmployeeId = function (employeeId) {
  return this.findOne({ employeeId: employeeId.toUpperCase() });
};

// Virtual for full name
systemUserSchema.virtual('fullName').get(function () {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
systemUserSchema.virtual('displayName').get(function () {
  if (this.firstName && this.lastName) {
    return this.fullName;
  }
  return this.username;
});

// Ensure virtual fields are serialized
systemUserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.twoFactorSecret;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});
systemUserSchema.set('toObject', { virtuals: true });

// Create and export the SystemUser model
const SystemUser = mongoose.model('SystemUser', systemUserSchema);

module.exports = SystemUser;
