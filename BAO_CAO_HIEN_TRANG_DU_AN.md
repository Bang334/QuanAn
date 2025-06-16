# BÁO CÁO HIỆN TRẠNG DỰ ÁN QUẢN LÝ QUÁN ĂN

## 1. Lý do và mục tiêu xây dựng dự án

Trong bối cảnh ngành dịch vụ ăn uống ngày càng phát triển, việc quản lý vận hành một quán ăn/quán cafe hiện đại đòi hỏi phải có hệ thống phần mềm hỗ trợ chuyên nghiệp, minh bạch và tự động hóa cao. Các vấn đề thường gặp ở các quán ăn truyền thống bao gồm:
- Quản lý ca làm việc, chấm công nhân viên thủ công, dễ sai sót, gian lận.
- Quản lý kho nguyên liệu, nhập xuất tồn không chính xác, thất thoát.
- Quản lý đơn hàng, thanh toán, khuyến mãi rời rạc, thiếu liên kết.
- Không có báo cáo tổng hợp, khó kiểm soát chi phí, doanh thu, lương thưởng.

**Mục tiêu của dự án:**
- Xây dựng hệ thống quản lý tổng thể cho quán ăn, bao gồm: nhân sự, ca làm, chấm công, kho, đơn hàng, thanh toán, báo cáo.
- Tự động hóa các quy trình nghiệp vụ, giảm thiểu thao tác thủ công, tăng minh bạch.
- Đảm bảo dữ liệu nhất quán, an toàn, dễ kiểm soát và truy xuất.

## 2. Hiện trạng hệ thống

### 2.1. Kiến trúc tổng thể
- Hệ thống gồm backend (NodeJS/Express + Sequelize + MySQL) và frontend (ReactJS/Ant Design).
- Phân quyền rõ ràng: admin, kitchen, waiter, customer.
- Các module chính: Quản lý nhân sự, lịch làm việc, chấm công, kho, đơn hàng, thanh toán, báo cáo.

### 2.2. Các chức năng đã triển khai
- Đăng ký, xác nhận, từ chối, hủy lịch làm việc cho nhân viên và admin.
- Chấm công tự động từ lịch làm việc, tính lương, thưởng, phụ cấp.
- Quản lý kho nguyên liệu, nhập xuất tồn, cảnh báo tồn kho thấp.
- Quản lý đơn hàng, trạng thái chế biến, thanh toán, khuyến mãi.
- Báo cáo doanh thu, lương, tồn kho, hiệu quả nhân viên, top món bán chạy.
- Hệ thống ràng buộc dữ liệu chặt chẽ ở cả backend và database (trigger, constraint, check, unique, foreign key).

### 2.3. Các ràng buộc dữ liệu đã áp dụng
- Không cho phép chấm công ngày tương lai, không cho phép đăng ký quá 2 ca/ngày, không trùng ca/ngày.
- Không cho phép tồn kho âm, không cho phép thanh toán cho đơn đã huỷ, không cho phép số lượng/gía trị âm.
- Ràng buộc unique, enum, foreign key, check cho tất cả các bảng nghiệp vụ chính.

### 2.4. Các vấn đề đã phát hiện và giải pháp
- **Dữ liệu lịch làm việc, chấm công, đơn hàng, kho...**: Đã kiểm tra, không phát hiện bản ghi trùng, bất thường nghiêm trọng.
- **Thiếu trigger kiểm soát nghiệp vụ ở mức DB**: Đã bổ sung đầy đủ trigger kiểm tra ngày, ca, số lượng, trạng thái, ...
- **Thiếu constraint ở DB**: Đã bổ sung file SQL constraint đồng bộ với backend.
- **Một số trường hợp nghiệp vụ đặc biệt (ca full_day, ca lẻ, ...)**: Đã đề xuất và có thể bổ sung trigger nếu cần.

## 3. Khuyến nghị và hướng phát triển tiếp theo
- Tiếp tục kiểm tra, rà soát các nghiệp vụ đặc thù, bổ sung trigger/constraint nếu phát sinh mới.
- Xây dựng thêm các báo cáo động, dashboard trực quan cho quản lý.
- Tối ưu hiệu năng truy vấn, backup dữ liệu định kỳ.
- Nâng cấp UI/UX cho trải nghiệm người dùng tốt hơn.
- Xây dựng hệ thống phân quyền chi tiết hơn cho các vai trò đặc biệt (quản lý kho, kế toán, ...).
- Tích hợp thêm các dịch vụ thanh toán online, quản lý khách hàng thân thiết, ...

## 4. Kết luận

Dự án đã xây dựng được nền tảng quản lý quán ăn hiện đại, tự động hóa, minh bạch và an toàn dữ liệu. Các ràng buộc nghiệp vụ đã được kiểm soát chặt chẽ ở cả backend và database, đảm bảo hệ thống vận hành ổn định, hạn chế tối đa sai sót và gian lận. Hệ thống sẵn sàng mở rộng, nâng cấp theo nhu cầu thực tế của quán ăn/cafe hiện đại.

## 5. Phân tích chức năng, nghiệp vụ của khách hàng (khách gọi món)

### 5.1. Xem thực đơn và đặt món
- Khách hàng có thể xem menu, chi tiết món ăn, giá, mô tả, hình ảnh.
- Thêm món vào giỏ hàng, chọn số lượng, ghi chú yêu cầu đặc biệt (nếu có).

