-- Use the restaurant database
USE quanan_db;

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discountType ENUM('percent', 'fixed') NOT NULL,
  discountValue DECIMAL(10, 2) NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  minimumOrderAmount DECIMAL(10, 2) DEFAULT 0,
  maximumDiscountAmount DECIMAL(10, 2) DEFAULT NULL,
  applicableCategories VARCHAR(255) DEFAULT NULL COMMENT 'Comma-separated categories or NULL for all',
  usageLimit INT DEFAULT NULL COMMENT 'Maximum number of uses',
  usageCount INT DEFAULT 0 COMMENT 'Current number of uses',
  promotionCode VARCHAR(50) DEFAULT NULL COMMENT 'Optional code to apply promotion',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create order_promotions table to track which promotions were applied to which orders
CREATE TABLE IF NOT EXISTS order_promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  promotionId INT NOT NULL,
  discountAmount DECIMAL(10, 2) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id),
  FOREIGN KEY (promotionId) REFERENCES promotions(id)
);

-- Create view for category-based revenue analysis
CREATE OR REPLACE VIEW category_revenue AS
SELECT 
    mi.category,
    COUNT(DISTINCT oi.orderId) AS numberOfOrders,
    SUM(oi.quantity) AS totalItems,
    SUM(oi.quantity * oi.price) AS totalRevenue,
    AVG(oi.price) AS averagePrice,
    MAX(p.paymentDate) AS lastOrderDate
FROM 
    order_items oi
JOIN 
    menu_items mi ON oi.menuItemId = mi.id
JOIN 
    orders o ON oi.orderId = o.id
LEFT JOIN 
    payments p ON o.id = p.orderId
WHERE 
    o.status = 'completed'
GROUP BY 
    mi.category
ORDER BY 
    totalRevenue DESC;

-- Create view for top-selling items
CREATE OR REPLACE VIEW top_selling_items AS
SELECT 
    mi.id,
    mi.name,
    mi.category,
    SUM(oi.quantity) AS totalQuantitySold,
    SUM(oi.quantity * oi.price) AS totalRevenue,
    AVG(r.rating) AS averageRating,
    COUNT(r.id) AS numberOfReviews
FROM 
    menu_items mi
LEFT JOIN 
    order_items oi ON mi.id = oi.menuItemId
LEFT JOIN 
    orders o ON oi.orderId = o.id AND o.status = 'completed'
LEFT JOIN 
    reviews r ON mi.id = r.menuItemId
GROUP BY 
    mi.id, mi.name, mi.category
ORDER BY 
    totalQuantitySold DESC;

-- Insert sample promotions
INSERT INTO promotions (name, description, discountType, discountValue, startDate, endDate, isActive, minimumOrderAmount, maximumDiscountAmount, applicableCategories, usageLimit, usageCount, promotionCode)
VALUES 
('Khuyến mãi mùa hè', 'Giảm giá 10% cho tất cả các món ăn', 'percent', 10, NOW() - INTERVAL 10 DAY, NOW() + INTERVAL 30 DAY, TRUE, 100000, 50000, NULL, 100, 0, 'SUMMER2025'),
('Món chính giảm giá', 'Giảm 15% cho tất cả các món chính', 'percent', 15, NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 15 DAY, TRUE, 0, 30000, 'Món chính', 50, 0, 'MAINDISH15'),
('Combo tiết kiệm', 'Giảm 30000 VNĐ cho đơn hàng từ 200000 VNĐ', 'fixed', 30000, NOW(), NOW() + INTERVAL 60 DAY, TRUE, 200000, NULL, NULL, NULL, 0, 'SAVE30K'),
('Happy Hour', 'Giảm 20% cho đồ uống từ 17h-19h', 'percent', 20, NOW() - INTERVAL 30 DAY, NOW() + INTERVAL 90 DAY, TRUE, 0, 20000, 'Đồ uống', 200, 12, 'HAPPYHOUR');

-- Apply promotions to some orders (for sample data)
INSERT INTO order_promotions (orderId, promotionId, discountAmount)
VALUES 
(2, 1, 25000), -- 10% off order id 2 (250000 VND)
(4, 3, 30000); -- 30000 VND fixed discount for order id 4 