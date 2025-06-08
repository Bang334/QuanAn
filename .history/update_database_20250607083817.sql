-- Create database if not exists
CREATE DATABASE IF NOT EXISTS quanan_db;
USE quanan_db;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(10) NOT NULL,
  capacity INT NOT NULL,
  status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
  location VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  tableId INT NOT NULL,
  menuItemId INT NOT NULL,
  orderId INT NOT NULL,
  reviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userName VARCHAR(100) DEFAULT 'Khách hàng',
  isVisible BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (tableId) REFERENCES tables(id),
  FOREIGN KEY (menuItemId) REFERENCES menu_items(id),
  FOREIGN KEY (orderId) REFERENCES orders(id),
  INDEX (menuItemId),
  INDEX (orderId),
  INDEX (tableId)
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