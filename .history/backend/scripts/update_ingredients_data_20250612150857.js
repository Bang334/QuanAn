const sequelize = require('../src/config/database');
const { Ingredient } = require('../src/models');

// Function to generate a random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to get a random image URL based on category
function getImageForCategory(category) {
  const categoryMap = {
    'Thịt': 'https://i.imgur.com/1234meat.jpg',
    'Rau củ': 'https://i.imgur.com/1234vegetable.jpg',
    'Gia vị': 'https://i.imgur.com/1234spice.jpg',
    'Hải sản': 'https://i.imgur.com/1234seafood.jpg',
    'Trái cây': 'https://i.imgur.com/1234fruit.jpg',
    'Đồ khô': 'https://i.imgur.com/1234dry.jpg',
    'Đồ uống': 'https://i.imgur.com/1234beverage.jpg',
    'Đồ đông lạnh': 'https://i.imgur.com/1234frozen.jpg',
  };

  // Default image if category doesn't match or is null
  const defaultImage = 'https://i.imgur.com/default_ingredient.jpg';
  
  if (!category) return defaultImage;
  
  // Try to find a matching category, or use the default
  for (const key in categoryMap) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return categoryMap[key];
    }
  }
  
  return defaultImage;
}

// Function to get a storage location based on category
function getLocationForCategory(category) {
  const locationMap = {
    'Thịt': 'Tủ lạnh 1',
    'Rau củ': 'Kho rau 2',
    'Gia vị': 'Tủ gia vị',
    'Hải sản': 'Tủ đông 3',
    'Trái cây': 'Kho trái cây',
    'Đồ khô': 'Kho đồ khô',
    'Đồ uống': 'Kho đồ uống',
    'Đồ đông lạnh': 'Tủ đông 2',
  };

  // Default location if category doesn't match or is null
  const defaultLocation = 'Kho chung';
  
  if (!category) return defaultLocation;
  
  // Try to find a matching category, or use the default
  for (const key in locationMap) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return locationMap[key];
    }
  }
  
  return defaultLocation;
}

async function updateIngredientsData() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get all ingredients
    const ingredients = await Ingredient.findAll();
    console.log(`Found ${ingredients.length} ingredients to update.`);

    // Calculate dates
    const now = new Date();
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(now.getMonth() + 3);

    // Update each ingredient
    let updatedCount = 0;
    for (const ingredient of ingredients) {
      try {
        // Generate sample data for the new columns
        const expiryDate = randomDate(now, threeMonthsLater);
        const location = getLocationForCategory(ingredient.category);
        const isActive = true; // Default all ingredients to active
        const image = getImageForCategory(ingredient.category);

        // Update the ingredient
        await ingredient.update({
          expiryDate,
          location,
          isActive,
          image
        });

        console.log(`Updated ingredient: ${ingredient.name}`);
        updatedCount++;
      } catch (err) {
        console.error(`Error updating ingredient ${ingredient.name}:`, err.message);
      }
    }

    console.log(`Successfully updated ${updatedCount} out of ${ingredients.length} ingredients.`);
  } catch (error) {
    console.error('Error updating ingredients data:', error);
  } finally {
    // Close the connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the function
updateIngredientsData(); 