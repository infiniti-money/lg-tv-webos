# Tương thích các launcher LG với Infiniti TV Home (webOS 3.4)

Tài liệu đối chiếu các dự án tham khảo, không sao chép toàn bộ launcher
hoặc can thiệp trực tiếp TV. Trạng thái: nghiên cứu mã nguồn, không thay thế
nghiệm thu thực tế với Power, Quick Start+ và standby/wake trên TV LG đã root.

## 1. LG Input Hook (Simon34545)

Nguồn: https://github.com/Simon34545/lginputhook
Giấy phép: **BSD-3-Clause**. LG Input Hook yêu cầu TV có quyền root và
Homebrew Channel; phải mở ứng dụng ít nhất một lần rồi dùng **Save changes**.

- Hỗ trợ chính thức ba loại hành động: `Execute` (`action:"exec"`),
  `Launch App` (`action:"launch"`) và `Replace` (cùng `Disable`).
  **Cả `exec` và `launch` đều hợp lệ** theo mã nguồn upstream.
- Với TV đang chẩn đoán, mã Home đã được xác minh
  **HEX `0305` = thập phân `773`**.
- Infiniti ưu tiên `{"773":{"action":"exec","command":
  "/home/root/lg-tv-vibehack/golauncher.sh"}}` vì script đã có nhật ký
  `/tmp/infiniti-homekey.log`, kiểm tra phản hồi Luna và phục hồi từ bản sao.
  Ánh xạ `launch` lịch sử đến chính ID `com.infinitimoney.tvhome` vẫn
  được `keymap.js` nhận diện để sao lưu/khôi phục an toàn.
- Đã lưu cấu hình **không chứng minh** đã chặn được giao diện Home hệ thống.
  Không bật song song `97-homekey`, evdev và vòng lặp `homewatch.js`.
- Không sao chép thư viện inject nhị phân từ upstream vào Infiniti; giữ
  Input Hook như một phụ thuộc cài đặt riêng.

## 2. Luma (ecklf)

Nguồn: https://github.com/ecklf/lg-luma
Giấy phép: **MIT**. Trình launcher native riêng dành cho TV LG đã root.

- Luma tách **autostart** khỏi **Home takeover**; đây là nguyên tắc hữu ích.
- Tài liệu Luma cho biết Home takeover được hỗ trợ cho
  **webOS 5, 6, 25, 26**; ngay cả một số TV webOS 4 có trường hợp
  launcher chạy được nhưng không thay thế Home.
- **Không áp dụng** `home.sh enable`, bind-mount qua app Home hệ thống,
  thay thế `/usr/bin/com.webos.app.home`, hoặc kỹ thuật patch compositor
  từ Luma lên TV **webOS 3.4** chưa được xác minh.
- Infiniti sử dụng `boot-home-once.sh` hiện có:
  thử cold boot một lần, tiêu thụ cờ thử trước khi mở, chờ kiểm tra,
  không chiếm foreground khi resume; `safe-recovery.sh` giữ rollback.
- Có thể tham khảo ý tưởng UI của Luma, nhưng không nhúng SDL/Rust ARM,
  native binary và boot hook vào gói app webOS 3 mặc định.

## 3. Free My TV (simbasjungles)

Nguồn: https://github.com/simbasjungles/free-my-tv
Giấy phép: **MIT**. Dự án đa nền tảng, có ứng dụng webOS riêng.

- Trên **webOS 3**, một ứng dụng chưa được cấp quyền phù hợp có thể
  **không đọc được danh sách ứng dụng đã cài**. Free My TV giải quyết bằng
  máy tính/SSAP, rồi đóng gói app và icon để cài qua Developer Mode.
- Infiniti đã có `sync-apps.py` và `install-noroot.sh`; quy trình
  vẫn cần người dùng xác nhận ghép đôi trên TV. Cải tiến mới giữ nguyên
  ứng dụng nếu tải icon lỗi (dùng `icon.png`), chặn tải icon từ host lạ,
  hạn chế 2 MiB và không ghi đè `apps.js` bằng kết quả rỗng tạm thời.
- Tệp `app/apps.js` được ghi nguyên tử để tránh danh sách mất giữa chừng.
  Đây là tối ưu cho **TV không root**; TV có root tiếp tục dùng
  `node /home/root/lg-tv-vibehack/sync.js`.
- Remote **Quick Access** của LG (giữ một phím số khi app đang mở)
  là lựa chọn để mở launcher mà không chặn phím Home hoặc sửa hệ thống.
- Không sao chép các quyền ADB, app Android hoặc thao tác tắt launcher gốc
  từ phần Google TV của Free My TV sang webOS.

## 4. Lệnh chẩn đoán an toàn trên TV đã root

Dùng một phiên SSH **đã đăng nhập trên TV**:

```sh
sh /home/root/lg-tv-vibehack/home-control.sh diagnose
sh /home/root/lg-tv-vibehack/integration-diagnostics.sh
```

Script mới chỉ đọc app đã cài, mã phím **773** và các dấu vết
`lginputhook`, `luma-home`, `97-homekey`, `homewatch` hay
`free-my-tv`. Không tiết lộ các phím khác, mật khẩu, token Developer
Mode, không tự chạy Home, thay mapping, mount, khởi động lại hoặc reboot.

**Cảnh báo ưu tiên:** TV trước đây đã bị đen màn hình sau Power.
Nếu gặp lại, chỉ chạy `safe-recovery.sh` qua SSH khi vẫn truy cập được,
đọc trạng thái `RECOVERY_COMPLETE` / `RECOVERY_PARTIAL` /
`RECOVERY_INCOMPLETE` trước khi khởi động lại. Không gỡ LG Home gốc.

## 5. Phạm vi mã nguồn và bản quyền

Các thay đổi trong Infiniti được viết lại dựa trên phân tích hành vi và
tương thích, **không chứa tệp hoặc thư viện từ ba repository upstream**.
Giữ nguyên tên, đường dẫn nguồn, thông tin giấy phép để người phát triển
có thể kiểm tra quyền tái sử dụng nếu sau này muốn tích hợp sâu hơn.

Việc kiểm tra GitHub Actions chỉ đánh giá cú pháp, cấu trúc, giả lập
ứng dụng/điều khiển; **chưa xác nhận khả năng chạy và khôi phục trên TV
thật**.
