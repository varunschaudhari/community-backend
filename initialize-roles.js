const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/community-app';

async function initializeRoles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find admin user to use as creator
        const adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            console.error('Admin user not found. Please create an admin user first.');
            return;
        }

        console.log('Initializing default roles...');

        // Create default roles
        await Role.createDefaultRoles(adminUser._id);

        console.log('✅ Default roles initialized successfully!');
        console.log('Created roles:');
        console.log('- Super Admin (Full system access)');
        console.log('- Admin (Administrative access)');
        console.log('- Moderator (Moderation access)');
        console.log('- Member (Standard access)');
        console.log('- Guest (Limited access)');

        // Display created roles
        const roles = await Role.find().sort({ name: 1 });
        console.log('\n📋 Available roles:');
        roles.forEach(role => {
            console.log(`- ${role.name}: ${role.permissions.length} permissions`);
        });

    } catch (error) {
        console.error('Error initializing roles:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

initializeRoles();
