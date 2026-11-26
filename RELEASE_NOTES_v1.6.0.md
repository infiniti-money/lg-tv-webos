# Designed by Tân Dev — v1.6.0 (V9.0)

## Phát hành tổng hợp
Gộp RC1–RC7 vào main theo yêu cầu chủ dự án. CI kiểm tra tương thích ES5, layout, icon pack, lịch âm, remote, đóng gói IPK và root tools. V8.4 đã được kiểm tra trên LG 49UH850T-TA; các thay đổi giao diện V9.0, QR hình nền và Standby thực sự chưa được xác nhận trên TV. Ảnh thác nước chọn trước đó chưa được nhúng vào IPK. Cài IPK và root tools cùng phiên bản; thử Home/boot trước khi confirm. Không tự bật root hook; giữ Failsafe và bản RC để quay lại. Người dùng đã cài RC có cùng version 1.6.0 cần cập nhật thủ công.

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
