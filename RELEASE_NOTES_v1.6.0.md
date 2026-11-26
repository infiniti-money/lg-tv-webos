# Designed by Tân Dev — v1.6.0 RC4 (Legacy Home V8.7)

- V8.4 trên LG 49UH850T-TA đã xác nhận Home 1,4 giây, readiness 11,2 giây và render boot 1,5 giây qua log; catalog 18 app, 5 input; tắt/bật Magic Remote tạo Boot ID mới. Standby thực sự chưa xác nhận.
- V8.5: tên app và vendor Designed by Tân Dev; giữ app ID com.infinitimoney.tvhome và đường dẫn dữ liệu. Giữ bản quyền MIT gốc.
- Bỏ trợ lý AI khỏi IPK, tab Dev Mode và khu vực nhanh thời tiết. Giữ tìm kiếm địa điểm và tính năng khác.
- Giữ Homebrew Failsafe, hai mẫu readiness; chu kỳ 500ms, hiển thị các tile đồng thời và đợi toàn bộ class shown. Cache biểu tượng và giảm sao chép không đổi; chưa đo CPU/RAM thực tế.
- QR: dịch vụ nền opt-in riêng, khóa ngẫu nhiên 48 ký tự, QR có viền, chọn JPG/PNG, cập nhật ảnh độc lập với catalog, refresh địa chỉ mạng. Chưa kiểm thử điện thoại thật; dùng cùng mạng LAN tin cậy, không mở cổng ra Internet.
- Cài IPK và root tools cùng bản, thử Home và boot một lần rồi xác nhận thủ công. RC2 là prerelease, không thay latest; chưa nghiệm thu vật lý. Xem docs/legacy-home-v8.vi.md.

- RC3: 4 thẻ ứng dụng ngang 380×214, một hàng phía dưới, cuộn theo từng ô, viền và zoom 7% khi chọn, chỉnh sửa cố định ngoài hàng. Giữ cài đặt giảm chuyển động. Chưa nghiệm thu hiển thị trên TV.

- RC4: thu nhỏ chữ dự báo 3 ngày, cố định chiều cao dòng và giới hạn nội dung trong ô 159px, kể cả chế độ chữ lớn. Không thay đổi dữ liệu dự báo.
