# Designed by Tân Dev — Hướng dẫn chủ TV

Chỉ dùng bản chính thức đã phát hành. Ứng viên v1.6.3 chưa phát hành tại thời điểm viết tài liệu. Bản v1.6.2 dùng 8090; v1.6.3 dự kiến dùng 9090.

## Nâng cấp bằng SSH

Trên máy tính: `ssh root@IP-TV`. Trên TV, giữ thư mục dữ liệu tương thích (xem [ghi chú kỹ thuật](compatibility-paths.md)):

```sh
D=/home/root/lg-tv-vibehack
B=/home/root/infiniti-backup-$(date +%Y%m%d-%H%M%S)
mkdir -m 700 "$B" && cp -a "$D" "$B/"
```

Sao lưu thành công rồi mới tiếp tục. Bản sao này không bảo đảm lưu localStorage. Dừng watcher bằng `sh "$D/legacy-home.sh" disable` và kiểm tra `ls /tmp/infiniti-legacy-v8-lock`. Chỉ tiếp tục khi khóa không còn; không tự xóa khóa.

```sh
V=v1.6.2
cd /tmp
curl -fsSL "https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/$V/install.sh" -o infiniti-install.sh &&
sed -i "s/^BRANCH=\"main\"/BRANCH=\"$V\"/;s@releases/latest/download/@releases/download/$V/@" infiniti-install.sh &&
sh infiniti-install.sh --no-auto-update
```

Đổi V thành tag đã phát hành khi nâng cấp. Không bật --enable-home hoặc --start-home-on-boot cùng Legacy V8.

```sh
sh "$D/legacy-home.sh" watch
```

Nhấn Home, kiểm tra RENDER OK và màn hình thật; Ctrl+C để dừng. Khi đã thử thành công:

```sh
sh "$D/legacy-home.sh" arm && reboot
```

Sau khi kết nối SSH lại, kiểm tra `cat /tmp/infiniti-legacy-v8.log`, BOOT READY, RENDER OK và màn hình thực tế. Chỉ xác nhận khi đạt:

```sh
D=/home/root/lg-tv-vibehack
sh "$D/legacy-home.sh" confirm &&
sh "$D/legacy-home.sh" wallpaper-on &&
sh "$D/legacy-home.sh" wake-on
```

Wake-on là tùy chọn thử nghiệm. Khởi động lại và kiểm tra status. Xem [hướng dẫn legacy](legacy-home-v8.vi.md) nếu cần chẩn đoán.

## Quản lý từ điện thoại/máy tính

Cùng Wi-Fi với TV, mở địa chỉ IP TV và cổng tương ứng phiên bản. v1.6.3 dự kiến dùng `http://IP-TV:9090/`, đăng nhập bằng mật khẩu riêng (8–64 ký tự; chỉ chữ cũng được). Không gửi mật khẩu cho người khác. QR vẫn có thể dùng. Khóa hiện tại đọc riêng qua SSH:

```sh
cat "$D/.wallpaper-key"
```

Không đưa khóa lên GitHub. HTTP không mã hóa; chỉ sử dụng LAN tin cậy. Web hỗ trợ cài đặt Launcher, không cung cấp shell/root, firmware hoặc DNS hệ thống. Nếu chưa có ACK, thay đổi mới được xếp hàng, chưa xác nhận đã áp dụng.

## Khôi phục

```sh
sh "$D/legacy-home.sh" disable
sh "$D/safe-recovery.sh"
```

Chỉ reboot sau khi kiểm tra kết quả. Giữ LG Home gốc và bản phát hành trước đó. Khi cài lại bản cũ, dùng đúng tag và cùng bộ IPK/Root Tools.

## Tên truy cập nội bộ (v1.6.3 ứng viên)
Thử `http://tan-dev.local:9090/` từ thiết bị cùng mạng. Dịch vụ quảng bá bản ghi IPv4 qua mDNS UDP 5353, kiểm tra trùng tên và cập nhật khi IP đổi. Không đổi hostname LG hoặc cấu hình router. QR luôn dùng IP động làm phương án dự phòng. Tên `.local` chỉ hoạt động nếu thiết bị và mạng hỗ trợ multicast/mDNS; nếu xung đột hoặc không phân giải, dùng IP hiển thị trên TV. Chưa thử trên phần cứng webOS 3.4.3.
