# Designed by Tân Dev v1.6.5 — Home fast relaunch candidate

Bản thử nghiệm dành cho LG webOS 3.4.3. v1.6.4 đã ghi nhận 10/10 lượt Home trên TV thật, nhưng chủ TV báo LG Launcher vẫn hiện khoảng 3 giây.

- Home ưu tiên đưa ứng dụng hiện có lên foreground với token render mới, không đóng trước.
- Nếu không có xác nhận trong 2,5 giây, thử đường close/relaunch đã kiểm chứng một lần; vẫn kiểm tra failsafe.
- Giữ hàng đợi một tác vụ và một yêu cầu chờ, app ID, dữ liệu và khả năng phục hồi.
- Kiểm thử giả lập fast path, fallback, timeout, cancellation và 100 Home intents.
- Không chặn độc quyền phím, không sửa firmware. Chưa chứng minh LG ribbon biến mất hoặc thời gian hiển thị giảm trên TV thật. Đo lại bằng quan sát màn hình và log fast relaunch/fallback, thử cold boot, standby, recovery trước khi nâng lên stable.
- Cài IPK và Root Tools cùng phiên bản, xác minh SHA-256. v1.6.4 giữ nguyên.
