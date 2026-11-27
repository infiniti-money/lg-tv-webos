# Biên bản nghiệm thu v1.6.3 — 27/11/2026

Thiết bị mục tiêu: LG webOS 3.4.3. Kết quả vật lý do chủ TV báo cáo trong phiên làm việc, không phải phép đo độc lập của CI. Không có log thô, số CPU/RAM hoặc SHA IPK thực tế được cung cấp.

## P4: 8/8 đạt
- [x] Chọn ảnh và xem thumbnail
- [x] Chuyển ảnh bằng remote
- [x] Sắp xếp ảnh lên trước/xuống sau
- [x] Xóa ảnh có xác nhận
- [x] Bật/tắt album
- [x] Thay đổi lịch trình chiếu
- [x] Chỉnh cường độ chuyển động
- [x] Xem trước hiệu ứng

## P5: 6/6 đạt theo xác nhận chủ TV
- [x] Xác minh CI commit mới nhất
- [x] Đo CPU/RAM trong 30 phút
- [x] Kiểm thử cold boot
- [x] Kiểm thử standby và bật lại
- [x] Khắc phục lỗi nhấn Home liên tiếp
- [x] Kiểm thử phục hồi LG Home

## Bằng chứng GitHub độc lập
Baseline kiểm tra: 7eca33a2149ab95e57581ff8ca475ba372f4dec0.
- https://github.com/infiniti-money/lg-tv-webos/actions/runs/45952897086 — success
- https://github.com/infiniti-money/lg-tv-webos/actions/runs/45952891385 — success

Bản vá Home 82bacf1 và kiểm thử a2d00c7 có trong baseline. Chủ TV xác nhận triệu chứng đã được khắc phục; observer vẫn không độc quyền, không cam kết loại bỏ hoàn toàn LG ribbon. Không thêm hook hoặc thay đổi firmware khi lỗi đã được xác nhận hết.

## Phát hành
Cần CI xanh tại head cuối cùng, gộp main, kiểm tra CI main rồi dispatch workflow publish_release. Giữ prerelease và v1.6.2 stable; không suy diễn số CPU/RAM hoặc khả năng tương thích thiết bị khác từ kết quả trên. Nếu có báo cáo CSV hoặc SHA build thực tế, bổ sung sau.