### 5.2. Đặt món và theo dõi đơn hàng
- Đặt món trực tiếp trên hệ thống (app/web).
- Theo dõi trạng thái đơn hàng: chờ xác nhận, đang chuẩn bị, sẵn sàng phục vụ, đã phục vụ, hoàn thành, đã hủy.

### 5.3. Thanh toán
- Thanh toán tại quầy hoặc qua hệ thống (nếu có hỗ trợ online).
- Nhận hóa đơn giấy hoặc xem lại hóa đơn trên hệ thống.

### 5.4. Đánh giá món ăn
- Sau khi đơn hàng hoàn thành, khách có thể đánh giá món ăn đã mua (số sao, nhận xét).
- Đánh giá chỉ thực hiện được với món đã mua và đơn đã hoàn thành.

### 5.5. Xem lại lịch sử đơn hàng
- Khách hàng có thể xem lại các đơn hàng đã đặt, chi tiết từng món, trạng thái, đánh giá đã gửi.

### 5.6. Quy trình nghiệp vụ tổng quát của khách hàng
1. Xem menu, chọn món, thêm vào giỏ hàng.
2. Đặt món, xác nhận đơn hàng.
3. Theo dõi trạng thái đơn hàng.
4. Nhận món, dùng bữa.
5. Thanh toán, nhận hóa đơn.
6. Đánh giá món ăn đã mua (nếu muốn).
7. Xem lại lịch sử đơn hàng, đánh giá.

## 6. Phân tích chức năng, nghiệp vụ của nhân viên phục vụ (waiter)

### 6.1. Lịch làm việc & đăng ký ca
- Xem lịch làm việc cá nhân, ca đã đăng ký.
- Đăng ký ca làm việc mới, chọn ngày, ca, ghi chú (nếu có).
- Hủy ca làm việc đã đăng ký (nếu chưa được xác nhận).
- Theo dõi trạng thái ca làm: đã lên lịch, đã xác nhận, đã hủy.

### 6.2. Quản lý đơn hàng
- Tạo đơn hàng mới cho bàn, thêm món vào đơn hàng khi tạo.
- Theo dõi trạng thái đơn hàng: chờ xác nhận, đang chuẩn bị, sẵn sàng phục vụ, đã phục vụ, hoàn thành, đã hủy.

### 6.3. Lịch sử đơn hàng
- Xem lại các đơn hàng đã phục vụ, chi tiết từng món, trạng thái.

### 6.4. Xem lương, thưởng
- Xem bảng lương cá nhân, tổng hợp lương, thưởng, phụ cấp, khấu trừ theo từng tháng.
- Xem chi tiết lịch sử lương, ca làm, số giờ làm, trạng thái thanh toán lương.

### 6.5. Quy trình nghiệp vụ tổng quát của nhân viên phục vụ
1. Xem lịch làm việc, đăng ký ca hoặc nhận ca từ quản lý.
2. Đón khách, nhận order, tạo đơn hàng cho bàn.
3. Gửi order xuống bếp, theo dõi trạng thái chế biến.
4. Theo dõi trạng thái đơn hàng, phục vụ khách.
5. Xem lại lịch sử đơn hàng đã phục vụ.
6. Xem lương, thưởng, lịch sử lương cá nhân.

## 7. Phân tích chức năng, nghiệp vụ của admin

### 7.1. Quản lý tài khoản nhân viên
- Tạo mới, chỉnh sửa, xóa tài khoản nhân viên (phục vụ, bếp).
- Phân quyền vai trò cho tài khoản (admin, bếp, phục vụ).

### 7.2. Quản lý ca làm việc, lịch làm việc
- Xem danh sách đăng ký ca làm việc của nhân viên.
- Xác nhận hoặc từ chối đăng ký ca làm việc.
- Tạo, chỉnh sửa, xóa ca làm việc cho nhân viên.
- Theo dõi lịch làm việc tổng thể của toàn bộ nhân viên.

### 7.3. Quản lý lương, thưởng
- Tính lương, thưởng cho nhân viên dựa trên ca làm, số giờ làm, trạng thái ca.
- Xem bảng lương tổng hợp của toàn bộ nhân viên.
- Chỉnh sửa, xác nhận trạng thái thanh toán lương.

### 7.4. Quản lý thực đơn (menu)
- Thêm, sửa, xóa món ăn trong thực đơn.
- Cập nhật giá, trạng thái món (còn/hết món).

### 7.5. Quản lý đơn hàng
- Xem danh sách đơn hàng của toàn bộ nhà hàng.
- Theo dõi trạng thái đơn hàng, can thiệp khi cần thiết (hủy đơn, xác nhận thanh toán).

### 7.6. Quản lý kho nguyên liệu
- Xem, cập nhật số lượng nguyên liệu trong kho.
- Thêm, sửa, xóa nguyên liệu.
- Theo dõi xuất/nhập kho, cảnh báo khi nguyên liệu sắp hết.

### 7.7. Theo dõi báo cáo tổng hợp
- Xem báo cáo tổng hợp về ca làm, lương, đơn hàng, doanh thu, tồn kho.

### 7.8. Quy trình nghiệp vụ tổng quát của admin
1. Quản lý tài khoản, phân quyền nhân viên.
2. Quản lý, xác nhận lịch làm việc, ca làm của nhân viên.
3. Quản lý thực đơn, cập nhật món ăn.
4. Theo dõi, can thiệp đơn hàng khi cần thiết.
5. Quản lý kho nguyên liệu, cập nhật số lượng.
6. Theo dõi, xác nhận lương, thưởng cho nhân viên.
7. Xem báo cáo tổng hợp hoạt động nhà hàng. 