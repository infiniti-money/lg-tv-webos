# Designed by Tân Dev — v1.6.1

## Thay đổi
- Tùy chỉnh kính trong suốt, thanh menu dọc, vùng nội dung cố định không cuộn; danh sách ứng dụng và icon phân trang bằng remote.
- 105 SVG offline: 21 kiểu trong mỗi 5 bộ icon; giữ icon cũ, thêm icon phân biệt các app phổ biến. App không nhận diện được có thể dùng chung icon chức năng.
- Icon vuông giữ tỷ lệ, mở rộng màu nền nếu các mép tương đồng; icon ngang dùng vùng thẻ 16:9.
- Chế độ chờ: mặc định 60 giây; chọn Tắt/30/60/120/300 giây. Giữ đồng hồ, lịch âm/dương và thời tiết hiện tại theo cài đặt; ẩn dự báo 3 ngày, dock và nút chức năng. Mưa tùy chọn, dừng khi app bị che hoặc giảm chuyển động; phím đầu tiên chỉ đánh thức giao diện.
- Sửa khôi phục icon gốc, giảm bộ nhớ lấy mẫu màu và bổ sung hạn sử dụng QR hình nền.
- Mục Cập nhật có nút kiểm tra bản chính thức qua GitHub. **Chưa hỗ trợ thay thế Launcher đang chạy bằng một nút**. Cần nâng cấp IPK và Root Tools cùng bản qua SSH; không dùng auto-update app-only khi Legacy Home đang bật.

## Cài đặt
Sao lưu /home/root/lg-tv-vibehack. Tắt watcher cũ, kiểm tra khóa /tmp/infiniti-legacy-v8-lock đã biến mất. Cài IPK và Root Tools v1.6.1 từ release, kiểm tra SHA-256. Thử watch, arm, reboot, quan sát giao diện và xác nhận confirm; bật wallpaper/wake tùy nhu cầu. Giữ LG Home, App ID, dữ liệu người dùng và Failsafe. Xem docs/legacy-home-v8.vi.md.

## Giới hạn
v1.6.0 đã kiểm thử trên LG 49UH850T-TA: readiness 10.2s, render 1.5s/17 ô. v1.6.1 mới có kiểm tra CI, chưa đo tốc độ hoặc nghiệm thu giao diện/mưa/QR trên TV thật. Ảnh thác nước chưa nhúng. Không ghi đè v1.6.0.
