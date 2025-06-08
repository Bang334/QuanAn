@echo off
echo Đang cập nhật cơ sở dữ liệu với bảng thanh toán và khuyến mãi...
mysql -h localhost -P 3307 -u root -p123456 quanan_db < complete_database_update.sql
echo Hoàn thành cập nhật cơ sở dữ liệu. 