# Phát hành Infiniti TV Home v1.5.3 — Chế độ an toàn cho LG webOS 3.x

Phiên bản **v1.5.3** tập trung loại bỏ tranh chấp giao diện Home trên LG webOS 3.x đã root, đặc biệt khi nhấn Power/đánh thức TV. **Chưa được chứng nhận thực nghiệm trên TV từng gặp màn hình đen**: kiểm thử GitHub Actions không tương đương kiểm thử nguồn, standby, remote và HDMI thực tế.

## Tải về

Sau khi tất cả bước của GitHub Actions hoàn thành thành công, xem:
https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.3

Release chứa bốn tệp:

- `infiniti-tv-home.ipk` và `infiniti-tv-home.ipk.sha256`: ứng dụng và checksum.
- `infiniti-tv-home-root-tools-v1.5.3.zip` và `.zip.sha256`: bộ khôi phục PowerShell, `tv/*.sh`, `tv/*.js`, installer, hướng dẫn tiếng Việt.

**Cài một mình file IPK không sửa các script root đã chạy trên TV.** Khi TV còn lỗi màn hình đen, ưu tiên script cứu hộ trước khi cài hoặc nâng cấp bất kỳ thứ gì.

## Sửa lỗi trọng tâm

1. `boot.sh`: không ép mở Infiniti khi bật nguồn hoặc thức dậy, không gọi Home watcher hay monitor phím.
2. `homewatch.js`: bỏ **hoàn toàn** chức năng cướp foreground, kể cả tham số cũ `--boot`; chỉ giữ đọc danh sách ứng dụng.
3. `home-control.sh`: chặn `evdev-enable`, vì đọc trực tiếp `/dev/input/event3` không chặn được LG Home, có thể khiến Home mở chồng và chạy trùng; vẫn hỗ trợ `evdev-disable`.
4. `install.sh`: cài với **LG Home mặc định**, không tự ghi đè phím Home hoặc tự chạy UI. Tùy chọn `--enable-home` chỉ dùng khi chủ động thử nghiệm đã kiểm tra hai lần tắt/bật.
5. `safe-recovery.sh`: sao lưu log và cấu hình, chuyển `lg-tv-vibehack`, `97-homekey` ra khỏi thư mục startup; cấm tự khởi động trước khi thử restore keymap.
6. Mã thoát cứu hộ được phân loại:
   - `RECOVERY_COMPLETE` / 0: không có lỗi được phát hiện khi giải giáp boot và khôi phục keymap.
   - `RECOVERY_PARTIAL` / 2: đã vô hiệu hóa các startup đã biết, nhưng ánh xạ Home hoặc backup chưa phục hồi/kiểm chứng đầy đủ.
   - `RECOVERY_INCOMPLETE` / 1: chưa vô hiệu hóa được toàn bộ các startup đã biết.
7. Có công cụ PowerShell 7 truyền mã shell qua SSH, tránh dán `for/if` Linux vào PowerShell.

## Cứu hộ TV đang bị đen màn hình (Windows PowerShell 7)

Xem nội dung script cứu hộ trên GitHub trước khi chạy. Nếu TV còn SSH và đang dùng IP/SSH key tương ứng:

```powershell
$p = Join-Path $env:TEMP 'recover-lg-tv.ps1'; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/scripts/recover-lg-tv.ps1' -OutFile $p; pwsh -NoProfile -File $p -TV 192.168.2.154
```

Công cụ **không tự reboot**. Chỉ khởi động lại sau khi kiểm tra kết quả, đặc biệt nếu hiện `RECOVERY_PARTIAL` hay `RECOVERY_INCOMPLETE`.

Sau kết quả `RECOVERY_COMPLETE`, khởi động lại một lần để ngừng vòng lặp Home cũ đã chạy trong RAM. Kiểm tra Home LG hiển thị và bật/tắt nguồn ít nhất **hai chu kỳ**. Không bật `--enable-home` cho đến khi hoàn tất nghiệm thu thực tế.

**Không xóa LG Home, không sửa phân vùng hệ thống, không dùng lệnh factory-reset chưa xác minh.**

## Quy trình phát hành trên GitHub

- PR → chạy kiểm tra cú pháp shell, ES5, test tình huống recovery và mã Home, đóng gói.
- Gộp vào main bằng commit có tiền tố `release: publish verified v1.5.3`.
- CI main phải thành công mới tạo tag `v1.5.3` và phát hành IPK + bộ root-tools được kiểm SHA-256.
- Nếu Actions không phát hành tự động, kiểm tra CI và `workflow_dispatch` ở nhánh main; không tạo tag trùng hoặc tự công bố khi CI chưa xanh.

Ghi chú: Các hướng dẫn cũ của v1.5.2 về `--rebind-home` không còn phù hợp để bật mặc định trên một TV đã từng đen màn hình; phải đọc lại hướng dẫn v1.5.3 trước khi can thiệp phím Home.
