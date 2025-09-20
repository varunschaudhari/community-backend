# Enhanced User Schema Documentation

This document describes the comprehensive User Mongoose schema that supports complex family relationships, multiple marriages, adoptions, and step-families while preserving the existing input structure.

## Overview

The enhanced User schema provides:
- ✅ **Complex Family Relationships** - Multiple marriages, adoptions, step-families
- ✅ **Autocomplete Support** - Real-time suggestions for all relationship fields
- ✅ **Validation & Security** - Comprehensive validation rules and security measures
- ✅ **Performance Optimization** - Strategic indexing for fast queries
- ✅ **Backward Compatibility** - Maintains existing field structure
- ✅ **Indian Format Support** - PAN, Aadhaar, mobile number validation

## Schema Structure

### Basic Information Fields (Preserved)
```javascript
firstName: String (required, max 50 chars)
middleName: String (optional, max 50 chars)
lastName: String (required, max 50 chars)
email: String (required, unique, validated)
phoneNumber: String (required, unique, Indian format)
password: String (required, min 6 chars, hashed)
pan: String (unique, sparse, Indian PAN format)
adhar: String (unique, sparse, 12-digit Aadhaar)
dobAsPerDocument: Date (required, not future)
```

### Role System (Using Existing Default Roles)
```javascript
roles: [{
  roleType: String (enum: Super Admin, Admin, Moderator, Member, Guest),
  assignedDate: Date,
  assignedBy: ObjectId (ref: User),
  isActive: Boolean
}]
primaryRole: String (enum: Super Admin, Admin, Moderator, Member, Guest)
```

### Marital Status & Multiple Marriages
```javascript
maritalStatus: String (enum: single, married, divorced, widowed, separated)
marriages: [{
  spouseId: ObjectId (ref: User),
  spouseName: String,
  marriageDate: Date,
  marriagePlace: { city, state, country },
  marriageOrder: Number (min: 1),
  marriageStatus: String (enum: current, divorced, widowed, separated),
  divorceDate: Date,
  isCurrentSpouse: Boolean,
  marriageType: String (enum: arranged, love, inter_caste, inter_religion, remarriage)
}]
```

### Parent Details with Relationship Types
```javascript
fatherDetails: {
  fatherId: ObjectId (ref: User),
  fatherName: String,
  relationshipType: String (enum: biological, adoptive, step, foster),
  isAlive: Boolean,
  dateOfDeath: Date
}
motherDetails: {
  motherId: ObjectId (ref: User),
  motherName: String,
  relationshipType: String (enum: biological, adoptive, step, foster),
  isAlive: Boolean,
  dateOfDeath: Date
}
```

### Children Support with Multiple Relationships
```javascript
children: [{
  childId: ObjectId (ref: User),
  childName: String (required),
  relationshipType: String (enum: biological, adopted, step, foster),
  birthDate: Date,
  adoptionDate: Date,
  fromWhichMarriage: Number,
  otherParentId: ObjectId (ref: User),
  otherParentName: String,
  isActive: Boolean
}]
```

### Cultural & Traditional Fields
```javascript
kul: String (max 100 chars)
gotra: String (max 100 chars)
```

### Additional Enhanced Fields
```javascript
familyId: ObjectId (ref: Family)
profilePicture: String
isVerified: Boolean
verificationDocuments: [{
  documentType: String (enum: marriage_certificate, birth_certificate, adoption_papers, death_certificate),
  documentUrl: String,
  uploadedDate: Date
}]
privacySettings: {
  showPhoneNumber: Boolean,
  showEmail: Boolean,
  showPersonalDetails: Boolean
}
```

## Virtual Fields

### Computed Properties
- **fullName**: Combines firstName, middleName, lastName
- **age**: Calculated from dobAsPerDocument
- **currentSpouse**: Gets current active spouse
- **totalChildren**: Count of active children

## Instance Methods

### Relationship Management
```javascript
// Add a child
user.addChild(childName, relationshipType, birthDate, fromWhichMarriage, otherParentId, otherParentName)

// Add a marriage
user.addMarriage(spouseDetails, marriageDate, marriageOrder)

// End a marriage
user.endMarriage(marriageOrder, endReason, endDate)

// Get current spouse
user.getCurrentSpouse()

// Get marriage history
user.getMarriageHistory()
```

### Role Management
```javascript
// Add a role
user.addRole(roleType, assignedBy)

// Remove a role
user.removeRole(roleType)
```

## Static Methods for Autocomplete

### Search Methods
```javascript
// General name search
User.searchByName(searchTerm, excludeIds)

// Father suggestions
User.getFatherSuggestions(searchTerm, excludeIds)

// Mother suggestions
User.getMotherSuggestions(searchTerm, excludeIds)

// Spouse suggestions
User.getSpouseSuggestions(searchTerm, excludeIds)

// Children suggestions
User.getChildrenSuggestions(searchTerm, excludeIds)
```

## Validation Methods

### Relationship Validation
```javascript
// Validate marriage sequence
user.validateMarriageSequence()

// Validate parent-child age relationship
user.validateParentChildAge()

// Validate marriage age
user.validateMarriageAge()

// Check for duplicate relationships
user.checkDuplicateRelationships()
```

## API Endpoints

### Autocomplete Endpoints
```
GET /api/users/autocomplete/fathers?search=term&exclude=id1,id2
GET /api/users/autocomplete/mothers?search=term&exclude=id1,id2
GET /api/users/autocomplete/spouses?search=term&exclude=id1,id2
GET /api/users/autocomplete/children?search=term&exclude=id1,id2
GET /api/users/autocomplete/general?search=term&exclude=id1,id2
```

