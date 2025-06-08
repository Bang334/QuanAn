-- Use the restaurant database
USE quanan_db;

-- Insert sample menu items if not already existing
INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Phở Bò', 'Phở bò truyền thống với nước dùng đậm đà, thịt bò tươi và các loại rau thơm', 55000, '/images/pho-bo.jpg', 'Món chính', TRUE, TRUE, 'Bánh phở, thịt bò, hành, gừng, rau thơm, gia vị', 'Calo: 450, Protein: 25g, Carbs: 65g, Chất béo: 10g', '15 phút', FALSE, FALSE, 'Không', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Phở Bò' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Bún Chả', 'Bún chả Hà Nội với thịt nướng thơm ngon và nước mắm pha chua ngọt', 60000, '/images/bun-cha.jpg', 'Món chính', TRUE, TRUE, 'Bún, thịt lợn, rau sống, nước mắm, gia vị', 'Calo: 500, Protein: 22g, Carbs: 70g, Chất béo: 15g', '20 phút', FALSE, FALSE, 'Cá', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bún Chả' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Gỏi Cuốn', 'Gỏi cuốn tôm thịt tươi mát với nước chấm đậu phộng', 40000, '/images/goi-cuon.jpg', 'Khai vị', TRUE, FALSE, 'Bánh tráng, tôm, thịt lợn, bún, rau xà lách, rau thơm', 'Calo: 220, Protein: 15g, Carbs: 30g, Chất béo: 5g', '10 phút', FALSE, FALSE, 'Tôm, đậu phộng', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Gỏi Cuốn' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Rau Xào Chay', 'Các loại rau củ xào với nước tương và gia vị chay', 35000, '/images/rau-xao.jpg', 'Món chay', TRUE, FALSE, 'Cải thảo, cà rốt, nấm, đậu hũ, gia vị chay', 'Calo: 180, Protein: 8g, Carbs: 20g, Chất béo: 7g', '10 phút', FALSE, TRUE, 'Đậu nành', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Rau Xào Chay' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Cà Phê Sữa Đá', 'Cà phê đen đậm đà pha với sữa đặc và đá', 25000, '/images/cafe-sua-da.jpg', 'Đồ uống', TRUE, TRUE, 'Cà phê, sữa đặc, đá', 'Calo: 120, Protein: 2g, Carbs: 15g, Chất béo: 5g', '5 phút', FALSE, FALSE, 'Sữa', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cà Phê Sữa Đá' LIMIT 1);

-- Insert sample tables if not already existing
INSERT INTO tables (name, status, capacity, qrCode, createdAt, updatedAt)
SELECT 'Bàn 1', 'available', 4, 'table1_qr', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 1');

INSERT INTO tables (name, status, capacity, qrCode, createdAt, updatedAt)
SELECT 'Bàn 2', 'available', 2, 'table2_qr', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 2');

INSERT INTO tables (name, status, capacity, qrCode, createdAt, updatedAt)
SELECT 'Bàn 3', 'available', 6, 'table3_qr', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 3');

INSERT INTO tables (name, status, capacity, qrCode, createdAt, updatedAt)
SELECT 'Bàn 4', 'available', 4, 'table4_qr', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 4');

INSERT INTO tables (name, status, capacity, qrCode, createdAt, updatedAt)
SELECT 'Bàn 5', 'available', 8, 'table5_qr', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 5');

-- Insert sample reviews (assuming we have menu items already)
INSERT INTO reviews (rating, comment, menuItemId, reviewDate, isVisible, createdAt, updatedAt)
SELECT 5, 'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!', 
(SELECT id FROM menu_items WHERE name = 'Phở Bò' LIMIT 1), 
NOW() - INTERVAL 3 DAY, TRUE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM menu_items WHERE name = 'Phở Bò') 
AND NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!' LIMIT 1);

INSERT INTO reviews (rating, comment, menuItemId, reviewDate, isVisible, createdAt, updatedAt)
SELECT 4, 'Bún chả thơm ngon, thịt nướng đậm đà', 
(SELECT id FROM menu_items WHERE name = 'Bún Chả' LIMIT 1), 
NOW() - INTERVAL 2 DAY, TRUE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bún Chả')
AND NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bún chả thơm ngon, thịt nướng đậm đà' LIMIT 1);

INSERT INTO reviews (rating, comment, menuItemId, reviewDate, isVisible, createdAt, updatedAt)
SELECT 5, 'Cà phê sữa đá rất ngon, đậm đà và thơm!', 
(SELECT id FROM menu_items WHERE name = 'Cà Phê Sữa Đá' LIMIT 1), 
NOW() - INTERVAL 1 DAY, TRUE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cà Phê Sữa Đá')
AND NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Cà phê sữa đá rất ngon, đậm đà và thơm!' LIMIT 1); 