# Ứng dụng Quản lý Quán Ăn

Ứng dụng web giúp khách hàng gọi món qua mã QR, bếp theo dõi và nấu món, chủ quán quản lý doanh thu và hoạt động quán.

## Đối tượng sử dụng

- **Khách hàng**: Quét mã QR, đặt món, xem trạng thái, thanh toán
- **Nhân viên bếp**: Xem danh sách món cần nấu, cập nhật trạng thái
- **Phục vụ**: Giao món, hỗ trợ thanh toán
- **Quản lý**: Quản lý thực đơn, bàn, nhân viên, thống kê doanh thu

## Công nghệ sử dụng

- **Frontend**: React (Vite)
- **Backend**: Express.js
- **Database**: MySQL với Sequelize ORM
- **Realtime**: Socket.IO
- **Authentication**: JWT

## Cài đặt và Chạy

### Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env (hoặc sửa file .env hiện có)
# Thêm các biến môi trường cần thiết:
# PORT=5000
# DB_HOST=localhost
# DB_USER=root
# DB_PASS=
# DB_NAME=quanan_db
# JWT_SECRET=your_jwt_secret_key_here
# NODE_ENV=development

# Tạo database và dữ liệu mẫu
npm run seed

# Chạy server ở chế độ development
npm run dev
```

### Frontend

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy frontend ở chế độ development
npm run dev
```

## Tài khoản mẫu

- **Admin**: admin@quanan.com / admin123
- **Bếp**: kitchen@quanan.com / kitchen123
- **Phục vụ**: waiter@quanan.com / waiter123

## Các chức năng chính

### Khách hàng
- Quét mã QR để truy cập web
- Xem menu và đặt món
- Xem trạng thái món ăn
- Yêu cầu thanh toán

### Bếp
- Xem danh sách món cần nấu
- Cập nhật trạng thái món
- Xem ghi chú đặc biệt của khách

### Phục vụ
- Xem bàn nào cần hỗ trợ
- Giao món
- Xác nhận thanh toán

### Quản lý
- Quản lý thực đơn
- Quản lý bàn và mã QR
- Xem thống kê doanh thu
- Quản lý nhân viên 