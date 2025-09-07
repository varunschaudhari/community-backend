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

const checkSystemUsers = async () => {
    try {
        console.log('🔍 Checking System Users in Database...\n');

        // Get all system users
        const systemUsers = await SystemUser.find({});

        console.log(`📊 Total System Users: ${systemUsers.length}\n`);

        if (systemUsers.length === 0) {
            console.log('❌ No system users found in database!');
            console.log('💡 Run: npm run seed to create system users');
            return;
        }

        // Display system users
        systemUsers.forEach((user, index) => {
            console.log(`${index + 1}. Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Employee ID: ${user.employeeId}`);
            console.log(`   System Role: ${user.systemRole}`);
            console.log(`   Department: ${user.department}`);
            console.log(`   Verified: ${user.verified}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log('');
        });

        // Test finding by username
        console.log('🔍 Testing findByUsername method...');
        const testUser = await SystemUser.findByUsername('sysadmin');
        if (testUser) {
            console.log('✅ Found sysadmin user:', testUser.username);
        } else {
            console.log('❌ sysadmin user not found');
        }

    } catch (error) {
        console.error('❌ Error checking system users:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
};

// Run the check
connectDB().then(() => {
    checkSystemUsers();
});
