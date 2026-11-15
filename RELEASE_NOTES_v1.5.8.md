# Infiniti TV Home v1.5.8 — Glasshouse lifecycle và Autostart phụ (webOS 3.x)

**Ứng dụng chính** là bản phát hành mới. **Autostart companion v0.1.5** là bản thử nghiệm, phải nghiệm thu trên TV thật.

## Nội dung
- Gộp PR #24: tạm dừng đồng hồ, thời tiết, lịch âm, cập nhật ứng dụng, hiệu ứng khi Glasshouse che Custom Launcher; khôi phục đúng một bộ timer; chống lặp Home/wake.
- Giữ thay đổi PR #25 (danh sách ứng dụng Glasshouse native) và PR #26 (trạng thái thời tiết và retry kết nối).
- Autostart companion: gọi Homebrew startup, khôi phục Live TV/nguồn vào bằng nhiều lần thử có giới hạn; đóng cửa sổ sau xử lý; xác minh EIM overlay bằng device:inode trước khi gỡ entry overlay.
- Không sửa Homebrew Channel chính thức 0.7.3, LG Home, firmware, bản quyền, hay tự bật Home replacement.

## Tệp phát hành
- `infiniti-tv-home.ipk` và SHA-256.
- `org.webosbrew.autostart_0.1.5_all.ipk` và SHA-256 (**thử nghiệm**).
- `infiniti-tv-home-root-tools-v1.5.8.zip` và SHA-256.

## Bảo vệ TV
Chỉ cài Autostart mới khi đã sao lưu `/var/lib/eim` và có phương án cứu hộ. **Không xóa, umount hoặc sửa thủ công EIM**. Trên TV từng bị bi lăn, kiểm tra một lần reboot có giám sát trước khi thử nhiều vòng. CI không thay thế nghiệm thu phần cứng. Xem `docs/autostart-webos3-safe-handoff.vi.md` và `docs/glasshouse-webos3-safe-wake.vi.md`.

Bản chính v1.5.8 giữ nguyên dữ liệu Homebrew và Glasshouse. Autostart phân phối riêng, không bắt buộc cài.
