# Lưu trữ ghi chú release lịch sử

Bản sao nội dung công khai từ GitHub Releases, giữ nguyên thông tin lịch sử và không diễn giải thành chứng nhận phần cứng hiện tại.

## v1.6.0-rc.7

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.7)

# Designed by Tân Dev — v1.6.0 RC7 (Legacy Home V9.0)

- V8.4 trên LG 49UH850T-TA đã xác nhận Home 1,4 giây, readiness 11,2 giây và render boot 1,5 giây qua log; catalog 18 app, 5 input; tắt/bật Magic Remote tạo Boot ID mới. Standby thực sự chưa xác nhận.
- V8.5: tên app và vendor Designed by Tân Dev; giữ app ID com.infinitimoney.tvhome và đường dẫn dữ liệu. Giữ bản quyền MIT gốc.
- Bỏ trợ lý AI khỏi IPK, tab Dev Mode và khu vực nhanh thời tiết. Giữ tìm kiếm địa điểm và tính năng khác.
- Giữ Homebrew Failsafe, hai mẫu readiness; chu kỳ 500ms, hiển thị các tile đồng thời và đợi toàn bộ class shown. Cache biểu tượng và giảm sao chép không đổi; chưa đo CPU/RAM thực tế.
- QR: dịch vụ nền opt-in riêng, khóa ngẫu nhiên 48 ký tự, QR có viền, chọn JPG/PNG, cập nhật ảnh độc lập với catalog, refresh địa chỉ mạng. Chưa kiểm thử điện thoại thật; dùng cùng mạng LAN tin cậy, không mở cổng ra Internet.
- Cài IPK và root tools cùng bản, thử Home và boot một lần rồi xác nhận thủ công. RC2 là prerelease, không thay latest; chưa nghiệm thu vật lý. Xem docs/legacy-home-v8.vi.md.

- RC3: 4 thẻ ứng dụng ngang 380×214, một hàng phía dưới, cuộn theo từng ô, viền và zoom 7% khi chọn, chỉnh sửa cố định ngoài hàng. Giữ cài đặt giảm chuyển động. Chưa nghiệm thu hiển thị trên TV.

- RC4: thu nhỏ chữ dự báo 3 ngày, cố định chiều cao dòng và giới hạn nội dung trong ô 159px, kể cả chế độ chữ lớn. Không thay đổi dữ liệu dự báo.

- RC5: giữ đủ năm dòng dự báo, chữ 20px thống nhất, nhiệt độ 22px; lịch âm tính offline hiện ngay khi mở app và cập nhật cùng đồng hồ, vẫn tôn trọng tùy chọn bật/tắt.

- RC6: đổi tên từng app, thay icon riêng hoặc áp dụng 5 bộ icon có sẵn (45 SVG), lưu cục bộ không sửa app hệ thống. Điều hướng Tùy chỉnh theo vị trí nút lên/xuống/trái/phải, tự cuộn. Chọn ảnh phụ thuộc hỗ trợ bộ chọn tệp trên TV; chưa nghiệm thu remote vật lý.

- RC7: Tùy chỉnh nền kính bán trong suốt, nút và ô nhập bán trong suốt, giữ viền focus vàng và nền trắng QR. Ẩn các widget Home phía sau khi mở cài đặt để không chồng chữ; giữ hình nền. Không dùng backdrop blur. Giữ toàn bộ bộ icon và chỉnh tên từ RC6; chưa nghiệm thu TV thật.


---

## v1.6.0-rc.6

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.6)

# Designed by Tân Dev — v1.6.0 RC6 (Legacy Home V8.9)

- V8.4 trên LG 49UH850T-TA đã xác nhận Home 1,4 giây, readiness 11,2 giây và render boot 1,5 giây qua log; catalog 18 app, 5 input; tắt/bật Magic Remote tạo Boot ID mới. Standby thực sự chưa xác nhận.
- V8.5: tên app và vendor Designed by Tân Dev; giữ app ID com.infinitimoney.tvhome và đường dẫn dữ liệu. Giữ bản quyền MIT gốc.
- Bỏ trợ lý AI khỏi IPK, tab Dev Mode và khu vực nhanh thời tiết. Giữ tìm kiếm địa điểm và tính năng khác.
- Giữ Homebrew Failsafe, hai mẫu readiness; chu kỳ 500ms, hiển thị các tile đồng thời và đợi toàn bộ class shown. Cache biểu tượng và giảm sao chép không đổi; chưa đo CPU/RAM thực tế.
- QR: dịch vụ nền opt-in riêng, khóa ngẫu nhiên 48 ký tự, QR có viền, chọn JPG/PNG, cập nhật ảnh độc lập với catalog, refresh địa chỉ mạng. Chưa kiểm thử điện thoại thật; dùng cùng mạng LAN tin cậy, không mở cổng ra Internet.
- Cài IPK và root tools cùng bản, thử Home và boot một lần rồi xác nhận thủ công. RC2 là prerelease, không thay latest; chưa nghiệm thu vật lý. Xem docs/legacy-home-v8.vi.md.

