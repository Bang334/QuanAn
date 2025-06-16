-- Trigger: Không cho phép chấm công ngày tương lai
DELIMITER $$
CREATE TRIGGER trg_attendance_date_check
BEFORE INSERT ON attendances
FOR EACH ROW
BEGIN
  IF NEW.date > CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không thể chấm công cho ngày trong tương lai!';
  END IF;
END$$
DELIMITER ;

-- Trigger: Không cho phép đăng ký lịch làm việc cho ngày đã qua hoặc trùng ca
DELIMITER $$
CREATE TRIGGER trg_schedule_date_and_duplicate_check
BEFORE INSERT ON schedules
FOR EACH ROW
BEGIN
  IF NEW.date < CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không thể đăng ký lịch làm việc cho ngày đã qua!';
  END IF;
  IF (SELECT COUNT(*) FROM schedules WHERE userId = NEW.userId AND date = NEW.date AND shift = NEW.shift) > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Đã đăng ký ca này cho ngày này!';
  END IF;
END$$
DELIMITER ;

-- Trigger: Không cho phép số lượng hoặc giá <= 0 ở order_items
DELIMITER $$
CREATE TRIGGER trg_order_item_quantity_price_check
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
  IF NEW.quantity <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số lượng món phải lớn hơn 0!';
  END IF;
  IF NEW.price < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Giá món không hợp lệ!';
  END IF;
END$$
DELIMITER ;

-- Trigger: Không cho phép thanh toán số tiền âm hoặc cho đơn đã huỷ
DELIMITER $$
CREATE TRIGGER trg_payment_amount_status_check
BEFORE INSERT ON payments
FOR EACH ROW
BEGIN
  IF NEW.amount < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số tiền thanh toán không hợp lệ!';
  END IF;
  IF (SELECT status FROM orders WHERE id = NEW.orderId) = 'cancelled' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không thể thanh toán cho đơn đã huỷ!';
  END IF;
END$$
DELIMITER ;

-- Trigger: Không cho phép tồn kho âm khi xuất kho
DELIMITER $$
CREATE TRIGGER trg_inventory_transaction_negative_stock
BEFORE INSERT ON inventory_transactions
FOR EACH ROW
BEGIN
  IF NEW.type = 'usage' THEN
    DECLARE currentStock DECIMAL(10,2);
    SELECT quantity INTO currentStock FROM ingredients WHERE id = NEW.ingredientId;
    IF currentStock - NEW.quantity < 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không đủ tồn kho để xuất!';
    END IF;
  END IF;
END$$
DELIMITER ;

-- Trigger: Không cho phép 1 nhân viên có quá 2 ca/ngày và không trùng ca trong ngày
DELIMITER $$
CREATE TRIGGER trg_schedule_max_2_shifts_per_day
BEFORE INSERT ON schedules
FOR EACH ROW
BEGIN
  -- Đếm số ca đã đăng ký trong ngày
  IF (SELECT COUNT(*) FROM schedules WHERE userId = NEW.userId AND date = NEW.date) >= 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không thể đăng ký quá 2 ca làm việc trong 1 ngày!';
  END IF;
  -- Kiểm tra trùng ca
  IF (SELECT COUNT(*) FROM schedules WHERE userId = NEW.userId AND date = NEW.date AND shift = NEW.shift) > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Đã đăng ký ca này cho ngày này!';
  END IF;
END$$
DELIMITER ; 