const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters']
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },

  // Identity Documents
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

  // Personal Details
  maritalStatus: {
    type: String,
    required: [true, 'Marital status is required'],
    enum: ['Single', 'Married', 'Divorced', 'Widowed']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
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

  // Community Information
  roles: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['Admin', 'Member', 'Moderator', 'Guest']
  },
  kul: {
    type: String,
    trim: true
  },
  gotra: {
    type: String,
    trim: true
  },

  // Family Information
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

  // System fields
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true
});

// Pre-save middleware to update the updatedAt field
memberSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
memberSchema.index({ email: 1 });
memberSchema.index({ phone: 1 });
memberSchema.index({ firstName: 1, lastName: 1 });
memberSchema.index({ roles: 1 });
memberSchema.index({ isVerified: 1 });
memberSchema.index({ isActive: 1 });

// Virtual for full name
memberSchema.virtual('fullName').get(function () {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
