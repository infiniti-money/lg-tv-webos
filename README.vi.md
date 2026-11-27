# Designed by Tân Dev

Launcher tùy chỉnh dành cho LG webOS. Chủ sở hữu kho mã, quản trị dự án và bản phát hành: [infiniti-money](https://github.com/infiniti-money).

[English](README.md) · [Bản phát hành](https://github.com/infiniti-money/lg-tv-webos/releases) · [Hướng dẫn chủ TV](docs/owner-guide.vi.md) · [Giấy phép](LICENSE)

## Phiên bản hiện tại

Bản ổn định v1.6.2; v1.6.6 đã phát hành prerelease. v1.6.7 là ứng viên kiểm thử Home theo foreground. Tất cả gói cài đặt chính thức của bản tùy chỉnh được phân phối từ repository này.

| Chức năng | v1.6.7 (ứng viên) |
|---|---|
| Home | Một hàng ứng dụng, chỉ hiện tên app được chọn |
| Giao diện | Chủ đề, phông chữ, 105 icon, đổi tên và icon, ghim/ẩn/hiện app |
| Đồng hồ | Lịch dương/âm, thời tiết hiện tại và dự báo |
| Màn hình chờ | 14 hiệu ứng, ngẫu nhiên, kiểm thử tức thời |
| Album | 20 ảnh Full HD, 24 chuyển cảnh, 12 chuyển động ảnh |
| Chu kỳ ảnh | 15 giây đến 7 ngày hoặc mỗi lần bật TV |
| Tùy chỉnh | 8 chuyên mục trên TV; quản lý web qua cổng 9090, mật khẩu riêng từ 8 ký tự |
| Khôi phục | Giữ LG Home gốc, thử watcher trước khi bật lâu dài |

## Cài đặt và sử dụng

- TV đã root: cài IPK và Root Tools **cùng phiên bản** từ Release; theo [hướng dẫn SSH](docs/owner-guide.vi.md).
- Không root: chỉ cài Launcher bằng công cụ Developer Mode phù hợp; không có dịch vụ quản lý root/LAN hoặc tích hợp Home legacy. Xem công cụ `install-noroot.sh` và [tích hợp Glasshouse](docs/GLASSHOUSE.md).
- Trên v1.6.2, web dùng cổng 8090; v1.6.3 trở lên chuyển sang 9090. Không mở cổng ra Internet.

## Tương thích và hỗ trợ

Thiết bị mục tiêu LG 49UH850T-TA, webOS 3.4.3, firmware 05.70.45, ARMv7. v1.6.0 đã được thử khởi động trên thiết bị; chủ TV đã báo cáo P4/P5 v1.6.3 đạt, nhưng nhật ký Home mới cho thấy các lần nhấn chưa có trigger riêng; v1.6.7 cần nghiệm thu lại. Không sửa firmware hay xóa LG Home. Tài liệu kỹ thuật legacy và các ghi chú release cũ là tài liệu tham chiếu/khôi phục, không phải hướng dẫn cài hiện hành.

Báo lỗi tại [Issues](https://github.com/infiniti-money/lg-tv-webos/issues). Không gửi mật khẩu hoặc URL chứa khóa.

## Quyền sở hữu và giấy phép

Tên hiển thị và nhà cung cấp: **Designed by Tân Dev**. Chủ repo: **infiniti-money**. Mã nguồn được phân phối theo [MIT](LICENSE); quyền tác giả và giấy phép của thành phần upstream vẫn được tôn trọng. Xem [ghi công và nguồn gốc](docs/ATTRIBUTION.md). Quyền sở hữu kho mã không đồng nghĩa với chuyển quyền tác giả của các bên khác.
