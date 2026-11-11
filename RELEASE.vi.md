# Infiniti TV Home v1.5.7 — Ẩn ứng dụng LG và hướng dẫn chặn quảng cáo DNS

- Tùy chỉnh → Ứng dụng → **Ẩn nhanh ứng dụng LG mặc định**: ẩn biểu tượng app LG trong Infiniti, không xóa gói hệ thống, không thay Home LG. Từng ứng dụng có thể hiện lại hoặc khôi phục cấu hình mặc định.
- **Tùy chỉnh → Chặn quảng cáo**: hướng dẫn cấu hình DNS AdGuard theo cách thủ công tại Cài đặt mạng TV. DNS chính `94.140.14.14`, DNS phụ `94.140.15.15`. Đổi về DNS tự động nếu chức năng LG Store hoặc mạng bị lỗi.
- Không chỉnh `/etc/hosts`, firewall, `init.d`, phân vùng root, Developer Mode, LG Home hay hành vi khởi động. Không có tác vụ cài adblock tự động khi cài IPK.
- Bổ sung kiểm thử tương thích ES5/webOS 3.4, thao tác ẩn/khôi phục, CSS tab và kiểm soát không thay đổi root.
- TV đã từng bị màn hình đen sau Power/standby: **chưa nghiệm thu trực tiếp trên TV thực tế**. Không tự động triển khai hoặc bật lại Home takeover.

Bản phát hành: https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.7

---

## Lịch sử — v1.5.6

# Infiniti TV Home v1.5.6 — Dev Mode Forever và chẩn đoán an toàn

Bản v1.5.6 bổ sung mục **Tùy chỉnh → Dev Mode** để phát hiện và mở ứng dụng **LG Dev Mode Forever** đã cài riêng. Người dùng phải xác nhận **hai lần nhấn** để mở, vì watchdog của ứng dụng đi kèm có thể **khởi động lại TV** khi kiểm tra phiên Developer Mode hoặc bộ đếm tắt nguồn. Infiniti không tự cài hoặc tự kích hoạt dịch vụ Developer Mode.

Nguồn ứng dụng đi kèm: https://github.com/infiniti-money/lg-devmode-forever — cần build và cài độc lập theo hướng dẫn dự án, giữ ứng dụng Developer Mode chính thức của LG.

Đã sửa mục Xử lý sự cố: tách lưới app trống khỏi lỗi màn hình đen, hướng dẫn `safe-recovery.sh`; mã phím Home chính xác **0305 (HEX) / 773**, ánh xạ **Execute `golauncher.sh`**; bỏ yêu cầu chạy Home Watcher; phân biệt cold boot và standby. Không tự xóa LG Home hoặc sửa hệ thống.

**Chưa nghiệm thu Dev Mode Forever trên TV LG webOS 3.4.0 đã từng đen màn hình sau Power.** Không chạy thao tác có thể khởi động lại TV khi thiết bị chưa ổn định. Bộ phát hành này chỉ có Infiniti IPK và bộ cứu hộ root, không đóng gói IPK của Dev Mode Forever.

Phiên bản: https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.6

---

## Lịch sử — v1.5.5

# Phát hành Infiniti TV Home v1.5.5 — Home 0305 / 773

- **Phím Home remote:** `0305` HEX = `773` thập phân. LG Input Hook mở `com.infinitimoney.tvhome` thông qua lệnh `golauncher.sh`, sao lưu ánh xạ trước đó.
- **Tự khởi động Infiniti:** bật có chủ đích bằng `--enable-home --start-home-on-boot`, chỉ chạy **một lần ở lần khởi động lạnh đầu tiên**. Chờ 55 giây cho hệ thống, không thực hiện vòng lặp, không đọc /dev/input/event3.
- **An toàn màn hình đen:** phải xem TV hiển thị bình thường rồi chạy `home-control.sh boot-confirm` mới duy trì việc tự mở ở các lần khởi động lạnh sau. Nếu không xác nhận, lần khởi động lạnh kế tiếp về Home LG. Không ép tự mở khi TV thức dậy khỏi standby.
- **Khôi phục:** `home-control.sh boot-disable` giữ phím Home nhưng tắt tự khởi động. `safe-recovery.sh` vô hiệu hóa tất cả cờ và cố phục hồi ánh xạ Home, không xóa Home LG.
- **Chưa nghiệm thu trên TV vật lý**: GitHub CI chỉ kiểm tra mã và giả lập các lần cold boot. Kiểm tra lại lỗi đen màn hình trước khi xác nhận.

Trên phiên SSH root của TV đã chạy ổn định:

```sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh -o /tmp/infiniti-install.sh
sh /tmp/infiniti-install.sh --enable-home --start-home-on-boot
```

Sau khi đã lưu LG Input Hook, thử Home và xác nhận lần boot thử hiển thị tốt:

```sh
sh /home/root/lg-tv-vibehack/home-control.sh boot-confirm
```

Tải phiên bản và bộ công cụ root: https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.5

---

## Lịch sử — v1.5.4

# Phát hành Infiniti TV Home v1.5.4

**Gộp biểu tượng lớn bo tròn, hình nền trong Tùy chỉnh và cập nhật ứng dụng tự động có xác minh.**

- Biểu tượng dock một hàng lớn hơn khoảng 10–12%, bo góc mềm 24px, giữ nền trong suốt và điều hướng remote.
- Hình nền chuyển về **Tùy chỉnh → Giao diện → Hình nền**. Mã QR mở trang điện thoại để chọn ảnh, ảnh từ USB, hoặc xóa hình nền. Không còn nút hình ảnh rời trên thanh trên.
- TV đã root có thể tự nhận bản mới từ GitHub Releases sau khi bật rõ ràng tùy chọn `--auto-update`. Bộ cập nhật kiểm tra mỗi 12 giờ, chờ 20 phút sau khi bật nguồn, kiểm SHA-256 và chỉ cài khi ứng dụng Infiniti không ở foreground, không có chiếm quyền Home LG; hoãn bản major khác.
- Tùy chọn `--wallpaper-service` chỉ bật dịch vụ hình nền qua điện thoại, không bật cập nhật tự động.
- **Bảo vệ TV:** vẫn giữ Home LG, không tự mở Infiniti lúc khởi động hoặc standby/wake; `safe-recovery.sh` có thể tắt luôn dịch vụ cập nhật mới. Tự cập nhật chỉ thay IPK, không ghi đè các script root.

**Lưu ý:** CI đã được bổ sung kiểm thử để hạn chế lỗi; chưa xác nhận trên TV LG thực tế từng đen màn hình sau Power. Chỉ bật dịch vụ nền sau ít nhất hai chu kỳ nguồn/standby/wake bình thường. File IPK tải riêng không kích hoạt updater: cần cập nhật root tools bằng trình cài đặt từ `main`.

Sau khi TV ổn định, đăng nhập SSH root:

```sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh -o /tmp/infiniti-install.sh
sh /tmp/infiniti-install.sh --auto-update
```

Xem trạng thái: `sh /home/root/lg-tv-vibehack/auto-update.sh --status`.

Bản phát hành: https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.4

---

## Lịch sử — bản v1.5.3

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
