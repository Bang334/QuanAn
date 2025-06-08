# Tính năng Thanh toán và Khuyến mãi - Quản lý Nhà hàng

## Tổng quan

Dự án đã được bổ sung thêm các chức năng quản lý thanh toán và khuyến mãi, cho phép:
- Ghi lại thông tin thanh toán cho các đơn hàng
- Tạo và quản lý các chương trình khuyến mãi
- Thống kê doanh thu theo nhiều tiêu chí
- Phân tích hiệu quả bán hàng

## Cấu trúc Database

### Bảng Thanh toán (payments)
- `id`: Khóa chính
- `orderId`: ID đơn hàng (khóa ngoại)
- `amount`: Số tiền thanh toán
- `paymentMethod`: Phương thức thanh toán (cash, card, momo, zalopay, vnpay)
- `paymentDate`: Ngày thanh toán
- `status`: Trạng thái (completed, refunded, failed)
- `transactionId`: ID giao dịch (cho thanh toán điện tử)
- `refundAmount`: Số tiền hoàn trả (nếu có)
- `notes`: Ghi chú
- `createdAt`: Ngày tạo
- `updatedAt`: Ngày cập nhật

### Bảng Khuyến mãi (promotions)
- `id`: Khóa chính
- `name`: Tên khuyến mãi
- `description`: Mô tả
- `discountType`: Loại giảm giá (percent, fixed)
- `discountValue`: Giá trị giảm giá
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc
- `isActive`: Trạng thái hoạt động
- `minimumOrderAmount`: Số tiền đơn hàng tối thiểu
- `maximumDiscountAmount`: Số tiền giảm giá tối đa
- `applicableCategories`: Danh mục áp dụng
- `usageLimit`: Giới hạn sử dụng
- `usageCount`: Số lần đã sử dụng
- `promotionCode`: Mã khuyến mãi

### Bảng Áp dụng Khuyến mãi (order_promotions)
- `id`: Khóa chính
- `orderId`: ID đơn hàng (khóa ngoại)
- `promotionId`: ID khuyến mãi (khóa ngoại)
- `discountAmount`: Số tiền giảm giá
- `createdAt`: Ngày tạo

## API Endpoints

### API Thanh toán (Payment)

- **POST /api/payments** - Tạo thanh toán mới
  - Quyền: Staff hoặc Admin
  - Body: `{ orderId, amount, paymentMethod, transactionId, notes }`

- **GET /api/payments** - Lấy danh sách thanh toán
  - Quyền: Admin
  - Tham số: `page, limit, startDate, endDate, paymentMethod, status`

- **GET /api/payments/:id** - Lấy chi tiết thanh toán
  - Quyền: Staff hoặc Admin

- **PUT /api/payments/:id** - Cập nhật thanh toán
  - Quyền: Admin
  - Body: `{ status, refundAmount, notes }`

- **GET /api/payments/stats/revenue** - Thống kê doanh thu
  - Quyền: Admin
  - Tham số: `period (daily/monthly/yearly), startDate, endDate`

- **GET /api/payments/stats/category** - Thống kê doanh thu theo danh mục
  - Quyền: Admin
  - Tham số: `startDate, endDate`

- **GET /api/payments/stats/top-items** - Lấy danh sách món ăn bán chạy
  - Quyền: Admin
  - Tham số: `limit, startDate, endDate`

### API Khuyến mãi (Promotion)

- **POST /api/promotions** - Tạo khuyến mãi mới
  - Quyền: Admin
  - Body: Thông tin khuyến mãi

- **GET /api/promotions/admin** - Lấy danh sách khuyến mãi (admin)
  - Quyền: Admin
  - Tham số: `isActive, search`

- **GET /api/promotions/active** - Lấy danh sách khuyến mãi đang hoạt động
  - Quyền: Public

- **GET /api/promotions/:id** - Lấy chi tiết khuyến mãi
  - Quyền: Public

- **PUT /api/promotions/:id** - Cập nhật khuyến mãi
  - Quyền: Admin
  - Body: Thông tin cập nhật

- **DELETE /api/promotions/:id** - Xóa khuyến mãi
  - Quyền: Admin

- **POST /api/promotions/apply** - Áp dụng khuyến mãi cho đơn hàng
  - Quyền: Staff hoặc Admin
  - Body: `{ orderId, promotionId }`

- **GET /api/promotions/order/:orderId** - Lấy khuyến mãi theo đơn hàng
  - Quyền: Staff hoặc Admin

- **DELETE /api/promotions/order/:orderId/promotion/:promotionId** - Xóa khuyến mãi khỏi đơn hàng
  - Quyền: Staff hoặc Admin

## Views Thống kê

### revenue_summary
- Tổng hợp doanh thu theo ngày
- Phân tích theo phương thức thanh toán

### monthly_revenue
- Tổng hợp doanh thu theo tháng

### category_revenue
- Phân tích doanh thu theo danh mục sản phẩm
- Số lượng đơn hàng, số lượng món, doanh thu...

### top_selling_items
- Danh sách món ăn bán chạy nhất
- Doanh thu, số lượng, đánh giá

## Cách sử dụng

### Thanh toán đơn hàng
1. Hoàn thành đơn hàng ở màn hình quản lý đơn
2. Chuyển sang màn hình thanh toán
3. Chọn phương thức thanh toán
4. Nhập thông tin giao dịch (nếu cần)
5. Xác nhận thanh toán

### Tạo khuyến mãi
1. Vào trang quản lý khuyến mãi
2. Tạo khuyến mãi mới với thông tin chi tiết
3. Thiết lập thời gian, điều kiện áp dụng

### Áp dụng khuyến mãi
1. Trong trang đơn hàng, chọn "Áp dụng khuyến mãi"
2. Chọn khuyến mãi phù hợp từ danh sách
3. Hệ thống tự động tính toán số tiền giảm giá

### Xem báo cáo doanh thu
1. Vào trang thống kê doanh thu
2. Chọn khoảng thời gian và kiểu báo cáo
3. Xem biểu đồ và dữ liệu chi tiết 