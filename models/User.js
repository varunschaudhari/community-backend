const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Unified User Schema definition - combining User and Member fields
const userSchema = new mongoose.Schema({
  // Authentication & Basic Info (from User model)
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
    minlength: [8, 'Password must be at least 8 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },

  // Personal Information (from Member model)
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
    required: false, // Made optional for basic users
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },

  // Identity Documents (from Member model)
  pan: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },
  adhar: {
    type: String,
    trim: true,
    match: [/^\d{12}$/, 'Please enter a valid 12-digit Aadhaar number']
  },

  // Personal Details (from Member model)
  maritalStatus: {
    type: String,
    required: false, // Made optional for basic users
    enum: ['Single', 'Married', 'Divorced', 'Widowed']
  },
  dateOfBirth: {
    type: Date,
    required: false, // Made optional for basic users
    validate: {
      validator: function (value) {
        return value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  dateOfMarriage: {
    type: Date,
    validate: {
      validator: function (value) {
        if (this.maritalStatus === 'Married' && !value) {
          return false;
        }
        return !value || value <= new Date();
      },
      message: 'Date of marriage cannot be in the future'
    }
  },

  // Community Information (from Member model)
  kul: {
    type: String,
    trim: true
  },
  gotra: {
    type: String,
    trim: true
  },

  // Family Information (from Member model)
  fatherName: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  childrenName: {
    type: String,
    trim: true
  },

  // Role & Permissions (enhanced from both models)
  role: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Member', 'Moderator', 'Guest', 'admin'], // Added 'admin' to match seed script
    default: 'Member',
    required: true
  },
  // Reference to Role model for detailed permissions (from User model)
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: false
  },

  // System fields (combined from both models)
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ role: 1 });
userSchema.index({ verified: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with salt rounds of 10
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to get public profile (without password)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Instance method to check if user has a specific permission
userSchema.methods.hasPermission = async function (permission) {
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

    return rolePermissions[this.role] && rolePermissions[this.role].includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Static method to find user by username
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase() });
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by mobile number
userSchema.statics.findByMobile = function (mobile) {
  return this.findOne({ phone: mobile });
};

// Virtual for full name (enhanced to include middle name)
userSchema.virtual('fullName').get(function () {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (falls back to username if no name)
userSchema.virtual('displayName').get(function () {
  if (this.firstName && this.lastName) {
    return this.fullName;
  }
  return this.username;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});
userSchema.set('toObject', { virtuals: true });

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
