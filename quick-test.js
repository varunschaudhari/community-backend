// Quick test to verify MongoDB connection and user creation
const mongoose = require('mongoose');

async function quickTest() {
    try {
        console.log('🔌 Testing MongoDB connection...');
        await mongoose.connect('mongodb://127.0.0.1:27017/community-app');
        console.log('✅ MongoDB connected successfully!');

        // Test basic connection
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 Available collections:', collections.map(c => c.name));

        await mongoose.connection.close();
        console.log('✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('\n💡 Solutions:');
        console.log('1. Install MongoDB: https://www.mongodb.com/try/download/community');
        console.log('2. Start MongoDB service: mongod --dbpath C:\\data\\db');
        console.log('3. Or use MongoDB Atlas (cloud) and update .env file');
    }
}

quickTest();
