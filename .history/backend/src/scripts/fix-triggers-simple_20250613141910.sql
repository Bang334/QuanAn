-- Script để sửa các trigger gây lỗi khi tạo đơn hàng mới
-- Tạo ngày: 2025-06-13

-- 1. Xóa trigger before_order_item_insert_update hiện tại
DROP TRIGGER IF EXISTS before_order_item_insert_update;

-- Tạo lại trigger before_order_item_insert_update với điều kiện phù hợp hơn
CREATE TRIGGER before_order_item_insert_update
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
    -- Kiểm tra số lượng phải dương
    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lượng món ăn phải lớn hơn 0';
    END IF;
    
    -- Kiểm tra giá phải dương
    IF NEW.price <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Giá món ăn phải lớn hơn 0';
    END IF;
    
    -- Kiểm tra món ăn có tồn tại và sẵn sàng
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE id = NEW.menuItemId AND isAvailable = 1) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Món ăn không tồn tại hoặc không sẵn sàng để đặt';
    END IF;
END;

-- 2. Xóa trigger before_order_item_status_update hiện tại
DROP TRIGGER IF EXISTS before_order_item_status_update;

-- Tạo lại trigger before_order_item_status_update với điều kiện phù hợp hơn
CREATE TRIGGER before_order_item_status_update
BEFORE UPDATE ON order_items
FOR EACH ROW
BEGIN
    -- Kiểm tra luồng trạng thái món ăn hợp lệ
    IF OLD.status = 'pending' AND NEW.status NOT IN ('cooking', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Món ăn chỉ có thể chuyển từ trạng thái pending sang cooking hoặc cancelled';
    ELSEIF OLD.status = 'cooking' AND NEW.status NOT IN ('ready', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Món ăn chỉ có thể chuyển từ trạng thái cooking sang ready hoặc cancelled';
    ELSEIF OLD.status = 'ready' AND NEW.status NOT IN ('served', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Món ăn chỉ có thể chuyển từ trạng thái ready sang served hoặc cancelled';
    ELSEIF OLD.status = 'served' AND NEW.status != 'served' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Món ăn đã phục vụ không thể thay đổi trạng thái';
    ELSEIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Món ăn đã hủy không thể thay đổi trạng thái';
    END IF;
END;

-- 3. Xóa trigger before_order_status_update hiện tại
DROP TRIGGER IF EXISTS before_order_status_update;

-- Tạo lại trigger before_order_status_update với điều kiện phù hợp hơn
CREATE TRIGGER before_order_status_update
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    -- Kiểm tra luồng trạng thái đơn hàng hợp lệ
    IF OLD.status = 'pending' AND NEW.status NOT IN ('preparing', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng chỉ có thể chuyển từ trạng thái pending sang preparing hoặc cancelled';
    ELSEIF OLD.status = 'preparing' AND NEW.status NOT IN ('ready', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng chỉ có thể chuyển từ trạng thái preparing sang ready hoặc cancelled';
    ELSEIF OLD.status = 'ready' AND NEW.status NOT IN ('served', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng chỉ có thể chuyển từ trạng thái ready sang served hoặc cancelled';
    ELSEIF OLD.status = 'served' AND NEW.status NOT IN ('payment_requested', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng chỉ có thể chuyển từ trạng thái served sang payment_requested hoặc cancelled';
    ELSEIF OLD.status = 'payment_requested' AND NEW.status NOT IN ('completed', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng chỉ có thể chuyển từ trạng thái payment_requested sang completed hoặc cancelled';
    ELSEIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng đã hoàn thành không thể thay đổi trạng thái';
    ELSEIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng đã hủy không thể thay đổi trạng thái';
    END IF;
END; 