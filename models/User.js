const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // EXISTING BASIC FIELDS (keep as-is):
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    middleName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[6-9]\d{9}$/.test(v); // Indian mobile number format
            },
            message: 'Please enter a valid 10-digit mobile number'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    pan: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        validate: {
            validator: function (v) {
                return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
            },
            message: 'Please enter a valid PAN number (ABCDE1234F format)'
        }
    },
    adhar: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || /^[0-9]{12}$/.test(v);
            },
            message: 'Please enter a valid 12-digit Aadhaar number'
        }
    },
    dobAsPerDocument: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return v <= new Date();
            },
            message: 'Date of birth cannot be in the future'
        }
    },

    // DYNAMIC ROLE SYSTEM - Reference to Role model:
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },

    // ENHANCED MARITAL STATUS with multiple marriages support:
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
        required: true,
        default: 'single'
    },

    // CULTURAL/TRADITIONAL FIELDS:
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

    // ENHANCED PARENT DETAILS with autocomplete support:
    fatherDetails: {
        fatherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        fatherName: {
            type: String,
            trim: true,
            maxlength: 100
        },
        relationshipType: {
            type: String,
            enum: ['biological', 'adoptive', 'step', 'foster'],
            default: 'biological'
        },
        isAlive: {
            type: Boolean,
            default: true
        },
        dateOfDeath: Date
    },
    motherDetails: {
        motherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        motherName: {
            type: String,
            trim: true,
            maxlength: 100
        },
        relationshipType: {
            type: String,
            enum: ['biological', 'adoptive', 'step', 'foster'],
            default: 'biological'
        },
        isAlive: {
            type: Boolean,
            default: true
        },
        dateOfDeath: Date
    },

    // ENHANCED MULTIPLE MARRIAGES SUPPORT:
    marriages: [{
        spouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        spouseName: {
            type: String,
            trim: true,
            maxlength: 100
        },
        marriageDate: Date,
        marriagePlace: {
            city: String,
            state: String,
            country: String
        },
        marriageOrder: {
            type: Number,
            min: 1,
            default: 1
        },
        marriageStatus: {
            type: String,
            enum: ['current', 'divorced', 'widowed', 'separated'],
            default: 'current'
        },
        divorceDate: Date,
        isCurrentSpouse: {
            type: Boolean,
            default: true
        },
        marriageType: {
            type: String,
            enum: ['arranged', 'love', 'inter_caste', 'inter_religion', 'remarriage'],
            default: 'arranged'
        }
    }],

    // ENHANCED CHILDREN SUPPORT with multiple relationships:
    children: [{
        childId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        childName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        relationshipType: {
            type: String,
            enum: ['biological', 'adopted', 'step', 'foster'],
            default: 'biological'
        },
        birthDate: Date,
        adoptionDate: Date, // if adopted
        fromWhichMarriage: {
            type: Number, // refers to marriages array index
            default: 1
        },
        otherParentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        otherParentName: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // ENHANCED TRACKING FIELDS:
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Made optional to handle cases where no user is authenticated
        default: null
    },

    // Additional enhanced fields for complex relationships:
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family'
    },

    // Profile and verification
    profilePicture: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDocuments: [{
        documentType: {
            type: String,
            enum: ['marriage_certificate', 'birth_certificate', 'adoption_papers', 'death_certificate']
        },
        documentUrl: String,
        uploadedDate: {
            type: Date,
            default: Date.now
        }
    }],

    // Privacy settings
    privacySettings: {
        showPhoneNumber: {
            type: Boolean,
            default: false
        },
        showEmail: {
            type: Boolean,
            default: false
        },
        showPersonalDetails: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

// VIRTUAL FIELDS
userSchema.virtual('fullName').get(function () {
    const parts = [this.firstName];
    if (this.middleName) parts.push(this.middleName);
    parts.push(this.lastName);
    return parts.join(' ');
});

userSchema.virtual('age').get(function () {
    if (!this.dobAsPerDocument) return null;
    const today = new Date();
    const birthDate = new Date(this.dobAsPerDocument);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

userSchema.virtual('currentSpouse').get(function () {
    const currentMarriage = this.marriages.find(marriage =>
        marriage.isCurrentSpouse && marriage.marriageStatus === 'current'
    );
    return currentMarriage || null;
});

userSchema.virtual('totalChildren').get(function () {
    return this.children.filter(child => child.isActive).length;
});

// PRE-SAVE MIDDLEWARE
userSchema.pre('save', async function (next) {
    // Hash password if it's modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Update marital status based on marriages array
    if (this.marriages && this.marriages.length > 0) {
        const currentMarriage = this.marriages.find(marriage =>
            marriage.isCurrentSpouse && marriage.marriageStatus === 'current'
        );

        if (currentMarriage) {
            this.maritalStatus = 'married';
        } else {
            const lastMarriage = this.marriages[this.marriages.length - 1];
            if (lastMarriage) {
                this.maritalStatus = lastMarriage.marriageStatus;
            }
        }
    }

    // Set isCurrentSpouse flags correctly
    if (this.marriages && this.marriages.length > 0) {
        let currentSpouseCount = 0;
        this.marriages.forEach(marriage => {
            if (marriage.marriageStatus === 'current') {
                currentSpouseCount++;
                marriage.isCurrentSpouse = true;
            } else {
                marriage.isCurrentSpouse = false;
            }
        });

        // Ensure only one current spouse
        if (currentSpouseCount > 1) {
            const error = new Error('Only one spouse can be current at a time');
            return next(error);
        }
    }

    next();
});

// INSTANCE METHODS
userSchema.methods.addChild = function (childName, relationshipType = 'biological', birthDate, fromWhichMarriage = 1, otherParentId = null, otherParentName = null) {
    const child = {
        childName,
        relationshipType,
        birthDate,
        fromWhichMarriage,
        otherParentId,
        otherParentName,
        isActive: true
    };

    this.children.push(child);
    return this.save();
};

userSchema.methods.addMarriage = function (spouseDetails, marriageDate, marriageOrder = null) {
    const marriage = {
        ...spouseDetails,
        marriageDate,
        marriageOrder: marriageOrder || (this.marriages.length + 1),
        marriageStatus: 'current',
        isCurrentSpouse: true
    };

    // Set all other marriages as not current
    this.marriages.forEach(marriage => {
        marriage.isCurrentSpouse = false;
    });

    this.marriages.push(marriage);
    return this.save();
};

userSchema.methods.endMarriage = function (marriageOrder, endReason, endDate = new Date()) {
    const marriage = this.marriages.find(m => m.marriageOrder === marriageOrder);
    if (marriage) {
        marriage.marriageStatus = endReason;
        marriage.isCurrentSpouse = false;
        if (endReason === 'divorced') {
            marriage.divorceDate = endDate;
        }
    }
    return this.save();
};

userSchema.methods.getCurrentSpouse = function () {
    return this.marriages.find(marriage =>
        marriage.isCurrentSpouse && marriage.marriageStatus === 'current'
    );
};

userSchema.methods.getMarriageHistory = function () {
    return this.marriages.sort((a, b) => a.marriageOrder - b.marriageOrder);
};

// Dynamic role update method
userSchema.methods.updateRole = function (roleId) {
    this.role = roleId;
    return this.save();
};

// STATIC METHODS for AUTOCOMPLETE
userSchema.statics.searchByName = function (searchTerm, excludeIds = []) {
    return this.find({
        $and: [
            {
                $or: [
                    { firstName: new RegExp(searchTerm, 'i') },
                    { lastName: new RegExp(searchTerm, 'i') },
                    { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: searchTerm, options: "i" } } }
                ]
            },
            { _id: { $nin: excludeIds } }
        ]
    }).select('firstName middleName lastName _id').limit(10);
};

userSchema.statics.getFatherSuggestions = async function (searchTerm, excludeIds = []) {
    return this.find({
        $and: [
            {
                $or: [
                    { firstName: new RegExp(searchTerm, 'i') },
                    { lastName: new RegExp(searchTerm, 'i') },
                    { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: searchTerm, options: "i" } } }
                ]
            },
            { _id: { $nin: excludeIds } },
            {
                $or: [
                    { maritalStatus: 'married' },
                    { 'children.0': { $exists: true } },
                    { gender: 'male' } // Assuming you have a gender field
                ]
            }
        ]
    }).select('firstName middleName lastName _id dobAsPerDocument').limit(10);
};

