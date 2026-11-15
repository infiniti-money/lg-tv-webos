# Khôi phục Autostart cũ và dùng máy tính bật dịch vụ Homebrew — webOS 3.4.x

## Vì sao thay đổi

Thử nghiệm Autostart companion v0.1.5 (phát hành kèm Infiniti v1.5.8) **không khắc phục được** lỗi chuyển về Live TV trên TV thực tế. Bản mới không còn phát hành IPK Autostart và **không áp dụng thêm EIM overlay**.

Lỗi màn hình bi lăn đã xảy ra cả với Autostart 0.1.4 trên webOS 3.4.x, vì vậy chỉ hạ xuống 0.1.4 chưa chắc sửa được vấn đề. Hãy xử lý việc hoàn tác EIM riêng, với bản sao lưu và kiểm tra đầy đủ. Không tự xóa \`/var/lib/eim\`, không dùng \`umount\` khi chưa xác minh mount thực tế.

## Khôi phục phiên trước an toàn

1. Đưa TV về màn hình sử dụng bình thường bằng thao tác nút nguồn đã hoạt động với TV của bạn; đừng khởi động lại liên tiếp.
2. Khi SSH hoạt động, lưu trạng thái **chỉ đọc**:

\`\`\`sh
date; uptime
cat /proc/self/mountinfo | grep ' /var/lib/eim '
stat -c '%d:%i %n' /var/lib/eim /var/lib/webosbrew/eim
ls -ld /home/root/autostart-backup/eim-before
cat /var/lib/eim/lastinput
\`\`\`

3. Nếu muốn trở lại **bản ứng dụng phụ cũ 0.1.4** ngay, tải bản gốc từ https://github.com/speed47/webosbrew-autostart/releases/tag/v1.0.4 và cài đè IPK bằng webOS Dev Manager khi TV đang hoạt động. **Không gỡ Homebrew Channel.** Việc hạ phiên bản không tự xóa đăng ký nguồn vào EIM.
4. Phương án **ổn định hơn** là vô hiệu hóa đăng ký EIM bằng script rollback có chế độ xem trước. Script này nằm trong bộ root-tools mới, không tự chạy khi cập nhật IPK:

\`\`\`sh
sh /home/root/lg-tv-vibehack/autostart-rollback.sh --inspect
\`\`\`

Chỉ khi có bản sao lưu \`eim-before\`, xác nhận mount đúng và đã đọc nội dung script, chạy:

\`\`\`sh
sh /home/root/lg-tv-vibehack/autostart-rollback.sh --disable
\`\`\`

Script sẽ sao lưu thêm EIM, chỉ tháo bind-overlay khi nhận diện đúng, sao lưu EIM gốc, rồi yêu cầu webOS gỡ đăng ký Autostart khỏi EIM thật bằng API. Nếu thất bại hoặc mount bất thường, **không reboot hay gỡ ứng dụng**. Chỉ khi API thông báo thành công mới gỡ **ứng dụng phụ Autostart** bằng webOS Dev Manager. Nếu script chưa có trên TV, chép riêng từ bộ root-tools mới; không dùng lệnh --disable trước khi kiểm tra.

## Bật Homebrew từ Windows thay vì EIM/Autostart

Yêu cầu: PC cùng LAN, Python 3, và thư viện \`websockets\`:

\`\`\`powershell
py -m pip install websockets
py scripts/tv-service-wake.py --tv 192.168.2.154 --status
py scripts/tv-service-wake.py --tv 192.168.2.154
\`\`\`

- Lần đầu, TV hiển thị yêu cầu ghép đôi: **chấp nhận trên TV**. Khóa ghép đôi lưu ở \`.lgtv-key.json\` (gitignored, không chia sẻ).
- Máy tính kết nối **cổng remote 3001** và chỉ khi **cả SSH 22 lẫn Glasshouse 8080 đang tắt**, gọi \`ssap://system.launcher/launch\` cho \`org.webosbrew.hbchannel\`.
- Homebrew Channel sẽ xuất hiện tạm trên TV và thực thi startup script root hiện có; sau đó SSH/Glasshouse cùng các dịch vụ Infiniti có thể khởi động.
- **Không mở Live TV tự động**, không chiếm hoặc đóng Homebrew Channel, không đụng EIM, không cài sửa ứng dụng LG.
- Chỉ dùng \`--watch\` sau khi chế độ thủ công đã hoạt động: \`py scripts/tv-service-wake.py --tv 192.168.2.154 --watch\`. Máy tính cần bật; mỗi lần thấy TV offline rồi online chỉ thử một lần. Tắt bằng Ctrl+C.
- Nếu TV chỉ dùng standby và remote 3001 không tắt, watch có thể không thấy chu kỳ mới; trường hợp đó chạy lệnh thủ công khi cần.

## Bật các dịch vụ Infiniti như khi cài bằng root

Trên SSH root, sau khi kiểm tra ổn định, có thể dùng bộ cài **chính thức của repository Infiniti** với cờ chỉ bật dịch vụ hình nền:

\`\`\`sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh -o /tmp/infiniti-install.sh
sh /tmp/infiniti-install.sh --wallpaper-service
\`\`\`

Nếu muốn cập nhật IPK tự động (tính năng khác, có thể phát sinh tải mạng), dùng \`--auto-update\` **thay** cho \`--wallpaper-service\`. Không thêm \`--enable-home\`, \`--start-home-on-boot\` hay script đổi Home cũ. Các dịch vụ đăng ký trong Homebrew \`init.d\` **chỉ chạy sau khi Homebrew startup được kích hoạt** — script trên Windows giải quyết đúng bước kích hoạt này.

## Giới hạn và rollback

Đây là giải pháp dựa vào PC/thiết bị LAN luôn hoạt động, không phải tự khởi động độc lập 100% trên TV. Không có mã nào được gửi tới TV từ GitHub hoặc CI. Nếu không cần tự động, chỉ dùng một lần thủ công khi bật TV. Giải pháp thay thế tiếp theo là dùng ActivityManager trên webOS 3 không qua EIM, nhưng phải thử riêng và có phương án rollback; bản Homebrew Channel v0.7.3 hiện không bao gồm PR #230.
