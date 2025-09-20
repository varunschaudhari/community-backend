const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Family = require('../models/Family');
const { authenticateToken } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

// POST /api/users - Create a new user
router.post('/', authenticateToken, userController.createUser);

// GET /api/users/autocomplete/fathers - Get father suggestions for autocomplete
router.get('/autocomplete/fathers', authenticateToken, async (req, res) => {
    try {
        const { search, exclude } = req.query;

        if (!search || search.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const excludeIds = exclude ? exclude.split(',') : [];
        excludeIds.push(req.user.id); // Exclude current user

        const suggestions = await User.getFatherSuggestions(search, excludeIds);

        res.json({
            success: true,
            data: suggestions.map(user => ({
                id: user._id,
                name: user.fullName,
                age: user.age,
                displayText: `${user.fullName} (Age: ${user.age || 'Unknown'})`
            }))
        });
    } catch (error) {
        console.error('Father suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching father suggestions'
        });
    }
});

// GET /api/users/autocomplete/mothers - Get mother suggestions for autocomplete
router.get('/autocomplete/mothers', authenticateToken, async (req, res) => {
    try {
        const { search, exclude } = req.query;

        if (!search || search.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const excludeIds = exclude ? exclude.split(',') : [];
        excludeIds.push(req.user.id); // Exclude current user

        const suggestions = await User.getMotherSuggestions(search, excludeIds);

        res.json({
            success: true,
            data: suggestions.map(user => ({
                id: user._id,
                name: user.fullName,
                age: user.age,
                displayText: `${user.fullName} (Age: ${user.age || 'Unknown'})`
            }))
        });
    } catch (error) {
        console.error('Mother suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching mother suggestions'
        });
    }
});

// GET /api/users/autocomplete/spouses - Get spouse suggestions for autocomplete
router.get('/autocomplete/spouses', authenticateToken, async (req, res) => {
    try {
        const { search, exclude } = req.query;

        if (!search || search.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const excludeIds = exclude ? exclude.split(',') : [];
        excludeIds.push(req.user.id); // Exclude current user

        const suggestions = await User.getSpouseSuggestions(search, excludeIds);

        res.json({
            success: true,
            data: suggestions.map(user => ({
                id: user._id,
                name: user.fullName,
                age: user.age,
                maritalStatus: user.maritalStatus,
                displayText: `${user.fullName} (Age: ${user.age || 'Unknown'}, Status: ${user.maritalStatus})`
            }))
        });
    } catch (error) {
        console.error('Spouse suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching spouse suggestions'
        });
    }
});

// GET /api/users/autocomplete/children - Get children suggestions for autocomplete
router.get('/autocomplete/children', authenticateToken, async (req, res) => {
    try {
        const { search, exclude } = req.query;

        if (!search || search.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const excludeIds = exclude ? exclude.split(',') : [];
        excludeIds.push(req.user.id); // Exclude current user

        const suggestions = await User.getChildrenSuggestions(search, excludeIds);

        res.json({
            success: true,
            data: suggestions.map(user => ({
                id: user._id,
                name: user.fullName,
                age: user.age,
                displayText: `${user.fullName} (Age: ${user.age || 'Unknown'})`
            }))
        });
    } catch (error) {
        console.error('Children suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching children suggestions'
        });
    }
});

// GET /api/users/autocomplete/general - General name search for any relationship
router.get('/autocomplete/general', authenticateToken, async (req, res) => {
    try {
        const { search, exclude } = req.query;

        if (!search || search.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const excludeIds = exclude ? exclude.split(',') : [];
        excludeIds.push(req.user.id); // Exclude current user

        const suggestions = await User.searchByName(search, excludeIds);

        res.json({
            success: true,
            data: suggestions.map(user => ({
                id: user._id,
                name: user.fullName,
                displayText: user.fullName
            }))
        });
    } catch (error) {
        console.error('General suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching suggestions'
        });
    }
});

// POST /api/users/:id/add-child - Add a child to user
router.post('/:id/add-child', authenticateToken, async (req, res) => {
    try {
        const { childName, relationshipType, birthDate, fromWhichMarriage, otherParentId, otherParentName } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate relationship
        if (otherParentId && otherParentId === req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add self as child'
            });
        }

        await user.addChild(childName, relationshipType, birthDate, fromWhichMarriage, otherParentId, otherParentName);

        res.json({
            success: true,
            message: 'Child added successfully',
            data: user
        });
    } catch (error) {
        console.error('Add child error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adding child'
        });
    }
});

// POST /api/users/:id/add-marriage - Add a marriage to user
router.post('/:id/add-marriage', authenticateToken, async (req, res) => {
    try {
        const { spouseId, spouseName, marriageDate, marriagePlace, marriageType } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate relationship
        if (spouseId && spouseId === req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot marry self'
            });
        }

        const spouseDetails = {
            spouseId,
            spouseName,
            marriagePlace,
            marriageType
        };

        await user.addMarriage(spouseDetails, marriageDate);

        res.json({
            success: true,
            message: 'Marriage added successfully',
            data: user
        });
    } catch (error) {
        console.error('Add marriage error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adding marriage'
        });
    }
});

// POST /api/users/:id/end-marriage - End a marriage
router.post('/:id/end-marriage', authenticateToken, async (req, res) => {
    try {
        const { marriageOrder, endReason, endDate } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.endMarriage(marriageOrder, endReason, endDate);

        res.json({
            success: true,
            message: 'Marriage ended successfully',
            data: user
        });
    } catch (error) {
        console.error('End marriage error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error ending marriage'
        });
    }
});

