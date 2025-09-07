// Quick reset script for system user
const mongoose = require('mongoose');
const SystemUser = require('../models/SystemUser');

async function quickReset() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/community-app');
        console.log('✅ Connected to MongoDB');

        // Reset sysadmin user
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
            console.log('❌ System user not found');
        }

        await mongoose.connection.close();
        console.log('🔌 Connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickReset();
