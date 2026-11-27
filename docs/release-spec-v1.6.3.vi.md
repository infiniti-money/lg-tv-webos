# Đặc tả phát hành v1.6.3 — Ambient Motion & Control Center

**Sản phẩm:** Designed by Tân Dev · **Chủ repo:** infiniti-money  
**Thiết bị mục tiêu:** LG 49UH850T-TA, webOS 3.4.3, ARMv7, firmware 05.70.45.  
**Trạng thái:** kế hoạch và tiêu chí nghiệm thu, không phải release. Bản chính thức hiện tại v1.6.2. PR #33; baseline `86ddd572bdd5b81970ad924960d49b1c4f82043e` có CI 45874912094 và 45874906257 thành công. appinfo vẫn 1.6.2. Chưa nghiệm thu hardware các chức năng mới.

## P0 — Tính năng bắt buộc phải hoạt động

- Idle chỉ khi Home hiển thị và TV đang hoạt động, không ép chạy khi Standby hoặc app khác foreground. Kiểm thử tức thời, thoát bằng remote; lần nhấn đánh thức không mở app ngoài ý muốn.
- Xác minh renderer hiệu ứng JavaScript 10 FPS trên webOS cũ; CSS là tùy chọn trên engine mới. Dừng timer khi covered/thoát.
- LAN http://IP-TV:9090/ và QR, mật khẩu riêng 8–64 ký tự, không bắt buộc số/ký tự đặc biệt; giữ khóa hiện tại khi nâng cấp. Không mở internet; HTTP không mã hóa. Xác minh đăng nhập, khóa sau 5 lần sai/60s, đổi mật khẩu, IP đổi và ACK thực tế. Không nhầm xếp hàng với áp dụng.
- Đồng bộ hai chiều giao diện/app/thời tiết; chỉnh thành phố qua web không bị localStorage thời tiết cũ ghi đè. Không ghi đè trường không sửa; nếu ACK chưa về vẫn cho gửi thay đổi có chủ đích. Kiểm thử cài đặt từ Safari iPhone và trình duyệt máy tính.
- Tối đa 20 ảnh Full HD, 1,5 MB/ảnh; xem trước/xóa/tải nhiều ảnh; lưu ảnh gần nhất; không thay hình nền Home. Cài IPK và Root Tools cùng tag, giữ cơ chế recovery, app ID và đường dẫn tương thích cũ.

## P1 — Chuyển cảnh album (mục tiêu 24 kiểu)

Đã có 14: fade, slide-left, slide-right, slide-up, slide-down, diagonal, zoom-in, zoom-out, soft-rotate, sweep, lift, focus, dissolve, cinema. Random và none là chế độ, không tính là phong cách.

Thêm 10:
| ID | Tên | Mô tả |
|---|---|---|
| slide-nw | Trượt chéo lên trái | Dịch chéo nhẹ + opacity |
| slide-ne | Trượt chéo lên phải | Dịch chéo nhẹ + opacity |
| slide-sw | Trượt chéo xuống trái | Dịch chéo nhẹ + opacity |
| cross-zoom | Zoom giao thoa | Scale nhẹ + opacity, không filter |
| swing-left | Nghiêng trái | Rotate nhẹ + scale |
| swing-right | Nghiêng phải | Rotate nhẹ + scale |
| drift-in | Lướt vào | Translate ngang nhỏ + scale |
| drop-in | Hạ ảnh | Translate dọc + scale |
| curtain-lite | Rèm mềm | Mở rộng scaleX nhẹ + opacity, không mask |
| flip-lite | Lật nhẹ | ScaleX từ .85 đến 1 + opacity, không 3D |

Mọi ID phải có cùng semantics ở validator server, web, player, CSS và fallback JavaScript. Không đưa blur động, canvas, clip-path, WebGL hoặc hiệu ứng nặng vào preset mặc định. Tốc độ chọn 0,6 / 1,1 / 1,6 giây, default 1,1 giây cho cài mới; giá trị cũ giữ nguyên. Chuyển ảnh ngẫu nhiên không lặp liên tiếp; nhóm nhẹ và điện ảnh, độc lập với thứ tự ảnh.

## P2 — Chuyển động ảnh (mục tiêu 12 kiểu)

Đã có sáu: zoom-in/out, pan-left/right/up/down. Thêm pan-nw, pan-ne, pan-sw, pan-se, drift-horizontal, drift-vertical. Chỉ dùng transform/opacity, crop trong wrapper. Mặc định 32s/lượt, biên độ nhẹ; cường độ nhẹ/vừa, không zoom quá 1,15. Tĩnh, zoom, pan, drift, ngẫu nhiên toàn bộ, ngẫu nhiên nhẹ. Tùy chọn cố định từng kiểu. Giảm chuyển động thắng mọi tùy chọn. Không chạy JS fallback khi rời idle.

## P3 — Màn hình chờ

