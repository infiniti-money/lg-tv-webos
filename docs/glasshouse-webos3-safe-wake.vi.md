# Infiniti TV Home + Glasshouse: tránh màn hình đen sau standby trên webOS 3.x

Áp dụng cho LG webOS 3.4.0 đã root, Glasshouse Custom Launcher. Đây là hướng dẫn **nghiệm thu trên TV thật**, không phải bảo đảm đã sửa được mọi lỗi đèn nền/compositor.

## Thay đổi trong nhánh này

- `app/lifecycle.js` nhận `Glasshouse.onCovered`, `Glasshouse.isCovered`, `Glasshouse.onHome`.
- Khi bị che: ngừng các interval giao diện, lịch âm và thời tiết; hủy yêu cầu thời tiết chưa hoàn tất, tạm dừng hiệu ứng và hẹn giờ Home/tile đang chờ.
- Khi hiện lại: tiếp tục đúng **một** bộ interval cho từng chức năng, làm mới trạng thái; giới hạn làm mới trùng do Home liên tiếp.
- Phím Home được Glasshouse quản lý. **Không gọi launcher từ sự kiện wake**, không thêm script init/hook, không can thiệp phân vùng hệ thống.
- Khi sử dụng IPK ngoài Glasshouse, vẫn dự phòng `visibilitychange` của webOS.

## Khuyến nghị cấu hình trên TV gặp màn hình đen

1. Đầu tiên vào Glasshouse → Home, chọn **LG Home**, tắt **Open Home at power-on**; không bật tự mở sau wake.
2. Xác nhận Settings, Live TV và HDMI vẫn có hình bình thường sau hai lần standby/wake.
3. Chọn Glasshouse Minimal (nếu thật sự cần) để thử phím Home. Chưa bật tự mở lúc lên nguồn.
4. Tải IPK/ZIP của nhánh kiểm thử ở Glasshouse → Home → Custom và xác nhận **Home → Infiniti** hoạt động khi đang bật TV.
5. Kiểm tra từ Live TV → Home, từ HDMI → Home, quay về Live TV, qua standby/wake. Chỉ sau khi mọi bước đạt mới cân nhắc chế độ tự mở khi bật nguồn.
6. Không bật đồng thời LG Input Hook, `97-homekey`, `--start-home-on-boot` của Infiniti và Glasshouse Home interception. Tránh cho các cơ chế cùng điều khiển Home.

**Giới hạn:** Glasshouse có thể chủ động đưa Custom Home lên khi wake tùy cấu hình của Glasshouse; sửa mã Infiniti không thể ngăn hành vi của server này. Kết quả thực tế cần được xác nhận trên từng firmware.

## Cứu hộ không chỉnh phân vùng hệ thống

SSH vào TV bằng khóa đã xác minh, rồi chạy:

```sh
/var/lib/tvweb/tvwebctl restore-glasshouse-home
/var/lib/tvweb/tvwebctl status
```

Nếu vẫn đen: kiểm tra menu LG, HDMI, Live TV, nguồn tín hiệu và đèn nền trước khi thử launcher tiếp. Có thể dừng Glasshouse tạm thời bằng `/var/lib/tvweb/tvwebctl stop` (Dashboard cổng 8080 sẽ ngừng chạy).

Thu thập trạng thái **chỉ đọc**:

```sh
luna-send -n 1 -f luna://com.webos.applicationManager/getForegroundAppInfo '{}'
tail -n 80 /var/lib/tvweb/tvweb.log
```

Không chia sẻ `config.json` nguyên bản vì có thể chứa token. Không thực hiện reboot lặp, xóa `/var/luna/preferences/webosbrew_failsafe`, hoặc sửa kernel/rootfs/TVSERVICE.

Tài liệu Glasshouse:
- [Home và Custom Launcher](https://rorygallagher2024.github.io/glasshouse/dashboard/home/)
- [API lifecycle onCovered/onHome](https://rorygallagher2024.github.io/glasshouse/development/WRITING-LAUNCHERS/)
