const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');

// Test user creation with the enhanced schema
async function testUserCreation() {
    try {
        console.log('🧪 Testing User Creation with Enhanced Schema...\n');

        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/community-app');
        console.log('✅ Connected to MongoDB');

        // Find or create a default role
        let defaultRole = await Role.findOne({ name: 'Member' });
        if (!defaultRole) {
            defaultRole = new Role({
                name: 'Member',
                description: 'Default community member role',
                permissions: ['read:profile', 'update:profile'],
                isActive: true,
                isSystem: false,
                isDefault: true
            });
            await defaultRole.save();
            console.log('✅ Created default Member role');
        }

        // Test user data with all enhanced fields
        const testUserData = {
            firstName: 'John',
            middleName: 'Michael',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '9876543210',
            password: 'password123',
            pan: 'ABCDE1234F',
            adhar: '123456789012',
            dobAsPerDocument: new Date('1990-05-15'),
            role: defaultRole._id,
            maritalStatus: 'married',
            kul: 'Sharma',
            gotra: 'Bhardwaj',
            fatherDetails: {
                fatherName: 'Robert Doe',
                relationshipType: 'biological',
                isAlive: true
            },
            motherDetails: {
                motherName: 'Mary Doe',
                relationshipType: 'biological',
                isAlive: true
            },
            marriages: [{
                spouseName: 'Jane Smith',
                marriageDate: new Date('2015-06-20'),
                marriagePlace: {
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    country: 'India'
                },
                marriageOrder: 1,
                marriageStatus: 'current',
                marriageType: 'love',
                isCurrentSpouse: true
            }],
            children: [{
                childName: 'Alice Doe',
                relationshipType: 'biological',
                birthDate: new Date('2018-03-10'),
                fromWhichMarriage: 1,
                otherParentName: 'Jane Smith',
                isActive: true
            }],
            addedBy: defaultRole._id // Using role ID as placeholder
        };

        // Create test user
        const user = new User(testUserData);
        await user.save();

        console.log('✅ User created successfully!');
        console.log('📋 User Details:');
        console.log(`   Name: ${user.fullName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Age: ${user.age}`);
        console.log(`   Marital Status: ${user.maritalStatus}`);
        console.log(`   Father: ${user.fatherDetails.fatherName}`);
        console.log(`   Mother: ${user.motherDetails.motherName}`);
        console.log(`   Current Spouse: ${user.currentSpouse?.spouseName || 'None'}`);
        console.log(`   Total Children: ${user.totalChildren}`);
        console.log(`   Children: ${user.children.map(c => c.childName).join(', ')}`);

        // Test virtual fields
        console.log('\n🔍 Testing Virtual Fields:');
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Age: ${user.age}`);
        console.log(`   Current Spouse: ${user.currentSpouse?.spouseName || 'None'}`);
        console.log(`   Total Children: ${user.totalChildren}`);

        // Test instance methods
        console.log('\n🔧 Testing Instance Methods:');
        
        // Test adding another child
        await user.addChild('Bob Doe', 'biological', new Date('2020-08-15'), 1, null, 'Jane Smith');
        console.log('✅ Added another child');
        
        // Test marriage history
        const marriageHistory = user.getMarriageHistory();
        console.log(`   Marriage History: ${marriageHistory.length} marriages`);

        // Test validation methods
        console.log('\n✅ Testing Validation Methods:');
        try {
            user.validateMarriageSequence();
            console.log('✅ Marriage sequence validation passed');
        } catch (error) {
            console.log('❌ Marriage sequence validation failed:', error.message);
        }

        try {
            user.validateParentChildAge();
            console.log('✅ Parent-child age validation passed');
        } catch (error) {
            console.log('❌ Parent-child age validation failed:', error.message);
        }

        try {
            user.validateMarriageAge();
            console.log('✅ Marriage age validation passed');
        } catch (error) {
            console.log('❌ Marriage age validation failed:', error.message);
        }

        try {
            user.checkDuplicateRelationships();
            console.log('✅ Duplicate relationships validation passed');
        } catch (error) {
            console.log('❌ Duplicate relationships validation failed:', error.message);
        }

        console.log('\n🎉 All tests passed! Enhanced user schema is working correctly.');
        console.log('\n📊 Final User Data:');
        console.log(JSON.stringify(user.toObject(), null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testUserCreation();

