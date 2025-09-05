const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/community-app';

// Initial roles data with admin permissions
const initialRoles = [
    {
        name: 'Super Admin',
        description: 'Full system access with all permissions - highest level administrator',
        permissions: [
            // User permissions
            'users:read',
            'users:create',
            'users:update',
            'users:delete',

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
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Admin',
        description: 'Administrative access with most permissions - system administrator',
        permissions: [
            // User permissions
            'users:read',
            'users:create',
            'users:update',

            // Role permissions
            'roles:read',
            'roles:create',
            'roles:update',

            // Analytics permissions
            'analytics:read',

            // Settings permissions
            'settings:read',
            'settings:update',

            // User management permissions
            'users:read',
            'users:create',
            'users:update',

            // Community permissions
            'community:read',
            'community:create',
            'community:update',

            // Event permissions
            'events:read',
            'events:create',
            'events:update',

            // Document permissions
            'documents:read',
            'documents:create',
            'documents:update',

            // Notification permissions
            'notifications:read',
            'notifications:create',
            'notifications:update'
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Moderator',
        description: 'Moderation access with limited permissions - community moderator',
        permissions: [
            // User permissions
            'users:read',
            'users:update',

            // Analytics permissions
            'analytics:read',

            // Community permissions
            'community:read',
            'community:update',

            // Event permissions
            'events:read',
            'events:create',
            'events:update',

            // Document permissions
            'documents:read',
            'documents:create',

            // Notification permissions
            'notifications:read',
            'notifications:create'
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Member',
        description: 'Standard member access with basic permissions - regular community member',
        permissions: [
            // User permissions
            'users:read',

            // Community permissions
            'community:read',

            // Event permissions
            'events:read',

            // Document permissions
            'documents:read',

            // Notification permissions
            'notifications:read'
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Guest',
        description: 'Limited access for guests - read-only access',
        permissions: [
            // Community permissions
            'community:read',

            // Event permissions
            'events:read'
        ],
        isSystem: true,
        isDefault: true
    }
];

/**
 * Seed the database with initial roles
 */
const seedRoles = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing roles (optional - comment out to keep existing data)
        await Role.deleteMany({});
        console.log('🗑️  Cleared existing roles');

        // Find or create a system user for createdBy field
        let systemUser = await User.findOne({ email: 'system@admin.com' });
        if (!systemUser) {
            systemUser = new User({
                username: 'system_admin',
                firstName: 'System',
                lastName: 'Admin',
                email: 'system@admin.com',
                password: 'system123', // This will be hashed by pre-save middleware
                role: 'Super Admin',
                isActive: true,
                verified: true
            });
            await systemUser.save();
            console.log('✅ Created system user for role creation');
        }

        // Create initial roles with createdBy field
        const createdRoles = [];
        for (const roleData of initialRoles) {
            const role = new Role({
                ...roleData,
                createdBy: systemUser._id
            });
            await role.save();
            createdRoles.push({
                name: role.name,
                description: role.description,
                permissions: role.permissions.length,
                isSystem: role.isSystem,
                isDefault: role.isDefault
            });
        }

        console.log('✅ Successfully created initial roles:');
        createdRoles.forEach(role => {
            console.log(`   - ${role.name} (${role.permissions} permissions) - ${role.isSystem ? '🔒 System' : '📝 Custom'} - ${role.isDefault ? '⭐ Default' : '⚙️ Optional'}`);
        });

        console.log('\n📋 Role Summary:');
        console.log('   🔒 System Roles: Cannot be deleted or modified');
        console.log('   ⭐ Default Roles: Automatically assigned to new users');
        console.log('   📝 Custom Roles: Can be created, modified, or deleted');

        console.log('\n🎯 Admin Roles Available:');
        const adminRoles = createdRoles.filter(role =>
            role.name === 'Super Admin' || role.name === 'Admin'
        );
        adminRoles.forEach(role => {
            console.log(`   - ${role.name}: ${role.permissions} permissions`);
        });

        console.log('\n🔗 API Endpoints:');
        console.log('   Get All Roles: GET http://localhost:5000/api/roles');
        console.log('   Create Role: POST http://localhost:5000/api/roles');
        console.log('   Update Role: PUT http://localhost:5000/api/roles/:id');
        console.log('   Delete Role: DELETE http://localhost:5000/api/roles/:id');

        console.log('\n💡 Next Steps:');
        console.log('   1. Start the backend server: npm start');
        console.log('   2. Start the frontend: cd ../community-admin && npm start');
        console.log('   3. Login with admin credentials');
        console.log('   4. Navigate to Roles page to manage permissions');

    } catch (error) {
        console.error('❌ Error seeding roles:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    }
};

// Run the seed functionqs
seedRoles();
