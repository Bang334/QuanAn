-- =============================================
-- STORED PROCEDURES CHO QUẢN LÝ KHO VÀ NGUYÊN LIỆU
-- =============================================

DELIMITER //

-- Procedure lấy thống kê tổng quan về kho
CREATE PROCEDURE IF NOT EXISTS sp_GetInventorySummary()
BEGIN
    -- Tổng số lượng nguyên liệu
    SELECT COUNT(*) as totalIngredients FROM ingredients;
    
    -- Số lượng nguyên liệu sắp hết (dưới mức cảnh báo)
    SELECT COUNT(*) as lowStockCount FROM ingredients WHERE currentStock < minStockLevel;
    
    -- Danh sách chi tiết các nguyên liệu sắp hết
    SELECT 
        id, 
        name, 
        currentStock as currentQuantity, 
        minStockLevel as alertThreshold, 
        unit, 
        costPerUnit as unitPrice
    FROM ingredients
    WHERE currentStock < minStockLevel
    ORDER BY (minStockLevel - currentStock) DESC;
    
    -- Tổng giá trị kho
    SELECT SUM(currentStock * costPerUnit) as inventoryValue FROM ingredients;
    
    -- Số đơn đặt hàng đang chờ xử lý
    SELECT COUNT(*) as pendingOrders FROM purchase_orders WHERE status = 'pending';
    
    -- Tổng số giao dịch kho trong 30 ngày qua
    SELECT COUNT(*) as recentTransactions 
    FROM inventory_transactions 
    WHERE createdAt >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);
END //

