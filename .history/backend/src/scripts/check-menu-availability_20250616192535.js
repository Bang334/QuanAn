/**
 * Script to check and update menu item availability based on ingredient stock levels
 * This script can be run as a scheduled task using node-cron or similar
 */

const { MenuItem } = require('../models');
const { checkMenuItemIngredientAvailability } = require('../controllers/recipe.controller');

async function checkAllMenuItemsAvailability() {
  try {
    // console.log('Starting scheduled check of menu item availability...');
    
    const menuItems = await MenuItem.findAll();
    let updatedCount = 0;
    
    for (const menuItem of menuItems) {
      const result = await checkMenuItemIngredientAvailability(menuItem.id);
      
      if (result.statusChanged) {
        updatedCount++;
        // console.log(`Updated menu item "${result.menuItemName}" (ID: ${result.menuItemId}) availability to ${result.currentStatus ? 'available' : 'unavailable'}`);
        
        if (!result.currentStatus) {
          // console.log(`  Missing ingredients: ${result.missingIngredients.map(i => 
          //   `${i.name} (need ${i.required}${i.unit}, have ${i.available}${i.unit})`
          // ).join(', ')}`);
        }
      }
    }
    
    // console.log(`Finished checking ${menuItems.length} menu items. Updated ${updatedCount} items.`);
    return {
      total: menuItems.length,
      updated: updatedCount
    };
  } catch (error) {
    // console.error('Error in scheduled menu item availability check:', error);
    return {
      error: error.message
    };
  }
}

// If running directly
if (require.main === module) {
  checkAllMenuItemsAvailability()
    .then(() => process.exit(0))
    .catch(err => {
      // console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { checkAllMenuItemsAvailability }; 