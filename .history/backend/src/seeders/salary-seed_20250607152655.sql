-- Dữ liệu lương mẫu cho nhân viên

-- Lương cho nhân viên kitchen (id: 2 - Trần Thị Kitchen)
INSERT INTO salaries (userId, month, year, baseSalary, bonus, deduction, workingDays, status, paidDate, note, createdAt, updatedAt)
VALUES 
(2, 6, 2025, 5000000, 500000, 0, 26, 'paid', '2025-06-30 00:00:00', 'Lương tháng 6/2025', NOW(), NOW()),
(2, 7, 2025, 5000000, 700000, 200000, 27, 'paid', '2025-07-31 00:00:00', 'Lương tháng 7/2025', NOW(), NOW()),
(2, 8, 2025, 5000000, 600000, 100000, 25, 'pending', NULL, 'Lương tháng 8/2025', NOW(), NOW());

-- Lương cho nhân viên kitchen (id: 4 - Phạm Thị Bếp)
INSERT INTO salaries (userId, month, year, baseSalary, bonus, deduction, workingDays, status, paidDate, note, createdAt, updatedAt)
VALUES 
(4, 6, 2025, 4800000, 400000, 0, 26, 'paid', '2025-06-30 00:00:00', 'Lương tháng 6/2025', NOW(), NOW()),
(4, 7, 2025, 4800000, 600000, 100000, 25, 'paid', '2025-07-31 00:00:00', 'Lương tháng 7/2025', NOW(), NOW()),
(4, 8, 2025, 4800000, 500000, 0, 26, 'pending', NULL, 'Lương tháng 8/2025', NOW(), NOW());

-- Lương cho nhân viên waiter (id: 3 - Lê Văn Waiter)
INSERT INTO salaries (userId, month, year, baseSalary, bonus, deduction, workingDays, status, paidDate, note, createdAt, updatedAt)
VALUES 
(3, 6, 2025, 4500000, 800000, 0, 28, 'paid', '2025-06-30 00:00:00', 'Lương tháng 6/2025 + thưởng doanh số', NOW(), NOW()),
(3, 7, 2025, 4500000, 650000, 200000, 26, 'paid', '2025-07-31 00:00:00', 'Lương tháng 7/2025', NOW(), NOW()),
(3, 8, 2025, 4500000, 900000, 0, 27, 'pending', NULL, 'Lương tháng 8/2025 + thưởng nhân viên xuất sắc', NOW(), NOW());

-- Lương cho nhân viên waiter (id: 5 - Hoàng Văn Phục Vụ)
INSERT INTO salaries (userId, month, year, baseSalary, bonus, deduction, workingDays, status, paidDate, note, createdAt, updatedAt)
VALUES 
(5, 6, 2025, 4300000, 500000, 100000, 25, 'paid', '2025-06-30 00:00:00', 'Lương tháng 6/2025', NOW(), NOW()),
(5, 7, 2025, 4300000, 600000, 0, 26, 'paid', '2025-07-31 00:00:00', 'Lương tháng 7/2025', NOW(), NOW()),
(5, 8, 2025, 4300000, 700000, 150000, 24, 'pending', NULL, 'Lương tháng 8/2025', NOW(), NOW());

-- Lương tháng trước cho tất cả nhân viên
INSERT INTO salaries (userId, month, year, baseSalary, bonus, deduction, workingDays, status, paidDate, note, createdAt, updatedAt)
VALUES 
(2, 5, 2025, 5000000, 400000, 100000, 24, 'paid', '2025-05-31 00:00:00', 'Lương tháng 5/2025', NOW(), NOW()),
(3, 5, 2025, 4500000, 700000, 0, 26, 'paid', '2025-05-31 00:00:00', 'Lương tháng 5/2025', NOW(), NOW()),
(4, 5, 2025, 4800000, 350000, 50000, 25, 'paid', '2025-05-31 00:00:00', 'Lương tháng 5/2025', NOW(), NOW()),
(5, 5, 2025, 4300000, 450000, 100000, 24, 'paid', '2025-05-31 00:00:00', 'Lương tháng 5/2025', NOW(), NOW());

-- Lương tháng hiện tại cho tất cả nhân viên
INSERT INTO salaries (userId, month, year, baseSalary, bonus, deduction, workingDays, status, paidDate, note, createdAt, updatedAt)
VALUES 
(2, 9, 2025, 5000000, 0, 0, 15, 'pending', NULL, 'Lương tháng 9/2025 (tạm tính)', NOW(), NOW()),
(3, 9, 2025, 4500000, 0, 0, 15, 'pending', NULL, 'Lương tháng 9/2025 (tạm tính)', NOW(), NOW()),
(4, 9, 2025, 4800000, 0, 0, 14, 'pending', NULL, 'Lương tháng 9/2025 (tạm tính)', NOW(), NOW()),
(5, 9, 2025, 4300000, 0, 0, 15, 'pending', NULL, 'Lương tháng 9/2025 (tạm tính)', NOW(), NOW()); 