### Relationship Management
```
POST /api/users/:id/add-child
POST /api/users/:id/add-marriage
POST /api/users/:id/end-marriage
POST /api/users/:id/add-role
DELETE /api/users/:id/remove-role
```

### Family Tree & Search
```
GET /api/users/:id/family-tree
GET /api/users/search?search=term&role=member&maritalStatus=married
GET /api/users/statistics
```

## Pre-Save Middleware

### Automatic Processing
1. **Password Hashing**: Automatically hashes passwords before saving
2. **Marital Status Update**: Updates marital status based on marriages array
3. **Current Spouse Management**: Ensures only one current spouse
4. **Marriage Sequence Validation**: Validates chronological marriage order

## Indexes for Performance

### Single Field Indexes
```javascript
{ email: 1 } (unique)
{ phoneNumber: 1 } (unique)
{ pan: 1 } (sparse, unique)
{ adhar: 1 } (sparse, unique)
{ firstName: 1, lastName: 1 }
{ familyId: 1 }
{ addedBy: 1 }
```

### Relationship Field Indexes
```javascript
{ 'fatherDetails.fatherName': 1 }
{ 'motherDetails.motherName': 1 }
{ 'marriages.spouseName': 1 }
{ 'children.childName': 1 }
```

### Compound Indexes
```javascript
{ firstName: 1, lastName: 1, dobAsPerDocument: 1 }
{ maritalStatus: 1, 'marriages.marriageStatus': 1 }
```

## Validation Rules

### Business Logic Validation
- **Self-Relationship Prevention**: Cannot be own parent, spouse, or child
- **Marriage Chronology**: Marriage dates must be in chronological order
- **Age Validation**: Parents must be older than children
- **Marriage Age**: Must be at least 18 years old to marry
- **Unique Relationships**: No duplicate relationships allowed

### Format Validation
- **Email**: Valid email format
- **Phone**: Indian mobile number format (10 digits starting with 6-9)
- **PAN**: Indian PAN format (ABCDE1234F)
- **Aadhaar**: 12-digit Aadhaar number
- **Date of Birth**: Cannot be in the future

## Usage Examples

### Creating a User with Relationships
```javascript
const user = new User({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '9876543210',
  password: 'password123',
  dobAsPerDocument: new Date('1990-01-01'),
  maritalStatus: 'married',
  kul: 'Sharma',
  gotra: 'Kashyap',
  addedBy: adminUserId
});

// Add marriage
await user.addMarriage({
  spouseId: spouseUserId,
  spouseName: 'Jane Doe',
  marriageDate: new Date('2015-06-15'),
  marriagePlace: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  marriageType: 'arranged'
}, new Date('2015-06-15'));

// Add child
await user.addChild('Child Name', 'biological', new Date('2018-03-20'), 1, spouseUserId, 'Jane Doe');
```

### Autocomplete Usage
```javascript
// Get father suggestions
const fatherSuggestions = await User.getFatherSuggestions('John', [currentUserId]);

// Get spouse suggestions
const spouseSuggestions = await User.getSpouseSuggestions('Jane', [currentUserId]);
```

### Family Tree Retrieval
```javascript
const familyTree = await User.findById(userId)
  .populate('fatherDetails.fatherId')
  .populate('motherDetails.motherId')
  .populate('marriages.spouseId')
  .populate('children.childId');
```

## Error Handling

### Common Validation Errors
- **Duplicate Email/Phone**: "Email/Phone number already exists"
- **Invalid PAN/Aadhaar**: "Please enter a valid PAN/Aadhaar number"
- **Self-Relationship**: "Cannot be own parent/spouse/child"
- **Age Validation**: "Parent must be older than child"
- **Marriage Age**: "Must be at least 18 years old to marry"

### API Error Responses
```javascript
{
  success: false,
  message: "Error description",
  errors: [
    {
      field: "fieldName",
      message: "Specific error message"
    }
  ]
}
```

## Migration Considerations

### Existing Data Compatibility
- All existing fields are preserved
- New fields have default values
- Existing relationships can be migrated gradually
- Backward compatibility maintained

### Data Migration Steps
1. **Add New Fields**: Add new schema fields with defaults
2. **Migrate Relationships**: Convert existing relationship data
3. **Update Indexes**: Add new indexes for performance
4. **Validate Data**: Run validation on existing data
5. **Update Application**: Update frontend to use new features

## Performance Considerations

### Query Optimization
- **Selective Field Loading**: Use `.select()` to load only needed fields
- **Population Limits**: Limit populated relationships
- **Pagination**: Implement pagination for large result sets
- **Caching**: Cache frequently accessed family trees

### Index Usage
- **Compound Queries**: Use compound indexes for complex queries
- **Sparse Indexes**: Use sparse indexes for optional fields
- **Text Search**: Consider text indexes for name searches

## Security Features

### Data Protection
- **Password Hashing**: Automatic bcrypt hashing
- **Input Validation**: Comprehensive input sanitization
- **Relationship Validation**: Prevents invalid relationships
- **Privacy Settings**: User-controlled data visibility

### Access Control
- **Authentication Required**: All endpoints require authentication
- **User Context**: Operations are user-context aware
- **Permission Checks**: Role-based access control
- **Data Isolation**: Users can only access appropriate data

This enhanced User schema provides a robust foundation for managing complex family relationships while maintaining performance, security, and usability.
