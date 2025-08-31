const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Role name must be at least 2 characters'],
    maxlength: [50, 'Role name cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores']
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    trim: true,
    minlength: [10, 'Role description must be at least 10 characters'],
    maxlength: [500, 'Role description cannot exceed 500 characters']
  },

  // Permissions
  permissions: [{
    type: String,
    required: true,
    enum: [
      // Member permissions
      'members:read',
      'members:create', 
      'members:update',
      'members:delete',
      
      // Role permissions
      'roles:read',
      'roles:create',
      'roles:update', 
      'roles:delete',
      
      // Analytics permissions
      'analytics:read',
      
      // Settings permissions
      'settings:read',
      'settings:update',
      
      // User management permissions
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      
      // Community permissions
      'community:read',
      'community:create',
      'community:update',
      'community:delete',
      
      // Event permissions
      'events:read',
      'events:create',
      'events:update',
      'events:delete',
      
      // Document permissions
      'documents:read',
      'documents:create',
      'documents:update',
      'documents:delete',
      
      // Notification permissions
      'notifications:read',
      'notifications:create',
      'notifications:update',
      'notifications:delete'
    ]
  }],

  // Status and System Fields
  isActive: {
    type: Boolean,
    default: true,
    required: true
  },
  isSystem: {
    type: Boolean,
    default: false,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false,
    required: true
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to update the updatedAt field
roleSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to validate permissions
roleSchema.pre('save', function (next) {
  if (this.permissions && this.permissions.length === 0) {
    return next(new Error('At least one permission must be assigned to a role'));
  }
  next();
});

// Indexes for better query performance
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ isDefault: 1 });
roleSchema.index({ createdAt: -1 });
roleSchema.index({ permissions: 1 });

// Virtual for member count (will be populated when needed)
roleSchema.virtual('memberCount', {
  ref: 'Member',
  localField: 'name',
  foreignField: 'roles',
  count: true
});

// Virtual for permission count
roleSchema.virtual('permissionCount').get(function () {
  return this.permissions ? this.permissions.length : 0;
});

// Instance methods
roleSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

roleSchema.methods.hasAnyPermission = function (permissions) {
  return permissions.some(permission => this.permissions.includes(permission));
};

roleSchema.methods.hasAllPermissions = function (permissions) {
  return permissions.every(permission => this.permissions.includes(permission));
};

roleSchema.methods.addPermission = function (permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

roleSchema.methods.removePermission = function (permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

// Static methods
roleSchema.statics.findByName = function (name) {
  return this.findOne({ name: name.toLowerCase() });
};

roleSchema.statics.findActiveRoles = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

roleSchema.statics.findSystemRoles = function () {
  return this.find({ isSystem: true });
};

roleSchema.statics.findDefaultRoles = function () {
  return this.find({ isDefault: true });
};

roleSchema.statics.findByPermission = function (permission) {
  return this.find({ permissions: permission, isActive: true });
};

roleSchema.statics.createDefaultRoles = async function (userId) {
  const defaultRoles = [
    {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissions: [
        'members:read', 'members:create', 'members:update', 'members:delete',
        'roles:read', 'roles:create', 'roles:update', 'roles:delete',
        'analytics:read',
        'settings:read', 'settings:update',
        'users:read', 'users:create', 'users:update', 'users:delete',
        'community:read', 'community:create', 'community:update', 'community:delete',
        'events:read', 'events:create', 'events:update', 'events:delete',
        'documents:read', 'documents:create', 'documents:update', 'documents:delete',
        'notifications:read', 'notifications:create', 'notifications:update', 'notifications:delete'
      ],
      isSystem: true,
      isDefault: true,
      createdBy: userId
    },
    {
      name: 'Admin',
      description: 'Administrative access with most permissions',
      permissions: [
        'members:read', 'members:create', 'members:update',
        'roles:read',
        'analytics:read',
        'settings:read',
        'users:read', 'users:create', 'users:update',
        'community:read', 'community:create', 'community:update',
        'events:read', 'events:create', 'events:update',
        'documents:read', 'documents:create', 'documents:update',
        'notifications:read', 'notifications:create', 'notifications:update'
      ],
      isSystem: true,
      isDefault: true,
      createdBy: userId
    },
    {
      name: 'Moderator',
      description: 'Moderation access with limited permissions',
      permissions: [
        'members:read', 'members:update',
        'analytics:read',
        'community:read', 'community:update',
        'events:read', 'events:create', 'events:update',
        'documents:read', 'documents:create',
        'notifications:read', 'notifications:create'
      ],
      isSystem: true,
      isDefault: true,
      createdBy: userId
    },
    {
      name: 'Member',
      description: 'Standard member access with basic permissions',
      permissions: [
        'members:read',
        'community:read',
        'events:read',
        'documents:read',
        'notifications:read'
      ],
      isSystem: true,
      isDefault: true,
      createdBy: userId
    },
    {
      name: 'Guest',
      description: 'Limited access for guests',
      permissions: [
        'community:read',
        'events:read'
      ],
      isSystem: true,
      isDefault: true,
      createdBy: userId
    }
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await this.findOne({ name: roleData.name });
    if (!existingRole) {
      await this.create(roleData);
    }
  }
};

// Ensure virtual fields are serialized
roleSchema.set('toJSON', { 
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

roleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Role', roleSchema);
