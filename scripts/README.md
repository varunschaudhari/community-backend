# Database Seeding Scripts

This directory contains scripts for seeding the database with initial data.

## 🌱 Unified Seeding Script

The main seeding script is `seedDatabase.js` which combines all seeding functionality into a single, easy-to-use script.

### Usage

```bash
# Basic seeding (skips if data already exists)
npm run seed

# Clear all existing data and seed fresh
npm run seed:clear

# Force create all data (overwrites existing)
npm run seed:force

# Direct script usage with options
node scripts/seedDatabase.js [options]
```

### Command Line Options

- `--clear-roles` - Clear existing roles before seeding
- `--clear-users` - Clear existing community users before seeding
- `--clear-system-users` - Clear existing system users before seeding
- `--clear-all` - Clear all existing data before seeding
- `--force` - Force create even if data already exists
- `--help` - Show help message

### Examples

```bash
# Seed with existing data (default behavior)
node scripts/seedDatabase.js

# Clear all and seed fresh
node scripts/seedDatabase.js --clear-all

# Clear only community users
node scripts/seedDatabase.js --clear-users

# Force create all data
node scripts/seedDatabase.js --force

# Show help
node scripts/seedDatabase.js --help
```

## 📊 What Gets Seeded

### 1. Roles (5 roles)
- **Super Admin** - Full system access with all permissions
- **Admin** - Administrative access with most permissions
- **Moderator** - Moderation access with limited permissions
- **Member** - Standard member access with basic permissions
- **Guest** - Limited access for guests (read-only)

### 2. Community Users (6 users)
- **varun** (Super Admin) - varun123
- **admin** (Admin) - admin123
- **moderator** (Moderator) - moderator123
- **member1** (Member) - member123
- **member2** (Member) - member123
- **unverified** (Member) - unverified123

### 3. System Users (6 users)
- **sysadmin** (System Admin) - SystemAdmin123!@#
- **sysmanager** (System Manager) - SystemManager123!@#
- **sysoperator** (System Operator) - SystemOperator123!@#
- **sysviewer** (System Viewer) - SystemViewer123!@#
- **hrmanager** (System Manager) - HRManager123!@#
- **financeadmin** (System Manager) - FinanceAdmin123!@#

## 🔧 Configuration

You can modify the seeding behavior by editing the `SEED_OPTIONS` object in `seedDatabase.js`:

```javascript
const SEED_OPTIONS = {
    clearExisting: {
        roles: false,        // Set to true to clear existing roles
        users: false,        // Set to true to clear existing users
        systemUsers: false   // Set to true to clear existing system users
    },
    skipIfExists: true       // Skip creating if already exists
};
```

## 🚀 Production Deployment

For production deployment, it's recommended to:

1. **Use the unified script**:
   ```bash
   npm run seed
   ```

2. **Change default passwords** immediately after deployment

3. **Use environment-specific data** by modifying the data arrays in the script

4. **Run with clear options** for fresh deployments:
   ```bash
   npm run seed:clear
   ```

## 🔐 Security Notes

⚠️ **Important**: The default passwords are for development only. In production:

1. Change all default passwords immediately
2. Use strong, unique passwords
3. Consider using environment variables for sensitive data
4. Implement proper password policies

## 📝 Logs

The seeding script provides detailed logging:
- ✅ Success messages for created items
- ⚠️ Warning messages for skipped items
- ❌ Error messages for failures
- 📊 Summary statistics at the end

## 🛠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env` file
   - Verify network connectivity

2. **Permission Errors**
   - Ensure the script has write permissions
   - Check MongoDB user permissions

3. **Validation Errors**
   - Check data format in the script
   - Verify model schemas match the data

### Debug Mode

For detailed error information, check the console output. The script provides comprehensive error messages and stack traces.

## 📚 Related Files

- `../models/Role.js` - Role model definition
- `../models/User.js` - Community user model definition
- `../models/SystemUser.js` - System user model definition
- `../app.js` - Main application file
- `../package.json` - NPM scripts configuration
