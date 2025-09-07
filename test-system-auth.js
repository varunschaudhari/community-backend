const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const SYSTEM_AUTH_URL = `${BASE_URL}/api/system/auth`;
const SYSTEM_USERS_URL = `${BASE_URL}/api/system/users`;

// Test system user credentials
const TEST_CREDENTIALS = {
    username: 'sysadmin',
    password: 'SystemAdmin123!@#'
};

async function testSystemAuthentication() {
    console.log('🧪 Testing System User Authentication System\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing System Auth Health Check...');
        const healthResponse = await axios.get(`${SYSTEM_AUTH_URL}/health`);
        console.log('✅ System Auth Health:', healthResponse.data.message);
        console.log('   User Type:', healthResponse.data.userType);
        console.log('');

        // Test 2: System Login
        console.log('2️⃣ Testing System User Login...');
        const loginResponse = await axios.post(`${SYSTEM_AUTH_URL}/login`, TEST_CREDENTIALS);
        console.log('✅ System Login Successful!');
        console.log('   User:', loginResponse.data.data.user.username);
        console.log('   Role:', loginResponse.data.data.user.systemRole);
        console.log('   Department:', loginResponse.data.data.user.department);
        console.log('   Access Level:', loginResponse.data.data.user.accessLevel);
        console.log('   User Type:', loginResponse.data.data.userType);
        console.log('');

        const token = loginResponse.data.data.token;

        // Test 3: Get System Profile
        console.log('3️⃣ Testing Get System Profile...');
        const profileResponse = await axios.get(`${SYSTEM_AUTH_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ System Profile Retrieved!');
        console.log('   Full Name:', profileResponse.data.data.user.fullName);
        console.log('   Employee ID:', profileResponse.data.data.user.employeeId);
        console.log('   Permissions Count:', profileResponse.data.data.user.permissions.length);
        console.log('');

        // Test 4: Get Permissions
        console.log('4️⃣ Testing Get Permissions...');
        const permissionsResponse = await axios.get(`${SYSTEM_AUTH_URL}/permissions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Permissions Retrieved!');
        console.log('   System Role:', permissionsResponse.data.data.systemRole);
        console.log('   Access Level:', permissionsResponse.data.data.accessLevel);
        console.log('   Permissions:', permissionsResponse.data.data.permissions.slice(0, 5).join(', ') + '...');
        console.log('');

        // Test 5: Test Admin Access
        console.log('5️⃣ Testing Admin Access...');
        const adminResponse = await axios.get(`${SYSTEM_AUTH_URL}/admin`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Admin Access Granted!');
        console.log('   Admin Features:', adminResponse.data.data.adminFeatures.join(', '));
        console.log('');

        // Test 6: Test System Write Permission
        console.log('6️⃣ Testing System Write Permission...');
        const writeResponse = await axios.get(`${SYSTEM_AUTH_URL}/system-write`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ System Write Permission Granted!');
        console.log('   Write Features:', writeResponse.data.data.writeFeatures.join(', '));
        console.log('');

        // Test 7: Get System Users (if permissions allow)
        console.log('7️⃣ Testing Get System Users...');
        try {
            const usersResponse = await axios.get(`${SYSTEM_USERS_URL}?limit=5`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ System Users Retrieved!');
            console.log('   Total Users:', usersResponse.data.data.pagination.totalUsers);
            console.log('   Users Found:', usersResponse.data.data.systemUsers.length);
            console.log('   First User:', usersResponse.data.data.systemUsers[0]?.username);
        } catch (error) {
            console.log('❌ System Users Access Denied:', error.response?.data?.message || error.message);
        }
        console.log('');

        // Test 8: Get System User Stats
        console.log('8️⃣ Testing Get System User Stats...');
        try {
            const statsResponse = await axios.get(`${SYSTEM_USERS_URL}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ System User Stats Retrieved!');
            console.log('   Total Users:', statsResponse.data.data.overview.totalUsers);
            console.log('   Active Users:', statsResponse.data.data.overview.activeUsers);
            console.log('   Verified Users:', statsResponse.data.data.overview.verifiedUsers);
            console.log('   Departments:', statsResponse.data.data.departmentStats.length);
        } catch (error) {
            console.log('❌ System User Stats Access Denied:', error.response?.data?.message || error.message);
        }
        console.log('');

        // Test 9: Validate Token
        console.log('9️⃣ Testing Token Validation...');
        const validateResponse = await axios.get(`${SYSTEM_AUTH_URL}/validate`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Token Valid!');
        console.log('   Message:', validateResponse.data.message);
        console.log('');

        // Test 10: System Logout
        console.log('🔟 Testing System Logout...');
        const logoutResponse = await axios.post(`${SYSTEM_AUTH_URL}/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ System Logout Successful!');
        console.log('   Message:', logoutResponse.data.message);
        console.log('');

        console.log('🎉 All System Authentication Tests Passed!');
        console.log('\n📋 Summary:');
        console.log('   ✅ System login with different endpoint');
        console.log('   ✅ Separate JWT token system');
        console.log('   ✅ Role-based access control');
        console.log('   ✅ Permission-based authorization');
        console.log('   ✅ System user management');
        console.log('   ✅ Different user type (system vs community)');

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Tip: Make sure to run the seeding script first:');
            console.log('   node scripts/seedSystemUsers.js');
        }
    }
}

// Test with different system user roles
async function testDifferentRoles() {
    console.log('\n🧪 Testing Different System User Roles\n');

    const testUsers = [
        { username: 'sysmanager', password: 'SystemManager123!@#', expectedRole: 'System Manager' },
        { username: 'sysoperator', password: 'SystemOperator123!@#', expectedRole: 'System Operator' },
        { username: 'sysviewer', password: 'SystemViewer123!@#', expectedRole: 'System Viewer' }
    ];

    for (const user of testUsers) {
        try {
            console.log(`Testing ${user.username} (${user.expectedRole})...`);
            
            const loginResponse = await axios.post(`${SYSTEM_AUTH_URL}/login`, user);
            const token = loginResponse.data.data.token;
            
            console.log(`✅ ${user.username} login successful`);
            console.log(`   Role: ${loginResponse.data.data.user.systemRole}`);
            console.log(`   Access Level: ${loginResponse.data.data.user.accessLevel}`);
            console.log(`   Permissions: ${loginResponse.data.data.user.permissions.length}`);
            
            // Test role-specific access
            if (user.expectedRole === 'System Manager') {
                try {
                    await axios.get(`${SYSTEM_AUTH_URL}/manager`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('   ✅ Manager access granted');
                } catch (error) {
                    console.log('   ❌ Manager access denied');
                }
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`❌ ${user.username} test failed:`, error.response?.data?.message || error.message);
        }
    }
}

// Run tests
async function runAllTests() {
    await testSystemAuthentication();
    await testDifferentRoles();
}

// Check if server is running
async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/health`);
        return true;
    } catch (error) {
        return false;
    }
}

// Main execution
async function main() {
    console.log('🚀 System User Authentication Test Suite\n');
    
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.log('❌ Server is not running. Please start the server first:');
        console.log('   npm start');
        return;
    }
    
    console.log('✅ Server is running, starting tests...\n');
    await runAllTests();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testSystemAuthentication, testDifferentRoles };
