const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/community-app';

const testDatabase = async () => {
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

        // Check users
        const userCount = await User.countDocuments();
        console.log(`👥 Users in database: ${userCount}`);

        if (userCount > 0) {
            const users = await User.find().select('username email role verified').limit(5);
            console.log('📋 Sample users:');
            users.forEach(user => {
                console.log(`   - ${user.username} (${user.email}) - Role: ${user.role} - Verified: ${user.verified}`);
            });
        }

        // Check roles
        const roleCount = await Role.countDocuments();
        console.log(`🔐 Roles in database: ${roleCount}`);

        if (roleCount > 0) {
            const roles = await Role.find().select('name description permissions isSystem isDefault').limit(5);
            console.log('📋 Sample roles:');
            roles.forEach(role => {
                console.log(`   - ${role.name} (${role.permissions.length} permissions) - System: ${role.isSystem} - Default: ${role.isDefault}`);
            });
        }

        if (userCount === 0) {
            console.log('\n⚠️  No users found. Running seed scripts...');
            console.log('   Run: node scripts/seedUsers.js');
            console.log('   Run: node scripts/seedRoles.js');
        }

        if (roleCount === 0) {
            console.log('\n⚠️  No roles found. Running seed scripts...');
            console.log('   Run: node scripts/seedRoles.js');
        }

    } catch (error) {
        console.error('❌ Error testing database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    }
};

testDatabase();
