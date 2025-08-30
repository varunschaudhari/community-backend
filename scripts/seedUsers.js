const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/community-app';

// Sample users data
const sampleUsers = [
    {
        username: 'admin',
        password: 'admin123',
        email: 'admin@community.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        verified: true
    },
    {
        username: 'moderator',
        password: 'moderator123',
        email: 'moderator@community.com',
        firstName: 'Moderator',
        lastName: 'User',
        role: 'member',
        verified: true
    },
    {
        username: 'member1',
        password: 'member123',
        email: 'member1@community.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'member',
        verified: true
    },
    {
        username: 'member2',
        password: 'member123',
        email: 'member2@community.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'member',
        verified: true
    },
    {
        username: 'unverified',
        password: 'unverified123',
        email: 'unverified@community.com',
        firstName: 'Unverified',
        lastName: 'User',
        role: 'member',
        verified: false
    }
];

/**
 * Seed the database with sample users
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

        // Clear existing users (optional - comment out to keep existing data)
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');

        // Create sample users
        const createdUsers = [];
        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            createdUsers.push({
                username: user.username,
                email: user.email,
                role: user.role,
                verified: user.verified
            });
        }

        console.log('✅ Successfully created sample users:');
        createdUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.role}) - ${user.verified ? 'Verified' : 'Unverified'}`);
        });

        console.log('\n📋 Sample Login Credentials:');
        console.log('   Admin: admin / admin123');
        console.log('   Moderator: moderator / moderator123');
        console.log('   Member: member1 / member123');
        console.log('   Unverified: unverified / unverified123');

        console.log('\n🔗 API Endpoints:');
        console.log('   Login: POST http://localhost:5000/api/auth/login');
        console.log('   Register: POST http://localhost:5000/api/auth/register');
        console.log('   Profile: GET http://localhost:5000/api/auth/profile');
        console.log('   Validate: GET http://localhost:5000/api/auth/validate');

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
