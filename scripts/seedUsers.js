const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/community-app';

// Sample users data with admin roles and additional fields
const sampleUsers = [
    {
        username: 'admin',
        password: 'admin123',
        email: 'admin@telicommunity.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        verified: true
    },
    {
        username: 'varun',
        password: 'varun123',
        email: 'varunschaudhari@gmail.com',
        firstName: 'Varun',
        lastName: 'Chaudhari',
        role: 'admin',
        verified: true
    },
    {
        username: 'moderator',
        password: 'moderator123',
        email: 'moderator@telicommunity.com',
        firstName: 'Community',
        lastName: 'Moderator',
        role: 'member',
        verified: true
    },
    {
        username: 'member1',
        password: 'member123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'member',
        verified: true
    },
    {
        username: 'member2',
        password: 'member123',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'member',
        verified: true
    },
    {
        username: 'unverified',
        password: 'unverified123',
        email: 'pending@example.com',
        firstName: 'Pending',
        lastName: 'User',
        role: 'member',
        verified: false
    }
];

/**
 * Seed the database with sample users and assign roles
 */
const seedUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4
        });
        console.log('✅ Connected to MongoDB');

        // Get available roles for assignment
        const roles = await Role.find({});
        const superAdminRole = roles.find(r => r.name === 'Super Admin');
        const adminRole = roles.find(r => r.name === 'Admin');
        const moderatorRole = roles.find(r => r.name === 'Moderator');
        const memberRole = roles.find(r => r.name === 'Member');

        if (!roles.length) {
            console.log('⚠️  No roles found. Please run seedRoles.js first to create roles.');
            console.log('   Creating users without role assignments...');
        }

        // Clear existing users (optional - comment out to keep existing data)
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');

        // Create sample users with role assignments
        const createdUsers = [];
        for (const userData of sampleUsers) {
            let roleId = null;

            // Assign appropriate role based on username
            if (userData.username === 'varun') {
                roleId = superAdminRole?._id; // Varun gets Super Admin role
            } else if (userData.username === 'admin') {
                roleId = adminRole?._id; // System admin gets Admin role
            } else if (userData.username === 'moderator') {
                roleId = moderatorRole?._id; // Moderator gets Moderator role
            } else {
                roleId = memberRole?._id; // Others get Member role
            }

            const user = new User({
                ...userData,
                roleId: roleId
            });
            await user.save();

            const assignedRole = roles.find(r => r._id.equals(roleId));
            createdUsers.push({
                username: user.username,
                email: user.email,
                role: user.role,
                roleName: assignedRole?.name || 'No Role',
                verified: user.verified,
                fullName: `${user.firstName} ${user.lastName}`
            });
        }

        console.log('✅ Successfully created sample users:');
        createdUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.role}) - ${user.fullName} - ${user.roleName} - ${user.verified ? '✅ Verified' : '❌ Unverified'}`);
        });

        console.log('\n📋 Sample Login Credentials:');
        console.log('   Super Admin: varun / varun123');
        console.log('   Admin: admin / admin123');
        console.log('   Moderator: moderator / moderator123');
        console.log('   Member: member1 / member123');
        console.log('   Member: member2 / member123');
        console.log('   Unverified: unverified / unverified123');

        console.log('\n🎯 Role Assignments:');
        console.log('   🔐 Varun: Super Admin (Full system access)');
        console.log('   👨‍💼 Admin: Admin (Administrative access)');
        console.log('   🛡️  Moderator: Moderator (Moderation access)');
        console.log('   👥 Members: Member (Standard access)');

        console.log('\n🔗 API Endpoints:');
        console.log('   Login: POST http://localhost:5000/api/auth/login');
        console.log('   Register: POST http://localhost:5000/api/auth/register');
        console.log('   Profile: GET http://localhost:5000/api/auth/profile');
        console.log('   Validate: GET http://localhost:5000/api/auth/validate');

        console.log('\n💡 Next Steps:');
        console.log('   1. Start the backend server: npm start');
        console.log('   2. Start the frontend: cd ../community-admin && npm start');
        console.log('   3. Login with varun/varun123 for Super Admin access');
        console.log('   4. Navigate to Roles page to manage permissions');

    } catch (error) {
        console.error('❌ Error seeding users:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    }
};

// Run the seed function
seedUsers();