Giữ 14 hiệu ứng đã có: mưa, tuyết, cánh hoa, sao, đom đóm, bong bóng, sương, lá bay, ánh kim, sao băng, cực quang, tàn lửa, sóng ánh sáng, trái tim. Random nhẹ (tuyết, cánh hoa, sao, sương, lá, ánh kim) và random toàn bộ. Giữ đồng hồ/lịch/thời tiết hiện tại và chữ Designed by Tân Dev, thu gọn dock và forecast. Không tuyên bố chống burn-in. Chỉ một lớp SVG tile, fallback 10 FPS.

## P4 — Tùy chỉnh / preview

8 nhóm: Giao diện; Màn hình chờ; Album; Ứng dụng; Đồng hồ & lịch; Thời tiết; Hình nền & kết nối web; An toàn & khôi phục. Nhóm an toàn cung cấp trạng thái/hướng dẫn, không mở shell/root/DNS/firmware qua web. Chuyển tên nhóm an toàn không xóa hướng dẫn DNS an toàn. D-pad, không tràn màn hình 1920x1080; kiểm tra focus và Back, tránh bẫy focus. Home chỉ hiện tên app được chọn. Web responsive, có lưu rõ ràng, thông báo lỗi, pending và applied; quản lý pin/ẩn/hiện/đổi tên/icon. Thử idle, thử album, chuyển ảnh tiếp và thử motion ngay trên TV; thử chuyển ảnh thủ công không làm sai lịch album dài hạn. Web preview mô phỏng và không thay thế nghiệm thu TV. TV hiện có 8 trang, lựa chọn idle và album preview cơ bản; preview riêng từng chuyển cảnh/motion và quản lý album đầy đủ qua TV là phần cần bổ sung. Không thêm mục cập nhật.

## Cấu hình mặc định cho cài mới

| Mục | Giá trị |
|---|---|
| Tự vào idle | 60 giây |
| Hiệu ứng idle | Ngẫu nhiên nhẹ |
| Album | Tắt đến khi chủ TV chọn ảnh và bật |
| Chu kỳ ảnh | 20 giây (cần bổ sung vào danh sách thời gian) |
| Chuyển cảnh | Ngẫu nhiên nhóm nhẹ |
| Tốc độ | 1,1 giây |
| Chuyển động | Ngẫu nhiên nhẹ |
| Cường độ | Nhẹ |
| Giảm chuyển động | Tôn trọng lựa chọn người dùng |
| Địa chỉ web | cổng 9090 |

Không ép đổi thiết lập người dùng đã lưu. Giữ chu kỳ 15s–7 ngày và mỗi lần bật TV. Ngày tính 24h; wake resume phụ thuộc sự kiện Luna và watcher, phải thử trên thiết bị.

## P5 — Hiệu năng và kiểm thử

Hai lớp ảnh tối đa; một lớp hiệu ứng; không mạng/video cho hiệu ứng; giải phóng ảnh cũ và timer khi thoát. Giới hạn preload, timeout lỗi ảnh và đọc lại cấu hình; không rebuild danh mục khi idle. Đo CPU/RAM trước/sau với cùng album, cùng độ phân giải và cấu hình; thử ít nhất 30 phút, ghi số liệu thực, không tuyên bố tăng hiệu năng nếu chưa đo.

- [ ] CI: cú pháp ES5, Node legacy, validator, player, persistence, LAN auth, QR 9090, lifecycle, packaging, SHA-256.
- [ ] Mọi ID mới được kiểm thử cả CSS và JS; random không lặp ngay; giảm chuyển động; ảnh lỗi và album rỗng; duy trì lịch.
- [ ] TV: 14 idle effects + 24 chuyển cảnh + 12 motion chạy vật lý; thử nhanh từng kiểu.
- [ ] TV: idle tự động, remote wake, rời Home, 30 phút chạy liên tục; CPU/RAM và log.
- [ ] LAN: Safari iPhone và trình duyệt máy tính, login, đổi mật khẩu, upload, xóa, chọn hiệu ứng, chỉnh thời tiết/app; ACK thực tế.
- [ ] Hai chu kỳ cold boot, standby/resume nếu có, LG Home và safe recovery còn hoạt động.
- [ ] Tài liệu, appinfo 1.6.3, release workflow/tag/notes đồng bộ; không sửa tag v1.6.2.
- [ ] CI trên head cuối và main thành công; phát hành IPK + Root Tools + SHA-256; xác minh assets.

**Điều kiện phát hành:** ưu tiên P0 và kiểm thử hardware trước; chưa gộp hoặc xuất bản nếu CI chưa đạt. Nếu phần cứng chưa nghiệm thu thì ghi rõ và chỉ cân nhắc ứng viên thử nghiệm, không quảng cáo là stable đã xác minh. Không thay đổi quyền sở hữu kho (đã thuộc infiniti-money) hoặc xóa ghi công bắt buộc. Không đổi đường dẫn dữ liệu tương thích trong bản này.

### Tiến độ triển khai
Bổ sung đủ 24 chuyển cảnh, 12 motion, chu kỳ 20 giây, tốc độ 600/1100/1600ms và nhóm random nhẹ/điện ảnh. Các mục khác trong đặc tả vẫn theo checklist; cần CI và kiểm thử TV.
