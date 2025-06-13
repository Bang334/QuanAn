const sequelize = require('../src/config/database');
const { Ingredient } = require('../src/models');

// Function to generate a random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to get a random image URL based on category
function getImageForCategory(category) {
  const categoryMap = {
    'Thịt': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=200',
    'Rau củ': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=200',
    'Gia vị': 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=80&w=200',
    'Hải sản': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=200',
    'Trái cây': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=200',
    'Đồ khô': 'https://images.unsplash.com/photo-1599046242505-2a9ed1da7553?q=80&w=200',
    'Đồ uống': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=200',
    'Đồ đông lạnh': 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?q=80&w=200',
  };

  // Default image if category doesn't match or is null
  const defaultImage = 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=200';
  
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