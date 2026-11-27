# CHANGELOG — Designed by Tân Dev

Lịch sử phát hành và nghiệm thu của Infiniti TV Home. Nguồn: [GitHub Releases](https://github.com/infiniti-money/lg-tv-webos/releases). Ngày theo UTC; nhãn phát hành chính thức không đồng nghĩa đã nghiệm thu phần cứng. Giữ nguyên tag và release lịch sử.

## Quy tắc bắt buộc

Mỗi phiên bản mới phải có mục trong CHANGELOG.md, tệp RELEASE_NOTES_vX.Y.Z.md, liên kết ở RELEASE.vi.md, thay đổi/sửa lỗi, CI, bằng chứng TV thật (nếu có), giới hạn và cách phục hồi. Không đánh dấu PASS nếu chưa có log. Không đưa binary LG, dữ liệu riêng hoặc bí mật vào GitHub. Cập nhật ghi chú khi có kết quả thử nghiệm sau phát hành; không sửa tag cũ.

## Danh mục phiên bản

| Phiên bản | Ngày UTC | Loại | Thay đổi | Ghi chú |
|---|---|---|---|---|
| v1.8.0 | — | Ứng viên, chưa phát hành | Runtime isolation, sáu đối chứng, báo cáo loader kể cả khi lỗi | [Chi tiết](RELEASE_NOTES_v1.8.0.md) |
| [v1.7.9](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.9) | 2026-11-27 | Prerelease | Preloaded GLib/C++, constructor interposition, IFUNC và readelf Windows | [Chi tiết](RELEASE_NOTES_v1.7.9.md) |
| [v1.7.8](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.8) | 2026-11-27 | Prerelease | Dynamic Cycle, mock exec, mixed threads, ELF collector | [Chi tiết](RELEASE_NOTES_v1.7.8.md) |
| [v1.7.7](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.7) | 2026-11-27 | Prerelease | Sửa provider pthread trên glibc 2.19 | [Chi tiết](RELEASE_NOTES_v1.7.7.md) |
| [v1.7.6](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.6) | 2026-11-27 | Prerelease | Chẩn đoán Hook, ghi mã thoát injector, probe đa luồng; khóa inject vật lý | [Chi tiết](RELEASE_NOTES_v1.7.6.md) |
| [v1.7.5](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.5) | 2026-11-27 | Prerelease | Thử nghiệm Native Home 773, preflight và rollback | [Chi tiết](RELEASE_NOTES_v1.7.5.md) |
| [v1.7.4](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.4) | 2026-11-27 | Prerelease | Sửa exit_group, BusyBox timeout và Lab cleanup | [Chi tiết](RELEASE_NOTES_v1.7.4.md) |
| [v1.7.3](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.3) | 2026-11-27 | Prerelease | Lab Thumb biệt lập, kiểm tra ABI | [Chi tiết](RELEASE_NOTES_v1.7.3.md) |
| [v1.7.2](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.2) | 2026-11-27 | Prerelease | Kiểm kê ABI và điều kiện Native Home | [Chi tiết](RELEASE_NOTES_v1.7.2.md) |
| [v1.7.1](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.1) | 2026-11-27 | Prerelease | V9.1: Native/LSM probe và fast fallback | [Chi tiết](RELEASE_NOTES_v1.7.1.md) |
| [v1.7.0](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.7.0) | 2026-11-27 | Prerelease | V9: tương quan LG ribbon và Home intent | [Chi tiết](RELEASE_NOTES_v1.7.0.md) |
| [v1.6.6](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.6) | 2026-11-27 | Prerelease | Repeat Home recovery | [Chi tiết](RELEASE_NOTES_v1.6.6.md) |
| [v1.6.5](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.5) | 2026-11-27 | Prerelease | Fast relaunch và fallback | [Chi tiết](RELEASE_NOTES_v1.6.5.md) |
| [v1.6.4](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.4) | 2026-11-27 | Prerelease | Home bất đồng bộ, hàng đợi giới hạn | [Chi tiết](RELEASE_NOTES_v1.6.4.md) |
| [v1.6.3](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.3) | 2026-11-27 | Prerelease | Ambient Motion, album và LAN 9090 | [Chi tiết](RELEASE_NOTES_v1.6.3.md) |
| [v1.6.2](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.2) | 2026-11-26 | Release | Ambient Display, album và LAN | [Chi tiết](RELEASE_NOTES_v1.6.2.md) |
| [v1.6.1](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.1) | 2026-11-26 | Release | Giao diện kính, 105 SVG, idle | [Chi tiết](RELEASE_NOTES_v1.6.1.md) |
| [v1.6.0](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0) | 2026-11-26 | Release | Tổng hợp RC1–RC7, V9.0 | [Chi tiết](RELEASE_NOTES_v1.6.0.md) |
| [v1.6.0-rc.7](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.7) | 2026-11-26 | Prerelease | V9.0: cài đặt kính bán trong suốt | [Lưu trữ](docs/release-history-archive.md#v160-rc7) |
| [v1.6.0-rc.6](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.6) | 2026-11-26 | Prerelease | V8.9: đổi tên, icon và điều hướng cài đặt | [Lưu trữ](docs/release-history-archive.md#v160-rc6) |
| [v1.6.0-rc.5](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.5) | 2026-11-26 | Prerelease | V8.8: lịch âm offline và dự báo năm dòng | [Lưu trữ](docs/release-history-archive.md#v160-rc5) |
| [v1.6.0-rc.4](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.4) | 2026-11-26 | Prerelease | V8.7: bố cục dự báo gọn | [Lưu trữ](docs/release-history-archive.md#v160-rc4) |
| [v1.6.0-rc.3](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.3) | 2026-11-26 | Prerelease | V8.6: thẻ ứng dụng ngang | [Lưu trữ](docs/release-history-archive.md#v160-rc3) |
| [v1.6.0-rc.2](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.2) | 2026-11-26 | Prerelease | V8.5: thương hiệu và QR LAN | [Lưu trữ](docs/release-history-archive.md#v160-rc2) |
| [v1.6.0-rc.1](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.6.0-rc.1) | 2026-11-26 | Prerelease | V8.4: render challenge và wake | [Lưu trữ](docs/release-history-archive.md#v160-rc1) |
| [v1.5.9](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.9) | 2026-11-15 | Release | Bỏ Autostart EIM, gọi Homebrew từ LAN | [Chi tiết](RELEASE_NOTES_v1.5.9.md) |
| [v1.5.8](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.8) | 2026-11-15 | Release | Glasshouse lifecycle, Autostart phụ thử nghiệm | [Chi tiết](RELEASE_NOTES_v1.5.8.md) |
| [v1.5.7](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.7) | 2026-11-11 | Release | Ẩn icon LG, hướng dẫn DNS | [Chi tiết](RELEASE_NOTES_v1.5.7.md) |
| [v1.5.6](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.6) | 2026-11-11 | Release | Dev Mode Forever companion và chẩn đoán | [Chi tiết](RELEASE_NOTES_v1.5.6.md) |
| [v1.5.5](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.5) | 2026-11-11 | Release | Home 773 và cold-boot trial | [Chi tiết](RELEASE_NOTES_v1.5.5.md) |
| [v1.5.4](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.4) | 2026-11-10 | Release | Icon lớn, hình nền, auto-update opt-in | [Chi tiết](RELEASE_NOTES_v1.5.4.md) |
| [v1.5.3](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.3) | 2026-11-10 | Release | Safe Boot và Emergency Recovery | [Chi tiết](RELEASE_NOTES_v1.5.3.md) |
| [v1.5.2](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.2) | 2026-11-10 | Release | Lọc app, dock và xung đột Home | [Lưu trữ](docs/release-history-archive.md#v152) |
| [v1.5.1](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.1) | 2026-11-10 | Release | Input Hook, Home mặc định, AI toggle | [Lưu trữ](docs/release-history-archive.md#v151) |
| [v1.5.0](https://github.com/infiniti-money/lg-tv-webos/releases/tag/v1.5.0) | 2026-11-10 | Release | Cá nhân hóa, tương thích webOS 3.x và tùy chỉnh | [Lưu trữ](docs/release-history-archive.md#v150) |
| v1.6.7 | — | Ứng viên; không thấy GitHub Release trong danh sách | Foreground-aware Home recovery | [Chi tiết](RELEASE_NOTES_v1.6.7.md) |

## Kết quả nghiệm thu bổ sung sau phát hành

- **v1.7.9:** CI main và workflow phát hành thành công; preloaded FAIL trên TV (injector 1 / 174 ms, mapped, log 0 byte, 7 luồng). LD_DEBUG xác nhận liên kết chéo GLib/C++, dừng tại calling init. Probe 137 do cleanup SIGKILL; hệ thống sạch. Chưa xác định nguyên nhân chính xác. Không inject lginput2 thật.
- **v1.7.8:** chủ TV gửi log PASS mixed và cycle; injector 257 ms, 20 lời gọi, mock exec một lần, QUIT_ACK, exit 0, config {}, không chứng minh Home vật lý. ELF collector hoàn tất; không đăng binary LG.
- **v1.7.7:** probe đơn/đa luồng và Lab pass đạt; ignore xác nhận chặn Home/giữ Volume nhưng Ctrl+C trước LAB_PASS; sau đó config {} và lginput2 sạch.
- **v1.7.6:** probe đơn luồng đạt, đa luồng lỗi pthread_create@GLIBC_2.4 provider libc, exit 127 trước injector.
- **v1.7.5:** thử vật lý thất bại; library mapped, hook log rỗng, không xác nhận init. Giữ bản phục hồi, không thử lại vật lý.
- **v1.7.4:** Lab pass/ignore mô phỏng đạt trên TV; chưa chứng minh Home vật lý.