userSchema.statics.getMotherSuggestions = async function (searchTerm, excludeIds = []) {
    return this.find({
        $and: [
            {
                $or: [
                    { firstName: new RegExp(searchTerm, 'i') },
                    { lastName: new RegExp(searchTerm, 'i') },
                    { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: searchTerm, options: "i" } } }
                ]
            },
            { _id: { $nin: excludeIds } },
            {
                $or: [
                    { maritalStatus: 'married' },
                    { 'children.0': { $exists: true } },
                    { gender: 'female' } // Assuming you have a gender field
                ]
            }
        ]
    }).select('firstName middleName lastName _id dobAsPerDocument').limit(10);
};

userSchema.statics.getSpouseSuggestions = async function (searchTerm, excludeIds = []) {
    return this.find({
        $and: [
            {
                $or: [
                    { firstName: new RegExp(searchTerm, 'i') },
                    { lastName: new RegExp(searchTerm, 'i') },
                    { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: searchTerm, options: "i" } } }
                ]
            },
            { _id: { $nin: excludeIds } },
            { maritalStatus: { $in: ['single', 'divorced', 'widowed'] } }
        ]
    }).select('firstName middleName lastName _id dobAsPerDocument maritalStatus').limit(10);
};

userSchema.statics.getChildrenSuggestions = async function (searchTerm, excludeIds = []) {
    return this.find({
        $and: [
            {
                $or: [
                    { firstName: new RegExp(searchTerm, 'i') },
                    { lastName: new RegExp(searchTerm, 'i') },
                    { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: searchTerm, options: "i" } } }
                ]
            },
            { _id: { $nin: excludeIds } }
        ]
    }).select('firstName middleName lastName _id dobAsPerDocument').limit(10);
};