- RC3: 4 thẻ ứng dụng ngang 380×214, một hàng phía dưới, cuộn theo từng ô, viền và zoom 7% khi chọn, chỉnh sửa cố định ngoài hàng. Giữ cài đặt giảm chuyển động. Chưa nghiệm thu hiển thị trên TV.

- RC4: thu nhỏ chữ dự báo 3 ngày, cố định chiều cao dòng và giới hạn nội dung trong ô 159px, kể cả chế độ chữ lớn. Không thay đổi dữ liệu dự báo.

- RC5: giữ đủ năm dòng dự báo, chữ 20px thống nhất, nhiệt độ 22px; lịch âm tính offline hiện ngay khi mở app và cập nhật cùng đồng hồ, vẫn tôn trọng tùy chọn bật/tắt.

- RC6: đổi tên từng app, thay icon riêng hoặc áp dụng 5 bộ icon có sẵn (45 SVG), lưu cục bộ không sửa app hệ thống. Điều hướng Tùy chỉnh theo vị trí nút lên/xuống/trái/phải, tự cuộn. Chọn ảnh phụ thuộc hỗ trợ bộ chọn tệp trên TV; chưa nghiệm thu remote vật lý.


---

## v1.6.0-rc.5

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.5)

# Designed by Tân Dev — v1.6.0 RC5 (Legacy Home V8.8)

- V8.4 trên LG 49UH850T-TA đã xác nhận Home 1,4 giây, readiness 11,2 giây và render boot 1,5 giây qua log; catalog 18 app, 5 input; tắt/bật Magic Remote tạo Boot ID mới. Standby thực sự chưa xác nhận.
- V8.5: tên app và vendor Designed by Tân Dev; giữ app ID com.infinitimoney.tvhome và đường dẫn dữ liệu. Giữ bản quyền MIT gốc.
- Bỏ trợ lý AI khỏi IPK, tab Dev Mode và khu vực nhanh thời tiết. Giữ tìm kiếm địa điểm và tính năng khác.
- Giữ Homebrew Failsafe, hai mẫu readiness; chu kỳ 500ms, hiển thị các tile đồng thời và đợi toàn bộ class shown. Cache biểu tượng và giảm sao chép không đổi; chưa đo CPU/RAM thực tế.
- QR: dịch vụ nền opt-in riêng, khóa ngẫu nhiên 48 ký tự, QR có viền, chọn JPG/PNG, cập nhật ảnh độc lập với catalog, refresh địa chỉ mạng. Chưa kiểm thử điện thoại thật; dùng cùng mạng LAN tin cậy, không mở cổng ra Internet.
- Cài IPK và root tools cùng bản, thử Home và boot một lần rồi xác nhận thủ công. RC2 là prerelease, không thay latest; chưa nghiệm thu vật lý. Xem docs/legacy-home-v8.vi.md.

- RC3: 4 thẻ ứng dụng ngang 380×214, một hàng phía dưới, cuộn theo từng ô, viền và zoom 7% khi chọn, chỉnh sửa cố định ngoài hàng. Giữ cài đặt giảm chuyển động. Chưa nghiệm thu hiển thị trên TV.

- RC4: thu nhỏ chữ dự báo 3 ngày, cố định chiều cao dòng và giới hạn nội dung trong ô 159px, kể cả chế độ chữ lớn. Không thay đổi dữ liệu dự báo.

- RC5: giữ đủ năm dòng dự báo, chữ 20px thống nhất, nhiệt độ 22px; lịch âm tính offline hiện ngay khi mở app và cập nhật cùng đồng hồ, vẫn tôn trọng tùy chọn bật/tắt.


---

## v1.6.0-rc.4

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.4)

