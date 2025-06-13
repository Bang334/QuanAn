-- =============================================
-- TRIGGERS KIỂM TRA TÍNH HỢP LỆ CỦA DỮ LIỆU
-- =============================================

DELIMITER //

-- Trigger kiểm tra luồng trạng thái đơn hàng
CREATE TRIGGER IF NOT EXISTS before_order_status_update
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    -- Kiểm tra luồng trạng thái đơn hàng hợp lệ
    IF OLD.status = 'pending' AND NEW.status NOT IN ('processing', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng chỉ có thể chuyển từ trạng thái pending sang processing hoặc cancelled';
    ELSEIF OLD.status = 'processing' AND NEW.status NOT IN ('ready', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn hàng chỉ có thể chuyển từ trạng thái processing sang ready hoặc cancelled';
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
END //

-- Trigger kiểm tra luồng trạng thái đơn đặt hàng nguyên liệu
CREATE TRIGGER IF NOT EXISTS before_purchase_order_status_update
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
BEGIN
    -- Kiểm tra luồng trạng thái đơn đặt hàng hợp lệ
    IF OLD.status = 'draft' AND NEW.status NOT IN ('pending', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đặt hàng chỉ có thể chuyển từ trạng thái draft sang pending hoặc cancelled';
    ELSEIF OLD.status = 'pending' AND NEW.status NOT IN ('confirmed', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đặt hàng chỉ có thể chuyển từ trạng thái pending sang confirmed hoặc cancelled';
    ELSEIF OLD.status = 'confirmed' AND NEW.status NOT IN ('shipping', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đặt hàng chỉ có thể chuyển từ trạng thái confirmed sang shipping hoặc cancelled';
    ELSEIF OLD.status = 'shipping' AND NEW.status NOT IN ('delivered', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đặt hàng chỉ có thể chuyển từ trạng thái shipping sang delivered hoặc cancelled';
    ELSEIF OLD.status = 'delivered' AND NEW.status NOT IN ('completed', 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đặt hàng chỉ có thể chuyển từ trạng thái delivered sang completed hoặc cancelled';
    ELSEIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đặt hàng đã hoàn thành không thể thay đổi trạng thái';
    ELSEIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đơn đặt hàng đã hủy không thể thay đổi trạng thái';
    END IF;
END //

-- Trigger kiểm tra giá trị hợp lệ của món ăn
CREATE TRIGGER IF NOT EXISTS before_menu_item_insert_update
BEFORE INSERT ON menu_items
FOR EACH ROW
BEGIN
    -- Kiểm tra giá phải dương
    IF NEW.price <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Giá món ăn phải lớn hơn 0';
    END IF;
    
    -- Kiểm tra danh mục hợp lệ
    IF NEW.category NOT IN ('appetizer', 'main_course', 'dessert', 'beverage', 'side_dish', 'special', 'combo') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Danh mục món ăn không hợp lệ';
    END IF;
    
    -- Kiểm tra trạng thái hợp lệ
    IF NEW.status NOT IN ('available', 'out_of_stock', 'hidden', 'seasonal') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trạng thái món ăn không hợp lệ';
    END IF;
END //

-- Trigger kiểm tra giá trị hợp lệ của đánh giá
CREATE TRIGGER IF NOT EXISTS before_review_insert_update
BEFORE INSERT ON reviews
FOR EACH ROW
BEGIN
    -- Kiểm tra đánh giá trong khoảng 1-5
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Đánh giá phải từ 1 đến 5 sao';
    END IF;
    
    -- Kiểm tra đơn hàng đã hoàn thành
    IF NOT EXISTS (SELECT 1 FROM orders WHERE id = NEW.orderId AND status = 'completed') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chỉ có thể đánh giá món ăn từ đơn hàng đã hoàn thành';
    END IF;
    
    -- Kiểm tra món ăn có trong đơn hàng
    IF NOT EXISTS (SELECT 1 FROM order_items WHERE orderId = NEW.orderId AND menuItemId = NEW.menuItemId) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chỉ có thể đánh giá món ăn có trong đơn hàng';
    END IF;
END //

-- Trigger kiểm tra giá trị hợp lệ của thanh toán
CREATE TRIGGER IF NOT EXISTS before_payment_insert_update
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
    -- Kiểm tra số tiền thanh toán phải dương
    IF NEW.amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số tiền thanh toán phải lớn hơn 0';
    END IF;
    
    -- Kiểm tra phương thức thanh toán hợp lệ
    IF NEW.paymentMethod NOT IN ('cash', 'card', 'momo', 'zalopay', 'vnpay', 'bank_transfer') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phương thức thanh toán không hợp lệ';
    END IF;
    
    -- Kiểm tra đơn hàng đang ở trạng thái yêu cầu thanh toán
    IF NOT EXISTS (SELECT 1 FROM orders WHERE id = NEW.orderId AND status = 'payment_requested') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Chỉ có thể thanh toán đơn hàng đang ở trạng thái yêu cầu thanh toán';
    END IF;
END //

-- Trigger kiểm tra giá trị hợp lệ của bàn
CREATE TRIGGER IF NOT EXISTS before_table_insert_update
BEFORE INSERT ON tables
FOR EACH ROW
BEGIN
    -- Kiểm tra số chỗ ngồi phải dương
    IF NEW.capacity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số chỗ ngồi phải lớn hơn 0';
    END IF;
    
    -- Kiểm tra trạng thái hợp lệ
    IF NEW.status NOT IN ('available', 'occupied', 'reserved', 'maintenance') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trạng thái bàn không hợp lệ';
    END IF;
END //

-- Trigger cập nhật trạng thái bàn khi đơn hàng thay đổi
CREATE TRIGGER IF NOT EXISTS after_order_status_update_table
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    -- Nếu đơn hàng hoàn thành hoặc hủy, cập nhật bàn thành available
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') AND NEW.tableId IS NOT NULL THEN
        UPDATE tables
        SET status = 'available'
        WHERE id = NEW.tableId;
    -- Nếu đơn hàng chuyển sang processing, cập nhật bàn thành occupied
    ELSEIF NEW.status = 'processing' AND OLD.status != 'processing' AND NEW.tableId IS NOT NULL THEN
        UPDATE tables
        SET status = 'occupied'
        WHERE id = NEW.tableId;
    END IF;
END //

-- Trigger kiểm tra giá trị hợp lệ của đặt bàn
CREATE TRIGGER IF NOT EXISTS before_reservation_insert_update
BEFORE INSERT ON reservations
FOR EACH ROW
BEGIN
    -- Kiểm tra số người phải dương
    IF NEW.numberOfGuests <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số người phải lớn hơn 0';
    END IF;
    
    -- Kiểm tra thời gian đặt phải trong tương lai
    IF NEW.reservationTime <= NOW() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Thời gian đặt bàn phải trong tương lai';
    END IF;
    
    -- Kiểm tra trạng thái hợp lệ
    IF NEW.status NOT IN ('pending', 'confirmed', 'cancelled', 'completed') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Trạng thái đặt bàn không hợp lệ';
    END IF;
    
    -- Kiểm tra bàn có sẵn không (nếu đã chỉ định bàn)
    IF NEW.tableId IS NOT NULL AND EXISTS (
        SELECT 1 FROM reservations 
        WHERE tableId = NEW.tableId 
        AND id != NEW.id
        AND status IN ('pending', 'confirmed')
        AND DATE(reservationTime) = DATE(NEW.reservationTime)
        AND ABS(TIMESTAMPDIFF(MINUTE, reservationTime, NEW.reservationTime)) < 120
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bàn đã được đặt trong khoảng thời gian này';
    END IF;
END //

-- Trigger cập nhật trạng thái bàn khi đặt bàn thay đổi
CREATE TRIGGER IF NOT EXISTS after_reservation_status_update_table
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    -- Nếu đặt bàn được xác nhận, cập nhật bàn thành reserved
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.tableId IS NOT NULL THEN
        UPDATE tables
        SET status = 'reserved'
        WHERE id = NEW.tableId;
    -- Nếu đặt bàn bị hủy hoặc hoàn thành, cập nhật bàn thành available
    ELSEIF NEW.status IN ('cancelled', 'completed') AND OLD.status NOT IN ('cancelled', 'completed') AND NEW.tableId IS NOT NULL THEN
        UPDATE tables
        SET status = 'available'
        WHERE id = NEW.tableId;
    END IF;
END //

-- Trigger kiểm tra và tự động cập nhật trạng thái đơn hàng khi thanh toán
CREATE TRIGGER IF NOT EXISTS after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    -- Cập nhật đơn hàng sang trạng thái hoàn thành khi thanh toán thành công
    IF NEW.status = 'completed' THEN
        UPDATE orders
        SET status = 'completed'
        WHERE id = NEW.orderId;
    END IF;
END //

DELIMITER ; 