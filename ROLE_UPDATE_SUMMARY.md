# Role System Update Summary

## Changes Made

### Updated User Schema (`models/User.js`)

**Before:**
```javascript
roles: [{
  roleType: {
    type: String,
    enum: [
      'family_head', 'elder', 'member', 'youth', 'child',
      'guardian', 'caretaker', 'family_historian',
      'event_organizer', 'community_representative',
      'admin', 'moderator'
    ],
    required: true
  }
}],
primaryRole: {
  type: String,
  enum: [
    'family_head', 'elder', 'member', 'youth', 'child',
    'guardian', 'caretaker', 'family_historian'
  ],
  default: 'member'
}
```

**After:**
```javascript
roles: [{
  roleType: {
    type: String,
    enum: [
      'Super Admin', 'Admin', 'Moderator', 'Member', 'Guest'
    ],
    required: true
  }
}],
primaryRole: {
  type: String,
  enum: [
    'Super Admin', 'Admin', 'Moderator', 'Member', 'Guest'
  ],
  default: 'Member'
}
```

## Existing Default Roles

The system now uses the existing default roles that are already defined in the system:

1. **Super Admin** - Full system access with all permissions
2. **Admin** - Administrative access with most permissions
3. **Moderator** - Moderation access with limited permissions
4. **Member** - Standard member access with basic permissions
5. **Guest** - Limited access for guests

## Benefits

- ✅ **Consistency**: Uses the same roles across the entire system
- ✅ **Simplicity**: No need to maintain separate role systems
- ✅ **Compatibility**: Works with existing role-based permissions
- ✅ **Maintenance**: Easier to maintain with fewer role types

## API Usage

The API endpoints remain the same, but now use the existing role names:

```javascript
// Add a role
POST /api/users/:id/add-role
{
  "roleType": "Admin"  // or "Super Admin", "Moderator", "Member", "Guest"
}

// Search by role
GET /api/users/search?role=Member

// Filter by role in autocomplete
GET /api/users/autocomplete/general?role=Admin
```

## Migration Notes

- Existing users will need their roles updated to use the new role names
- The role assignment functionality remains the same
- All existing permissions and access control logic continues to work
- No breaking changes to the API structure
