const mongoose = require('mongoose');
const SystemUser = require('../models/SystemUser');

// Connect to MongoDB using the same connection string as the app
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

const resetSystemUser = async () => {
    try {
        console.log('🔧 Resetting system user...\n');
        
        // Find and update the sysadmin user to reset rate limiting
        const result = await SystemUser.updateOne(
            { username: 'sysadmin' },
            {
                $unset: {
                    loginAttempts: 1,
                    lastLoginAttempt: 1,
                    isLocked: 1
                },
                $set: {
                    verified: true,
                    isActive: true,
                    updatedAt: new Date()
                }
            }
        );
        
        if (result.matchedCount > 0) {
            console.log('✅ System user reset successfully');
            console.log('   - Cleared login attempts');
            console.log('   - Unlocked account');
            console.log('   - Set as verified and active');
        } else {
            console.log('❌ System user not found - creating new one...');
            
            // Create new system admin user
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('SystemAdmin123!@#', 12);
            
            const systemUser = new SystemUser({
                username: 'sysadmin',
                email: 'sysadmin@company.com',
                employeeId: 'SYS0001',
                department: 'IT',
                designation: 'System Administrator',
                firstName: 'System',
                lastName: 'Admin',
                phone: '9876543210',
                systemRole: 'System Admin',
                accessLevel: 5,
                permissions: [
                    'system:read',
                    'system:write',
                    'system:delete',
                    'users:manage',
                    'database:backup',
                    'database:restore',
                    'logs:view',
                    'logs:export',
                    'settings:system',
                    'settings:security',
                    'reports:generate',
                    'maintenance:schedule',
                    'backup:create',
                    'backup:restore',
                    'monitoring:view',
                    'alerts:manage'
                ],
                password: hashedPassword,
                verified: true,
                isActive: true,
                createdBy: 'system'
            });
            
            await systemUser.save();
            console.log('✅ Created new sysadmin user');
        }
        
        // Verify the user exists and is ready
        const user = await SystemUser.findOne({ username: 'sysadmin' });
        if (user) {
            console.log('\n📋 User Details:');
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   System Role: ${user.systemRole}`);
            console.log(`   Verified: ${user.verified}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Login Attempts: ${user.loginAttempts || 0}`);
            console.log(`   Is Locked: ${user.isLocked || false}`);
        }
        
    } catch (error) {
        console.error('❌ Error resetting system user:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
};

// Run the script
connectDB().then(() => {
    resetSystemUser();
});
