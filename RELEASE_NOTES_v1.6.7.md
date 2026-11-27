# Designed by Tân Dev v1.6.7 — Foreground-aware Home recovery

Bản thử nghiệm cho LG webOS 3.4.3. Chủ TV báo v1.6.6 vẫn có thể để LG Launcher nằm đè khi nhấn Home một lần từ Tân Dev.

- Kiểm tra foreground bằng Luna với timeout 1 giây trước Home đơn. Nếu Tân Dev đang foreground hoặc không xác định được app, dùng close/relaunch có xác nhận render; nếu app khác, giữ Fast Relaunch và một fallback.
- Giữ Repeat Recovery của v1.6.6, một child và một yêu cầu chờ, guard failsafe. Giới hạn helper 25 giây để bao gồm probe và fallback.
- Không chiếm độc quyền remote, không sửa firmware hay xóa LG Home. Foreground và render ACK không chứng minh native ribbon đã biến mất.
- Kiểm thử các trạng thái foreground, timeout, cancellation, fallback và hàng đợi. Cần kiểm tra trực quan Home đơn ngay trong Tân Dev, Home kép, YouTube, cold boot, standby và recovery trên TV thật.
- Cài IPK và root scripts cùng tag, kiểm tra SHA-256. Giữ nguyên v1.6.6 để khôi phục.
