# Infiniti TV Home v1.5.9 — Giữ LG Home, bỏ Autostart EIM thử nghiệm

Phát hành: 15/11/2026. Bản này duy trì Infiniti TV Home v1.5.8 và các sửa lỗi Glasshouse, đồng thời rút lại tính năng phụ Autostart 0.1.5 vì thử nghiệm thực tế không giải quyết được chuyển về Live TV trên LG webOS 3.4.x.

## Thay đổi
- Không còn build/phân phối `org.webosbrew.autostart_0.1.5_all.ipk`. Không đụng EIM và không thay thế Homebrew Channel 0.7.3.
- Bộ công cụ root kèm `scripts/tv-service-wake.py` và `lgtv.py`. Chạy công cụ trên Windows/PC ở cùng LAN, dùng WebSocket của LG để khởi chạy Homebrew Channel **một lần có kiểm soát** khi SSH/Glasshouse chưa mở.
- Không ép mở Live TV; để người dùng tự thoát Homebrew Channel bằng điều khiển. Tùy chọn giám sát `--watch` chỉ thử một lần sau mỗi lần thấy thiết bị offline → online.
- Giữ nguyên GLASSHOUSE lifecycle + weather/native app fixes; không bật Home takeover hoặc root boot hook mới.

## Tải về
- `infiniti-tv-home.ipk` + SHA-256.
- `infiniti-tv-home-root-tools-v1.5.9.zip` + SHA-256 (script PC và cứu hộ).

## Hướng dẫn
Xem `docs/revert-autostart-and-host-wake.vi.md`. Công cụ từ PC yêu cầu Python 3 + `websockets`, TV chấp nhận ghép đôi lần đầu. Chỉ hỗ trợ khi PC được bật. Chưa nghiệm thu trên TV thật vì không có kết nối LAN từ môi trường CI.

**Cảnh báo về thiết bị đã cài Autostart cũ:** Việc cài IPK Infiniti mới **không tự xóa Autostart và đăng ký nguồn vào EIM**. Không tự xóa `/var/lib/eim`, không `umount` thủ công. Giữ bản sao lưu và kiểm tra mount trước khi hoàn tác.
