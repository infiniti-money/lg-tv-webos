# Infiniti LG Home Legacy — LG 49UH850T-TA

Mục tiêu: webOS 3.4.3, firmware 05.70.45, ARMv7, Python 2.7.3, root UID 0. Home key 773 đã được đo trên LGE M-RCU Builtin [0] event4. V8 tương tác đã xác nhận close/launch/getForegroundAppInfo với Homebrew Channel; chưa thử với IPK Infiniti hoặc daemon mới.

## Cài và thử nghiệm (SSH root, trên TV)
Cài IPK và root tools theo README; không chọn --enable-home (LG Input Hook) đồng thời với V8. Nếu đã có hook cũ, dùng recovery hiện có, kiểm tra lại và xác nhận Home gốc trước khi tiếp tục. Không sửa firmware.

```sh
cd /home/root/lg-tv-vibehack
sh legacy-home.sh status
sh legacy-home.sh watch
```

Nếu chỉ cài IPK thủ công thì apps.js ban đầu rỗng: cài root tools, chạy `node /home/root/lg-tv-vibehack/sync.js` rồi đóng/mở Launcher. Legacy sync ưu tiên listApps qua Node.js với stdin mở; loại bỏ app ẩn và dịch vụ nền. Không arm boot nếu danh sách còn rỗng.

Nhấn Home, kiểm tra log foreground phải là com.infinitimoney.tvhome và quan sát màn hình. Ctrl+C để dừng. Đây là quan sát phím không độc quyền, có thể lóe LG Home gốc; không phải thay thế compositor.

Nếu thử thành công và đã kiểm tra ít nhất hai chu kỳ bật/tắt bình thường, chạy `sh legacy-home.sh arm`, reboot thủ công để thử một lần. Sau khi nhìn thấy Launcher và kiểm tra hoạt động bình thường, chạy `sh legacy-home.sh confirm`. Lần cold boot kế tiếp mới chạy watcher lâu dài. Tùy chọn `sh legacy-home.sh wake-on` (thử nghiệm): chỉ kích hoạt sau trạng thái standby quan sát được chuyển sang Active; Quick Start có thể không phát sinh trạng thái này. Không bật mặc định.

## V8.3 — Khởi động thích ứng
Bỏ thời gian chờ cố định 45 giây. Từ khi Homebrew chạy hook, kiểm tra guard (không tự xóa failsafe), TV power Active và getForegroundAppInfo có appId hai lần liên tiếp cách nhau 1 giây. Giới hạn chờ 90 giây, chỉ thử launch một lần, không close khi boot; nếu Infiniti đã foreground thì chỉ xác minh lại. Sau launch kiểm tra foreground sau 2 giây. Timeout hoặc xung đột thì dừng, không mở lại liên tục. Không đảm bảo compositor đã render; phải quan sát màn hình thật. Thời gian tính từ hook, không phải nút nguồn. Standby giữ cơ chế riêng. Thử lại bằng disable, arm, reboot, quan sát log và xác nhận thủ công.
 
## Khôi phục
```sh
sh /home/root/lg-tv-vibehack/legacy-home.sh disable
sh /home/root/lg-tv-vibehack/safe-recovery.sh
```
Lệnh đầu gỡ cờ và hook V8 do dự án tạo. Lệnh thứ hai xử lý các hook và mapping cũ. Không khởi động lại trước khi đọc kết quả recovery. Không ghi rootfs, kernel, EIM hoặc grab thiết bị điều khiển.

## Quảng cáo và quyền riêng tư
Launcher không có quảng cáo. Customize > Privacy đã hỗ trợ ẩn biểu tượng và hướng dẫn DNS AdGuard thủ công, khôi phục DNS tự động. Homebrew startup có hạn chế telemetry riêng. Tắt Live Plus/ACR trong cài đặt TV nếu có. Không vô hiệu hóa/mount chồng gói hệ thống ACR khi chưa xác minh tác động HDMI và Live TV. Không cam kết chặn mọi quảng cáo trong app.

## Kiểm thử
V8.2: Python chỉ đọc phím và điều phối; Node.js xử lý JSON/Luna vì Python trên TV thiếu fcntl và json. Chạy `node /home/root/lg-tv-vibehack/legacy-luna.js probe` trước khi watch.

CI kiểm tra ES5, IPK, checksum và mô phỏng Luna stdin: giữ đầu ghi pipe mở tránh EOF khi daemon không có TTY. Đây không thay thế thử nghiệm vật lý. Không phát hành bản ổn định hoặc tự bật hook khi chưa nghiệm thu TV.

## V8.4
Home giảm thời gian chờ trước close/launch; wake kiểm tra 2 giây, giữ trạng thái standby qua lỗi truy vấn tạm thời, không suy đoán wake khi chưa thấy standby. IPK mới xác nhận DOM/layout và hai frame bằng challenge ngẫu nhiên qua HTTP loopback tạm thời; không phải bằng chứng màn hình vật lý. Nếu không nhận render trong 18 giây thì dừng, không retry boot. Khi enabled, đồng bộ catalog nền sau 10 giây rồi mỗi 120 giây, bảo toàn danh sách nếu Luna trống; giao diện đã có refresh mỗi 30 giây. Recovery lưu log V8 và vô hiệu hóa proof. Cần cài IPK và sidecar cùng phiên bản, không dùng V8.4 với IPK cũ. Wake và render chưa nghiệm thu vật lý.

