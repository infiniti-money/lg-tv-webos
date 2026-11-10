<div align="center">

# Infiniti TV Home

**Màn hình chính kiểu Apple TV cho TV LG webOS, có nút Home thật, thời tiết và hình nền riêng.**

*Dự án Infiniti Money dành cho TV LG webOS. Mã nguồn, cập nhật và bản phát hành chính thức đều tại repository này.*

[![Release](https://img.shields.io/github/v/release/infiniti-money/lg-tv-webos?style=flat-square)](https://github.com/infiniti-money/lg-tv-webos/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![webOS](https://img.shields.io/badge/webOS-3.x%2B%20(tuong%20thich%20ma%20nguon)-a50034?style=flat-square)](#tv-đã-thử-nghiệm)
[![Root](https://img.shields.io/badge/root-optional-555?style=flat-square)](#root-hay-không-root)

[English](README.md) · **Tiếng Việt**

<img src="docs/media/hero.jpg" alt="Giao diện Infiniti TV Home trên LG webOS (ảnh minh họa từ dự án)" width="860">

</div>

---

## Mục lục

- [Tính năng](#tính-năng)
- [Root hay không root?](#root-hay-không-root)
- [Cài trên TV đã root (khuyên dùng)](#cài-trên-tv-đã-root-khuyên-dùng)
- [Cài không cần root](#cài-không-cần-root)
- [Tuỳ chỉnh: hình nền, thời tiết, ngôn ngữ](#tuỳ-chỉnh-hình-nền-thời-tiết-ngôn-ngữ)
- [Cài thêm app từ Homebrew Channel](#cài-thêm-app-từ-homebrew-channel)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Gỡ cài đặt](#gỡ-cài-đặt)
- [TV đã thử nghiệm](#tv-đã-thử-nghiệm)
- [Cảm ơn](#cảm-ơn)
- [Ủng hộ](#ủng-hộ)

## Tính năng

**Tương thích dữ liệu cũ:** Các đường dẫn trên TV dạng `/home/root/lg-tv-vibehack/` được giữ nguyên có chủ đích để không làm hỏng cấu hình, hình nền, ánh xạ Home và quá trình cập nhật của bản đã cài. Đây không phải địa chỉ tải phần mềm từ dự án cũ.

- **Giao diện gọn kiểu tvOS:** hàng dock ghim app, lưới app, và một khung kính lướt mượt giữa các ô.
- **Nút Home thật** (TV đã root, kích hoạt thủ công): chỉ cấu hình sau khi xác minh TV tắt/bật nguồn bình thường; không can thiệp vào Home LG theo mặc định.
- **Đổi hình nền bằng điện thoại** (TV đã root): bấm nút hình ảnh, quét mã QR, chọn ảnh rồi cắt
  trong khung đúng tỉ lệ TV, có đánh dấu chỗ đồng hồ và hàng app sẽ nằm. Lấy ảnh từ USB cắm TV cũng được.
- **Thời tiết** theo thành phố, miễn phí, không cần tài khoản ([Open-Meteo](https://open-meteo.com)).
  Đổi thành phố ngay trên trang điện thoại đó, gõ tiếng Việt có dấu được.
- **Tiếng Việt hoặc tiếng Anh**, đồng hồ 12 h hoặc 24 h.
- **4 đến 10 ô mỗi hàng:** bấm cây bút cạnh hàng dock rồi chọn số.
- **Khởi động an toàn:** không tự chiếm màn hình lúc bật nguồn hoặc thức dậy từ chế độ chờ. Đã loại bỏ tự mở launcher ở thời điểm này để tránh lỗi màn hình đen trên webOS 3.x.
- **Danh sách app tự cập nhật** (TV đã root): cài hay xoá app, khởi động lại TV là launcher tự cập nhật.
- **Sắp xếp app dễ dàng:** bấm cây bút cạnh dock → **Sắp xếp ứng dụng**, bấm vào app, trỏ tới chỗ mới
  rồi bấm lần nữa. Hoặc giữ OK trên 1 ô (dùng được cả con trỏ lẫn phím mũi tên).
- **Không theo dõi, không quảng cáo, không tài khoản.** Chỉ dùng HTML, CSS, JavaScript.

<p align="center">
  <img src="docs/media/home-button.gif" alt="Bấm Home vào thẳng launcher" width="420">
  <img src="docs/media/wallpaper-weather.jpg" alt="Hình nền và thời tiết" width="420">
</p>


## Cứu hộ màn hình đen khi bật nguồn — ưu tiên cao

Áp dụng với các TV LG đã root từng chạy Infiniti TV Home hoặc script thí nghiệm /var/lib/webosbrew/init.d/97-homekey có sleep 25. Các nguyên nhân có thể: nhiều chương trình cùng mở Home khi bật TV; script cũ chạy sau 25 giây; ánh xạ LG Input Hook chưa được khôi phục. Đây là biện pháp loại trừ tác nhân phần mềm, **không khẳng định khắc phục được lỗi phần cứng**.

Bộ cài từ commit sửa lỗi này chạy **chế độ an toàn mặc định**: giải giáp script autostart cũ, bảo toàn LG Home, và chỉ cài app (không mở ngay, không bật Home key, không khởi chạy lại khi TV thức dậy).

### Cứu hộ từ Windows PowerShell 7 — không dán lệnh Linux vào PowerShell

Nếu TV còn mở SSH trên IP \`192.168.2.154\` và đã có khóa \`$env:USERPROFILE\.ssh\infiniti_tv_rsa\`, chạy **một dòng** sau tại dấu nhắc \`PS C:\...>\`:

\`\`\`powershell
$p = Join-Path $env:TEMP 'recover-lg-tv.ps1'; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/scripts/recover-lg-tv.ps1' -OutFile $p; pwsh -NoProfile -File $p -TV 192.168.2.154
\`\`\`

Nên xem nội dung file GitHub trước khi chạy. Công cụ tải script cứu hộ và gửi tới TV bằng \`ssh.exe -T -i ... sh -s\` qua stdin; không yêu cầu PowerShell phân tích cú pháp Linux. **Không tự reboot**. Khi thấy \`RECOVERY_COMPLETE\`, kiểm tra cảnh báo, rồi mới chạy:

\`\`\`powershell
ssh.exe -i "$env:USERPROFILE\.ssh\infiniti_tv_rsa" root@192.168.2.154 reboot
\`\`\`

Nếu PowerShell in \`>>\` nghĩa là còn đang nhập lệnh nhiều dòng: nhấn Ctrl+C rồi dán chính xác dòng lệnh PowerShell trên. Tên khóa, IP có thể thay đổi trên TV khác: \`-TV x.x.x.x -KeyPath C:\...\`.

### Cứu hộ trực tiếp trong SSH root

\`\`\`sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/tv/safe-recovery.sh -o /tmp/infiniti-safe-recovery.sh
sh /tmp/infiniti-safe-recovery.sh
\`\`\`

Bộ cứu hộ (idempotent):
- Lưu log, bản sao keybinds và backup Home tại \`/home/root/infiniti-tv-recovery/<timestamp>/\`.
- Chuyển \`lg-tv-vibehack\` và \`97-homekey\` ra khỏi \`/var/lib/webosbrew/init.d\` thay vì xóa.
- Vô hiệu hóa \`home-enabled\`, \`home-event-device\`, \`boot-services-enabled\` trước khi cố phục hồi ánh xạ phím.
- Ngừng Home watcher và event monitor; nếu keybind xung đột vẫn **không** kích hoạt lại launcher.
- Chừa nguyên ứng dụng LG, dữ liệu Infiniti, Homebrew và SSH.

Script \`97-homekey\` cũ có vòng lặp nền nên **phải khởi động lại một lần** để dừng tiến trình đã chạy trong bộ nhớ. Nếu TV không phản hồi SSH hoặc đen màn hình ngay cả khi đã tắt hết script, kiểm tra nguồn, tín hiệu, backlight và dịch vụ sửa chữa; không chạy factory reset SSH không xác minh hoặc xóa compositor.

### Chỉ kích hoạt lại Home khi đã kiểm thử TV ổn định

Sau 2 chu kỳ tắt/bật nguồn thành công, có thể *chủ động* chọn Home interception (vẫn giữ LG Home dự phòng):

\`\`\`sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh -o /tmp/infiniti-install.sh
sh /tmp/infiniti-install.sh --enable-home
\`\`\`

Chỉ chọn thêm \`--rebind-home\` nếu nhận lỗi ánh xạ và biết rõ ánh xạ hiện có cần thay. Các cờ này **không** bật ứng dụng ở thời điểm boot/wake. Cấu hình Input Hook phải được kiểm tra trên remote và lưu trong giao diện của LG Input Hook.

Muốn khôi phục chế độ an toàn: \`sh /home/root/lg-tv-vibehack/safe-recovery.sh\`. Giữ nguyên LG Home như phương án cứu hộ.

## Root hay không root?

Cả hai đều dùng được. **Root cho trải nghiệm tốt hơn nhiều**, vì webOS chỉ cho app có quyền cao
đổi nút Home hoặc tự chạy khi bật TV.

| | TV đã root | Không root (Developer Mode) |
|---|:---:|:---:|
| Launcher có dock, lưới app, khung kính | ✅ | ✅ |
| Hình nền, thời tiết, ngôn ngữ, đồng hồ, số cột | ✅ | ✅ |
| Đổi hình nền, thành phố thời tiết **bằng điện thoại** (mã QR) | ✅ | ❌ sửa `config.js` |
| Cài bằng **1 lệnh**, không cần máy tính | ✅ | ❌ cần máy tính |
| **Nút Home** mở launcher | ⚠️ cần bật thủ công sau khi nghiệm thu | ❌ (dùng phím tắt số) |
| Tự mở khi bật TV | ❌ tạm tắt để bảo vệ khởi động | ❌ |
| Danh sách app tự cập nhật | ✅ | ❌ phải chạy lại trình cài |
| Dùng vĩnh viễn | ✅ | ⚠️ Developer Mode hết hạn, phải gia hạn |
| Chặn quảng cáo, theo dõi của LG (app *Life's Good Without Spying*) | ✅ | ❌ |
| Rủi ro cho TV | Thấp | Không có |

Chưa biết TV mình root được không? Xem **[rootmy.tv](https://rootmy.tv)** và
**[hướng dẫn root của webOS Homebrew](https://www.webosbrew.org/rooting/)**. Tuỳ phiên bản firmware.

## Cài trên TV đã root (khuyên dùng)

**Cần có:** TV LG đã root, có **Homebrew Channel**, và một điện thoại hoặc máy tính cùng Wi-Fi.

### 1. Bật SSH (làm 1 lần)

Trên TV, mở **Homebrew Channel → Settings (⚙)**, bật:

- **SSH Server**
- **Block system updates** (bản cập nhật của LG có thể làm mất root)

Kiểm tra **Root status** là **ok**, rồi bấm **System reboot**.

<img src="docs/media/homebrew-settings.jpg" alt="Cài đặt Homebrew Channel" width="300">

Xem IP của TV: **Cài đặt → Mạng → (Wi-Fi hoặc Có dây) → Nâng cao**. IP có dạng `192.168.1.50`.

### 2. (Tuỳ chọn) Cài LG Input Hook

Muốn **nút Home** mở Infiniti, trước tiên phải kiểm tra TV ổn định sau ít nhất 2 lần tắt/bật nguồn. Sau đó mới cài **LG Input Hook**, mở một lần rồi chạy bộ cài với cờ `--enable-home`. Mặc định bộ cài **không thay thế phím Home** và không tự khởi động launcher. Nếu có script `97-homekey` cũ, phải sao lưu/vô hiệu hóa trước khi thử.

### 3. Chạy 1 lệnh

Mở cửa sổ lệnh:

- **Windows 10/11:** bấm Start, gõ `Terminal` (hoặc `PowerShell`), Enter.
- **Mac:** bấm ⌘ + Space, gõ `Terminal`, Enter.
- **Điện thoại:** app SSH bất kỳ (ví dụ Termius).

Kết nối vào TV (thay bằng IP TV của bạn). Mật khẩu là `alpine` (khi gõ sẽ không hiện ký tự, cứ gõ rồi Enter):

```bash
ssh root@192.168.1.50
```

Dán lệnh này rồi Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh | sh
```

Khi bộ cài báo **SAFE MODE**, hãy giữ Home LG là mặc định, kiểm tra TV hoạt động và tắt/bật nguồn hai lần. **Không bật Home replacement trước khi TV ổn định.**

<details>
<summary><b>Cài luôn hình nền, thời tiết và tiếng Việt trong 1 lệnh</b></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh | sh -s -- \
  --city "Ho Chi Minh City" --wallpaper https://example.com/anh-cua-ban.jpg --lang vi --clock24 on
```

Xem đủ tuỳ chọn ở phần [Tuỳ chỉnh](#tuỳ-chỉnh-hình-nền-thời-tiết-ngôn-ngữ).
</details>

> **Bảo mật:** mật khẩu root `alpine` không đổi được trên webOS (hệ thống chỉ đọc). Thay vào đó
> dùng SSH key như chính thông báo đăng nhập của TV khuyên: chạy `ssh-copy-id root@192.168.1.50`
> trên máy tính 1 lần. Nhớ **tắt Telnet** trong cài đặt Homebrew Channel: nó cho bất kỳ ai cùng mạng
> vào quyền root mà không cần mật khẩu.

## Cài không cần root

**Cần có:** máy Mac hoặc Linux có [Node.js](https://nodejs.org) và [Python 3](https://www.python.org/downloads/),
cùng mạng với TV. (Windows: dùng [WSL](https://learn.microsoft.com/windows/wsl/install).)

1. **Bật Developer Mode.** Tạo tài khoản miễn phí tại [webostv.developer.lge.com](https://webostv.developer.lge.com).
   Trên TV, cài app **Developer Mode** từ LG Content Store, đăng nhập, bật **Dev Mode Status**
   (TV sẽ khởi động lại), mở lại app và bật **Key Server**.
2. **Tải project:** [Tải ZIP](https://github.com/infiniti-money/lg-tv-webos/archive/refs/heads/main.zip) rồi giải nén.
3. **Chạy trình cài** trong cửa sổ lệnh, ở thư mục vừa giải nén:
   ```bash
   ./install-noroot.sh
   ```
   Trình cài hỏi IP của TV và passphrase hiện trong app Developer Mode, rồi tự cài.
   Bấm đồng ý khi TV hỏi.
4. **Tạo phím tắt:** khi đang mở launcher, giữ một phím số (ví dụ **1**) trên remote.
   Từ đó giữ phím 1 là mở launcher.

Mỗi lần cài hoặc xoá app, chạy lại `./install-noroot.sh`. Developer Mode sẽ hết hạn sau một
thời gian: thỉnh thoảng mở app Developer Mode và bấm **Extend**.

<details>
<summary><b>Tuỳ chọn: dùng nút Home mà không cần root</b></summary>

Cần một máy tính, Raspberry Pi hoặc NAS luôn bật, cùng mạng với TV:

```bash
python3 home-watch.py 192.168.1.50
```

Nó theo dõi TV và chuyển từ Home LG về launcher trong khoảng 0,1 giây.
Trên Mac: `TV_HOST=192.168.1.50 ./home-watch-mac.sh`.
</details>

## Tuỳ chỉnh: hình nền, thời tiết, ngôn ngữ

### TV đã root

**Dễ nhất: dùng điện thoại.** Trên launcher, bấm lên nút hình ảnh (giữa nút mạng và Cài đặt) rồi
bấm OK. Quét mã QR bằng camera điện thoại (điện thoại phải chung Wi-Fi với TV). Trang mở ra cho phép:

- **Chọn ảnh** trong điện thoại, rồi kéo và chụm 2 ngón để canh trong khung 16:9. Lưới và các ô
  viền nét đứt cho biết đồng hồ, các nút và hàng app sẽ che chỗ nào.
- **Làm tối** hoặc **xoá** hình nền.
- Chọn ảnh **từ USB** cắm vào TV.
- Đổi **thành phố thời tiết**: gõ tên (có dấu cũng được, ví dụ "Đà Lạt"), bấm đúng kết quả.

Mã QR có kèm khoá riêng, người khác dùng chung Wi-Fi không mở được trang nếu không có mã.

**Số ô mỗi hàng:** trên hàng dock, bấm sang phải qua app cuối để tới cây bút, bấm OK rồi chọn
từ 4 đến 10. Lựa chọn này lưu trên TV và được ưu tiên hơn `--columns`.

**Dùng dòng lệnh:** chạy lại đúng lệnh cài, thêm tuỳ chọn mong muốn. Cài đặt cũ được giữ nguyên.

```bash
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh | sh -s -- --city "Da Nang"
```

| Tuỳ chọn | Tác dụng |
|---|---|
| `--wallpaper URL` | Hình nền từ link trên mạng |
| `--wallpaper /tmp/usb/sda/sda1/anh.jpg` | …hoặc từ USB cắm vào TV |
| `--no-wallpaper` | Về nền đen |
| `--dim 0.5` | Làm tối hình nền (0 = giữ nguyên, 0.8 = rất tối). Mặc định 0.35 |
| `--glow off` | Tắt vầng sáng màu phía sau app đang chọn |
| `--city "Ho Chi Minh City"` | Thời tiết của thành phố này (dòng lệnh nên gõ tên tiếng Anh, không dấu) |
| `--fahrenheit` | Nhiệt độ theo °F |
| `--no-weather` | Ẩn thời tiết |
| `--lang vi` / `--lang en` | Tiếng Việt hoặc tiếng Anh |
| `--clock24 on` | Đồng hồ 24 giờ |
| `--columns 6` | Số ô mỗi hàng, từ 3 đến 10 (cây bút trên TV được ưu tiên hơn) |
| `--no-home-button` | Không đổi nút Home trên remote |

**Mẹo chọn hình nền:** dùng ảnh ngang (1920 × 1080). Để khuôn mặt ở 1/3 phía trên,
vì hàng dock và lưới app sẽ che nửa dưới.

**Icon app tuỳ chỉnh:** đặt file PNG mang tên ID app vào `/home/root/lg-tv-vibehack/icons/`
(ví dụ `netflix.png`) rồi khởi động lại TV. Logo nền trong suốt đẹp: [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons).
Xem ID app: `node /home/root/lg-tv-vibehack/sync.js --list`.

### Không root

Sửa file `app/config.js` (có chú thích từng dòng), rồi chạy lại `./install-noroot.sh`.
Hình nền: lưu ảnh thành `app/bg.jpg` và đặt `wallpaper: 'bg.jpg'`.
Thời tiết: đặt `enabled: true` cùng toạ độ (trên Google Maps, giữ tay lên vị trí nhà bạn,
hai con số hiện ra là vĩ độ và kinh độ).

## Cài thêm app từ Homebrew Channel

Mở **Homebrew Channel**, chọn app, bấm **Install**. Launcher sẽ hiện app mới sau lần khởi động lại kế tiếp.

| App | Dùng để | Cần root |
|---|---|:---:|
| **Kodi** | Xem phim từ USB, mạng LAN hoặc add-on | Không |
| **Jellyfin** | Xem kho phim riêng trên PC/NAS chạy Jellyfin | Không |
| **PlxNative** | App Plex chạy nhanh (app Plex chính thức cũng có trong LG Content Store) | Không |
| **Moonlight** | Chơi game stream từ PC, độ trễ thấp | Không |
| **YouTube AdFree** | YouTube không quảng cáo, có SponsorBlock. Gỡ YouTube chính thức trước khi cài | Không |
| **Life's Good Without Spying** | Chặn quảng cáo, theo dõi ACR và gửi dữ liệu của LG | Có |
| **LG Input Hook** | Đổi chức năng nút remote (dùng cho nút Home ở đây) | Có |

**Stremio** không có trong Homebrew Channel. Hãy tìm trong **LG Content Store**; có hay không tuỳ
quốc gia và đời TV.

Cập nhật app Homebrew: mở app đó trong Homebrew Channel và bấm **Update**. Homebrew Channel lấy app
từ kho riêng, nên có thể chậm hơn bản mới nhất trên GitHub một chút.

## Xử lý sự cố

<details>
<summary><b>Lưới app trống hoặc màn hình đen</b></summary>

TV đã root: chạy `node /home/root/lg-tv-vibehack/sync.js` qua SSH rồi mở lại launcher.
Không root: chạy lại `./install-noroot.sh`.
</details>

<details>
<summary><b>Bấm Home vẫn ra Home của LG</b></summary>

1. Đã cài **LG Input Hook** và mở nó 1 lần chưa? Cài xong thì chạy lại lệnh cài.
2. Khởi động lại TV 1 lần sau khi cài.
3. Kiểm tra watcher: `ps -ef | grep homewatch` phải thấy một tiến trình `node`.
4. Xem log: `tail -30 /tmp/lg-tv-vibehack.log`
</details>

<details>
<summary><b>Bật TV lên thấy truyền hình hoặc Home LG vài giây rồi mới vào launcher</b></summary>

Bình thường. webOS mở màn hình của nó trước, launcher sẽ chiếm lại ngay khi webOS sẵn sàng
(thường vài giây, lâu hơn nếu đang có bảng thông báo của LG như thông báo cập nhật phần mềm).
</details>

<details>
<summary><b>Bấm Home không có phản ứng gì</b></summary>

LG Input Hook đã bắt được phím nhưng lệnh lỗi. Kiểm tra:
Chạy `cat /home/root/.config/lginputhook/keybinds.json` và kiểm tra phím Home `773` có
`{"action":"launch","id":"com.infinitimoney.tvhome"}`. Nếu chưa đúng, hãy xem
`/home/root/lg-tv-vibehack/home-key-backup.json` trước khi thử lại. Trình quản lý phím Home có thể
khôi phục lần bật bị gián đoạn, nhưng sẽ không ghi đè thay đổi của ứng dụng khác.
Kiểm tra thêm bằng `sh /home/root/lg-tv-vibehack/home-control.sh status`.
</details>

<details>
<summary><b>Bấm nút hình ảnh báo "Trang đổi hình nền chưa chạy"</b></summary>

Trang này chạy khoảng 30 giây sau khi bật TV, đợi chút rồi thử lại. Vẫn lỗi thì kiểm tra:
`ps -ef | grep wallpaper-server` phải có một tiến trình `node`, còn `tail -30 /tmp/lg-tv-vibehack.log`
cho biết lý do. Chạy lại lệnh cài sẽ khởi động lại nó.
</details>

<details>
<summary><b>Điện thoại không mở được trang từ mã QR</b></summary>

Điện thoại phải chung mạng với TV (không dùng 4G). Nếu IP của TV đổi, bấm lại nút hình ảnh để có
mã QR mới. Mẹo: đặt IP cố định cho TV trong router (DHCP reservation).
</details>

<details>
<summary><b>Báo "Could not download…" hoặc không hiện thời tiết</b></summary>

TV không ra được Internet. Thử trên TV: `curl -sI https://github.com`.
</details>

<details>
<summary><b>Thoát YouTube, Netflix mất 2–3 giây mới về launcher</b></summary>

Bình thường với TV ít RAM: app nặng đẩy launcher ra khỏi bộ nhớ, nên nó phải tải lại.
</details>

<details>
<summary><b>App đã xoá vẫn còn icon</b></summary>

TV đã root: icon tự mất sau lần khởi động lại (hoặc chạy `sync.js`). Không root: chạy lại trình cài.
</details>

Vẫn chưa được? [Tạo issue](https://github.com/infiniti-money/lg-tv-webos/issues/new/choose)
kèm model TV, ảnh chụp màn hình và log.

## Gỡ cài đặt

**TV đã root:**
```bash
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh | sh -s -- --uninstall
reboot
```

**Không root:** trên TV, mở danh sách app, chọn **Home** và xoá.

## TV đã thử nghiệm

**Lưu ý:** Danh sách model dưới đây kế thừa tài liệu nguồn; chưa xác nhận độc lập toàn bộ với Infiniti TV Home v1.4.1.

| Model | webOS | Chế độ | Trạng thái |
|---|---|---|---|
| 55NANO77TPA | 6 (firmware 03.51.15) | Root | ✅ |
| OLED55C6XLA | 26 | Không root | ✅ |
| 55UK6340PTF | 4.4 (firmware 05.50.70) | Root | ✅ từ bản v1.1.3 |

Bạn đã thử trên TV khác? Tạo issue hoặc pull request để bổ sung vào bảng.

## Cảm ơn

Infiniti Money duy trì phiên bản tùy chỉnh này; thông báo tác quyền và giấy phép của các tác giả gốc được giữ trong [LICENSE](LICENSE).

Project này được xây trên công sức của nhiều người. Xin cảm ơn:

- **[Gathin23/tv-vibehack](https://github.com/Gathin23/tv-vibehack)**: launcher kiểu Apple TV gốc cho Android TV.
- **[webOS Homebrew Project](https://www.webosbrew.org)**: Homebrew Channel, công cụ root và kho app.
- **[RootMyTV](https://rootmy.tv)**: giúp root được TV LG.
- **[Simon34545/lginputhook](https://github.com/Simon34545/lginputhook)**: đổi chức năng nút remote.
- **[Open-Meteo](https://open-meteo.com)**: API thời tiết và tìm toạ độ miễn phí.
- Font **[Lexend](https://fonts.google.com/specimen/Lexend)** (SIL Open Font License), có đủ chữ tiếng Việt.

## Ủng hộ

Nếu project giúp TV của bạn đẹp hơn, một ⭐ cho repo sẽ giúp người khác tìm thấy nó.

Dự án do **Infiniti Money** duy trì tại [infiniti-money/lg-tv-webos](https://github.com/infiniti-money/lg-tv-webos). Hiện chưa công bố địa chỉ ví nhận tài trợ của dự án.

## Miễn trừ trách nhiệm

Root và chỉnh sửa TV là rủi ro của bạn và có thể ảnh hưởng bảo hành. Project này không sửa phân vùng
hệ thống; mọi thứ cài vào đều gỡ được bằng `--uninstall`. LG, webOS và tên các app là thương hiệu của
chủ sở hữu tương ứng. Project không liên quan đến LG Electronics.

## Giấy phép

[MIT](LICENSE). Có sử dụng mã nguồn từ tv-vibehack và webos-vibehack, cũng theo giấy phép MIT.

## Thay thế Home LG an toàn và khôi phục (TV đã root)

**Điều kiện:** đã đóng gói và phát hành `infiniti-tv-home.ipk` từ chính repository này; `LG Input Hook` đã cài nếu muốn bấm Home chuyển trực tiếp. Không xóa hoặc ghi đè ứng dụng Home hệ thống của LG.

Trước khi cài, kiểm tra gói phát hành, sao lưu cấu hình quan trọng và kết nối SSH vào TV bằng tài khoản root. Trình cài mới tải các tệp từ `infiniti-money/lg-tv-webos`, bật Home Watcher và, nếu có LG Input Hook, sao lưu riêng ánh xạ phím Home (mã 773) vào `/home/root/lg-tv-vibehack/home-key-backup.json` trước khi thay đổi.

```sh
# Bật lại thay thế Home sau khi cài đặt:
sh /home/root/lg-tv-vibehack/home-control.sh enable
# Kiểm tra:
sh /home/root/lg-tv-vibehack/home-control.sh status
# Trả lại phím Home cũ, dừng Home Watcher, không xóa ứng dụng:
sh /home/root/lg-tv-vibehack/home-control.sh disable
reboot
```

Nếu muốn giữ Home LG ngay từ lúc cài, dùng tùy chọn `--no-home-button`. Khi gỡ, trình cài khôi phục ánh xạ đã sao lưu; nếu không thể khôi phục, nó dừng thay vì xóa dữ liệu sao lưu. Không chỉnh hoặc xóa `home-key-backup.json` bằng tay trước khi khôi phục. Nếu một công cụ khác đã sửa phím Home sau đó, việc khôi phục sẽ không ghi đè thay đổi của công cụ ấy và yêu cầu bạn kiểm tra thủ công. Sau khi thử Home Watcher và LG Input Hook trên model TV cụ thể, mới nên sử dụng thường xuyên.

### Gán phím Home qua LG Input Hook

Trên TV đã root, cài **LG Input Hook** từ Homebrew Channel và **mở ứng dụng ít nhất một lần** để kích hoạt. Trong LG Input Hook, chọn **Add keybind**, tìm mã nút Home trong phần log của remote (nhiều remote LG dùng mã `773`), chọn **Launch App** → **Infiniti TV Home** (`com.infinitimoney.tvhome`) rồi **Save changes**.

Tính năng `home-control.sh enable` tự tạo cấu hình tương đương `{"773":{"action":"launch","id":"com.infinitimoney.tvhome"}}` khi tìm thấy LG Input Hook. Trước đó script lưu ánh xạ Home cũ vào `home-key-backup.json`; `disable` sẽ khôi phục lại. **Không dùng lệnh `luna://org.webosbrew.inputhook/setMapping`** nếu chưa xác thực API trên firmware của bạn. `initctl status inputhook` cũng không phải phép thử đủ tin cậy trên mọi webOS; hãy kiểm tra trực tiếp nhật ký trong ứng dụng.

Sau khi cài gói `.ipk`, thử mở Infiniti TV Home từ danh sách ứng dụng trước khi kích hoạt Home Watcher và gán nút Home. Chỉ thay đổi khi đã xác minh khả năng quay về LG Home.

## Hỗ trợ LG webOS TV 3.x (2016–2017)

**Mức hỗ trợ:** giao diện đã được điều chỉnh để không yêu cầu các API JavaScript/CSS mới hơn Chromium 38; các script phía TV nhắm Node.js 0.12.2. Đó là **tương thích mã nguồn**, chưa phải xác nhận chạy trên mọi model hoặc firmware. webOS 3.x sử dụng Chromium 38 và Node.js 0.12.2 theo tài liệu LG.

**Phụ trợ cần thiết cho TV đã root:**

- Homebrew Channel với quyền root và SSH hoạt động. Kiểm tra trên TV bằng `id -u` (kết quả phải là `0`).
- LG Input Hook nếu muốn gán trực tiếp phím Home. Mở LG Input Hook tối thiểu một lần trước khi gán phím; mã Home tùy điều khiển, một số remote dùng `773`.
- `node`, `curl`, `luna-send` có sẵn trên TV; `tv/compat-check.sh` chỉ đọc trạng thái, không chỉnh sửa hệ thống.
- Máy tính cài Node.js 20 trở lên và `@webos-tools/cli` để tạo gói `.ipk`, hoặc tải tệp `.ipk` từ GitHub Actions artifact sau khi workflow thành công.

**Cài thử an toàn trên webOS 3.x, chỉ sau khi có Release chứa `infiniti-tv-home.ipk`:**

1. Trước tiên sao lưu `/home/root/.config/lginputhook/keybinds.json` (nếu tồn tại), ghi lại IP TV và phiên bản firmware. Không xóa ứng dụng Home gốc.
2. Kết nối `ssh root@IP_TV`; đọc `/etc/os-release`, `node -v` và chạy `id -u`. Nếu TV không có root thực sự, dừng lại.
3. Chỉ tải trình cài từ repository `infiniti-money/lg-tv-webos`; đọc script trước khi chạy. Trong lần đầu, sử dụng `--no-home-button` để giữ Home LG.
4. Mở Infiniti TV Home thủ công từ danh sách ứng dụng, kiểm tra điều khiển, icon, tiếng Việt, hình nền và mở ứng dụng.
5. Khi đã chắc chắn hoạt động, cài LG Input Hook, xác nhận đúng mã Home từ log và bật bằng `sh /home/root/lg-tv-vibehack/home-control.sh enable`.
6. Nếu Home không hoạt động như ý, dùng SSH chạy `sh /home/root/lg-tv-vibehack/home-control.sh disable` rồi `reboot` để quay lại LG Home.

Các lệnh chẩn đoán (không thay đổi hệ thống):

```sh
id -u
node -v
cat /etc/os-release
sh /home/root/lg-tv-vibehack/compat-check.sh
```

**Quan trọng:** không chạy `install.sh` từ nhánh `main` khi GitHub Releases chưa chứa gói `infiniti-tv-home.ipk`. Cơ chế gán Home và tự khởi động cần được thử trực tiếp vì phụ thuộc firmware và phiên bản LG Input Hook.

### Đóng gói nhanh trên Windows 11

Sau khi cài Node.js 20+, mở **Command Prompt** hoặc PowerShell tại thư mục `lg-tv-webos` rồi chạy:

```cmd
scripts\build-windows.cmd
```

Script tự chuyển đến thư mục dự án, kiểm tra các tệp tương thích webOS 3.x và dùng `npx.cmd` để gọi webOS CLI, tránh lỗi chặn `npm.ps1` trong PowerShell. Kết quả: `build\com.infinitimoney.tvhome_1.2.1_all.ipk` (tên tệp có thể khác khi thay phiên bản). Script **chỉ tạo bộ cài trên máy tính**, không kết nối hoặc thay Home của TV.


# Trợ lý AI tiếng Việt cho Infiniti TV Home

## Phương thức nhận giọng nói trên webOS 3.4.0

webOS 3.x dùng Chromium 38. Ứng dụng web không được bảo đảm truy cập âm thanh
thô của micro Magic Remote. Nút AI tiếng Việt hỗ trợ nhập câu hỏi bằng bàn phím
LG (nút micro nếu firmware cung cấp), hoặc Web Speech API khi có sẵn.
Nếu không, remote vẫn có thể gõ. Nút Gửi AI chỉ gửi văn bản sau khi người dùng
chủ động xác nhận. Không có tính năng nghe lén hoặc ghi âm thường trực.

## Cấu hình Cloudflare Worker (không để OpenAI API key trong IPK)

Yêu cầu Node 20+, Cloudflare và OpenAI API. Trong thư mục repository:

    cd cloudflare/ai
    npx wrangler login
    npx wrangler secret put OPENAI_API_KEY
    npx wrangler secret put AI_ACCESS_TOKEN
    npx wrangler deploy

AI_ACCESS_TOKEN phải là chuỗi ngẫu nhiên mạnh ít nhất 32 ký tự. KHÔNG
commit token, API key, hay cấu hình chứa token lên GitHub. Đặt hạn mức
chi tiêu OpenAI và Cloudflare WAF/rate limit trước khi dùng thật.

Đặt CONFIG.aiEndpoint trong app/config.js thành URL Worker HTTPS kết thúc
bằng /api/chat. Trên TV root có thể thay bằng cách thêm aiEndpoint
vào /home/root/lg-tv-vibehack/settings.json và chạy lại node
/home/root/lg-tv-vibehack/sync.js. Không lưu mã truy cập vào localStorage.

Chu trình: tiếng nói -> LG/Web Speech chuyển thành chữ -> bấm Gửi AI
-> HTTPS Cloudflare Worker -> OpenAI Responses -> câu trả lời tiếng Việt.

Trợ lý chưa có quyền điều khiển TV hoặc mở ứng dụng bằng câu lệnh AI.
Cần thử thật trên TV, đặc biệt nút micro, bàn phím, TLS/CORS và Magic Remote.

## Nâng cấp 1.5.0: tùy chỉnh, thời tiết 3 ngày, âm lịch

**Quản lý ứng dụng trên Home:** chọn nút Tùy chỉnh ở góc trên phải, hoặc nhấn
phím ĐỎ của remote (nếu TV gửi keycode 403). Chọn tab Thêm / ẩn ứng dụng.
Chọn Thêm vào Home hoặc Ẩn khỏi Home cho từng ứng dụng. Thao tác này KHÔNG
gỡ ứng dụng khỏi TV, không ảnh hưởng LG Home, HDMI, Live TV hay dữ liệu ứng dụng.
Ứng dụng cài mới sẽ xuất hiện trong danh sách sau lần đồng bộ apps.js.
Nhấn Khôi phục ứng dụng mặc định để xóa các lựa chọn ẩn/hiện riêng.

**Tùy biến giao diện:** trong tab Giao diện & phông chữ, chọn Đêm đen,
Đại dương, Ánh vàng. Phông chữ có Lexend (đã đóng gói và có dấu tiếng Việt),
Arial, Georgia; bật hoặc tắt cỡ chữ lớn và thanh dự báo 3 ngày.
Người dùng có thể thay hình nền qua trang điện thoại của nút Hình nền.
Lựa chọn được lưu trong localStorage của riêng ứng dụng để giữ lại sau reboot
(trừ khi bộ nhớ ứng dụng bị xóa).

**Dự báo 3 ngày:** dùng Open-Meteo Forecast API với `forecast_days=3`,
các trường `daily.weather_code`, `temperature_2m_max`, `temperature_2m_min`,
`precipitation_probability_max`. Chọn thành phố bằng trình cài `--city` hoặc
trang điện thoại hình nền. Thanh dự báo tự ẩn khi chưa bật thời tiết, và
hiển thị trạng thái thiếu dữ liệu nếu API không trả về danh sách hợp lệ.
Nguồn: https://open-meteo.com/en/docs

**Âm lịch Việt Nam:** tính trực tiếp trên TV, không cần internet, theo
mốc múi giờ UTC+7, hiển thị ngày/tháng âm và Can Chi của năm, có dấu tháng nhuận.
Công thức dựa trên thuật toán thiên văn chuyển đổi Dương/Âm lịch cho Việt Nam.
Nguồn: https://honguyenviet.com/amlich/vncal_en.html

**Giới hạn kiểm thử:** cần thử thật trên TV webOS 3.4.0 về vùng hiển thị
1920×1080, điều hướng Magic Remote, cập nhật apps.js và kết nối TLS tới Open-Meteo.
Chưa phát hành chính thức trước khi kiểm tra các phần này và rollback phím Home.

### Kiểm thử và đóng gói

    node scripts/check-webos3.js
    node scripts/test-homewatch.js
    node scripts/test-keymap.js
    node scripts/test-lunar.js
    node scripts/test-forecast.js
    node scripts/test-customize.js
    node scripts/test-ai-worker.mjs
    npx -y -p @webos-tools/cli ares-package --no-minify app -o build

File IPK chỉ chứa giao diện; chức năng root (Home Watcher, Input Hook) phải
được cài riêng bằng `install.sh` sau khi tạo Release và SHA-256 hợp lệ.

Trong mục **Tùy chỉnh > Giao diện & phông chữ**, nút **Đổi thành phố / Hình nền** mở mã QR để thiết lập thành phố dự báo thời tiết hoặc hình nền bằng điện thoại (yêu cầu máy chủ hình nền trên TV root đang chạy).
## Cài đặt giao diện v1.5.0 trên TV

Mở **Tùy chỉnh** (hoặc nhấn phím đỏ 403 nếu remote hỗ trợ). Hộp cài đặt có bốn trang:

- **Giao diện:** đổi chủ đề, phông chữ, cỡ chữ, hình nền bằng điện thoại, bật chế độ giảm hiệu ứng chuyển động cho TV cấu hình thấp.
- **Thời tiết:** chọn nhanh Hà Nội, Hải Phòng, Hưng Yên, Đà Nẵng, Huế, TP. Hồ Chí Minh, Cần Thơ, Đà Lạt; hoặc dùng ô tìm kiếm tên khu vực để tra Open-Meteo. Chọn kết quả để lưu trên TV và cập nhật ngay. Có nút bật/tắt và °C/°F.
- **Âm · dương lịch:** chọn hiển thị dương lịch đầy đủ (thứ, ngày, tháng, năm) và âm lịch Việt Nam (ngày, tháng, năm, Can Chi, tháng nhuận). Dương lịch lấy ngày TV; âm lịch quy đổi theo UTC+7.
- **Ứng dụng:** thêm/ẩn biểu tượng khỏi Home, không gỡ ứng dụng thật.

Thanh thời tiết có **3 thẻ** cho hôm nay, ngày mai, ngày kia, gồm điều kiện thời tiết, nhiệt độ cao/thấp và xác suất mưa. Lựa chọn khu vực và giao diện được lưu bằng localStorage trong ứng dụng, không cần root. Trên TV cũ, nên chọn **Hiệu ứng chuyển động: Giảm** khi thấy giật hình. Khi dùng bàn phím ảo LG ở ô tìm kiếm, nhấn OK để bắt đầu tìm; chọn kết quả bằng remote. Các lựa chọn trên TV có thể ưu tiên hơn vị trí thời tiết đã lưu từ trình cài root. Nếu xóa dữ liệu ứng dụng, thiết lập riêng trên TV sẽ mất.

**Giới hạn nghiệm thu:** kiểm thử mã nguồn và CSS không thay thế thử thực tế trên TV LG. Trước khi phát hành chính thức, kiểm tra 1920×1080, phím Back, tìm khu vực, chuyển trang, vỡ dòng tiếng Việt, chế độ giảm chuyển động và khôi phục Home.

## Cập nhật v1.5.1: Launcher mặc định, ứng dụng và AI

- **Chỉ một hàng ứng dụng:** nhấn trái/phải trên remote để cuộn theo chiều ngang; toàn bộ ứng dụng được tìm thấy vẫn có mặt. Cuối hàng có nút chỉnh kích thước ô và sắp xếp.
- **Trong suốt:** ba thẻ dự báo thời tiết dùng nền kính gần như trong suốt và chữ có bóng để dễ đọc trên hình nền. webOS 3.x không hỗ trợ blur CSS đầy đủ, nên hiệu ứng có fallback nhẹ.
- **Bật/tắt AI:** Tùy chỉnh → Trợ lý AI. Khi tắt, nút AI trên Home bị ẩn, micro và yêu cầu AI sẽ không sử dụng. Token không được lưu.
- **Nhận diện đủ gói ứng dụng:** script root `tv/sync.js` tổng hợp launchpoints và `appinfo.json` từ thư mục cài trên TV; icon thiếu dùng icon launcher mặc định; Home Watcher đồng bộ định kỳ nếu LG không phát sự kiện.
- **Home:** installer trên TV root tự gắn nút Home (mã 773) của LG Input Hook bằng hành động Execute, khởi động Infiniti khi bật TV, có dự phòng Home Watcher. **LG Home không bị xóa**, nên có thể hoàn tác an toàn. LG Input Hook phải được mở ít nhất một lần để hoạt động.

Cài/update đầy đủ phần trên TV root sau khi bản phát hành mới có sẵn:

```sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh | sh
reboot
```

Lệnh này phải chạy trong SSH shell **root trên TV**, không chạy trên Windows. Chỉ cài file `.ipk` bằng webOS CLI **không cập nhật** Home Watcher, LG Input Hook hay bộ đồng bộ gói ứng dụng. Cách khôi phục Home LG:

```sh
sh /home/root/lg-tv-vibehack/home-control.sh disable
reboot
```

**Không được xóa thư mục LG Home hệ thống.** Nếu firmware không hỗ trợ keyhook hoặc phím Home dùng mã khác, LG Home có thể xuất hiện thoáng qua trước khi watcher mở Infiniti TV Home; kiểm tra log trong LG Input Hook để xác nhận mã phím đúng.

## V1.5.2 — Chỉ ứng dụng đã cài, dock trong suốt và sửa xung đột Home

Nếu nhật ký báo `App discovery: Luna 20, local packages 185`, đó là số lượng *gói hệ thống*, không phải 185 ứng dụng nên đưa lên Home. Từ v1.5.2, chỉ ứng dụng có launchpoint hiển thị hoặc ứng dụng do người dùng cài tại developer/store có màn hình chính và icon mới được hiện. Gói dịch vụ, nền tảng, LG Home và các thành phần ẩn sẽ không xuất hiện.

Danh sách ứng dụng được đặt thành **một hàng biểu tượng nhỏ sát phía dưới màn hình TV**, nền của dock/ô biểu tượng trong suốt; nhấn trái/phải để xem thêm, nút bút ở cuối hàng để chọn cỡ icon.

### Khi installer báo `Home mapping changed externally`

Đây là chốt bảo vệ của Home key (không phải lỗi cài IPK). Có một ánh xạ hiện tại khác với bản backup cũ. **Không xóa file keybinds.json hoặc file backup.** Đầu tiên kiểm tra trên LG Input Hook rằng Home thực sự có mã **773**; trên một số TV mã có thể khác. Chỉ nếu muốn thay ánh xạ Home hiện có, chạy từ shell SSH root trên TV:

```sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh -o /tmp/infiniti-install.sh
sh /tmp/infiniti-install.sh --rebind-home
reboot
```

`--rebind-home` là lựa chọn cố ý ghi đè **phím Home duy nhất**, sau khi lưu bản ánh xạ trước đó và bản backup cũ vào file archive. Những phím khác giữ nguyên. Không truyền cờ này nếu chưa muốn thay thế một keybind của launcher khác. Khi xong, mở LG Input Hook một lần, kiểm tra ánh xạ **Execute** thành `/home/root/lg-tv-vibehack/golauncher.sh`, nhấn Save changes rồi khởi động lại. Mỗi TV/firmware có thể vẫn hiển thị LG Home thoáng qua trước khi bộ hook bắt phím Home.

Kiểm tra trạng thái: `sh /home/root/lg-tv-vibehack/home-control.sh status`.
Khôi phục: `sh /home/root/lg-tv-vibehack/home-control.sh disable` và `reboot`.

Cài riêng file IPK **không cập nhật** bộ script root, vì thế không sửa được lỗi đồng bộ app hoặc phím Home.

## Chẩn đoán nút Home vẫn mở LG Home trên webOS 3.x

Nếu lệnh `home-control.sh status` báo `INFINITI ACTIVE` nhưng bấm Home vẫn hiện thanh LG, **không tiếp tục chạy `--rebind-home` hoặc xóa keybinds**. Chữ ACTIVE chỉ kiểm tra JSON. Trên webOS 3.x, LG Home là thanh `superRibbon` trong compositor, không phải app `com.webos.app.home`, nên `getForegroundAppInfo`/Home Watcher không thể luôn phát hiện.

1. Thử launcher hoạt động trực tiếp: `luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.infinitimoney.tvhome"}'`.
2. Trong LG Input Hook → log, bấm Home **một lần** và xác nhận mã nhận được (có thể là 773, 774 hoặc 125 tùy remote). Trên TV hiện tại phải có log sự kiện, không chỉ keymap trong tệp.
3. Chạy `sh /home/root/lg-tv-vibehack/home-control.sh diagnose`. Bộ chẩn đoán đọc log `/tmp/lginput-hook*.log`, tiến trình hook, keymap 773/774/125, nhật ký Home Watcher và tệp `/tmp/infiniti-homekey.log`. Không ghi hay sửa dữ liệu.
4. Nếu có log phím đúng mà **không có** `HOME Execute invoked`, hook chưa áp dụng binding hoặc không inject vào firmware. Mở ứng dụng Input Hook, kiểm tra hành động Execute, nhấn **Save changes**, khởi động lại và thử. Nếu log mã phím khác 773 thì cần sửa đúng phím sau khi xác minh.
5. Nếu **có** `HOME Execute invoked` nhưng launcher không hiện, đọc dòng `Launch failed` trong log. Nếu launcher mở bằng lệnh Luna trực tiếp nhưng không mở từ hook, kiểm tra quyền thực thi và môi trường của Input Hook.

**Không cam kết chặn tuyệt đối LG Home trên webOS 3.x nếu Input Hook không hoạt động.** Dự án giữ LG Home nguyên vẹn và không vá phân vùng hệ thống. Khôi phục bằng `sh /home/root/lg-tv-vibehack/home-control.sh disable`.

## webOS 3.x: phím Home vật lý `0305` và phương án đọc `/dev/input/event3`

Đã xác minh từ TV thực tế: `KEY down code=0305` = **Home (773)**, `0110` = **OK (272)** và `019c` = **Back (412)**. Đây là mã **Linux evdev**, có thể khác ID trong log LG Input Hook. Không đổi mã Home sang OK/Back.

Nếu `keymap.js status` báo ACTIVE nhưng remote vẫn hiện LG Home, trước tiên hãy kiểm tra log **LG Input Hook** và thử hành động Execute hoặc Launch App. Chỉ đọc input trực tiếp nếu hook không bắt được phím. Trên webOS 3.x, LG Home là ribbon hệ thống; đọc `/dev/input/event3` **không nuốt** Home và **không thể đảm bảo ẩn LG Home tuyệt đối** — nó chỉ đưa Infiniti TV Home ra trước sau khi có sự kiện Home.

Bản tùy chọn `tv/home-event-monitor.js` đọc các bản ghi `input_event` bằng Node ES5, tương thích cấu trúc 16 byte (ARM 32-bit) và 24 byte (64-bit), không chặn điều khiển gốc, không lưu những phím khác, giới hạn kích hoạt Home một lần mỗi 1,8 giây. Không tạo vô hạn tiến trình `dd`/`od` hoặc chạy nhiều lệnh khởi động song song.

Để dùng tính năng này **khi đã thử và xác nhận Home xuất hiện trên `/dev/input/event3`**, đăng nhập SSH root, cập nhật sidecar từ nhánh `main` (bằng installer), rồi bảo đảm **không còn** script thử nghiệm `/var/lib/webosbrew/init.d/97-homekey` đang cùng chạy. Có thể lưu nó ngoài `init.d` để khôi phục về sau:

```sh
if [ -f /var/lib/webosbrew/init.d/97-homekey ]; then
  mv /var/lib/webosbrew/init.d/97-homekey /home/root/lg-tv-vibehack/97-homekey.backup
fi
sh /home/root/lg-tv-vibehack/home-control.sh evdev-enable /dev/input/event3
reboot
```

Kiểm tra sau khi khởi động:

```sh
sh /home/root/lg-tv-vibehack/home-control.sh status
tail -n 30 /tmp/infiniti-homeevent.log
```

Nếu muốn tắt riêng fallback đọc input nhưng giữ ánh xạ Input Hook và launcher:

```sh
sh /home/root/lg-tv-vibehack/home-control.sh evdev-disable
```

Khôi phục toàn bộ nút Home về trạng thái trước đó: `sh /home/root/lg-tv-vibehack/home-control.sh disable` và khởi động lại. **Không xóa hoặc sửa LG Home hệ thống**, không thay đổi nội dung `/dev/input/event3`, không áp dụng thiết bị event3 trên TV khác khi chưa kiểm tra.
