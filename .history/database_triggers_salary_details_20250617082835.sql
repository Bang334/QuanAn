-- Trigger để cập nhật bảng salaries khi xóa một bản ghi từ salary_details
DELIMITER //

-- Xóa trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS after_salary_detail_delete //

-- Tạo trigger mới
CREATE TRIGGER after_salary_detail_delete
AFTER DELETE ON salary_details
FOR EACH ROW
BEGIN
    DECLARE detail_amount DECIMAL(10, 2);
    DECLARE detail_hours DECIMAL(10, 2);
    
    -- Lấy số giờ làm việc từ bảng attendance liên quan
    SELECT COALESCE(hoursWorked, 0) INTO detail_hours 
    FROM attendances 
    WHERE id = OLD.attendanceId;
    
    -- Lấy số tiền từ bản ghi đã xóa
    SET detail_amount = COALESCE(OLD.amount, 0);
    
    -- Cập nhật bảng salaries: trừ đi số tiền và số giờ làm việc
    UPDATE salaries 
    SET 
        totalHourlyPay = GREATEST(0, totalHourlyPay - detail_amount),
        totalHours = GREATEST(0, totalHours - detail_hours)
    WHERE id = OLD.salaryId;
    
    -- Ghi log để theo dõi
    INSERT INTO system_logs (action, table_name, record_id, details, created_at)
    VALUES (
        'DELETE', 
        'salary_details', 
        OLD.id, 
        CONCAT('Đã xóa chi tiết lương: ID=', OLD.id, ', Số tiền=', detail_amount, ', Giờ làm=', detail_hours),
        NOW()
    );
END //

DELIMITER ;

-- Trigger để cập nhật bảng salaries khi thêm một bản ghi vào salary_details
DELIMITER //

DROP TRIGGER IF EXISTS after_salary_detail_insert //

CREATE TRIGGER after_salary_detail_insert
AFTER INSERT ON salary_details
FOR EACH ROW
BEGIN
    DECLARE detail_hours DECIMAL(10, 2);
    
    -- Lấy số giờ làm việc từ bảng attendance liên quan
    SELECT COALESCE(hoursWorked, 0) INTO detail_hours 
    FROM attendances 
    WHERE id = NEW.attendanceId;
    
    -- Cập nhật bảng salaries: cộng thêm số tiền và số giờ làm việc
    UPDATE salaries 
    SET 
        totalHourlyPay = totalHourlyPay + COALESCE(NEW.amount, 0),
        totalHours = totalHours + detail_hours
    WHERE id = NEW.salaryId;
    
    -- Ghi log để theo dõi
    INSERT INTO system_logs (action, table_name, record_id, details, created_at)
    VALUES (
        'INSERT', 
        'salary_details', 
        NEW.id, 
        CONCAT('Đã thêm chi tiết lương: ID=', NEW.id, ', Số tiền=', COALESCE(NEW.amount, 0), ', Giờ làm=', detail_hours),
        NOW()
    );
END //

DELIMITER ;

-- Trigger để cập nhật bảng salaries khi cập nhật một bản ghi trong salary_details
DELIMITER //

DROP TRIGGER IF EXISTS after_salary_detail_update //

CREATE TRIGGER after_salary_detail_update
AFTER UPDATE ON salary_details
FOR EACH ROW
BEGIN
    DECLARE old_hours DECIMAL(10, 2);
    DECLARE new_hours DECIMAL(10, 2);
    DECLARE diff_amount DECIMAL(10, 2);
    DECLARE diff_hours DECIMAL(10, 2);
    
    -- Lấy số giờ làm việc cũ và mới từ bảng attendance
    IF OLD.attendanceId = NEW.attendanceId THEN
        -- Nếu attendanceId không thay đổi, chỉ cần lấy một lần
        SELECT COALESCE(hoursWorked, 0) INTO new_hours 
        FROM attendances 
        WHERE id = NEW.attendanceId;
        
        SET old_hours = new_hours;
    ELSE
        -- Nếu attendanceId thay đổi, lấy cả hai giá trị
        SELECT COALESCE(hoursWorked, 0) INTO old_hours 
        FROM attendances 
        WHERE id = OLD.attendanceId;
        
        SELECT COALESCE(hoursWorked, 0) INTO new_hours 
        FROM attendances 
        WHERE id = NEW.attendanceId;
    END IF;
    
    -- Tính sự chênh lệch
    SET diff_amount = COALESCE(NEW.amount, 0) - COALESCE(OLD.amount, 0);
    SET diff_hours = new_hours - old_hours;
    
    -- Cập nhật bảng salaries với sự chênh lệch
    UPDATE salaries 
    SET 
        totalHourlyPay = GREATEST(0, totalHourlyPay + diff_amount),
        totalHours = GREATEST(0, totalHours + diff_hours)
    WHERE id = NEW.salaryId;
    
    -- Ghi log để theo dõi
    INSERT INTO system_logs (action, table_name, record_id, details, created_at)
    VALUES (
        'UPDATE', 
        'salary_details', 
        NEW.id, 
        CONCAT('Đã cập nhật chi tiết lương: ID=', NEW.id, ', Chênh lệch tiền=', diff_amount, ', Chênh lệch giờ=', diff_hours),
        NOW()
    );
END //

DELIMITER ; 