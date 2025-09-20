const mongoose = require('mongoose');
const Role = require('../models/Role');

async function ensureMemberRole() {
    try {
        console.log('🔧 Ensuring Member role exists...\n');

        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/community-app');
        console.log('✅ Connected to MongoDB');

        // Check if Member role exists
        let memberRole = await Role.findOne({ name: 'Member' });

        if (!memberRole) {
            console.log('📝 Creating Member role...');

            // Create Member role
            memberRole = new Role({
                name: 'Member',
                description: 'Standard member access with basic permissions',
                permissions: [
                    'users:read',
                    'community:read',
                    'events:read',
                    'documents:read',
                    'notifications:read'
                ],
                isSystem: true,
                isDefault: true,
                createdBy: new mongoose.Types.ObjectId() // Placeholder ID
            });

            await memberRole.save();
            console.log('✅ Member role created successfully!');
        } else {
            console.log('✅ Member role already exists');
        }

        // Display role details
        console.log('\n📋 Member Role Details:');
        console.log(`   Name: ${memberRole.name}`);
        console.log(`   Description: ${memberRole.description}`);
        console.log(`   Permissions: ${memberRole.permissions.join(', ')}`);
        console.log(`   Is Default: ${memberRole.isDefault}`);
        console.log(`   Is System: ${memberRole.isSystem}`);
        console.log(`   Is Active: ${memberRole.isActive}`);

        // Also ensure other default roles exist
        console.log('\n🔧 Ensuring all default roles exist...');
        await Role.createDefaultRoles(new mongoose.Types.ObjectId());
        console.log('✅ All default roles ensured');

        console.log('\n🎉 Member role setup completed successfully!');

    } catch (error) {
        console.error('❌ Error ensuring Member role:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
ensureMemberRole();
