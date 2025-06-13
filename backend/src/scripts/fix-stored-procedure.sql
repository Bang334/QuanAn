-- Sửa lại stored procedure sp_ProcessIngredientUsage
DROP PROCEDURE IF EXISTS sp_ProcessIngredientUsage;

DELIMITER //
CREATE PROCEDURE sp_ProcessIngredientUsage(
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
            recipeIngredientId,
            createdAt,
            updatedAt
        ) VALUES (
            p_orderItemId,
            v_ingredientId,
            v_usedQuantity,
            NOW(),
            p_orderId,
            p_menuItemId,
            v_recipeId,
            NOW(),
            NOW()
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
        
        -- Kiểm tra nguyên liệu sắp hết nhưng không ghi log vào bảng system_logs
        IF (v_currentStock - v_usedQuantity < v_minStockLevel) THEN
            -- Chỉ in thông báo vào console, không ghi vào bảng system_logs
            SELECT CONCAT('Cảnh báo: Ingredient #', v_ingredientId, ' is below minimum stock level') AS warning;
        END IF;
    END LOOP;
    
    CLOSE recipe_cursor;
    
    -- Commit transaction
    COMMIT;
    
    -- Trả về kết quả thành công
    SELECT 'Success' as status;
END //
DELIMITER ; 