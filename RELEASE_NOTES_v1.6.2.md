# Designed by Tân Dev — v1.6.2 Ambient Display

## Tính năng tổng hợp
- 7 hiệu ứng chờ offline: mưa, tuyết, cánh hoa, sao, đom đóm, bong bóng, sương; chọn ngẫu nhiên mỗi lần vào chờ.
- Dock thu nhỏ/trượt xuống và dự báo 3 ngày mờ dần trong 420 ms; giữ đồng hồ, lịch âm/dương và thời tiết hiện tại theo tùy chỉnh. Chữ Designed by Tân Dev ở góc dưới phải.
- Album tối đa 20 JPEG, 1,5 MB/ảnh, trình duyệt thu về 1920×1080. Chuyển ảnh 15 giây đến 7 ngày, hoặc mỗi lần bật TV; tuần tự/ngẫu nhiên không lặp ngay. Ngày = 24 giờ. Cold boot nhận diện boot ID; resume phụ thuộc wake-on và trạng thái Luna thực tế. Chỉ trình chiếu khi Home rảnh, không chạy khi TV tắt. Giữ hình nền chính.
- Tùy chỉnh qua QR/LAN trên điện thoại và trình duyệt máy tính: ảnh, album, giao diện, kiểu hiệu ứng, tên/icon/ẩn-hiện app, thời tiết. Chỉ thao tác trường hợp lệ; web báo chờ nếu không nhận ACK từ Launcher. Không có shell, cài gói hoặc điều khiển nguồn qua web.
- Mục Ứng dụng thêm lọc hiện/ẩn/đã ghim, sắp xếp, số lượng, hiện tất cả, ghim lên đầu Home và mở app. Giữ 105 icon, đổi tên và ảnh icon riêng. Bỏ mục Cập nhật trong Tùy chỉnh.
- Hiệu năng: một lớp hiệu ứng SVG/CSS, tối đa hai lớp ảnh, giới hạn thời gian tải ảnh, hủy timer khi rời idle, hạn chế quét album (30s thay vì 5s khi ổn định), giới hạn đặt lại timer chuột, giảm ACK trùng. Chưa đo CPU/RAM trên TV.

## Cài đặt và giới hạn
Cài IPK và Root Tools v1.6.2 cùng phiên bản qua SSH. Sao lưu, disable watcher, chạy trình cài đặt cố định tag, kiểm thử watch rồi arm/reboot/confirm; bật wallpaper-on để dùng web, wake-on nếu muốn thử resume. Giữ v1.6.1 để rollback, không sửa firmware hoặc LG Home. Nút cập nhật trong app đã bỏ; không tự cài đè.
v1.6.0 đã có bằng chứng chạy trên LG 49UH850T-TA; v1.6.2 cần nghiệm thu chuyển cảnh, album, web (loopback/CORS), standby và hiệu năng trên TV thực. Ảnh thác nước đã chọn trước đó chưa nhúng. Web chỉ dùng mạng riêng đáng tin cậy, giữ bí mật URL chứa khóa và không mở port 8090 ra Internet.
