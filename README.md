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

# Quản Lý Quán Ăn - Hướng Dẫn Chạy Bằng Docker Desktop

## 1. Yêu cầu hệ thống
- **Docker Desktop** (Windows/Mac/Linux): https://www.docker.com/products/docker-desktop/
- Không cần cài Node.js, npm, MySQL, v.v.

## 2. Cách chạy project

### Bước 1: Giải nén project
- Giải nén toàn bộ mã nguồn vào một thư mục trên máy tính.

### Bước 2: Mở Docker Desktop
- Đảm bảo Docker Desktop đang chạy (Engine running).

### Bước 3: Mở terminal/cmd/PowerShell tại thư mục project
- Ví dụ: `cd E:/HocTap/QuanAn`

### Bước 4: Chạy lệnh khởi động project
```sh
docker-compose up --build
```
- Lần đầu sẽ mất vài phút để build image.
- Sau khi hoàn tất, các container sẽ tự động chạy.

### Bước 5: Truy cập hệ thống
- **Giao diện web (frontend):** http://localhost:3000
- **API backend:** http://localhost:3001
- **MySQL:**
  - Host: `localhost`
  - Port: `3307`
  - User: `root`
  - Password: `123456`
  - Database: `quanan_db`

### Bước 6: Dừng hệ thống khi không sử dụng
```sh
docker-compose down
```

## 3. Lưu ý
- Nếu bạn có file dữ liệu mẫu (.sql), có thể import vào MySQL bằng các công cụ như DBeaver, HeidiSQL, MySQL Workbench hoặc lệnh:
  ```sh
  docker exec -i mysql_db mysql -uroot -p123456 quanan_db < /duong_dan/ten_file.sql
  ```
- Nếu sửa code, hãy chạy lại `docker-compose up --build` để cập nhật.
- Nếu gặp lỗi, kiểm tra log từng container bằng Docker Desktop hoặc lệnh:
  ```sh
  docker logs -f quanan_backend
  docker logs -f quanan_frontend
  docker logs -f mysql_db
  ```

## 4. Thông tin liên hệ
- Nếu cần hỗ trợ, vui lòng liên hệ người gửi project này.

---
Chúc bạn sử dụng hệ thống thành công! 