# Phát hành Infiniti TV Home v1.4.1

Ứng dụng LG webOS 3.4.0 đóng gói thành `infiniti-tv-home.ipk`. Không phát hành bản chính thức nếu CI đóng gói hoặc kiểm tra SHA-256 thất bại. Chỉ tải gói từ GitHub Releases của `infiniti-money/lg-tv-webos`; không dùng link hoặc địa chỉ ủng hộ từ repository nguồn.

## Chạy thủ công trên GitHub

1. Mở https://github.com/infiniti-money/lg-tv-webos/actions/workflows/release.yml
2. Chọn **Run workflow** → **Branch: main**.
3. Đánh dấu **Create version tag and publish the verified IPK to GitHub Releases**.
4. Nhấn **Run workflow**. Workflow sẽ kiểm thử cú pháp, ES5 và hồi quy; tạo gói IPK, kiểm tra cấu trúc và sinh SHA-256; tải artifact lên GitHub; cuối cùng tạo tag theo phiên bản trong `app/appinfo.json` và công bố Release.
5. Chỉ sau khi job thành công, kiểm tra https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.4.1, xác nhận hai tệp `infiniti-tv-home.ipk` và `infiniti-tv-home.ipk.sha256`.

**Nếu chỉ muốn kiểm tra hoặc tải artifact thử nghiệm:** bỏ dấu chọn phát hành trước khi chạy; workflow không tạo tag/Release.

**Nếu không có nút Run workflow:** vào **Settings → Actions → General**, kiểm tra GitHub Actions được bật, rồi quay lại workflow. Commit do GitHub App tạo có thể không kích hoạt sự kiện `push`; lúc đó cần chạy thủ công. Không giả định mã nguồn gộp thành công đồng nghĩa build đã chạy.

## Kiểm tra trên TV

Cài trên TV LG đã bật Developer Mode hoặc đã root theo hướng dẫn. Kiểm tra khởi động, remote OK/Back, 7 ngày thời tiết, âm lịch, tùy chỉnh app, phát âm tiếng Việt qua bàn phím LG và Home rollback. Quyền điều khiển micro trực tiếp tùy firmware; AI chỉ có phản hồi khi đã cấu hình Cloudflare Worker, API key và access token.

Đối chiếu tệp IPK bằng SHA-256 trước khi cài. **Không tự kích hoạt thay thế phím Home trên TV sản xuất khi chưa thử khôi phục Home gốc.**
