const mongoose = require('mongoose');
const SystemUser = require('../models/SystemUser');
const bcrypt = require('bcrypt');

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

const createTestSystemUser = async () => {
    try {
        console.log('🔧 Creating test system user...\n');

        // Clear existing sysadmin user
        await SystemUser.deleteOne({ username: 'sysadmin' });
        console.log('🗑️  Cleared existing sysadmin user');

        // Create new system admin user
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
        console.log('✅ Created sysadmin user successfully');

        // Test the user
        console.log('\n🔍 Testing user creation...');
        const foundUser = await SystemUser.findOne({ username: 'sysadmin' });
        if (foundUser) {
            console.log('✅ User found in database');
            console.log(`   Username: ${foundUser.username}`);
            console.log(`   Email: ${foundUser.email}`);
            console.log(`   System Role: ${foundUser.systemRole}`);
            console.log(`   Verified: ${foundUser.verified}`);
            console.log(`   Active: ${foundUser.isActive}`);

            // Test password comparison
            const isPasswordValid = await foundUser.comparePassword('SystemAdmin123!@#');
            console.log(`   Password valid: ${isPasswordValid}`);
        } else {
            console.log('❌ User not found in database');
        }

    } catch (error) {
        console.error('❌ Error creating test system user:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
};

// Run the script
connectDB().then(() => {
    createTestSystemUser();
});
