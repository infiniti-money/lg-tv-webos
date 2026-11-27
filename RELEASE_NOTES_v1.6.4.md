# Designed by Tân Dev v1.6.4 — Home reliability candidate

Bản ứng viên kiểm thử trên LG webOS 3.4.3; không thay thế v1.6.3 đã phát hành.

- Nhật ký TV 27/11/2026: 11 Home DOWN trên event3, 8 lượt Home trigger/RENDER OK; PID watcher tồn tại trước/sau. Ba lần không có trigger riêng, không chứng minh rằng từng lần không đổi foreground hoặc LG ribbon bị chặn.
- Watcher đọc evdev theo lô, không chờ đồng bộ Luna redirect/power. Một child, một intent chờ gộp; log input, dispatch, completion, coalesced. Child có timeout và được thu hồi khi dừng; giữ failsafe và giới hạn ba lỗi.
- Thêm mô phỏng 100 intent, khoảng cách 150ms–5s, timeout và cancellation; xác minh bằng CI. Giữ non-exclusive observer: LG Home có thể lóe, close/relaunch vẫn dùng đường đã kiểm chứng trước đây.
- Sửa album dữ liệu sai kiểu, LAN query sai, phục hồi lỗi select và đo RSS.
- Cần chạy lại home-repeat-diagnose.sh trên TV, so sánh số Home input, dispatched/coalesced và completion; kiểm tra màn hình thực tế, standby, cold boot và recovery. Không cam kết sửa lỗi phần cứng khi chưa thử.
