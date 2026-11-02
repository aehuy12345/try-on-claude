# Flow: Upload và thay ảnh toàn thân

US-02 (sprint backlog gọi là "avatar"). Là phần file của `PUT /api/user/profile` ([PRD 4.4](../PRD.md#44-put-apiuserprofile), [flow hồ sơ](profile.md)), không có endpoint riêng. Quyết định: D9, D10, D13, D15, D16. Bucket và thứ tự thay ảnh: [schema mục 4](../database/schema.md#4-storage-bucket-body-photos).

## Chọn ảnh ở client

```mermaid
flowchart TD
    subgraph U["Người dùng"]
        U1["Chọn ảnh (1 file)"]
        U2(["Xem preview, tiếp tục sửa form hoặc bấm Lưu"])
    end

    subgraph F["Frontend"]
        F1{"Loại là image/jpeg hoặc image/png?"}
        F2["Lỗi: Ảnh phải ở định dạng JPG hoặc PNG. Không nhận file"]
        F3{"Dung lượng ≤ 5 MB?"}
        F4["Lỗi: Ảnh không được vượt quá 5 MB. Không nhận file"]
        F5["Tải vào phần tử Image để đọc kích thước"]
        F6{"Giải mã được?"}
        F7["Lỗi: Không đọc được ảnh. Không nhận file"]
        F8{"Chiều ngắn ≥ 720 px và tỉ lệ gần 3:4 hoặc 9:16?"}
        F9["Cảnh báo mềm kèm hướng dẫn chụp, VẪN nhận file"]
        F10["Giữ File trong state, hiện preview qua object URL"]
    end

    U1 --> F1
    F1 -->|"Không"| F2
    F2 --> U1
    F1 -->|"Có"| F3
    F3 -->|"Không"| F4
    F4 --> U1
    F3 -->|"Có"| F5
    F5 --> F6
    F6 -->|"Không"| F7
    F7 --> U1
    F6 -->|"Có"| F8
    F8 -->|"Không"| F9
    F8 -->|"Có"| F10
    F9 --> F10
    F10 --> U2
```

## Xử lý ở server (có file trong `PUT`)

Chạy sau khi field đã hợp lệ. Các bước 1–4 của schema mục 4 được đánh dấu trong sơ đồ.

```mermaid
flowchart TD
    subgraph F["Frontend"]
        F1["Nhận kết quả từ PUT, xem flow hồ sơ"]
    end

    subgraph B["Backend (Express)"]
        B1{"Magic bytes là JPEG hoặc PNG?"}
        B2["400: INVALID_FILE_TYPE"]
        B3["Lấy ext và contentType từ magic bytes"]
        B4["SELECT lấy path cũ"]
        B5["Sinh path mới: userId/Date.now().ext"]
        B6{"Upload được?"}
        B7["500: UPLOAD_FAILED, DB chưa đổi"]
        B8{"UPDATE được?"}
        B9["Bước 3: xoá ảnh mới (rollback); lỗi xoá chỉ ghi log"]
        B10["500: INTERNAL_ERROR hoặc 400: VALIDATION_ERROR, DB chưa đổi"]
        B11{"Có path cũ?"}
        B12{"Xoá ảnh cũ được?"}
        B13["Chỉ ghi log, không làm hỏng request"]
        B14{"Tạo signed URL được?"}
        B15["bodyPhotoUrl = URL ký"]
        B16["bodyPhotoUrl = null"]
        B17["200: hồ sơ"]
    end

    subgraph S["Supabase"]
        S0[("DB: SELECT body_photo_path")]
        S1[("Bước 1, Storage: upload path mới, contentType, upsert false")]
        S2[("Bước 2, DB: UPDATE field + body_photo_path mới")]
        S3[("Storage: remove path mới")]
        S4[("Bước 4, Storage: remove path cũ")]
        S5[("Storage: createSignedUrl(path mới, 3600)")]
    end

    B1 -->|"Không"| B2
    B1 -->|"Có"| B3
    B3 --> B4
    B4 --> S0
    S0 --> B5
    B5 --> S1
    S1 --> B6
    B6 -->|"Không"| B7
    B6 -->|"Có"| S2
    S2 --> B8
    B8 -->|"Không"| B9
    B9 --> S3
    S3 --> B10
    B8 -->|"Có"| B11
    B11 -->|"Có"| S4
    S4 --> B12
    B12 -->|"Không"| B13
    B12 -->|"Có"| S5
    B13 --> S5
    B11 -->|"Không"| S5
    S5 --> B14
    B14 -->|"Có"| B15
    B14 -->|"Không"| B16
    B15 --> B17
    B16 --> B17
    B2 --> F1
    B7 --> F1
    B10 --> F1
    B17 --> F1
```

## Nhánh lỗi

| Điều kiện | HTTP | Thông báo cho người dùng | Hành vi UI |
|-----------|------|--------------------------|------------|
| File sai loại (không phải jpg/jpeg/png, gồm HEIC) | Client chặn; server `400 INVALID_FILE_TYPE` | Ảnh phải ở định dạng JPG hoặc PNG. | Lỗi tại vùng chọn ảnh; giữ ảnh hiện tại |
| Đổi đuôi file giả mạo (vd `.exe` thành `.jpg`) | Thường bị chặn ở bước giải mã client; server `400 INVALID_FILE_TYPE` | Client: Không đọc được ảnh. Vui lòng chọn ảnh khác. | Không nhận file |
| File vượt 5 MB | Client chặn; server `413 FILE_TOO_LARGE` | Ảnh không được vượt quá 5 MB. | Lỗi tại vùng chọn ảnh |
| Ảnh không đúng ratio hoặc nhỏ hơn khuyến nghị | Không có lỗi (không tới server) | Cảnh báo: "Ảnh có thể chưa phù hợp để thử đồ. Nên dùng ảnh toàn thân, đứng thẳng, dọc tỉ lệ 3:4 hoặc 9:16, chiều ngắn từ 720 px." | Không chặn; hiện cạnh preview kèm nút chọn ảnh khác |
| Gửi nhiều file, sai tên part, multipart hỏng | `400 INVALID_UPLOAD` | Dữ liệu tải lên không hợp lệ. Vui lòng thử lại. | Thông báo trên form (UI bình thường không gây ra) |
| Upload Storage lỗi | `500 UPLOAD_FAILED` | Không thể tải ảnh lên lúc này. Vui lòng thử lại. | Giữ form và file; **chưa có gì được lưu**, kể cả field hợp lệ |
| Ghi DB lỗi sau khi upload | `500 INTERNAL_ERROR` | Đã có lỗi xảy ra. Vui lòng thử lại. | Giữ form và file; ảnh mới đã được rollback, ảnh cũ còn nguyên |
| Xoá ảnh cũ lỗi | `200` | Lưu thành công. | Bình thường; backend ghi log |
| Tạo signed URL lỗi sau khi lưu | `200`, `bodyPhotoUrl: null` | Lưu thành công. | Tiếp tục hiện preview cục bộ từ file vừa chọn |
| Mất mạng, timeout 60 giây | Không có | Không thể kết nối tới máy chủ. Vui lòng thử lại. | Giữ form và file. Server có thể đã lưu xong; gửi lại an toàn vì ảnh sau thay ảnh trước |

## Quy tắc kiểm tra kích thước

- Đọc `naturalWidth`, `naturalHeight` từ phần tử `Image`; giá trị đã tính hướng xoay EXIF trên trình duyệt hiện đại.
- `ratio = rộng / cao`. Đạt khi `|ratio - 0.75| ≤ 0.03` hoặc `|ratio - 0.5625| ≤ 0.03`, và `min(rộng, cao) ≥ 720`. Ảnh ngang luôn bị cảnh báo.
- Input dùng `accept="image/jpeg,image/png"`, `multiple` tắt. Hướng dẫn chọn ảnh luôn hiển thị, không chờ đến khi có lỗi.

## Signed URL hết hạn khi mở trang lâu

TTL 1 giờ. Ảnh đã hiển thị vẫn còn trên màn hình; chỉ lần tải lại ảnh mới lỗi.

1. `<img onError>` gọi lại `GET /api/user/profile`, **chỉ cập nhật `bodyPhotoUrl`**, không đổ đè các ô form đang sửa. Nếu form có thay đổi thì ghi bản nháp trước ([flow hồ sơ](profile.md#giữ-bản-nháp)).
2. Tải lại ảnh tối đa một lần cho mỗi lần hỏng, tránh lặp vô hạn.
3. Vẫn lỗi, hoặc `bodyPhotoUrl` là `null`: hiện ô trống "Không tải được ảnh" kèm nút Thử lại và vẫn cho chọn ảnh mới. Có thể gặp với tài khoản seed `buyer.full` (path chưa có object thật).

## Ghi chú bảo mật

- Path do server sinh từ `sub` trong JWT và thời gian; không dùng tên file hay MIME từ client, nên không có path traversal và không lưu được file giả dạng.
- Bucket private, không có policy; bucket chặn thêm một lớp 5 MB và MIME ([schema mục 4](../database/schema.md#4-storage-bucket-body-photos)). Xoá object qua Storage API.
- Không log signed URL. Object URL của preview phải được thu hồi khi bỏ file hoặc rời trang.
- Rollback lỗi hoặc hai lần lưu đồng thời có thể để lại object mồ côi; chấp nhận ở Sprint 1 ([PRD mục 7](../PRD.md#7-rủi-ro-đã-chấp-nhận-và-đề-xuất-backlog)).
