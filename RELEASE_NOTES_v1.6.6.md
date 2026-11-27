# Designed by Tân Dev v1.6.6 — Repeat Home recovery

Bản thử nghiệm LG webOS 3.4.3. Chủ TV xác nhận v1.6.5 chỉ còn lóe LG Launcher khi nhấn một lần, nhưng nhấn hai lần có thể khiến LG Launcher nằm đè mãi.

- Giữ Fast Relaunch cho Home đơn. Trong hai phiên watch v1.6.5 có 16 yêu cầu ghi nhận, 8 tác vụ hoàn tất, 8 yêu cầu gộp, không dùng fallback; thời gian render 0,2–1,8 giây. Đây không phải phép đo thời gian LG ribbon.
- Home phân biệt trong 3 giây chọn đường đóng/mở lại Tân Dev một lần cho yêu cầu chờ. Chờ ổn định 350 ms, giới hạn trì hoãn hàng đợi 1 giây từ lúc yêu cầu chờ đầu tiên; tác vụ đang chạy vẫn phải hoàn tất.
- Giữ một child, một yêu cầu chờ, bảo vệ failsafe, xác nhận render và foreground, phục hồi LG Home. Không chiếm độc quyền remote, không sửa firmware.
- Kiểm thử Home kép sau fast completion, burst coalescing và 100 yêu cầu giả lập. Cần nghiệm thu trực quan Home đơn/kép/nhiều lần, cold boot, standby và recovery trên TV thật trước khi nâng stable.
- Cài cùng tag v1.6.6 cho IPK và root scripts, xác minh SHA-256; giữ nguyên release v1.6.5 để rollback.
