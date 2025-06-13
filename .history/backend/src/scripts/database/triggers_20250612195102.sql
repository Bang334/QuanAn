-- =============================================
-- TRIGGERS CHO QUẢN LÝ KHO VÀ NGUYÊN LIỆU
-- =============================================

DELIMITER //

-- Trigger kiểm tra số lượng nguyên liệu không âm trước khi cập nhật
CREATE TRIGGER IF NOT EXISTS before_ingredient_update
BEFORE UPDATE ON ingredients
FOR EACH ROW
BEGIN
    -- Kiểm tra số lượng không được âm
    IF NEW.currentStock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lượng nguyên liệu không thể âm';
    END IF;
    
    -- Nếu giá thay đổi, lưu lịch sử giá
    IF OLD.costPerUnit != NEW.costPerUnit THEN
        INSERT INTO ingredient_price_history (
            ingredientId,
            oldPrice,
            newPrice,
            changeDate,
            createdAt,
            updatedAt
        ) VALUES (
            NEW.id,
            OLD.costPerUnit,
            NEW.costPerUnit,
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
END //

-- Trigger kiểm tra số lượng nguyên liệu đủ trước khi sử dụng
CREATE TRIGGER IF NOT EXISTS before_ingredient_usage_insert
BEFORE INSERT ON ingredient_usage
FOR EACH ROW
BEGIN
    DECLARE current_stock DECIMAL(10, 2);
    
    -- Lấy số lượng hiện tại của nguyên liệu
    SELECT currentStock INTO current_stock
    FROM ingredients
    WHERE id = NEW.ingredientId;
    
    -- Kiểm tra số lượng đủ để sử dụng
    IF current_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lượng nguyên liệu không đủ để sử dụng';
    END IF;
END //

-- Trigger cập nhật tổng giá trị đơn hàng khi thêm món
CREATE TRIGGER IF NOT EXISTS after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    -- Cập nhật tổng giá trị đơn hàng
    UPDATE orders
    SET totalAmount = (
        SELECT SUM(quantity * price)
        FROM order_items
        WHERE orderId = NEW.orderId
    )
    WHERE id = NEW.orderId;
END //

-- Trigger cập nhật tổng giá trị đơn hàng khi sửa món
CREATE TRIGGER IF NOT EXISTS after_order_item_update
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
    -- Cập nhật tổng giá trị đơn hàng
    UPDATE orders
    SET totalAmount = (
        SELECT SUM(quantity * price)
        FROM order_items
        WHERE orderId = NEW.orderId
    )
    WHERE id = NEW.orderId;
END //

-- Trigger cập nhật tổng giá trị đơn hàng khi xóa món
CREATE TRIGGER IF NOT EXISTS after_order_item_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    -- Cập nhật tổng giá trị đơn hàng
    UPDATE orders
    SET totalAmount = (
        SELECT COALESCE(SUM(quantity * price), 0)
        FROM order_items
        WHERE orderId = OLD.orderId
    )
    WHERE id = OLD.orderId;
END //

-- Trigger kiểm tra và cập nhật trạng thái đơn hàng khi tất cả món đã sẵn sàng
CREATE TRIGGER IF NOT EXISTS after_order_item_status_update
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
    DECLARE all_ready BOOLEAN;
    DECLARE order_status VARCHAR(20);
    
    -- Kiểm tra nếu trạng thái món thay đổi thành sẵn sàng
    IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
        -- Kiểm tra xem tất cả các món trong đơn hàng đã sẵn sàng chưa
        SELECT 
            COUNT(*) = SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END),
            o.status
        INTO all_ready, order_status
        FROM order_items oi
        JOIN orders o ON o.id = oi.orderId
        WHERE oi.orderId = NEW.orderId;
        
        -- Nếu tất cả các món đã sẵn sàng và đơn hàng đang ở trạng thái xử lý, cập nhật thành sẵn sàng
        IF all_ready AND order_status = 'processing' THEN
            UPDATE orders
            SET status = 'ready'
            WHERE id = NEW.orderId;
        END IF;
    END IF;
END //

