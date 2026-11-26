> Tài liệu kỹ thuật/tham chiếu lịch sử — Designed by Tân Dev. Hướng dẫn cài đặt hiện hành: [Owner guide](owner-guide.vi.md). Không áp dụng hook thử nghiệm cũ đồng thời với Legacy Home.

# Autostart webOS 3.4 — Chuyển giao màn hình an toàn (thử nghiệm)

**Phạm vi:** Ứng dụng phụ \`org.webosbrew.autostart\` được build từ mã nguồn upstream speed47 (ISC). Không thay Homebrew Channel v0.7.3 chính thức, không đụng LG Home hay phân vùng hệ thống.

## Tình huống thực tế
- LG webOS 3.4.x có thể bị kẹt màn hình bi lăn khi Autostart được đăng ký làm ứng dụng nguồn vào.
- SSH (22) và Glasshouse (8080) đôi lúc đã mở, nhưng giao diện vẫn chưa chuyển về Live TV.
- EIM của TV vốn là mount ext4; vì vậy \`findmnt /var/lib/eim\` không thể dùng làm bằng chứng bind-mount.
- Không có bằng chứng mọi trường hợp bi lăn đều do Autostart. Cần nghiệm thu thực tế.

## Bản vá
1. Kích hoạt Homebrew ngay, cố khôi phục ứng dụng nguồn vào trước đó sau khoảng chờ ngắn và tối đa 3 vòng, có giới hạn thời gian cho mỗi Luna call.
2. Không giành màn hình nếu foreground đã chuyển sang một ứng dụng thực khác.
3. Nếu chuyển nguồn vào thất bại, thử Live TV; ứng dụng phụ tự đóng, không chặn màn hình vô hạn.
4. Giữ cơ chế re-register EIM nhưng chỉ xóa entry ở overlay **sau khi xác minh thành công bằng cùng device:inode**; không xóa, unmount, hay chép đè EIM gốc.
5. Bản vá là ứng dụng phụ, phải được đóng gói và cài đè từ IPK v0.1.5; không chạy script sửa hệ thống.

## Thứ tự thử nghiệm
1. Khi TV còn dùng được, sao lưu \`/var/lib/eim\` và các file Homebrew; xác nhận SSH hoạt động.
2. Cài đè \`org.webosbrew.autostart_0.1.5_all.ipk\` trên ứng dụng phụ **0.1.4**; không gỡ Homebrew Channel.
3. Mở Autostart một lần, xác nhận thông báo EIM overlay verified.
4. Khởi động lại một lần có kiểm soát; theo dõi SSH, Glasshouse và foreground; xác minh Live TV/HDMI và phím Home.
5. Chỉ sau khi TV ổn định, kiểm tra thêm các lần bật/tắt bình thường và tình huống mất điện.

## Hoàn tác
Nếu bản thử nghiệm gây màn hình bi lăn: có thể sử dụng thao tác nút nguồn đã được chứng minh trên TV này để lấy lại giao diện. **Không tự xóa \`/var/lib/eim\` hoặc chạy \`umount\`.** Giữ bản sao tại \`/home/root/autostart-backup/eim-before\`. Có thể cài đè lại IPK upstream 0.1.4 sau khi đã ổn định, nhưng bản upstream có lỗi cũ, không xem đó là cách chữa màn hình treo. Nếu cần gỡ hoàn toàn, phải kiểm tra trạng thái đăng ký EIM trước khi khởi động lại.

Nguồn: [speed47/webosbrew-autostart](https://github.com/speed47/webosbrew-autostart) và [Issue #7](https://github.com/speed47/webosbrew-autostart/issues/7).

**Giới hạn:** CI chỉ kiểm tra mô phỏng, build/đóng gói; không thể chứng nhận hết treo trên TV thực qua GitHub Actions.
