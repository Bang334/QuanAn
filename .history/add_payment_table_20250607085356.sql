-- Use the restaurant database
USE quanan_db;

-- Create payments table to track revenue
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paymentMethod ENUM('cash', 'card', 'momo', 'zalopay', 'vnpay') NOT NULL,
  paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('completed', 'refunded', 'failed') DEFAULT 'completed',
  transactionId VARCHAR(100),
  refundAmount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id)
);

-- Add index on orderId for faster lookups
CREATE INDEX idx_payments_order_id ON payments(orderId);

-- Add index on paymentDate for reporting queries
CREATE INDEX idx_payments_date ON payments(paymentDate);

-- Insert sample payment records for existing orders
INSERT INTO payments (orderId, amount, paymentMethod, paymentDate, status, transactionId, notes, createdAt, updatedAt)
VALUES 
(2, 250000, 'cash', NOW() - INTERVAL 4 DAY, 'completed', NULL, 'Thanh toán đơn hàng bàn 5', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
(1, 185000, 'momo', NOW() - INTERVAL 2 DAY, 'completed', 'MOMO123456', 'Thanh toán đơn hàng bàn 3', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(3, 120000, 'cash', NOW() - INTERVAL 1 DAY, 'completed', NULL, 'Thanh toán đơn hàng bàn 1', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(4, 340000, 'card', NOW() - INTERVAL 12 HOUR, 'completed', 'CARD789012', 'Thanh toán đơn hàng bàn 4', NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 12 HOUR),
(5, 95000, 'zalopay', NOW() - INTERVAL 6 HOUR, 'completed', 'ZALO456789', 'Thanh toán đơn hàng bàn 2', NOW() - INTERVAL 6 HOUR, NOW() - INTERVAL 6 HOUR);

-- Create a revenue summary view for easy reporting
CREATE OR REPLACE VIEW revenue_summary AS
SELECT 
    DATE(paymentDate) AS day,
    SUM(amount) AS totalRevenue,
    COUNT(*) AS numberOfPayments,
    AVG(amount) AS averagePayment,
    SUM(CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END) AS cashRevenue,
    SUM(CASE WHEN paymentMethod = 'card' THEN amount ELSE 0 END) AS cardRevenue,
    SUM(CASE WHEN paymentMethod IN ('momo', 'zalopay', 'vnpay') THEN amount ELSE 0 END) AS eWalletRevenue
FROM 
    payments
WHERE 
    status = 'completed'
GROUP BY 
    DATE(paymentDate)
ORDER BY 
    day DESC;

-- Create monthly revenue summary view
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    YEAR(paymentDate) AS year,
    MONTH(paymentDate) AS month,
    SUM(amount) AS totalRevenue,
    COUNT(*) AS numberOfPayments,
    AVG(amount) AS averagePayment
FROM 
    payments
WHERE 
    status = 'completed'
GROUP BY 
    YEAR(paymentDate), MONTH(paymentDate)
ORDER BY 
    year DESC, month DESC; 