const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const SystemUser = require('../models/SystemUser');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/community-app';

// Configuration options
const SEED_OPTIONS = {
    clearExisting: {
        roles: false,        // Set to true to clear existing roles
        users: false,        // Set to true to clear existing users
        systemUsers: false   // Set to true to clear existing system users
    },
    skipIfExists: true       // Skip creating if already exists
};

// Initial roles data
const initialRoles = [
    {
        name: 'Super Admin',
        description: 'Full system access with all permissions - highest level administrator',
        permissions: [
            'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage',
            'roles:read', 'roles:create', 'roles:update', 'roles:delete',
            'analytics:read', 'settings:read', 'settings:update',
            'community:read', 'community:create', 'community:update', 'community:delete',
            'events:read', 'events:create', 'events:update', 'events:delete',
            'documents:read', 'documents:create', 'documents:update', 'documents:delete',
            'notifications:read', 'notifications:create', 'notifications:update', 'notifications:delete'
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Admin',
        description: 'Administrative access with most permissions - system administrator',
        permissions: [
            'users:read', 'users:create', 'users:update', 'users:manage',
            'roles:read', 'roles:create', 'roles:update',
            'analytics:read', 'settings:read', 'settings:update',
            'community:read', 'community:create', 'community:update',
            'events:read', 'events:create', 'events:update',
            'documents:read', 'documents:create', 'documents:update',
            'notifications:read', 'notifications:create', 'notifications:update'
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Moderator',
        description: 'Moderation access with limited permissions - community moderator',
        permissions: [
            'users:read', 'users:update', 'analytics:read',
            'community:read', 'community:update',
            'events:read', 'events:create', 'events:update',
            'documents:read', 'documents:create',
            'notifications:read', 'notifications:create'
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Member',
        description: 'Standard member access with basic permissions - regular community member',
        permissions: [
            'users:read', 'community:read', 'events:read',
            'documents:read', 'notifications:read',
            // Additional permissions for members
            'events:create', 'events:update',           // Can create and update events
            'documents:create', 'documents:update',     // Can create and update documents
            'notifications:create'                      // Can create notifications
        ],
        isSystem: true,
        isDefault: true
    },
    {
        name: 'Guest',
        description: 'Limited access for guests - read-only access',
        permissions: [
            'community:read', 'events:read'
        ],
        isSystem: true,
        isDefault: true
    }
];

// Sample community users data
const sampleUsers = [
    {
        username: 'admin',
        password: 'admin123',
        email: 'admin@telicommunity.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'Admin',
        verified: true,
        phone: '9876543210',
        maritalStatus: 'Single',
        dateOfBirth: new Date('1990-01-01')
    },
    {
        username: 'varun',
        password: 'varun123',
        email: 'varunschaudhari@gmail.com',
        firstName: 'Varun',
        lastName: 'Chaudhari',
        role: 'Super Admin',
        verified: true,
        phone: '9876543211',
        maritalStatus: 'Single',
        dateOfBirth: new Date('1990-01-01')
    },
    {
        username: 'moderator',
        password: 'moderator123',
        email: 'moderator@telicommunity.com',
        firstName: 'Community',
        lastName: 'Moderator',
        role: 'Moderator',
        verified: true,
        phone: '9876543212',
        maritalStatus: 'Single',
        dateOfBirth: new Date('1990-01-01')
    },
    {
        username: 'member1',
        password: 'member123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Member',
        verified: true,
        phone: '9876543213',
        maritalStatus: 'Single',
        dateOfBirth: new Date('1990-01-01')
    },
    {
        username: 'member2',
        password: 'member123',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'Member',
        verified: true,
        phone: '9876543214',
        maritalStatus: 'Single',
        dateOfBirth: new Date('1990-01-01')
    },
    {
        username: 'unverified',
        password: 'unverified123',
        email: 'pending@example.com',
        firstName: 'Pending',
        lastName: 'User',
        role: 'Member',
        verified: false,
        phone: '9876543215',
        maritalStatus: 'Single',
        dateOfBirth: new Date('1990-01-01')
    }
];

// System users data - Using unified role system
const systemUsers = [
    {
        username: 'sysadmin',
        password: 'SystemAdmin123!@#',
        email: 'sysadmin@company.com',
        employeeId: 'SYS0001',
        department: 'IT',
        designation: 'System Administrator',
        firstName: 'System',
        lastName: 'Administrator',
        phone: '9876543210',
        role: 'Super Admin',
        accessLevel: 5
    },
    {
        username: 'sysmanager',
        password: 'SystemManager123!@#',
        email: 'sysmanager@company.com',
        employeeId: 'SYS0002',
        department: 'IT',
        designation: 'System Manager',
        firstName: 'System',
        lastName: 'Manager',
        phone: '9876543211',
        role: 'Admin',
        accessLevel: 4
    },
    {
        username: 'sysoperator',
        password: 'SystemOperator123!@#',
        email: 'sysoperator@company.com',
        employeeId: 'SYS0003',
        department: 'IT',
        designation: 'System Operator',
        firstName: 'System',
        lastName: 'Operator',
        phone: '9876543212',
        role: 'Moderator',
        accessLevel: 3
    },
    {
        username: 'sysviewer',
        password: 'SystemViewer123!@#',
        email: 'sysviewer@company.com',
        employeeId: 'SYS0004',
        department: 'IT',
        designation: 'System Viewer',
        firstName: 'System',
        lastName: 'Viewer',
        phone: '9876543213',
        role: 'Member',
        accessLevel: 2
    },
    {
        username: 'hrmanager',
        password: 'HRManager123!@#',
        email: 'hrmanager@company.com',
        employeeId: 'HR0001',
        department: 'HR',
        designation: 'HR Manager',
        firstName: 'HR',
        lastName: 'Manager',
        phone: '9876543214',
        role: 'Admin',
        accessLevel: 4
    },
    {
        username: 'financeadmin',
        password: 'FinanceAdmin123!@#',
        email: 'financeadmin@company.com',
        employeeId: 'FIN0001',
        department: 'Finance',
        designation: 'Finance Administrator',
        firstName: 'Finance',
        lastName: 'Admin',
        phone: '9876543215',
        role: 'Moderator',
        accessLevel: 3
    }
];

/**
 * Seed roles into the database
 */
async function seedRoles() {
    console.log('\n🔐 Seeding Roles...');

    try {
        // Clear existing roles if configured
        if (SEED_OPTIONS.clearExisting.roles) {
            await Role.deleteMany({});
            console.log('🗑️  Cleared existing roles');
        }

        // Find or create a system user for createdBy field
        let systemUser = await User.findOne({ email: 'system@admin.com' });
        if (!systemUser) {
            systemUser = new User({
                username: 'system_admin',
                firstName: 'System',
                lastName: 'Admin',
                email: 'system@admin.com',
                password: 'system123',
                role: 'Super Admin',
                isActive: true,
                verified: true
            });
            await systemUser.save();
            console.log('✅ Created system user for role creation');
        }

        // Create roles
        const createdRoles = [];
        for (const roleData of initialRoles) {
            if (SEED_OPTIONS.skipIfExists) {
                const existingRole = await Role.findOne({ name: roleData.name });
                if (existingRole) {
                    console.log(`⚠️  Role ${roleData.name} already exists, skipping...`);
                    createdRoles.push({
                        name: existingRole.name,
                        permissions: existingRole.permissions.length,
                        isSystem: existingRole.isSystem,
                        isDefault: existingRole.isDefault
                    });
                    continue;
                }
            }

            const role = new Role({
                ...roleData,
                createdBy: systemUser._id
            });
            await role.save();
            createdRoles.push({
                name: role.name,
                permissions: role.permissions.length,
                isSystem: role.isSystem,
                isDefault: role.isDefault
            });
            console.log(`✅ Created role: ${role.name} (${role.permissions.length} permissions)`);
        }

        console.log(`✅ Roles seeding completed! Created/Found ${createdRoles.length} roles`);
        return createdRoles;

    } catch (error) {
        console.error('❌ Error seeding roles:', error.message);
        throw error;
    }
}

/**
 * Seed community users into the database
 */
async function seedUsers() {
    console.log('\n👥 Seeding Community Users...');

    try {
        // Get available roles for assignment
        const roles = await Role.find({});
        const superAdminRole = roles.find(r => r.name === 'Super Admin');
        const adminRole = roles.find(r => r.name === 'Admin');
        const moderatorRole = roles.find(r => r.name === 'Moderator');
        const memberRole = roles.find(r => r.name === 'Member');

        if (!roles.length) {
            console.log('⚠️  No roles found. Please ensure roles are seeded first.');
        }

        // Update system user's roleId if it exists but doesn't have roleId
        const systemUser = await User.findOne({ email: 'system@admin.com' });
        if (systemUser && !systemUser.roleId && superAdminRole) {
            systemUser.roleId = superAdminRole._id;
            await systemUser.save();
            console.log('✅ Updated system user with Super Admin roleId');
        }

        // Clear existing users if configured (preserve system user)
        if (SEED_OPTIONS.clearExisting.users) {
            await User.deleteMany({ email: { $ne: 'system@admin.com' } });
            console.log('🗑️  Cleared existing users (preserved system user)');
        }

        // Create users
        const createdUsers = [];
        for (const userData of sampleUsers) {
            if (SEED_OPTIONS.skipIfExists) {
                const existingUser = await User.findOne({
                    $or: [
                        { username: userData.username },
                        { email: userData.email }
                    ]
                });
                if (existingUser) {
                    console.log(`⚠️  User ${userData.username} already exists, skipping...`);
                    continue;
                }
            }

            let roleId = null;
            // Assign appropriate role based on username
            if (userData.username === 'varun') {
                roleId = superAdminRole?._id;
            } else if (userData.username === 'admin') {
                roleId = adminRole?._id;
            } else if (userData.username === 'moderator') {
                roleId = moderatorRole?._id;
            } else {
                roleId = memberRole?._id;
            }

            const user = new User({
                ...userData,
                roleId: roleId
            });
            await user.save();

            const assignedRole = roles.find(r => r._id.equals(roleId));
            createdUsers.push({
                username: user.username,
                role: user.role,
                roleName: assignedRole?.name || 'No Role',
                verified: user.verified
            });
            console.log(`✅ Created user: ${user.username} (${user.role})`);
        }

        console.log(`✅ Community users seeding completed! Created/Found ${createdUsers.length} users`);
        return createdUsers;

    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
        throw error;
    }
}

/**
 * Seed system users into the database
 */
async function seedSystemUsers() {
    console.log('\n🔧 Seeding System Users...');

    try {
        // Clear existing system users if configured
        if (SEED_OPTIONS.clearExisting.systemUsers) {
            await SystemUser.deleteMany({});
            console.log('🗑️  Cleared existing system users');
        }

        // Find Super Admin role for temporary admin
        const superAdminRole = await Role.findOne({ name: 'Super Admin' });
        if (!superAdminRole) {
            throw new Error('Super Admin role not found. Please seed roles first.');
        }

        // Create a temporary system admin user to be the creator
        const tempAdmin = new SystemUser({
            username: 'temp_admin',
            password: 'TempAdmin123!@#',
            email: 'temp@system.local',
            employeeId: 'TEMP0001',
            department: 'IT',
            designation: 'System Administrator',
            firstName: 'System',
            lastName: 'Administrator',
            phone: '9999999999',
            role: 'Super Admin',
            roleId: superAdminRole._id, // Assign role reference
            accessLevel: 5,
            verified: true,
            isActive: true,
            createdBy: new mongoose.Types.ObjectId()
        });

        await tempAdmin.save();
        console.log('✅ Created temporary system admin');

        // Create system users
        const createdSystemUsers = [];
        for (const userData of systemUsers) {
            if (SEED_OPTIONS.skipIfExists) {
                const existingUser = await SystemUser.findOne({
                    $or: [
                        { username: userData.username },
                        { email: userData.email },
                        { employeeId: userData.employeeId }
                    ]
                });
                if (existingUser) {
                    console.log(`⚠️  System user ${userData.username} already exists, skipping...`);
                    continue;
                }
            }

            // Find the role for this system user
            const role = await Role.findOne({ name: userData.role });
            if (!role) {
                console.log(`❌ Role ${userData.role} not found for system user ${userData.username}`);
                continue;
            }

            const systemUser = new SystemUser({
                ...userData,
                roleId: role._id, // Assign role reference
                verified: true,
                isActive: true,
                createdBy: tempAdmin._id
            });
            await systemUser.save();
            createdSystemUsers.push({
                username: systemUser.username,
                role: systemUser.role,
                department: systemUser.department,
                roleId: systemUser.roleId
            });
            console.log(`✅ Created system user: ${systemUser.username} (${systemUser.role}) with role ID: ${role._id}`);
        }

        // Remove temporary admin
        await SystemUser.deleteOne({ username: 'temp_admin' });
        console.log('🗑️  Removed temporary system admin');

        console.log(`✅ System users seeding completed! Created/Found ${createdSystemUsers.length} users`);
        return createdSystemUsers;

    } catch (error) {
        console.error('❌ Error seeding system users:', error.message);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
    console.log('🌱 Starting Database Seeding Process...\n');
    console.log('📋 Configuration:');
    console.log(`   Clear Roles: ${SEED_OPTIONS.clearExisting.roles ? 'Yes' : 'No'}`);
    console.log(`   Clear Users: ${SEED_OPTIONS.clearExisting.users ? 'Yes' : 'No'}`);
    console.log(`   Clear System Users: ${SEED_OPTIONS.clearExisting.systemUsers ? 'Yes' : 'No'}`);
    console.log(`   Skip If Exists: ${SEED_OPTIONS.skipIfExists ? 'Yes' : 'No'}\n`);

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('✅ Connected to MongoDB');

        // Seed in order: Roles -> Users -> System Users
        const roles = await seedRoles();
        const users = await seedUsers();
        const systemUsers = await seedSystemUsers();

        // Summary
        console.log('\n🎉 Database Seeding Completed Successfully!\n');
        console.log('📊 Summary:');
        console.log(`   🔐 Roles: ${roles.length} created/found`);
        console.log(`   👥 Community Users: ${users.length} created/found`);
        console.log(`   🔧 System Users: ${systemUsers.length} created/found`);

        console.log('\n🔑 Community User Login Credentials:');
        console.log('   Super Admin: varun / varun123');
        console.log('   Admin: admin / admin123');
        console.log('   Moderator: moderator / moderator123');
        console.log('   Member: member1 / member123');
        console.log('   Member: member2 / member123');
        console.log('   Unverified: unverified / unverified123');

        console.log('\n🔐 System User Login Credentials (Unified Role System):');
        console.log('   Super Admin: sysadmin / SystemAdmin123!@#');
        console.log('   Admin: sysmanager / SystemManager123!@#');
        console.log('   Moderator: sysoperator / SystemOperator123!@#');
        console.log('   Member: sysviewer / SystemViewer123!@#');
        console.log('   Admin: hrmanager / HRManager123!@#');
        console.log('   Moderator: financeadmin / FinanceAdmin123!@#');

        console.log('\n🌐 API Endpoints:');
        console.log('   Community Auth: POST /api/auth/login');
        console.log('   System Auth: POST /api/system/auth/login');
        console.log('   Health Check: GET /health');
        console.log('   System Health: GET /api/system/auth/health');

        console.log('\n💡 Next Steps:');
        console.log('   1. Start the backend server: npm start');
        console.log('   2. Start the frontend: cd ../community-admin && npm start');
        console.log('   3. Test community login: varun/varun123');
        console.log('   4. Test system login: sysadmin/SystemAdmin123!@#');
        console.log('   5. Change default passwords in production!');

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('\n✅ MongoDB connection closed');
        process.exit(0);
    }
}

// Command line argument handling
if (require.main === module) {
    const args = process.argv.slice(2);

    // Parse command line arguments
    if (args.includes('--clear-roles')) {
        SEED_OPTIONS.clearExisting.roles = true;
    }
    if (args.includes('--clear-users')) {
        SEED_OPTIONS.clearExisting.users = true;
    }
    if (args.includes('--clear-system-users')) {
        SEED_OPTIONS.clearExisting.systemUsers = true;
    }
    if (args.includes('--clear-all')) {
        SEED_OPTIONS.clearExisting.roles = true;
        SEED_OPTIONS.clearExisting.users = true;
        SEED_OPTIONS.clearExisting.systemUsers = true;
    }
    if (args.includes('--force')) {
        SEED_OPTIONS.skipIfExists = false;
    }
    if (args.includes('--help')) {
        console.log('🌱 Database Seeding Script\n');
        console.log('Usage: node scripts/seedDatabase.js [options]\n');
        console.log('Options:');
        console.log('  --clear-roles        Clear existing roles before seeding');
        console.log('  --clear-users        Clear existing community users before seeding');
        console.log('  --clear-system-users Clear existing system users before seeding');
        console.log('  --clear-all          Clear all existing data before seeding');
        console.log('  --force              Force create even if data already exists');
        console.log('  --help               Show this help message\n');
        console.log('Examples:');
        console.log('  node scripts/seedDatabase.js                    # Seed with existing data');
        console.log('  node scripts/seedDatabase.js --clear-all        # Clear all and seed fresh');
        console.log('  node scripts/seedDatabase.js --clear-users      # Clear only users');
        console.log('  node scripts/seedDatabase.js --force            # Force create all data');
        process.exit(0);
    }

    // Run the seeding function
    seedDatabase();
}

module.exports = {
    seedDatabase,
    seedRoles,
    seedUsers,
    seedSystemUsers,
    SEED_OPTIONS
};