// VALIDATION METHODS
userSchema.methods.validateMarriageSequence = function () {
    const sortedMarriages = this.marriages.sort((a, b) => a.marriageOrder - b.marriageOrder);

    for (let i = 0; i < sortedMarriages.length - 1; i++) {
        const current = sortedMarriages[i];
        const next = sortedMarriages[i + 1];

        if (current.marriageDate && next.marriageDate) {
            if (current.marriageStatus === 'current' && next.marriageDate <= current.marriageDate) {
                throw new Error('Marriage dates must be chronological');
            }
        }
    }
    return true;
};

userSchema.methods.validateParentChildAge = function () {
    if (!this.dobAsPerDocument) return true;

    // Check children
    this.children.forEach(child => {
        if (child.birthDate && child.birthDate <= this.dobAsPerDocument) {
            throw new Error('Child birth date must be after parent birth date');
        }
    });

    return true;
};

userSchema.methods.validateMarriageAge = function () {
    const marriageableAge = 18; // Minimum marriageable age

    this.marriages.forEach(marriage => {
        if (marriage.marriageDate) {
            const ageAtMarriage = this.age;
            if (ageAtMarriage < marriageableAge) {
                throw new Error('Person must be at least 18 years old to marry');
            }
        }
    });

    return true;
};

userSchema.methods.checkDuplicateRelationships = function () {
    const relationships = [];

    // Check for duplicate children
    this.children.forEach(child => {
        if (child.childId) {
            if (relationships.includes(child.childId.toString())) {
                throw new Error('Duplicate child relationship found');
            }
            relationships.push(child.childId.toString());
        }
    });

    // Check for duplicate spouses
    this.marriages.forEach(marriage => {
        if (marriage.spouseId) {
            if (relationships.includes(marriage.spouseId.toString())) {
                throw new Error('Duplicate spouse relationship found');
            }
            relationships.push(marriage.spouseId.toString());
        }
    });

    return true;
};

// INDEXES for PERFORMANCE
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true });
userSchema.index({ pan: 1 }, { unique: true, sparse: true });
userSchema.index({ adhar: 1 }, { unique: true, sparse: true });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ 'fatherDetails.fatherName': 1 });
userSchema.index({ 'motherDetails.motherName': 1 });
userSchema.index({ 'marriages.spouseName': 1 });
userSchema.index({ 'children.childName': 1 });
userSchema.index({ familyId: 1 });
userSchema.index({ addedBy: 1 });

// COMPOUND INDEXES for better query performance
userSchema.index({ firstName: 1, lastName: 1, dobAsPerDocument: 1 });
userSchema.index({ maritalStatus: 1, 'marriages.marriageStatus': 1 });

// JSON transformation
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);