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

-- Insert additional menu items
INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Cơm Tấm Sườn', 'Cơm tấm với sườn nướng thơm ngon và các loại rau sống', 65000, '/images/com-tam.jpg', 'Món chính', TRUE, TRUE, 'Cơm, sườn, hành, dưa leo, cà chua, nước mắm', 'Calo: 550, Protein: 28g, Carbs: 75g, Chất béo: 15g', '15 phút', FALSE, FALSE, 'Không', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cơm Tấm Sườn' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Bánh Xèo', 'Bánh xèo giòn tan với nhân tôm thịt và đậu xanh', 70000, '/images/banh-xeo.jpg', 'Món chính', TRUE, TRUE, 'Bột gạo, tôm, thịt, giá đỗ, đậu xanh, hành lá', 'Calo: 480, Protein: 22g, Carbs: 55g, Chất béo: 20g', '20 phút', FALSE, FALSE, 'Tôm', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bánh Xèo' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Chả Giò', 'Chả giò giòn rụm với nhân thịt và nấm mèo', 45000, '/images/cha-gio.jpg', 'Khai vị', TRUE, TRUE, 'Bánh đa nem, thịt lợn, nấm mèo, hành, tiêu', 'Calo: 350, Protein: 15g, Carbs: 25g, Chất béo: 22g', '15 phút', FALSE, FALSE, 'Không', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chả Giò' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Bún Bò Huế', 'Bún bò Huế cay nồng với thịt bò và chả', 60000, '/images/bun-bo-hue.jpg', 'Món chính', TRUE, TRUE, 'Bún, thịt bò, chả, sả, ớt, rau thơm', 'Calo: 520, Protein: 30g, Carbs: 65g, Chất béo: 12g', '20 phút', TRUE, FALSE, 'Không', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bún Bò Huế' LIMIT 1);

INSERT INTO menu_items (name, description, price, image, category, isAvailable, isPopular, ingredients, nutritionInfo, preparationTime, isSpicy, isVegetarian, allergens, createdAt, updatedAt)
SELECT 'Canh Chua Cá Lóc', 'Canh chua cá lóc với rau đồng thơm ngon', 80000, '/images/canh-chua.jpg', 'Món chính', TRUE, FALSE, 'Cá lóc, đậu bắp, dứa, me, rau om, ngò gai', 'Calo: 320, Protein: 25g, Carbs: 15g, Chất béo: 8g', '25 phút', FALSE, FALSE, 'Cá', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Canh Chua Cá Lóc' LIMIT 1);

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

-- Create sample orders for reviews
INSERT INTO orders (tableId, status, totalAmount, paymentStatus, notes, createdAt, updatedAt)
SELECT 
  (SELECT id FROM tables WHERE name = 'Bàn 1' LIMIT 1),
  'completed',
  125000,
  'paid',
  'Đơn hàng mẫu 1',
  NOW() - INTERVAL 5 DAY,
  NOW() - INTERVAL 5 DAY
WHERE EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 1')
AND NOT EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 1' LIMIT 1);

INSERT INTO orders (tableId, status, totalAmount, paymentStatus, notes, createdAt, updatedAt)
SELECT 
  (SELECT id FROM tables WHERE name = 'Bàn 2' LIMIT 1),
  'completed',
  85000,
  'paid',
  'Đơn hàng mẫu 2',
  NOW() - INTERVAL 3 DAY,
  NOW() - INTERVAL 3 DAY
WHERE EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 2')
AND NOT EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 2' LIMIT 1);

INSERT INTO orders (tableId, status, totalAmount, paymentStatus, notes, createdAt, updatedAt)
SELECT 
  (SELECT id FROM tables WHERE name = 'Bàn 3' LIMIT 1),
  'completed',
  175000,
  'paid',
  'Đơn hàng mẫu 3',
  NOW() - INTERVAL 2 DAY,
  NOW() - INTERVAL 2 DAY
WHERE EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 3')
AND NOT EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 3' LIMIT 1);

INSERT INTO orders (tableId, status, totalAmount, paymentStatus, notes, createdAt, updatedAt)
SELECT 
  (SELECT id FROM tables WHERE name = 'Bàn 4' LIMIT 1),
  'completed',
  220000,
  'paid',
  'Đơn hàng mẫu 4',
  NOW() - INTERVAL 1 DAY,
  NOW() - INTERVAL 1 DAY
WHERE EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 4')
AND NOT EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 4' LIMIT 1);

-- Insert sample reviews with required tableId and orderId
INSERT INTO reviews (rating, comment, tableId, menuItemId, orderId, reviewDate, userName, isVisible, createdAt, updatedAt)
SELECT 
  5, 
  'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!', 
  (SELECT id FROM tables WHERE name = 'Bàn 1' LIMIT 1),
  (SELECT id FROM menu_items WHERE name = 'Phở Bò' LIMIT 1), 
  (SELECT id FROM orders WHERE notes = 'Đơn hàng mẫu 1' LIMIT 1),
  NOW() - INTERVAL 4 DAY, 
  'Khách hàng', 
  TRUE, 
  NOW(), 
  NOW()
WHERE 
  EXISTS (SELECT 1 FROM menu_items WHERE name = 'Phở Bò') AND
  EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 1') AND
  EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 1') AND
  NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!' LIMIT 1);

INSERT INTO reviews (rating, comment, tableId, menuItemId, orderId, reviewDate, userName, isVisible, createdAt, updatedAt)
SELECT 
  4, 
  'Bún chả thơm ngon, thịt nướng đậm đà', 
  (SELECT id FROM tables WHERE name = 'Bàn 2' LIMIT 1),
  (SELECT id FROM menu_items WHERE name = 'Bún Chả' LIMIT 1), 
  (SELECT id FROM orders WHERE notes = 'Đơn hàng mẫu 2' LIMIT 1),
  NOW() - INTERVAL 2 DAY, 
  'Khách hàng', 
  TRUE, 
  NOW(), 
  NOW()
