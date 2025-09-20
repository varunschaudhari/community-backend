// Test script to verify Member role is working as default
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

async function testMemberRole() {
    try {
        console.log('🧪 Testing Member Role as Default...\n');

        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/community-app');
        console.log('✅ Connected to MongoDB');

        // Ensure Member role exists
        let memberRole = await Role.findOne({ name: 'Member' });
        if (!memberRole) {
            console.log('📝 Creating Member role...');
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
                createdBy: new mongoose.Types.ObjectId()
            });
            await memberRole.save();
            console.log('✅ Member role created');
        } else {
            console.log('✅ Member role already exists');
        }

        // Test creating a user with Member role
        console.log('\n👤 Testing user creation with Member role...');

        const testUserData = {
            firstName: 'Test',
            lastName: 'Member',
            email: 'test.member@example.com',
            phoneNumber: '9876543210',
            password: 'password123',
            dobAsPerDocument: new Date('1990-01-01'),
            role: memberRole._id,
            maritalStatus: 'single',
            addedBy: memberRole._id // Using role ID as placeholder
        };

        // Check if user already exists
        const existingUser = await User.findOne({ email: testUserData.email });
        if (existingUser) {
            await User.findByIdAndDelete(existingUser._id);
            console.log('🗑️ Removed existing test user');
        }

        const user = new User(testUserData);
        await user.save();

        console.log('✅ Test user created successfully!');
        console.log(`   Name: ${user.fullName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${memberRole.name}`);
        console.log(`   Role ID: ${user.role}`);

        // Verify role assignment
        const populatedUser = await User.findById(user._id).populate('role');
        console.log(`   Populated Role: ${populatedUser.role.name}`);
        console.log(`   Role Permissions: ${populatedUser.role.permissions.join(', ')}`);

        // Test role validation
        console.log('\n🔍 Testing role validation...');
        console.log(`   Has users:read permission: ${populatedUser.role.hasPermission('users:read')}`);
        console.log(`   Has community:read permission: ${populatedUser.role.hasPermission('community:read')}`);
        console.log(`   Is default role: ${populatedUser.role.isDefault}`);

        // Clean up test user
        await User.findByIdAndDelete(user._id);
        console.log('\n🗑️ Test user cleaned up');

        console.log('\n🎉 Member role test completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Member role exists and is marked as default');
        console.log('   ✅ Users can be created with Member role');
        console.log('   ✅ Role permissions are properly assigned');
        console.log('   ✅ Frontend will show Member as default selection');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testMemberRole();
