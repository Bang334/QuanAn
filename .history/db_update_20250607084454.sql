-- Use the restaurant database
USE quanan_db;

-- Create tables table if it doesn't exist
CREATE TABLE IF NOT EXISTS tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(10) NOT NULL,
  capacity INT NOT NULL,
  status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
  location VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create or update menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  isAvailable BOOLEAN DEFAULT TRUE,
  isPopular BOOLEAN DEFAULT FALSE,
  ingredients TEXT,
  nutritionInfo TEXT,
  preparationTime VARCHAR(20),
  isSpicy BOOLEAN DEFAULT FALSE,
  isVegetarian BOOLEAN DEFAULT FALSE,
  allergens VARCHAR(255),
  avgRating FLOAT DEFAULT 0,
  ratingCount INT DEFAULT 0
);

-- Create or update orders table (no user required)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tableId INT NOT NULL,
  status ENUM('pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tableId) REFERENCES tables(id)
);

-- Create or update order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  menuItemId INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id),
  FOREIGN KEY (menuItemId) REFERENCES menu_items(id)
);

-- Create simplified reviews table (no user information required)
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  menuItemId INT NOT NULL,
  reviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isVisible BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (menuItemId) REFERENCES menu_items(id),
  INDEX (menuItemId)
);

-- Add procedure to update menu item ratings when reviews are added
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS update_menu_item_rating(IN item_id INT)
BEGIN
  DECLARE avg_rating FLOAT;
  DECLARE count_rating INT;
  
  SELECT AVG(rating), COUNT(id) 
  INTO avg_rating, count_rating
  FROM reviews 
  WHERE menuItemId = item_id AND isVisible = TRUE;
  
  UPDATE menu_items 
  SET avgRating = IFNULL(avg_rating, 0), 
      ratingCount = IFNULL(count_rating, 0)
  WHERE id = item_id;
END //
DELIMITER ;

-- Add trigger to update menu item rating when a review is added or updated
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  CALL update_menu_item_rating(NEW.menuItemId);
END //

CREATE TRIGGER IF NOT EXISTS after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  CALL update_menu_item_rating(NEW.menuItemId);
END //
DELIMITER ;

-- Insert sample menu items if not already existing
INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens)
SELECT 'Phở Bò', 'Phở bò truyền thống với nước dùng đậm đà, thịt bò tươi và các loại rau thơm', 55000, '/images/pho-bo.jpg', 'Món chính', TRUE, TRUE, 'Bánh phở, thịt bò, hành, gừng, rau thơm, gia vị', 'Calo: 450, Protein: 25g, Carbs: 65g, Chất béo: 10g', '15 phút', FALSE, FALSE, 'Không'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Phở Bò');

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens)
SELECT 'Bún Chả', 'Bún chả Hà Nội với thịt nướng thơm ngon và nước mắm pha chua ngọt', 60000, '/images/bun-cha.jpg', 'Món chính', TRUE, TRUE, 'Bún, thịt lợn, rau sống, nước mắm, gia vị', 'Calo: 500, Protein: 22g, Carbs: 70g, Chất béo: 15g', '20 phút', FALSE, FALSE, 'Cá'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bún Chả');

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens)
SELECT 'Gỏi Cuốn', 'Gỏi cuốn tôm thịt tươi mát với nước chấm đậu phộng', 40000, '/images/goi-cuon.jpg', 'Khai vị', TRUE, FALSE, 'Bánh tráng, tôm, thịt lợn, bún, rau xà lách, rau thơm', 'Calo: 220, Protein: 15g, Carbs: 30g, Chất béo: 5g', '10 phút', FALSE, FALSE, 'Tôm, đậu phộng'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Gỏi Cuốn');

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens)
SELECT 'Rau Xào Chay', 'Các loại rau củ xào với nước tương và gia vị chay', 35000, '/images/rau-xao.jpg', 'Món chay', TRUE, FALSE, 'Cải thảo, cà rốt, nấm, đậu hũ, gia vị chay', 'Calo: 180, Protein: 8g, Carbs: 20g, Chất béo: 7g', '10 phút', FALSE, TRUE, 'Đậu nành'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Rau Xào Chay');

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens)
SELECT 'Cà Phê Sữa Đá', 'Cà phê đen đậm đà pha với sữa đặc và đá', 25000, '/images/cafe-sua-da.jpg', 'Đồ uống', TRUE, TRUE, 'Cà phê, sữa đặc, đá', 'Calo: 120, Protein: 2g, Carbs: 15g, Chất béo: 5g', '5 phút', FALSE, FALSE, 'Sữa'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cà Phê Sữa Đá');

-- Insert sample tables if not already existing
INSERT INTO tables (table_number, capacity, status, location)
SELECT '1', 4, 'available', 'Tầng 1'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE table_number = '1');

INSERT INTO tables (table_number, capacity, status, location)
SELECT '2', 2, 'available', 'Tầng 1'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE table_number = '2');

INSERT INTO tables (table_number, capacity, status, location)
SELECT '3', 6, 'available', 'Tầng 1'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE table_number = '3');

INSERT INTO tables (table_number, capacity, status, location)
SELECT '4', 4, 'available', 'Tầng 2'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE table_number = '4');

INSERT INTO tables (table_number, capacity, status, location)
SELECT '5', 8, 'available', 'Tầng 2'
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE table_number = '5');

-- Insert sample reviews
INSERT INTO reviews (rating, comment, menuItemId, reviewDate)
SELECT 5, 'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!', 
(SELECT id FROM menu_items WHERE name = 'Phở Bò' LIMIT 1), 
NOW() - INTERVAL 3 DAY
WHERE EXISTS (SELECT 1 FROM menu_items WHERE name = 'Phở Bò') 
AND NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!');

INSERT INTO reviews (rating, comment, menuItemId, reviewDate)
SELECT 4, 'Bún chả thơm ngon, thịt nướng đậm đà', 
(SELECT id FROM menu_items WHERE name = 'Bún Chả' LIMIT 1), 
NOW() - INTERVAL 2 DAY
WHERE EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bún Chả')
AND NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bún chả thơm ngon, thịt nướng đậm đà');

INSERT INTO reviews (rating, comment, menuItemId, reviewDate)
SELECT 5, 'Cà phê sữa đá rất ngon, đậm đà và thơm!', 
(SELECT id FROM menu_items WHERE name = 'Cà Phê Sữa Đá' LIMIT 1), 
NOW() - INTERVAL 1 DAY
WHERE EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cà Phê Sữa Đá')
AND NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Cà phê sữa đá rất ngon, đậm đà và thơm!'); 