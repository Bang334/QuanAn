-- Use the restaurant database
USE quanan_db;

-- Insert reviews for existing menu items and orders
INSERT INTO reviews (rating, comment, tableId, menuItemId, orderId, reviewDate, userName, isVisible, createdAt, updatedAt)
VALUES 
(5, 'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!', 1, 1, 3, NOW() - INTERVAL 1 DAY, 'Khách hàng', TRUE, NOW(), NOW()),
(4, 'Bún chả thơm ngon, thịt nướng đậm đà', 2, 2, 5, NOW() - INTERVAL 2 DAY, 'Khách hàng', TRUE, NOW(), NOW()),
(5, 'Cà phê sữa đá rất ngon, đậm đà và thơm!', 1, 5, 3, NOW() - INTERVAL 3 DAY, 'Khách hàng', TRUE, NOW(), NOW()),
(4, 'Chả giò giòn rụm, nhân thịt thơm ngon', 3, 8, 1, NOW() - INTERVAL 2 DAY, 'Khách hàng', TRUE, NOW(), NOW()),
(5, 'Cơm tấm ngon tuyệt, sườn mềm thơm', 4, 7, 4, NOW() - INTERVAL 1 DAY, 'Khách hàng', TRUE, NOW(), NOW()),
(4, 'Bún bò Huế cay đủ mức, thịt bò mềm, rất đúng vị', 5, 9, 2, NOW() - INTERVAL 4 DAY, 'Khách hàng', TRUE, NOW(), NOW());

-- Update avg ratings for menu items based on reviews
UPDATE menu_items SET avgRating = 5.0, ratingCount = 1 WHERE id = 1;
UPDATE menu_items SET avgRating = 4.0, ratingCount = 1 WHERE id = 2;
UPDATE menu_items SET avgRating = 5.0, ratingCount = 1 WHERE id = 5;
UPDATE menu_items SET avgRating = 4.0, ratingCount = 1 WHERE id = 8;
UPDATE menu_items SET avgRating = 5.0, ratingCount = 1 WHERE id = 7;
UPDATE menu_items SET avgRating = 4.0, ratingCount = 1 WHERE id = 9; 