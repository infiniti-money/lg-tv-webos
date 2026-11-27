# Designed by Tân Dev v1.6.3 — Ambient Motion

**Ứng viên kiểm thử — chưa nghiệm thu TV thật.**

- 14 hiệu ứng idle, 24 chuyển cảnh album, 12 kiểu motion; giảm chuyển động và preview.
- 8 nhóm tùy chỉnh, tên app chỉ hiện khi focus, tìm kiếm và ứng dụng gần đây.
- LAN cổng 9090, mật khẩu chủ TV, mDNS tan-dev.local và IP động dự phòng; chỉ dùng mạng tin cậy.
- Đồng bộ qua mailbox/ACK, xuất nhập tùy chọn JSON (không bao gồm ảnh, icon riêng hoặc toàn bộ localStorage).
- Album TV: duyệt ảnh, thumbnail, sắp xếp, xác nhận xóa, chu kỳ, bật/tắt, thứ tự và cường độ; ảnh mới tải qua LAN. API ghi giới hạn loopback và token. Cần thử D-pad/CORS trên thiết bị.
- Home: sửa chống nhấn lặp 2 giây, thêm công cụ chẩn đoán Home liên tiếp 75 giây. LG ribbon vẫn có thể xuất hiện vì observer không độc quyền; lỗi lần nhấn thứ hai do chủ TV báo chưa được xác nhận đã hết.
- Giữ app ID, dữ liệu tương thích và cơ chế recovery. Cài IPK và Root Tools cùng build, kiểm tra SHA-256.

## Điều kiện nghiệm thu
Xem [đặc tả](docs/release-spec-v1.6.3.vi.md) và [hướng dẫn chủ TV](docs/owner-guide.vi.md). Cần xác nhận Home, idle, LAN, cold boot, standby và recovery trên TV LG webOS 3.4.3 trước khi công bố stable. Không thay thế tag v1.6.2.
