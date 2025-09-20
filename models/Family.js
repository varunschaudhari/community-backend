const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  familyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Family hierarchy
  familyHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Family lineage information
  lineage: {
    kul: {
      type: String,
      trim: true,
      maxlength: 100
    },
    gotra: {
      type: String,
      trim: true,
      maxlength: 100
    },
    origin: {
      village: String,
      district: String,
      state: String,
      country: {
        type: String,
        default: 'India'
      }
    }
  },
  
  // Family tree structure
  familyTree: {
    rootAncestor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    generations: [{
      generation: {
        type: Number,
        required: true
      },
      members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }]
  },
  
  // Family events and milestones
  familyEvents: [{
    eventType: {
      type: String,
      enum: ['marriage', 'birth', 'death', 'adoption', 'divorce', 'anniversary', 'festival', 'other'],
      required: true
    },
    eventDate: {
      type: Date,
      required: true
    },
    eventDescription: {
      type: String,
      required: true,
      maxlength: 500
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    location: {
      city: String,
      state: String,
      country: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Family traditions and customs
  traditions: [{
    traditionName: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'special_occasions', 'custom'],
      default: 'yearly'
    },
    lastObserved: Date,
    nextScheduled: Date
  }],
  
  // Family statistics
  statistics: {
    totalMembers: {
      type: Number,
      default: 0
    },
    livingMembers: {
      type: Number,
      default: 0
    },
    deceasedMembers: {
      type: Number,
      default: 0
    },
    marriages: {
      type: Number,
      default: 0
    },
    children: {
      type: Number,
      default: 0
    },
    generations: {
      type: Number,
      default: 0
    }
  },
  
  // Family settings and permissions
  settings: {
    privacyLevel: {
      type: String,
      enum: ['private', 'family_only', 'extended_family', 'public'],
      default: 'family_only'
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApprovalForNewMembers: {
      type: Boolean,
      default: true
    },
    allowEventCreation: {
      type: Boolean,
      default: true
    }
  },
  
  // Family administrators
  administrators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['head', 'co_head', 'moderator', 'historian'],
      default: 'moderator'
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: [{
      type: String,
      enum: ['add_members', 'remove_members', 'edit_family_info', 'create_events', 'manage_traditions', 'view_statistics']
    }]
  }],
  
  // Family documents and photos
  documents: [{
    documentType: {
      type: String,
      enum: ['family_tree', 'family_photo', 'certificate', 'legal_document', 'other'],
      required: true
    },
    documentName: {
      type: String,
      required: true,
      maxlength: 200
    },
    documentUrl: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  
  // Family contact information
  contactInfo: {
    primaryContact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emergencyContacts: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      relationship: String,
      priority: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
      }
    }],
    familyAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    }
  },
  
  // Family history and stories
  familyHistory: [{
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    story: {
      type: String,
      required: true,
      maxlength: 2000
    },
    period: {
      startYear: Number,
      endYear: Number
    },
    relatedMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    writtenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    writtenDate: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  
  // Family goals and objectives
  goals: [{
    goalTitle: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    targetDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  
  // Family notifications and announcements
  announcements: [{
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    targetAudience: {
      type: String,
      enum: ['all', 'adults', 'youth', 'children', 'specific_roles'],
      default: 'all'
    },
    specificRoles: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// VIRTUAL FIELDS
familySchema.virtual('activeMembers').get(function() {
  return this.statistics.livingMembers;
});

familySchema.virtual('familySize').get(function() {
  return this.statistics.totalMembers;
});

familySchema.virtual('currentGeneration').get(function() {
  return this.familyTree.generations.length;
});

// INSTANCE METHODS
familySchema.methods.addMember = function(userId, role = 'member') {
  // This would typically be handled by updating the User's familyId
  // and then updating family statistics
  return this.updateStatistics();
};

familySchema.methods.removeMember = function(userId) {
  // Remove from administrators if present
  this.administrators = this.administrators.filter(admin => 
    admin.user.toString() !== userId.toString()
  );
  
  return this.updateStatistics();
};

familySchema.methods.addEvent = function(eventData) {
  this.familyEvents.push({
    ...eventData,
    createdDate: new Date()
  });
  return this.save();
};

familySchema.methods.addTradition = function(traditionData) {
  this.traditions.push(traditionData);
  return this.save();
};

familySchema.methods.addHistory = function(historyData) {
  this.familyHistory.push({
    ...historyData,
    writtenDate: new Date()
  });
  return this.save();
};

familySchema.methods.addAnnouncement = function(announcementData) {
  this.announcements.push({
    ...announcementData,
    createdDate: new Date()
  });
  return this.save();
};

familySchema.methods.updateStatistics = async function() {
  const User = mongoose.model('User');
  
  // Count family members
  const totalMembers = await User.countDocuments({ familyId: this._id });
  const livingMembers = await User.countDocuments({ 
    familyId: this._id,
    $or: [
      { 'fatherDetails.isAlive': { $ne: false } },
      { 'motherDetails.isAlive': { $ne: false } }
    ]
  });
  
  // Count marriages
  const marriages = await User.aggregate([
    { $match: { familyId: this._id } },
    { $unwind: '$marriages' },
    { $count: 'totalMarriages' }
  ]);
  
  // Count children
  const children = await User.aggregate([
    { $match: { familyId: this._id } },
    { $unwind: '$children' },
    { $count: 'totalChildren' }
  ]);
  
  this.statistics = {
    totalMembers,
    livingMembers,
    deceasedMembers: totalMembers - livingMembers,
    marriages: marriages[0]?.totalMarriages || 0,
    children: children[0]?.totalChildren || 0,
    generations: this.familyTree.generations.length
  };
  
  return this.save();
};

familySchema.methods.getFamilyTree = function() {
  return this.familyTree;
};

familySchema.methods.getUpcomingEvents = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.familyEvents.filter(event => 
    event.eventDate >= new Date() && event.eventDate <= futureDate
  ).sort((a, b) => a.eventDate - b.eventDate);
};

familySchema.methods.getActiveAnnouncements = function() {
  const now = new Date();
  return this.announcements.filter(announcement => 
    announcement.isActive && 
    (!announcement.expiryDate || announcement.expiryDate > now)
  );
};

// STATIC METHODS
familySchema.statics.findByFamilyName = function(familyName) {
  return this.find({ 
    familyName: new RegExp(familyName, 'i') 
  });
};

familySchema.statics.findByKul = function(kul) {
  return this.find({ 
    'lineage.kul': new RegExp(kul, 'i') 
  });
};

familySchema.statics.findByGotra = function(gotra) {
  return this.find({ 
    'lineage.gotra': new RegExp(gotra, 'i') 
  });
};

familySchema.statics.findByLocation = function(city, state, country) {
  const query = {};
  if (city) query['lineage.origin.city'] = new RegExp(city, 'i');
  if (state) query['lineage.origin.state'] = new RegExp(state, 'i');
  if (country) query['lineage.origin.country'] = new RegExp(country, 'i');
  
  return this.find(query);
};

// PRE-SAVE MIDDLEWARE
familySchema.pre('save', function(next) {
  // Ensure family head is in administrators
  const isHeadInAdmins = this.administrators.some(admin => 
    admin.user.toString() === this.familyHead.toString()
  );
  
  if (!isHeadInAdmins) {
    this.administrators.push({
      user: this.familyHead,
      role: 'head',
      assignedDate: new Date(),
      permissions: ['add_members', 'remove_members', 'edit_family_info', 'create_events', 'manage_traditions', 'view_statistics']
    });
  }
  
  next();
});

// INDEXES
familySchema.index({ familyName: 1 });
familySchema.index({ familyHead: 1 });
familySchema.index({ 'lineage.kul': 1 });
familySchema.index({ 'lineage.gotra': 1 });
familySchema.index({ 'lineage.origin.city': 1 });
familySchema.index({ 'lineage.origin.state': 1 });
familySchema.index({ 'administrators.user': 1 });
familySchema.index({ 'familyEvents.eventDate': 1 });
familySchema.index({ 'announcements.createdDate': 1 });

// JSON transformation
familySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Family', familySchema);
