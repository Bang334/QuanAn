-- Add missing columns to ingredients table
ALTER TABLE ingredients 
ADD COLUMN expiryDate DATETIME NULL COMMENT 'Hạn sử dụng của nguyên liệu',
ADD COLUMN location VARCHAR(255) NULL COMMENT 'Vị trí lưu trữ trong kho',
ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hoạt động của nguyên liệu',
ADD COLUMN image VARCHAR(255) NULL COMMENT 'Đường dẫn đến hình ảnh nguyên liệu'; 