## V8.5 RC2 — Designed by Tân Dev
Cold Boot đã được xác nhận qua Boot ID thay đổi và thông báo halt. Giữ failsafe, hai mẫu readiness, giảm polling xuống 500ms; không suy đoán Wake chỉ từ gián đoạn. Bỏ AI, trang Dev Mode và preset thời tiết; giữ tìm kiếm. Render đợi toàn bộ tile được tạo và class shown, không chứng minh tất cả ảnh decode hoặc màn hình vật lý. QR: `sh /home/root/lg-tv-vibehack/legacy-home.sh wallpaper-on` bật dịch vụ LAN có khóa, điện thoại cùng mạng, cổng 8090; `wallpaper-off` tắt dịch vụ managed. Khi enabled, dịch vụ tự chạy lại nếu đã bật cờ. Kiểm tra `/tmp/infiniti-wallpaper.log`. Không mở port ra Internet. Giữ nguyên app ID và thư mục dữ liệu để cập nhật tại chỗ. RC2 cần thử trên TV.

## Bảo trì sau V9.0 (ứng viên v1.6.1)
Log TV ngày 26/11/2026 xác nhận readiness 10,2s, render 1,5s/17 tile, watcher enabled. Giữ nguyên đường khởi động. Bản bảo trì giảm canvas icon xuống 1x1, sửa khôi phục icon gốc dưới bộ icon toàn cục, QR chỉ hiện khi heartbeat còn hạn (90s; ghi lại mỗi 30s), báo rõ ảnh đã lưu nhưng cần mở lại Launcher khi không xác nhận yêu cầu reload. Cần cài IPK và Root Tools đồng bộ; chưa nghiệm thu QR thực tế. Không nhúng ảnh thác nước do chưa chuyển được ảnh nhị phân vào repo.

- Icon gốc vuông/dọc: giữ tỷ lệ, căn giữa khung ngang 380×214; dùng màu nền đồng nhất nếu bốn mẫu mép ảnh tương đồng, nếu không giữ nền trung tính. Icon ngang 16:9 dùng toàn bộ vùng thẻ với contain; không crop hoặc kéo giãn. Giữ cache và hiệu ứng focus, kiểm thử vật lý còn cần thực hiện.

- Chế độ chờ Home: 60 giây mặc định, chọn Tắt/30/60/120/300 giây; tùy chọn mưa hoạt động khi Home rảnh, không chạy khi app khác che phủ hoặc giảm chuyển động. Phím đầu tiên thoát chế độ chờ, không mở app. Không điều khiển nguồn TV, không thay thế bảo vệ màn hình LG.

- Bộ icon: 21 hình khác nhau mỗi chủ đề, 5 chủ đề (105 tệp); tự phân biệt Netflix, YouTube, Spotify, Prime, Disney+, TikTok, Jellyfin và loại chức năng; giữ 45 tệp cũ để không mất tùy chỉnh. Icon dạng minh họa, không phải bộ logo chính thức. Các app không nhận diện được có thể vẫn dùng chung icon chức năng, hoặc chọn icon gốc.

- Chế độ chờ giữ đồng hồ, ngày âm/dương và thời tiết hiện tại theo tùy chọn hiển thị đã lưu. Chỉ ẩn hàng ứng dụng, nút chức năng, dự báo 3 ngày và các lớp trang trí Home. Không thay đổi lựa chọn hiển thị dự báo 3 ngày khi thoát chế độ chờ.

- Ứng viên v1.6.2: 7 hiệu ứng màn hình chờ (mưa, tuyết, cánh hoa, sao, đom đóm, bong bóng, sương) và ngẫu nhiên mỗi lần vào chờ. Bật/tắt riêng, giữ thời gian cũ và lựa chọn giảm chuyển động. Chỉ một lớp SVG lặp với CSS transform; không dùng âm thanh, canvas hay mạng. Giữ đồng hồ/lịch/thời tiết hiện tại; ẩn dock/dự báo 3 ngày; cần nghiệm thu trên TV thật.

- Khi vào màn hình chờ: dock thu 92% và trượt xuống, dự báo 3 ngày thu 94% và trượt lên, các nút chức năng mờ dần; 420ms. Thoát chờ khôi phục hiển thị. Không thay đổi đồng hồ/lịch/thời tiết hiện tại; giảm chuyển động thì ẩn ngay. Cần thử trên TV thật.

- Tùy chỉnh web: cùng Wi-Fi, bật wallpaper-on, vào Tùy chỉnh > Hình nền và quét QR hoặc dùng URL đầy đủ trên máy tính. Hỗ trợ chủ đề, chữ, hiển thị lịch/forecast, màn hình chờ, bộ icon, tên/icon có sẵn/ẩn-hiện từng app. Mailbox chỉ nhận trường hợp lệ, lưu thay đổi có revision và nhận phản hồi từ TV qua loopback có token. Chỉ áp dụng khi Home rảnh, không chiếm foreground. Cần nghiệm thu khả năng loopback/CORS trên webOS 3.4; nếu không có phản hồi, web báo chưa xác nhận. Không điều khiển shell, root, cài IPK hay nguồn TV. Không mở 8090 ra Internet. Cần cài IPK và Root Tools cùng bản.

- Album màn hình chờ: tối đa 20 JPEG (1,5 MB/ảnh), chọn nhiều ảnh trên web, thu 1920×1080, chuyển 15/30/60/120/300/600 giây hoặc ngẫu nhiên không lặp ngay. Album chỉ chạy khi idle, ảnh chính giữ nguyên. Chữ Designed by Tân Dev ở góc dưới phải. Root Tools lưu album trong DATA/idle-album; phục hồi tệp sau cập nhật qua dịch vụ wallpaper-on. Cần thử webOS thực tế; không công bố đã nghiệm thu.