-- Procedure lấy thống kê sử dụng nguyên liệu theo thời gian
CREATE PROCEDURE IF NOT EXISTS sp_GetIngredientUsageStats(
    IN p_startDate DATE,
    IN p_endDate DATE,
    IN p_ingredientId INT
)
BEGIN
    DECLARE whereClause VARCHAR(500);
    
    SET whereClause = 'type = "out"';
    
    IF p_startDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND createdAt >= "', p_startDate, '"');
    END IF;
    
    IF p_endDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND createdAt <= "', p_endDate, '"');
    END IF;
    
    IF p_ingredientId IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND ingredientId = ', p_ingredientId);
    END IF;
    
    -- Lấy dữ liệu sử dụng nguyên liệu theo ngày
    SET @sql = CONCAT('
        SELECT DATE(createdAt) as date, SUM(quantity) as totalUsage 
        FROM inventory_transactions 
        WHERE ', whereClause, '
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt) ASC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Lấy top 5 nguyên liệu được sử dụng nhiều nhất
    SET @sql2 = CONCAT('
        SELECT 
            it.ingredientId, 
            SUM(it.quantity) as totalUsage, 
            i.name, 
            i.unit
        FROM inventory_transactions it
        JOIN ingredients i ON it.ingredientId = i.id
        WHERE it.type = "out"
        ', IF(p_startDate IS NOT NULL, CONCAT(' AND it.createdAt >= "', p_startDate, '"'), ''),
        IF(p_endDate IS NOT NULL, CONCAT(' AND it.createdAt <= "', p_endDate, '"'), ''), '
        GROUP BY it.ingredientId, i.name, i.unit
        ORDER BY SUM(it.quantity) DESC
        LIMIT 5
    ');
    
    PREPARE stmt FROM @sql2;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

-- Procedure lấy thống kê chi phí mua nguyên liệu
CREATE PROCEDURE IF NOT EXISTS sp_GetPurchaseCostStats(
    IN p_startDate DATE,
    IN p_endDate DATE,
    IN p_supplierId INT
)
BEGIN
    DECLARE whereClause VARCHAR(500);
    
    SET whereClause = 'po.status = "delivered"';
    
    IF p_startDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND po.createdAt >= "', p_startDate, '"');
    END IF;
    
    IF p_endDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND po.createdAt <= "', p_endDate, '"');
    END IF;
    
    IF p_supplierId IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND po.supplierId = ', p_supplierId);
    END IF;
    
    -- Lấy chi phí mua nguyên liệu theo tháng
    SET @sql = CONCAT('
        SELECT 
            DATE_FORMAT(po.createdAt, "%Y-%m-01") as month,
            SUM(po.totalAmount) as totalCost
        FROM purchase_orders po
        WHERE ', whereClause, '
        GROUP BY DATE_FORMAT(po.createdAt, "%Y-%m-01")
        ORDER BY DATE_FORMAT(po.createdAt, "%Y-%m-01") ASC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Lấy chi phí theo nhà cung cấp
    SET @sql2 = CONCAT('
        SELECT 
            po.supplierId,
            SUM(po.totalAmount) as totalCost,
            s.name
        FROM purchase_orders po
        JOIN suppliers s ON po.supplierId = s.id
        WHERE ', whereClause, '
        GROUP BY po.supplierId, s.name
        ORDER BY SUM(po.totalAmount) DESC
    ');
    
    PREPARE stmt FROM @sql2;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

-- Procedure lấy báo cáo hiệu quả nhà cung cấp
CREATE PROCEDURE IF NOT EXISTS sp_GetSupplierPerformance(
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE whereClause VARCHAR(500);
    
    SET whereClause = 'po.status = "delivered" AND po.actualDeliveryDate IS NOT NULL';
    
    IF p_startDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND po.createdAt >= "', p_startDate, '"');
    END IF;
    
    IF p_endDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND po.createdAt <= "', p_endDate, '"');
    END IF;
    
    -- Lấy thông tin hiệu suất nhà cung cấp
    SET @sql = CONCAT('
        SELECT 
            po.supplierId,
            COUNT(po.id) as orderCount,
            AVG(DATEDIFF(po.actualDeliveryDate, po.orderDate)) as avgDeliveryDays,
            SUM(po.totalAmount) as totalSpent,
            s.name,
            s.phone,
            s.email
        FROM purchase_orders po
        JOIN suppliers s ON po.supplierId = s.id
        WHERE ', whereClause, '
        GROUP BY po.supplierId, s.id, s.name, s.phone, s.email
        ORDER BY SUM(po.totalAmount) DESC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

-- =============================================
-- STORED PROCEDURES CHO THANH TOÁN VÀ DOANH THU
-- =============================================

-- Procedure lấy thống kê doanh thu
CREATE PROCEDURE IF NOT EXISTS sp_GetRevenueStats(
    IN p_period VARCHAR(10),
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE dateFormat VARCHAR(20);
    DECLARE groupBy VARCHAR(10);
    DECLARE whereClause VARCHAR(500);
    
    SET whereClause = 'status = "completed"';
    
    IF p_period = 'daily' THEN
        SET dateFormat = '%Y-%m-%d';
        SET groupBy = 'day';
    ELSEIF p_period = 'monthly' THEN
        SET dateFormat = '%Y-%m';
        SET groupBy = 'month';
    ELSEIF p_period = 'yearly' THEN
        SET dateFormat = '%Y';
        SET groupBy = 'year';
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Định dạng thời gian không hợp lệ. Sử dụng daily, monthly hoặc yearly';
    END IF;
    
    IF p_startDate IS NOT NULL AND p_endDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND paymentDate BETWEEN "', p_startDate, '" AND "', p_endDate, '"');
    ELSEIF p_startDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND paymentDate >= "', p_startDate, '"');
    ELSEIF p_endDate IS NOT NULL THEN
        SET whereClause = CONCAT(whereClause, ' AND paymentDate <= "', p_endDate, '"');
    END IF;
    
    -- Lấy thống kê doanh thu
    SET @sql = CONCAT('
        SELECT 
            DATE_FORMAT(paymentDate, "', dateFormat, '") as ', groupBy, ',
            SUM(amount) as totalRevenue,
            COUNT(id) as numberOfPayments,
            AVG(amount) as averagePayment,
            SUM(CASE WHEN paymentMethod = "cash" THEN amount ELSE 0 END) as cashRevenue,
            SUM(CASE WHEN paymentMethod = "card" THEN amount ELSE 0 END) as cardRevenue,
            SUM(CASE WHEN paymentMethod IN ("momo", "zalopay", "vnpay") THEN amount ELSE 0 END) as eWalletRevenue
        FROM payments
        WHERE ', whereClause, '
        GROUP BY ', groupBy, '
        ORDER BY ', groupBy, ' DESC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

-- Procedure lấy thống kê doanh thu theo danh mục
CREATE PROCEDURE IF NOT EXISTS sp_GetCategoryRevenue(
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE dateFilter VARCHAR(200);
    
    SET dateFilter = '';
    
    IF p_startDate IS NOT NULL AND p_endDate IS NOT NULL THEN
        SET dateFilter = CONCAT(' AND p.paymentDate BETWEEN "', p_startDate, '" AND "', p_endDate, '"');
    ELSEIF p_startDate IS NOT NULL THEN
        SET dateFilter = CONCAT(' AND p.paymentDate >= "', p_startDate, '"');
    ELSEIF p_endDate IS NOT NULL THEN
        SET dateFilter = CONCAT(' AND p.paymentDate <= "', p_endDate, '"');
    END IF;
    
    -- Lấy thống kê doanh thu theo danh mục
    SET @sql = CONCAT('
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
            o.status = "completed"
            ', dateFilter, '
        GROUP BY 
            mi.category
        ORDER BY 
            totalRevenue DESC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

-- Procedure lấy top món bán chạy
CREATE PROCEDURE IF NOT EXISTS sp_GetTopSellingItems(
    IN p_limit INT,
    IN p_startDate DATE,
    IN p_endDate DATE
)
BEGIN
    DECLARE dateFilter VARCHAR(200);
    
    SET dateFilter = '';
    
    IF p_startDate IS NOT NULL AND p_endDate IS NOT NULL THEN
        SET dateFilter = CONCAT(' AND p.paymentDate BETWEEN "', p_startDate, '" AND "', p_endDate, '"');
    ELSEIF p_startDate IS NOT NULL THEN
        SET dateFilter = CONCAT(' AND p.paymentDate >= "', p_startDate, '"');
    ELSEIF p_endDate IS NOT NULL THEN
        SET dateFilter = CONCAT(' AND p.paymentDate <= "', p_endDate, '"');
    END IF;
    
    -- Lấy top món bán chạy
    SET @sql = CONCAT('
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
            orders o ON oi.orderId = o.id AND o.status = "completed"
        LEFT JOIN 
            payments p ON o.id = p.orderId
        LEFT JOIN 
            reviews r ON mi.id = r.menuItemId
        WHERE 
            o.id IS NOT NULL
            ', dateFilter, '
        GROUP BY 
            mi.id, mi.name, mi.category
        ORDER BY 
            totalQuantitySold DESC
        LIMIT ', IFNULL(p_limit, 10)
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

-- Procedure xử lý sử dụng nguyên liệu khi hoàn thành món ăn
CREATE PROCEDURE IF NOT EXISTS sp_ProcessIngredientUsage(
    IN p_orderId INT,
    IN p_orderItemId INT,
    IN p_menuItemId INT,
    IN p_quantity DECIMAL(10,2),
    IN p_userId INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_ingredientId INT;
    DECLARE v_recipeQuantity DECIMAL(10,2);
    DECLARE v_usedQuantity DECIMAL(10,2);
    DECLARE v_currentStock DECIMAL(10,2);
    DECLARE v_minStockLevel DECIMAL(10,2);
    DECLARE v_recipeId INT;
    
    -- Cursor để lấy danh sách nguyên liệu từ công thức
    DECLARE recipe_cursor CURSOR FOR
        SELECT ri.id, ri.ingredientId, ri.quantity, i.currentStock, i.minStockLevel
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredientId = i.id
        WHERE ri.menuItemId = p_menuItemId;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Bắt đầu transaction
    START TRANSACTION;
    
    -- Mở cursor và xử lý từng nguyên liệu
    OPEN recipe_cursor;
    
    recipe_loop: LOOP
        FETCH recipe_cursor INTO v_recipeId, v_ingredientId, v_recipeQuantity, v_currentStock, v_minStockLevel;
        
        IF done THEN
            LEAVE recipe_loop;
        END IF;
        
        -- Tính lượng nguyên liệu sử dụng
        SET v_usedQuantity = v_recipeQuantity * p_quantity;
        
        -- Tạo bản ghi sử dụng nguyên liệu
        INSERT INTO ingredient_usage (
            orderItemId,
            ingredientId,
            quantity,
            usageDate,
            orderId,
            menuItemId,
            recipeIngredientId
        ) VALUES (
            p_orderItemId,
            v_ingredientId,
            v_usedQuantity,
            NOW(),
            p_orderId,
            p_menuItemId,
            v_recipeId
        );
        
        -- Cập nhật tồn kho nguyên liệu
        UPDATE ingredients
        SET currentStock = currentStock - v_usedQuantity
        WHERE id = v_ingredientId;
        
        -- Tạo giao dịch kho
        INSERT INTO inventory_transactions (
            ingredientId,
            type,
            quantity,
            reason,
            userId,
            orderId,
            createdAt,
            updatedAt
        ) VALUES (
            v_ingredientId,
            'out',
            v_usedQuantity,
            CONCAT('Used for order #', p_orderId),
            p_userId,
            p_orderId,
            NOW(),
            NOW()
        );
        
        -- Kiểm tra nguyên liệu sắp hết
        IF (v_currentStock - v_usedQuantity < v_minStockLevel) THEN
            -- Ghi log cảnh báo (có thể mở rộng để gửi thông báo)
            INSERT INTO system_logs (
                type,
                message,
                createdAt
            ) VALUES (
                'low_stock_alert',
                CONCAT('Ingredient #', v_ingredientId, ' is below minimum stock level'),
                NOW()
            );
        END IF;
    END LOOP;
    
    CLOSE recipe_cursor;
    
    -- Commit transaction
    COMMIT;
    
    -- Trả về kết quả thành công
    SELECT 'Success' as status;
END //

DELIMITER ; 