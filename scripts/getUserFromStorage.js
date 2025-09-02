/**
 * Utility script to get logged-in user information from localStorage
 * This can be used in browser console or integrated into your application
 */

/**
 * Get the logged-in user from localStorage
 * @returns {Object|null} User object or null if not found
 */
function getLoggedInUser() {
    try {
        const userData = localStorage.getItem('user');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
    }
}

/**
 * Get the logged-in user's full name
 * @returns {string} Full name or 'Unknown User' if not found
 */
function getLoggedInUserName() {
    const user = getLoggedInUser();
    if (user && user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    } else if (user && user.firstName) {
        return user.firstName;
    } else if (user && user.username) {
        return user.username;
    }
    return 'Unknown User';
}

/**
 * Get the logged-in user's first name
 * @returns {string} First name or 'Unknown' if not found
 */
function getLoggedInUserFirstName() {
    const user = getLoggedInUser();
    return user?.firstName || 'Unknown';
}

/**
 * Get the logged-in user's last name
 * @returns {string} Last name or 'Unknown' if not found
 */
function getLoggedInUserLastName() {
    const user = getLoggedInUser();
    return user?.lastName || 'Unknown';
}

/**
 * Get the logged-in user's username
 * @returns {string} Username or 'Unknown' if not found
 */
function getLoggedInUserUsername() {
    const user = getLoggedInUser();
    return user?.username || 'Unknown';
}

/**
 * Get the logged-in user's email
 * @returns {string} Email or 'Unknown' if not found
 */
function getLoggedInUserEmail() {
    const user = getLoggedInUser();
    return user?.email || 'Unknown';
}

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isUserLoggedIn() {
    const user = getLoggedInUser();
    const token = localStorage.getItem('authToken');
    return !!(user && token);
}

/**
 * Get user's role
 * @returns {string} User role or 'Unknown' if not found
 */
function getLoggedInUserRole() {
    const user = getLoggedInUser();
    return user?.role || 'Unknown';
}

/**
 * Display all user information in console
 */
function displayUserInfo() {
    const user = getLoggedInUser();
    if (user) {
        console.log('🔍 Logged-in User Information:');
        console.log('   Name:', getLoggedInUserName());
        console.log('   Username:', getLoggedInUserUsername());
        console.log('   Email:', getLoggedInUserEmail());
        console.log('   Role:', getLoggedInUserRole());
        console.log('   Verified:', user.verified ? '✅ Yes' : '❌ No');
        console.log('   User ID:', user._id);
        console.log('   Created:', new Date(user.createdAt).toLocaleString());
        console.log('   Updated:', new Date(user.updatedAt).toLocaleString());
    } else {
        console.log('❌ No user logged in');
    }
}

// Export functions for use in other modules (if using Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getLoggedInUser,
        getLoggedInUserName,
        getLoggedInUserFirstName,
        getLoggedInUserLastName,
        getLoggedInUserUsername,
        getLoggedInUserEmail,
        isUserLoggedIn,
        getLoggedInUserRole,
        displayUserInfo
    };
}

// Make functions available globally in browser
if (typeof window !== 'undefined') {
    window.getLoggedInUser = getLoggedInUser;
    window.getLoggedInUserName = getLoggedInUserName;
    window.getLoggedInUserFirstName = getLoggedInUserFirstName;
    window.getLoggedInUserLastName = getLoggedInUserLastName;
    window.getLoggedInUserUsername = getLoggedInUserUsername;
    window.getLoggedInUserEmail = getLoggedInUserEmail;
    window.isUserLoggedIn = isUserLoggedIn;
    window.getLoggedInUserRole = getLoggedInUserRole;
    window.displayUserInfo = displayUserInfo;
}

// Auto-display user info when script is loaded in browser
if (typeof window !== 'undefined') {
    console.log('📋 User Storage Utility Loaded');
    console.log('Available functions:');
    console.log('  - getLoggedInUser()');
    console.log('  - getLoggedInUserName()');
    console.log('  - getLoggedInUserFirstName()');
    console.log('  - getLoggedInUserLastName()');
    console.log('  - getLoggedInUserUsername()');
    console.log('  - getLoggedInUserEmail()');
    console.log('  - isUserLoggedIn()');
    console.log('  - getLoggedInUserRole()');
    console.log('  - displayUserInfo()');

    // Display current user info
    displayUserInfo();
}