# Designed by Tân Dev — v1.6.0 RC4 (Legacy Home V8.7)

- V8.4 trên LG 49UH850T-TA đã xác nhận Home 1,4 giây, readiness 11,2 giây và render boot 1,5 giây qua log; catalog 18 app, 5 input; tắt/bật Magic Remote tạo Boot ID mới. Standby thực sự chưa xác nhận.
- V8.5: tên app và vendor Designed by Tân Dev; giữ app ID com.infinitimoney.tvhome và đường dẫn dữ liệu. Giữ bản quyền MIT gốc.
- Bỏ trợ lý AI khỏi IPK, tab Dev Mode và khu vực nhanh thời tiết. Giữ tìm kiếm địa điểm và tính năng khác.
- Giữ Homebrew Failsafe, hai mẫu readiness; chu kỳ 500ms, hiển thị các tile đồng thời và đợi toàn bộ class shown. Cache biểu tượng và giảm sao chép không đổi; chưa đo CPU/RAM thực tế.
- QR: dịch vụ nền opt-in riêng, khóa ngẫu nhiên 48 ký tự, QR có viền, chọn JPG/PNG, cập nhật ảnh độc lập với catalog, refresh địa chỉ mạng. Chưa kiểm thử điện thoại thật; dùng cùng mạng LAN tin cậy, không mở cổng ra Internet.
- Cài IPK và root tools cùng bản, thử Home và boot một lần rồi xác nhận thủ công. RC2 là prerelease, không thay latest; chưa nghiệm thu vật lý. Xem docs/legacy-home-v8.vi.md.

- RC3: 4 thẻ ứng dụng ngang 380×214, một hàng phía dưới, cuộn theo từng ô, viền và zoom 7% khi chọn, chỉnh sửa cố định ngoài hàng. Giữ cài đặt giảm chuyển động. Chưa nghiệm thu hiển thị trên TV.

- RC4: thu nhỏ chữ dự báo 3 ngày, cố định chiều cao dòng và giới hạn nội dung trong ô 159px, kể cả chế độ chữ lớn. Không thay đổi dữ liệu dự báo.


---

## v1.6.0-rc.3

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.3)

# Designed by Tân Dev — v1.6.0 RC3 (Legacy Home V8.6)

- V8.4 trên LG 49UH850T-TA đã xác nhận Home 1,4 giây, readiness 11,2 giây và render boot 1,5 giây qua log; catalog 18 app, 5 input; tắt/bật Magic Remote tạo Boot ID mới. Standby thực sự chưa xác nhận.
- V8.5: tên app và vendor Designed by Tân Dev; giữ app ID com.infinitimoney.tvhome và đường dẫn dữ liệu. Giữ bản quyền MIT gốc.
- Bỏ trợ lý AI khỏi IPK, tab Dev Mode và khu vực nhanh thời tiết. Giữ tìm kiếm địa điểm và tính năng khác.
- Giữ Homebrew Failsafe, hai mẫu readiness; chu kỳ 500ms, hiển thị các tile đồng thời và đợi toàn bộ class shown. Cache biểu tượng và giảm sao chép không đổi; chưa đo CPU/RAM thực tế.
- QR: dịch vụ nền opt-in riêng, khóa ngẫu nhiên 48 ký tự, QR có viền, chọn JPG/PNG, cập nhật ảnh độc lập với catalog, refresh địa chỉ mạng. Chưa kiểm thử điện thoại thật; dùng cùng mạng LAN tin cậy, không mở cổng ra Internet.
- Cài IPK và root tools cùng bản, thử Home và boot một lần rồi xác nhận thủ công. RC2 là prerelease, không thay latest; chưa nghiệm thu vật lý. Xem docs/legacy-home-v8.vi.md.

- RC3: 4 thẻ ứng dụng ngang 380×214, một hàng phía dưới, cuộn theo từng ô, viền và zoom 7% khi chọn, chỉnh sửa cố định ngoài hàng. Giữ cài đặt giảm chuyển động. Chưa nghiệm thu hiển thị trên TV.


---

## v1.6.0-rc.2

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.2)

# Designed by Tân Dev — v1.6.0 RC2 (Legacy Home V8.5)