-- Trigger kiểm tra tính hợp lệ của đơn đặt hàng nguyên liệu
CREATE TRIGGER IF NOT EXISTS before_purchase_order_item_insert
BEFORE INSERT ON purchase_order_items
FOR EACH ROW
BEGIN
    -- Kiểm tra số lượng phải dương
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lượng đặt hàng phải lớn hơn 0';
    END IF;
    
    -- Kiểm tra đơn giá phải dương
    IF NEW.unitPrice <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn giá phải lớn hơn 0';
    END IF;
    
    -- Tính tổng giá
    SET NEW.totalPrice = NEW.quantity * NEW.unitPrice;
END //

-- Trigger cập nhật tổng giá trị đơn đặt hàng khi thêm mặt hàng
CREATE TRIGGER IF NOT EXISTS after_purchase_order_item_insert
AFTER INSERT ON purchase_order_items
FOR EACH ROW
BEGIN
    -- Cập nhật tổng giá trị đơn đặt hàng
    UPDATE purchase_orders
    SET totalAmount = (
        SELECT SUM(totalPrice)
        FROM purchase_order_items
        WHERE purchaseOrderId = NEW.purchaseOrderId
    )
    WHERE id = NEW.purchaseOrderId;
END //

-- Trigger cập nhật tổng giá trị đơn đặt hàng khi sửa mặt hàng
CREATE TRIGGER IF NOT EXISTS after_purchase_order_item_update
AFTER UPDATE ON purchase_order_items
FOR EACH ROW
BEGIN
    -- Cập nhật tổng giá trị đơn đặt hàng
    UPDATE purchase_orders
    SET totalAmount = (
        SELECT SUM(totalPrice)
        FROM purchase_order_items
        WHERE purchaseOrderId = NEW.purchaseOrderId
    )
    WHERE id = NEW.purchaseOrderId;
    
    -- Kiểm tra nếu số lượng nhận thay đổi
    IF NEW.receivedQuantity > OLD.receivedQuantity THEN
        DECLARE v_userId INT;
        
        -- Lấy userId của người thực hiện
        SELECT requesterId INTO v_userId
        FROM purchase_orders
        WHERE id = NEW.purchaseOrderId;
        
        -- Cập nhật số lượng trong kho
        UPDATE ingredients
        SET currentStock = currentStock + (NEW.receivedQuantity - OLD.receivedQuantity)
        WHERE id = NEW.ingredientId;
        
        -- Tạo giao dịch kho
        INSERT INTO inventory_transactions (
            ingredientId,
            type,
            quantity,
            reason,
            userId,
            purchaseOrderId,
            createdAt,
            updatedAt
        ) VALUES (
            NEW.ingredientId,
            'in',
            NEW.receivedQuantity - OLD.receivedQuantity,
            CONCAT('Received from purchase order #', NEW.purchaseOrderId),
            v_userId,
            NEW.purchaseOrderId,
            NOW(),
            NOW()
        );
        
        -- Cập nhật trạng thái mặt hàng trong một trigger BEFORE riêng biệt
    END IF;
END //

-- Trigger cập nhật trạng thái mặt hàng khi nhận hàng
CREATE TRIGGER IF NOT EXISTS before_purchase_order_item_receive
BEFORE UPDATE ON purchase_order_items
FOR EACH ROW
BEGIN
    -- Kiểm tra nếu số lượng nhận thay đổi
    IF NEW.receivedQuantity > OLD.receivedQuantity THEN
        -- Cập nhật trạng thái mặt hàng
        IF NEW.receivedQuantity >= NEW.quantity THEN
            SET NEW.status = 'complete';
        ELSE
            SET NEW.status = 'partial';
        END IF;
    END IF;
END //

-- Trigger cập nhật tổng giá trị đơn đặt hàng khi xóa mặt hàng
CREATE TRIGGER IF NOT EXISTS after_purchase_order_item_delete
AFTER DELETE ON purchase_order_items
FOR EACH ROW
BEGIN
    -- Cập nhật tổng giá trị đơn đặt hàng
    UPDATE purchase_orders
    SET totalAmount = (
        SELECT COALESCE(SUM(totalPrice), 0)
        FROM purchase_order_items
        WHERE purchaseOrderId = OLD.purchaseOrderId
    )
    WHERE id = OLD.purchaseOrderId;
END //

DELIMITER ; 