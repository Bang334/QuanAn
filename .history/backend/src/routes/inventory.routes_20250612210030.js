const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredient.controller');
const supplierController = require('../controllers/supplier.controller');
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const kitchenPermissionController = require('../controllers/kitchenPermission.controller');
const inventoryReportController = require('../controllers/inventoryReport.controller');
const recipeController = require('../controllers/recipe.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth');

// Middleware để kiểm tra xác thực và quyền
const adminOnly = [authenticateJWT, authorizeRoles(['admin'])];
const kitchenOrAdmin = [authenticateJWT, authorizeRoles(['admin', 'kitchen'])];

// Ingredient routes
router.get('/ingredients/low-stock', kitchenOrAdmin, ingredientController.getLowStockIngredients);
router.get('/ingredients/:id/transactions', kitchenOrAdmin, ingredientController.getTransactionHistory);
router.get('/ingredients/:id/price-history', kitchenOrAdmin, ingredientController.getPriceHistory);
router.get('/ingredients/:id', kitchenOrAdmin, ingredientController.getIngredientById);
router.get('/ingredients', kitchenOrAdmin, ingredientController.getAllIngredients);
router.post('/ingredients', adminOnly, ingredientController.createIngredient);
router.put('/ingredients/:id', adminOnly, ingredientController.updateIngredient);
router.patch('/ingredients/:id/adjust', kitchenOrAdmin, ingredientController.adjustQuantity);
router.delete('/ingredients/:id', adminOnly, ingredientController.deleteIngredient);

// Supplier routes
router.get('/suppliers/active', kitchenOrAdmin, supplierController.getActiveSuppliers);
router.get('/suppliers/search', kitchenOrAdmin, supplierController.searchSuppliers);
router.get('/suppliers/:id/purchase-history', kitchenOrAdmin, supplierController.getPurchaseHistory);
router.get('/suppliers/:id', kitchenOrAdmin, supplierController.getSupplierById);
router.get('/suppliers', kitchenOrAdmin, supplierController.getAllSuppliers);
router.post('/suppliers', adminOnly, supplierController.createSupplier);
router.put('/suppliers/:id', adminOnly, supplierController.updateSupplier);
router.delete('/suppliers/:id', adminOnly, supplierController.deleteSupplier);

// Purchase Order routes
router.get('/purchase-orders/kitchen', kitchenOrAdmin, purchaseOrderController.getKitchenPurchaseOrders);
router.get('/purchase-orders/:id', kitchenOrAdmin, purchaseOrderController.getPurchaseOrderById);
router.get('/purchase-orders', adminOnly, purchaseOrderController.getAllPurchaseOrders);
router.get('/purchase-order-items', kitchenOrAdmin, purchaseOrderController.getPurchaseOrderItems);
router.post('/purchase-orders', kitchenOrAdmin, purchaseOrderController.createPurchaseOrder);
router.put('/purchase-orders/:id', kitchenOrAdmin, purchaseOrderController.updatePurchaseOrder);
router.patch('/purchase-orders/:id/status', kitchenOrAdmin, purchaseOrderController.updatePurchaseOrderStatus);
router.delete('/purchase-orders/:id', kitchenOrAdmin, purchaseOrderController.deletePurchaseOrder);

// Kitchen Permission routes
router.get('/kitchen-permissions/active', adminOnly, kitchenPermissionController.getActiveKitchenPermissions);
router.get('/kitchen-permissions/user/:userId', adminOnly, kitchenPermissionController.getUserKitchenPermissions);
router.get('/kitchen-permissions/check/:userId', kitchenOrAdmin, kitchenPermissionController.checkAutoApprovePermission);
router.get('/kitchen-permissions/:id', adminOnly, kitchenPermissionController.getKitchenPermissionById);
router.get('/kitchen-permissions', adminOnly, kitchenPermissionController.getAllKitchenPermissions);
router.post('/kitchen-permissions', adminOnly, kitchenPermissionController.createKitchenPermission);
router.put('/kitchen-permissions/:id', adminOnly, kitchenPermissionController.updateKitchenPermission);
router.patch('/kitchen-permissions/:id/revoke', adminOnly, kitchenPermissionController.revokeKitchenPermission);

// Recipe routes
router.get('/recipes', kitchenOrAdmin, recipeController.getAllRecipes);
router.get('/recipes/menu-item/:menuItemId', kitchenOrAdmin, recipeController.getRecipeByMenuItem);
router.post('/recipes/menu-item/:menuItemId', adminOnly, recipeController.createOrUpdateRecipe);
router.delete('/recipes/menu-item/:menuItemId', adminOnly, recipeController.deleteRecipe);
router.post('/recipes/calculate', kitchenOrAdmin, recipeController.calculateIngredientsForOrder);
router.post('/recipes/process-usage', kitchenOrAdmin, recipeController.processIngredientUsage);
router.get('/recipes/usage/menu-item/:menuItemId', adminOnly, recipeController.getIngredientUsageByMenuItem);

// Inventory Report routes
router.get('/reports/summary', adminOnly, inventoryReportController.getInventorySummary);
router.get('/reports/usage-stats', adminOnly, inventoryReportController.getIngredientUsageStats);
router.get('/reports/purchase-costs', adminOnly, inventoryReportController.getPurchaseCostStats);
router.get('/reports/ingredients/:id/stock-history', kitchenOrAdmin, inventoryReportController.getIngredientStockHistory);
router.get('/reports/supplier-performance', adminOnly, inventoryReportController.getSupplierPerformance);
router.get('/reports/forecast', adminOnly, inventoryReportController.getForecastReport);

module.exports = router; 