- V8.4 trên LG 49UH850T-TA đã xác nhận Home 1,4 giây, readiness 11,2 giây và render boot 1,5 giây qua log; catalog 18 app, 5 input; tắt/bật Magic Remote tạo Boot ID mới. Standby thực sự chưa xác nhận.
- V8.5: tên app và vendor Designed by Tân Dev; giữ app ID com.infinitimoney.tvhome và đường dẫn dữ liệu. Giữ bản quyền MIT gốc.
- Bỏ trợ lý AI khỏi IPK, tab Dev Mode và khu vực nhanh thời tiết. Giữ tìm kiếm địa điểm và tính năng khác.
- Giữ Homebrew Failsafe, hai mẫu readiness; chu kỳ 500ms, hiển thị các tile đồng thời và đợi toàn bộ class shown. Cache biểu tượng và giảm sao chép không đổi; chưa đo CPU/RAM thực tế.
- QR: dịch vụ nền opt-in riêng, khóa ngẫu nhiên 48 ký tự, QR có viền, chọn JPG/PNG, cập nhật ảnh độc lập với catalog, refresh địa chỉ mạng. Chưa kiểm thử điện thoại thật; dùng cùng mạng LAN tin cậy, không mở cổng ra Internet.
- Cài IPK và root tools cùng bản, thử Home và boot một lần rồi xác nhận thủ công. RC2 là prerelease, không thay latest; chưa nghiệm thu vật lý. Xem docs/legacy-home-v8.vi.md.


---

## v1.6.0-rc.1

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.1)

# Infiniti TV Home v1.6.0 — Legacy Home V8.4

- V8.3 đo được Luna sẵn sàng 11,2 giây từ hook trên LG 49UH850T-TA; Home và cold boot đã xác nhận qua log Foreground trên V8.2/V8.3.
- V8.4 giảm thời gian chờ Home, tối ưu polling wake, bổ sung challenge render qua loopback và đồng bộ app nền, lưu log Recovery.
- IPK và root tools phải cập nhật cùng nhau. Tích hợp Home/boot/wake vẫn opt-in, trial một lần, không sửa firmware. V8.4 render, wake, recovery và giao diện thực tế chưa nghiệm thu trên TV; release candidate không phải chứng nhận ổn định.
- Giữ nguyên các tính năng tiếng Việt, HDMI, tùy chỉnh và SHA-256. Xem docs/legacy-home-v8.vi.md.


---

## v1.5.2

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.2)

## What's Changed
* fix: v1.5.2 – lọc ứng dụng cài đặt, dock nhỏ trong suốt sát đáy, sửa xung đột Home by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/12


**Full Changelog**: https://github.com/infiniti-money/lg-tv-webos/compare/v1.5.1...v1.5.2

---

## v1.5.1

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.1)

## What's Changed
* fix: Infiniti TV Home v1.5.1 – LG Input Hook, Home mặc định, AI toggle, một hàng app và thời tiết trong suốt by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/11


**Full Changelog**: https://github.com/infiniti-money/lg-tv-webos/compare/v1.5.0...v1.5.1

---

## v1.5.0

[Nguồn](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.0)

## What's Changed
* Cá nhân hóa Infiniti TV Home và chuyển nguồn cài đặt sang infiniti-money by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/1
* Thay thế Home LG an toàn bằng Input Hook + Home Watcher, có khôi phục by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/2
* Sửa GitHub Actions đóng gói Infiniti TV Home .ipk by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/3
* Sửa ánh xạ Home dùng Launch App của LG Input Hook by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/4
* Nâng cấp Infiniti TV Home tương thích webOS 3.x (Chromium 38 / Node 0.12) by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/5
* LG webOS 3.4.0: Home ổn định + Voice/AI + tùy chỉnh ứng dụng, giao diện, thời tiết 7 ngày và âm lịch (v1.4.0) by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/6
* ci(release): publish verified IPK v1.4.0 via manual GitHub Actions by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/7
* release: Infiniti TV Home v1.4.1 – đồng bộ sở hữu, Home rollback, CI checks by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/8
* feat: Infiniti TV Home v1.5.0 – cài đặt riêng, thời tiết 3 ngày theo khu vực và lịch đầy đủ by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/9
* release: xuất bản IPK v1.5.0 sau CI thành công by @infiniti-money in https://github.com/infiniti-money/lg-tv-webos/pull/10

## New Contributors
* @infiniti-money made their first contribution in https://github.com/infiniti-money/lg-tv-webos/pull/1

**Full Changelog**: https://github.com/infiniti-money/lg-tv-webos/commits/v1.5.0
