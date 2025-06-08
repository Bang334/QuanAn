const express = require('express');
const router = express.Router();
const kitchenPermissionController = require('../controllers/kitchenPermission.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Get all kitchen permissions - Admin only
router.get('/', authenticateToken, isAdmin, kitchenPermissionController.getAllKitchenPermissions);

// Get active kitchen permissions - Admin only
router.get('/active', authenticateToken, isAdmin, kitchenPermissionController.getActiveKitchenPermissions);

// Get kitchen permission by ID - Admin only
router.get('/:id', authenticateToken, isAdmin, kitchenPermissionController.getKitchenPermissionById);

// Get kitchen permissions for a specific user - Admin only
router.get('/user/:userId', authenticateToken, isAdmin, kitchenPermissionController.getUserKitchenPermissions);

// Create a new kitchen permission - Admin only
router.post('/', authenticateToken, isAdmin, kitchenPermissionController.createKitchenPermission);

// Update a kitchen permission - Admin only
router.put('/:id', authenticateToken, isAdmin, kitchenPermissionController.updateKitchenPermission);

// Revoke a kitchen permission - Admin only
router.patch('/:id/revoke', authenticateToken, isAdmin, kitchenPermissionController.revokeKitchenPermission);

module.exports = router; 