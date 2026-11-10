# Phát hành Infiniti TV Home v1.5.1

Ứng dụng LG webOS 3.4.0 đóng gói thành `infiniti-tv-home.ipk`. Không phát hành bản chính thức nếu CI đóng gói hoặc kiểm tra SHA-256 thất bại. Chỉ tải gói từ GitHub Releases của `infiniti-money/lg-tv-webos`; không dùng link hoặc địa chỉ ủng hộ từ repository nguồn.

## Chạy thủ công trên GitHub

1. Mở https://github.com/infiniti-money/lg-tv-webos/actions/workflows/release.yml
2. Chọn **Run workflow** → **Branch: main**.
3. Đánh dấu **Create version tag and publish the verified IPK to GitHub Releases**.
4. Nhấn **Run workflow**. Workflow sẽ kiểm thử cú pháp, ES5 và hồi quy; tạo gói IPK, kiểm tra cấu trúc và sinh SHA-256; tải artifact lên GitHub; cuối cùng tạo tag theo phiên bản trong `app/appinfo.json` và công bố Release.
5. Chỉ sau khi job thành công, kiểm tra https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.1, xác nhận hai tệp `infiniti-tv-home.ipk` và `infiniti-tv-home.ipk.sha256`.

**Nếu chỉ muốn kiểm tra hoặc tải artifact thử nghiệm:** bỏ dấu chọn phát hành trước khi chạy; workflow không tạo tag/Release.

**Nếu không có nút Run workflow:** vào **Settings → Actions → General**, kiểm tra GitHub Actions được bật, rồi quay lại workflow. Commit do GitHub App tạo có thể không kích hoạt sự kiện `push`; lúc đó cần chạy thủ công. Không giả định mã nguồn gộp thành công đồng nghĩa build đã chạy.

## Nâng cấp giao diện v1.5.1

- Trang **Cài đặt giao diện** riêng có các mục Giao diện, Thời tiết, Âm–dương lịch và Ứng dụng.
- Thời tiết Open-Meteo còn **3 ngày**: hôm nay, ngày mai, ngày kia; chọn nhanh khu vực hoặc tìm thành phố/khu vực qua API geocoding.
- Dương lịch hiển thị đầy đủ thứ, ngày/tháng/năm; âm lịch hiển thị ngày/tháng/năm âm, Can Chi năm và tháng nhuận.
- Giảm chuyển động tùy chọn, hạn chế đọc lại kích thước header và kiểm soát tốc độ lặp phím điều khiển.
- Giữ tương thích Chromium 38 (ES5), tệp dữ liệu và Home rollback cũ.

## Kiểm tra trên TV

Cài trên TV LG đã bật Developer Mode hoặc đã root theo hướng dẫn. Kiểm tra khởi động, remote OK/Back, 3 ngày thời tiết, âm lịch, tùy chỉnh app, phát âm tiếng Việt qua bàn phím LG và Home rollback. Quyền điều khiển micro trực tiếp tùy firmware; AI chỉ có phản hồi khi đã cấu hình Cloudflare Worker, API key và access token.

Đối chiếu tệp IPK bằng SHA-256 trước khi cài. **Không tự kích hoạt thay thế phím Home trên TV sản xuất khi chưa thử khôi phục Home gốc.**

## Bản sửa lỗi v1.5.1 (webOS 3.x)

- Đồng bộ gói ứng dụng từ Luna + thư mục cài đặt cùng lúc, kể cả khi Luna chỉ trả một phần danh sách. Phát hiện ứng dụng cài tại các vị trí developer/cryptofs và đồng bộ định kỳ mỗi 10 phút.
- LG Input Hook 1.4: cấu hình nút Home (773) bằng **Execute** lệnh `/home/root/lg-tv-vibehack/golauncher.sh`, tương thích hơn tùy chọn Launch App; giữ backup keymap và phục hồi nguyên trạng sau khi tắt.
- Tự động khởi động Infiniti TV Home ở lần bật TV (chờ ứng dụng webOS sẵn sàng); LG Home vẫn nằm trong hệ thống làm phương án khôi phục. Không xóa app hệ thống.
- Danh sách ứng dụng chỉ còn **một hàng cuộn ngang**; remote trái/phải chọn app, nút chỉnh sửa ở cuối hàng.
- Thời tiết 3 ngày sử dụng **nền kính trong suốt** có đường viền sáng và chữ dễ đọc trên hình nền.
- Trang **Trợ lý AI** trong Tùy chỉnh cho phép bật/tắt và lưu cấu hình; tắt sẽ ẩn nút AI, ngăn gửi yêu cầu và tắt micro/huỷ yêu cầu đang xử lý; không lưu token truy cập.

**Lưu ý:** Nâng cấp IPK đơn lẻ chỉ cập nhật giao diện. Để kích hoạt Home khi bật TV và sửa đồng bộ app, phải chạy lại `install.sh` qua SSH root để cập nhật các sidecar `tv/*.sh` và `tv/*.js` trên TV, sau đó khởi động lại. Bản nghiệm thu CI không thay thế thử remote và Input Hook trên TV LG thật.