WHERE 
  EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bún Chả') AND
  EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 2') AND
  EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 2') AND
  NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bún chả thơm ngon, thịt nướng đậm đà' LIMIT 1);

INSERT INTO reviews (rating, comment, tableId, menuItemId, orderId, reviewDate, userName, isVisible, createdAt, updatedAt)
SELECT 
  5, 
  'Bánh xèo giòn tan, nhân đầy đặn, rất ngon', 
  (SELECT id FROM tables WHERE name = 'Bàn 3' LIMIT 1),
  (SELECT id FROM menu_items WHERE name = 'Bánh Xèo' LIMIT 1), 
  (SELECT id FROM orders WHERE notes = 'Đơn hàng mẫu 3' LIMIT 1),
  NOW() - INTERVAL 1 DAY, 
  'Khách hàng', 
  TRUE, 
  NOW(), 
  NOW()
WHERE 
  EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bánh Xèo') AND
  EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 3') AND
  EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 3') AND
  NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bánh xèo giòn tan, nhân đầy đặn, rất ngon' LIMIT 1);

INSERT INTO reviews (rating, comment, tableId, menuItemId, orderId, reviewDate, userName, isVisible, createdAt, updatedAt)
SELECT 
  4, 
  'Bún bò Huế cay đủ mức, thịt bò mềm, rất đúng vị', 
  (SELECT id FROM tables WHERE name = 'Bàn 4' LIMIT 1),
  (SELECT id FROM menu_items WHERE name = 'Bún Bò Huế' LIMIT 1), 
  (SELECT id FROM orders WHERE notes = 'Đơn hàng mẫu 4' LIMIT 1),
  NOW() - INTERVAL 1 DAY, 
  'Khách hàng', 
  TRUE, 
  NOW(), 
  NOW()
WHERE 
  EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bún Bò Huế') AND
  EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 4') AND
  EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 4') AND
  NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bún bò Huế cay đủ mức, thịt bò mềm, rất đúng vị' LIMIT 1);

INSERT INTO reviews (rating, comment, tableId, menuItemId, orderId, reviewDate, userName, isVisible, createdAt, updatedAt)
SELECT 
  5, 
  'Cà phê sữa đá rất ngon, đậm đà và thơm!', 
  (SELECT id FROM tables WHERE name = 'Bàn 1' LIMIT 1),
  (SELECT id FROM menu_items WHERE name = 'Cà Phê Sữa Đá' LIMIT 1), 
  (SELECT id FROM orders WHERE notes = 'Đơn hàng mẫu 1' LIMIT 1),
  NOW() - INTERVAL 3 DAY, 
  'Khách hàng', 
  TRUE, 
  NOW(), 
  NOW()
WHERE 
  EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cà Phê Sữa Đá') AND
  EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 1') AND
  EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 1') AND
  NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Cà phê sữa đá rất ngon, đậm đà và thơm!' LIMIT 1);

INSERT INTO reviews (rating, comment, tableId, menuItemId, orderId, reviewDate, userName, isVisible, createdAt, updatedAt)
SELECT 
  4, 
  'Chả giò giòn rụm, nhân thịt thơm ngon', 
  (SELECT id FROM tables WHERE name = 'Bàn 3' LIMIT 1),
  (SELECT id FROM menu_items WHERE name = 'Chả Giò' LIMIT 1), 
  (SELECT id FROM orders WHERE notes = 'Đơn hàng mẫu 3' LIMIT 1),
  NOW() - INTERVAL 2 DAY, 
  'Khách hàng', 
  TRUE, 
  NOW(), 
  NOW()
WHERE 
  EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chả Giò') AND
  EXISTS (SELECT 1 FROM tables WHERE name = 'Bàn 3') AND
  EXISTS (SELECT 1 FROM orders WHERE notes = 'Đơn hàng mẫu 3') AND
  NOT EXISTS (SELECT 1 FROM reviews WHERE comment = 'Chả giò giòn rụm, nhân thịt thơm ngon' LIMIT 1);

-- Update avg ratings for menu items
UPDATE menu_items 
SET 
  avgRating = 5.0,
  ratingCount = 1
WHERE name = 'Phở Bò' AND EXISTS (SELECT 1 FROM reviews WHERE comment = 'Phở rất ngon, nước dùng đậm đà và thịt bò tươi!');

UPDATE menu_items 
SET 
  avgRating = 4.0,
  ratingCount = 1
WHERE name = 'Bún Chả' AND EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bún chả thơm ngon, thịt nướng đậm đà');

UPDATE menu_items 
SET 
  avgRating = 5.0,
  ratingCount = 1
WHERE name = 'Bánh Xèo' AND EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bánh xèo giòn tan, nhân đầy đặn, rất ngon');

UPDATE menu_items 
SET 
  avgRating = 4.0,
  ratingCount = 1
WHERE name = 'Bún Bò Huế' AND EXISTS (SELECT 1 FROM reviews WHERE comment = 'Bún bò Huế cay đủ mức, thịt bò mềm, rất đúng vị');

UPDATE menu_items 
SET 
  avgRating = 5.0,
  ratingCount = 1
WHERE name = 'Cà Phê Sữa Đá' AND EXISTS (SELECT 1 FROM reviews WHERE comment = 'Cà phê sữa đá rất ngon, đậm đà và thơm!');

UPDATE menu_items 
SET 
  avgRating = 4.0,
  ratingCount = 1
WHERE name = 'Chả Giò' AND EXISTS (SELECT 1 FROM reviews WHERE comment = 'Chả giò giòn rụm, nhân thịt thơm ngon'); 