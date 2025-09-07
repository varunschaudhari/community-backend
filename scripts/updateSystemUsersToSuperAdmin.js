const mongoose = require('mongoose');
const SystemUser = require('../models/SystemUser');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/community-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const updateSystemUsersToSuperAdmin = async () => {
    try {
        console.log('🔧 Updating all system users to Super Admin role...\n');
        
        // Update all system users to have Super Admin role and full permissions
        const result = await SystemUser.updateMany(
            {}, // Update all system users
            {
                $set: {
                    systemRole: 'Super Admin',
                    accessLevel: 5,
                    permissions: [
                        'system:read', 'system:write', 'system:delete', 'users:manage',
                        'database:backup', 'database:restore', 'logs:view', 'logs:export',
                        'settings:system', 'settings:security', 'reports:generate',
                        'maintenance:schedule', 'backup:create', 'backup:restore',
                        'monitoring:view', 'alerts:manage'
                    ],
                    verified: true,
                    isActive: true,
                    updatedAt: new Date()
                }
            }
        );
        
        console.log(`✅ Updated ${result.modifiedCount} system users to Super Admin role`);
        
        // Display all system users
        const systemUsers = await SystemUser.find({});
        console.log(`\n📋 All System Users (${systemUsers.length}):`);
        systemUsers.forEach((user, index) => {
            console.log(`${index + 1}. Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   System Role: ${user.systemRole}`);
            console.log(`   Access Level: ${user.accessLevel}`);
            console.log(`   Verified: ${user.verified}`);
            console.log(`   Active: ${user.isActive}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error updating system users:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
};

// Run the update
connectDB().then(() => {
    updateSystemUsersToSuperAdmin();
});
