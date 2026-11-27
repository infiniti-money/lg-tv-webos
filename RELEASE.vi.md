# v1.7.9 — Loader và symbol interposition

[Xem ghi chú](RELEASE_NOTES_v1.7.9.md). Chưa nghiệm thu trên LG.

# v1.7.8 — Lab cycle và loader audit

[Xem ghi chú](RELEASE_NOTES_v1.7.8.md). Chưa nghiệm thu trên LG.

# v1.7.7 — Sửa liên kết pthread trên glibc 2.19

[Xem ghi chú](RELEASE_NOTES_v1.7.7.md). Chưa nghiệm thu trên LG.

# v1.7.6 — Chẩn đoán Native Hook, thử nghiệm đa luồng

[Quy trình](RELEASE_NOTES_v1.7.6.md). Tạm dừng inject tiến trình LG thật.

# v1.7.5 — Native Home 773, thử nghiệm vật lý

[Xem quy trình và phục hồi](RELEASE_NOTES_v1.7.5.md). Chưa nghiệm thu phần cứng.

# v1.7.4 — Native Lab: sửa thoát đa luồng và BusyBox

Xem [ghi chú v1.7.4](RELEASE_NOTES_v1.7.4.md). Chưa nghiệm thu Home vật lý.

# v1.7.3 — Native Thumb Lab (ứng viên)

[Hướng dẫn](RELEASE_NOTES_v1.7.3.md).

# v1.7.2 — Native Home verification (ứng viên)

[Hướng dẫn thử nghiệm](RELEASE_NOTES_v1.7.2.md).

# v1.7.1 — Infiniti Home V9.1 (ứng viên)

[Hướng dẫn thử nghiệm và giới hạn](RELEASE_NOTES_v1.7.1.md).

# v1.7.0 — Infiniti Home V9 (ứng viên)

[Xem ghi chú thử nghiệm](RELEASE_NOTES_v1.7.0.md). Chưa nghiệm thu TV thật.

# v1.6.7 — Designed by Tân Dev (ứng viên)

Xem [ghi chú v1.6.7](RELEASE_NOTES_v1.6.7.md). Home chọn cơ chế theo foreground; cần nghiệm thu trực quan trên TV thật.

# v1.6.6 — Designed by Tân Dev (prerelease)

Xem [ghi chú v1.6.6](RELEASE_NOTES_v1.6.6.md). Home đơn dùng fast relaunch; Home liên tiếp dùng đường phục hồi có giới hạn. Chưa nghiệm thu lớp LG ribbon trên TV thật.

> Lịch sử phiên bản. Xem [hướng dẫn hiện hành](docs/owner-guide.vi.md); các tên và lệnh cũ chỉ mang tính tham chiếu lịch sử.

# v1.6.5 — Designed by Tân Dev (prerelease)

Xem [ghi chú v1.6.5](RELEASE_NOTES_v1.6.5.md). Ưu tiên relaunch không đóng ứng dụng; cần kiểm tra thời gian LG ribbon trên TV thật.

# v1.6.4 — Designed by Tân Dev (prerelease)

Xem [ghi chú v1.6.4](RELEASE_NOTES_v1.6.4.md). Home bất đồng bộ, hàng đợi giới hạn; cần nghiệm thu TV lại.

# v1.6.3 — Designed by Tân Dev (prerelease)

Xem [ghi chú v1.6.3](RELEASE_NOTES_v1.6.3.md) và [lộ trình nghiệm thu](docs/release-spec-v1.6.3.vi.md). IPK và Root Tools phải cùng build. Đã phát hành prerelease; bản ổn định vẫn là v1.6.2.

# v1.6.2 — Designed by Tân Dev

Xem RELEASE_NOTES_v1.6.2.md. Cài IPK và Root Tools đồng bộ qua SSH; không có mục Cập nhật trên TV.

# v1.6.1 — Designed by Tân Dev

Xem RELEASE_NOTES_v1.6.1.md để cài đặt và biết giới hạn kiểm thử.

## v1.6.0 — Legacy Home V8 (bản thử nghiệm)

Xem [ghi chú v1.6.0](RELEASE_NOTES_v1.6.0.md) và [hướng dẫn TV webOS 3.4.3](docs/legacy-home-v8.vi.md). Chưa phát hành ổn định.

# Infiniti TV Home v1.5.9 — Quay về Home LG an toàn, bỏ Autostart EIM không hiệu quả

- **Thu hồi thử nghiệm phụ Autostart 0.1.5:** phiên bản đã không khắc phục được tình trạng chuyển Live TV và màn hình bi lăn trên TV webOS 3.4.x. Không còn đóng gói IPK Autostart cùng Release mới.
- **Thay bằng cơ chế gọi Homebrew từ máy tính trong LAN:** công cụ `scripts/tv-service-wake.py` sử dụng kết nối SSAP WebSocket 3001, gọi ứng dụng Homebrew Channel khi cả SSH 22 và Glasshouse 8080 chưa chạy. Không chỉnh EIM, không ép chuyển Live TV và không thay Homebrew Channel chính thức.
- **Giữ nguyên các sửa Glasshouse trước đó**, phiên bản giao diện TV Home và chức năng thời tiết.
- Tệp khôi phục và hướng dẫn: `docs/revert-autostart-and-host-wake.vi.md`.
- Không thể tự hoàn tác Autostart đã cài trên TV chỉ bằng cập nhật IPK Infiniti; cần kiểm tra đăng ký EIM trước khi gỡ app.

Bản phát hành: https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.9

---

## Lịch sử — v1.5.8

# Infiniti TV Home v1.5.8 — Glasshouse Custom và Autostart phụ an toàn hơn

- **Glasshouse lifecycle:** gộp PR #24, PR #25 và PR #26; dừng tác vụ khi Custom Launcher bị che, giảm làm mới lặp sau khi TV thức dậy; giữ trạng thái thời tiết và danh sách app.
- **Autostart độc lập 0.1.5 (thử nghiệm):** thêm chuyển màn hình về nguồn vào trước đó với số lần thử và thời hạn rõ ràng, tự đóng cửa sổ phụ; kiểm tra EIM overlay bằng inode, không dùng mỗi lệnh `findmnt`.
- Homebrew Channel chính thức v0.7.3 vẫn nguyên trạng, không thay LG Home, không tự bật Home khi boot.
- Chưa có xác nhận thực tế rằng bản Autostart mới xử lý hoàn toàn màn hình bi lăn trên TV webOS 3.4.x. Sao lưu EIM trước khi cài; các tệp IPK có checksum SHA-256.

Bản phát hành: https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.8

---

## Lịch sử — v1.5.7

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