// POST /api/users/:id/add-role - Add a role to user
router.post('/:id/add-role', authenticateToken, async (req, res) => {
    try {
        const { roleType } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.addRole(roleType, req.user.id);

        res.json({
            success: true,
            message: 'Role added successfully',
            data: user
        });
    } catch (error) {
        console.error('Add role error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adding role'
        });
    }
});

// DELETE /api/users/:id/remove-role - Remove a role from user
router.delete('/:id/remove-role', authenticateToken, async (req, res) => {
    try {
        const { roleType } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.removeRole(roleType);

        res.json({
            success: true,
            message: 'Role removed successfully',
            data: user
        });
    } catch (error) {
        console.error('Remove role error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error removing role'
        });
    }
});

// GET /api/users/:id/family-tree - Get user's family tree
router.get('/:id/family-tree', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('fatherDetails.fatherId', 'firstName lastName dobAsPerDocument')
            .populate('motherDetails.motherId', 'firstName lastName dobAsPerDocument')
            .populate('marriages.spouseId', 'firstName lastName dobAsPerDocument')
            .populate('children.childId', 'firstName lastName dobAsPerDocument')
            .populate('children.otherParentId', 'firstName lastName');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.fullName,
                    age: user.age,
                    maritalStatus: user.maritalStatus,
                    role: user.role
                },
                parents: {
                    father: user.fatherDetails.fatherId ? {
                        id: user.fatherDetails.fatherId._id,
                        name: user.fatherDetails.fatherId.fullName,
                        relationshipType: user.fatherDetails.relationshipType,
                        isAlive: user.fatherDetails.isAlive
                    } : null,
                    mother: user.motherDetails.motherId ? {
                        id: user.motherDetails.motherId._id,
                        name: user.motherDetails.motherId.fullName,
                        relationshipType: user.motherDetails.relationshipType,
                        isAlive: user.motherDetails.isAlive
                    } : null
                },
                marriages: user.marriages.map(marriage => ({
                    spouse: marriage.spouseId ? {
                        id: marriage.spouseId._id,
                        name: marriage.spouseId.fullName
                    } : null,
                    spouseName: marriage.spouseName,
                    marriageDate: marriage.marriageDate,
                    marriageStatus: marriage.marriageStatus,
                    isCurrentSpouse: marriage.isCurrentSpouse,
                    marriageType: marriage.marriageType
                })),
                children: user.children.filter(child => child.isActive).map(child => ({
                    child: child.childId ? {
                        id: child.childId._id,
                        name: child.childId.fullName
                    } : null,
                    childName: child.childName,
                    relationshipType: child.relationshipType,
                    birthDate: child.birthDate,
                    otherParent: child.otherParentId ? {
                        id: child.otherParentId._id,
                        name: child.otherParentId.fullName
                    } : null
                }))
            }
        });
    } catch (error) {
        console.error('Family tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching family tree'
        });
    }
});

// GET /api/users/search - Search users with filters
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const {
            search,
            role,
            maritalStatus,
            ageMin,
            ageMax,
            kul,
            gotra,
            page = 1,
            limit = 20
        } = req.query;

        const query = {};

        // Name search
        if (search) {
            query.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: search, options: "i" } } }
            ];
        }

        // Role filter
        if (role) {
            query['roles.roleType'] = role;
            query['roles.isActive'] = true;
        }

        // Marital status filter
        if (maritalStatus) {
            query.maritalStatus = maritalStatus;
        }

        // Age range filter
        if (ageMin || ageMax) {
            const today = new Date();
            if (ageMax) {
                const minBirthDate = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate());
                query.dobAsPerDocument = { ...query.dobAsPerDocument, $gte: minBirthDate };
            }
            if (ageMin) {
                const maxBirthDate = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate());
                query.dobAsPerDocument = { ...query.dobAsPerDocument, $lte: maxBirthDate };
            }
        }

        // Kul filter
        if (kul) {
            query.kul = new RegExp(kul, 'i');
        }

        // Gotra filter
        if (gotra) {
            query.gotra = new RegExp(gotra, 'i');
        }

        const skip = (page - 1) * limit;

        const users = await User.find(query)
            .select('firstName middleName lastName email phoneNumber dobAsPerDocument maritalStatus role kul gotra')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ firstName: 1, lastName: 1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users.map(user => ({
                id: user._id,
                name: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                age: user.age,
                maritalStatus: user.maritalStatus,
                role: user.role,
                kul: user.kul,
                gotra: user.gotra
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching users'
        });
    }
});

// GET /api/users/statistics - Get user statistics
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    marriedUsers: {
                        $sum: { $cond: [{ $eq: ['$maritalStatus', 'married'] }, 1, 0] }
                    },
                    singleUsers: {
                        $sum: { $cond: [{ $eq: ['$maritalStatus', 'single'] }, 1, 0] }
                    },
                    divorcedUsers: {
                        $sum: { $cond: [{ $eq: ['$maritalStatus', 'divorced'] }, 1, 0] }
                    },
                    widowedUsers: {
                        $sum: { $cond: [{ $eq: ['$maritalStatus', 'widowed'] }, 1, 0] }
                    },
                    totalMarriages: {
                        $sum: { $size: '$marriages' }
                    },
                    totalChildren: {
                        $sum: { $size: '$children' }
                    }
                }
            }
        ]);

        const roleStats = await User.aggregate([
            { $unwind: '$roles' },
            { $match: { 'roles.isActive': true } },
            {
                $group: {
                    _id: '$roles.roleType',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    totalUsers: 0,
                    marriedUsers: 0,
                    singleUsers: 0,
                    divorcedUsers: 0,
                    widowedUsers: 0,
                    totalMarriages: 0,
                    totalChildren: 0
                },
                roles: roleStats
            }
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

module.exports = router;
