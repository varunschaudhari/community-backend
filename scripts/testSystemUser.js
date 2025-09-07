const mongoose = require('mongoose');
const SystemUser = require('../models/SystemUser');

async function testSystemUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/community-app');
        console.log('✅ Connected to MongoDB');

        // Check if sysadmin user exists
        const user = await SystemUser.findOne({ username: 'sysadmin' });
        
        if (user) {
            console.log('✅ sysadmin user found:');
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   System Role: ${user.systemRole}`);
            console.log(`   Verified: ${user.verified}`);
            console.log(`   Active: ${user.isActive}`);
            console.log(`   Login Attempts: ${user.loginAttempts || 0}`);
            console.log(`   Is Locked: ${user.isLocked || false}`);
            
            // Test password comparison
            const isPasswordValid = await user.comparePassword('SystemAdmin123!@#');
            console.log(`   Password valid: ${isPasswordValid}`);
        } else {
            console.log('❌ sysadmin user not found');
            
            // List all system users
            const allUsers = await SystemUser.find({});
            console.log(`\n📋 All system users (${allUsers.length}):`);
            allUsers.forEach((u, i) => {
                console.log(`   ${i + 1}. ${u.username} (${u.email}) - ${u.systemRole}`);
            });
        }

        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSystemUser();
