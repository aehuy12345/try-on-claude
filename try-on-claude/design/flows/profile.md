# Flow: Lấy và cập nhật hồ sơ

US-02. API: [PRD 4.3, 4.4](../PRD.md#43-get-apiuserprofile). Quyết định: D9–D14, D20–D24. Rate limit trong sơ đồ cập nhật là hành vi đích của Sprint 2 Task 6, đã chốt, chưa cài đặt. Phần xử lý file: [flow ảnh toàn thân](upload-body-photo.md). Xác thực: [flow bảo vệ route](logout-protected-routes.md).

## Lấy hồ sơ

```mermaid
flowchart TD
    subgraph U["Người dùng"]
        U1(["Mở /profile"])
        U2(["Thấy form hồ sơ, email chỉ đọc"])
        U3["Bấm Thử lại"]
    end

    subgraph F["Frontend"]
        F1["ProtectedRoute đã cho qua, hiện skeleton, gửi GET /api/user/profile"]
        F2{"Kết quả?"}
        F3["Đổ dữ liệu vào form"]
        F4{"Có bản nháp sessionStorage cùng user id?"}
        F5["Áp bản nháp, báo cần chọn lại ảnh nếu trước đó có ảnh, xoá bản nháp"]
        F6["Hiện trạng thái lỗi + nút Thử lại, KHÔNG hiện form trống"]
        F7["Xử lý hết phiên: xoá token, chuyển /login"]
    end

    subgraph B["Backend (Express)"]
        B1["requireAuth: verify JWT"]
        B2{"Token hợp lệ?"}
        B3["401: AUTH_REQUIRED, TOKEN_EXPIRED hoặc TOKEN_INVALID"]
        B4{"Có dòng profiles?"}
        B5["401: TOKEN_INVALID"]
        B6{"Có body_photo_path?"}
        B7{"Tạo signed URL được?"}
        B8["bodyPhotoUrl = URL ký"]
        B9["bodyPhotoUrl = null"]
        B10["200: hồ sơ"]
    end

    subgraph S["Supabase"]
        S1[("SELECT các cột hồ sơ theo id trong JWT")]
        S2[("Storage: createSignedUrl(path, 3600)")]
    end

    U1 --> F1
    F1 --> B1
    B1 --> B2
    B2 -->|"Không"| B3
    B2 -->|"Có"| S1
    S1 --> B4
    B4 -->|"Không"| B5
    B4 -->|"Có"| B6
    B6 -->|"Không"| B9
    B6 -->|"Có"| S2
    S2 --> B7
    B7 -->|"Có"| B8
    B7 -->|"Không"| B9
    B8 --> B10
    B9 --> B10
    B10 --> F2
    B3 --> F2
    B5 --> F2
    F1 -.->|"Lỗi mạng"| F2
    F2 -->|"200"| F3
    F3 --> F4
    F4 -->|"Có"| F5
    F4 -->|"Không"| U2
    F5 --> U2
    F2 -->|"401 hết phiên"| F7
    F2 -->|"500, lỗi mạng"| F6
    F6 --> U3
    U3 --> F1
```

## Cập nhật hồ sơ

```mermaid
flowchart TD
    subgraph U["Người dùng"]
        U1["Sửa tên, chiều cao, cân nặng; có thể chọn ảnh"]
        U2["Bấm Lưu"]
        U3(["Thấy dữ liệu mới và thông báo thành công"])
    end

    subgraph F["Frontend"]
        F1{"Hợp lệ theo quy tắc client?"}
        F2["Hiện lỗi dưới từng ô, giữ dữ liệu"]
        F3["Ghi bản nháp text vào sessionStorage"]
        F4["Tạo FormData: heightCm, weightKg, displayName, bodyPhoto nếu có; vô hiệu nút; gửi PUT"]
        F5{"Kết quả?"}
        F6["Xoá bản nháp, cập nhật form từ response, bỏ file đã chọn"]
        F7["Xoá bản nháp, hiện lỗi theo code, giữ dữ liệu và file đã chọn"]
        F8["Giữ bản nháp, xoá token, chuyển /login (from=/profile)"]
    end

    subgraph B["Backend (Express)"]
        B1["requireAuth"]
        B2{"Content-Type multipart?"}
        B3["415: UNSUPPORTED_MEDIA_TYPE"]
        B15{"Trong ngưỡng 20 lần mỗi 10 phút theo user?"}
        B16["429: TOO_MANY_REQUESTS, không đọc body"]
        B4["multer parse (bộ nhớ, giới hạn)"]
        B5{"Parse được?"}
        B6["413: FILE_TOO_LARGE hoặc 400: INVALID_UPLOAD"]
        B7["Validate displayName, heightCm, weightKg; đọc theo whitelist"]
        B8{"Hợp lệ?"}
        B9["400: INVALID_DISPLAY_NAME, INVALID_HEIGHT hoặc INVALID_WEIGHT"]
        B10{"Có file?"}
        B11["Kiểm tra, xử lý và upload ảnh: xem flow ảnh toàn thân"]
        B12["Tạo signed URL, 200: hồ sơ"]
        B13["Lỗi: rollback nếu đã upload, 500"]
        B14{"UPDATE thành công?"}
    end

    subgraph S["Supabase (PostgreSQL)"]
        S1[("UPDATE display_name, height_cm, weight_kg, kèm body_photo_path nếu có ảnh mới")]
    end

    U1 --> U2
    U2 --> F1
    F1 -->|"Không"| F2
    F2 --> U1
    F1 -->|"Có"| F3
    F3 --> F4
    F4 --> B1
    B1 -->|"Token lỗi: 401"| F5
    B1 -->|"Hợp lệ"| B2
    B2 -->|"Không"| B3
    B2 -->|"Có"| B15
    B15 -->|"Không"| B16
    B15 -->|"Có"| B4
    B4 --> B5
    B5 -->|"Không"| B6
    B5 -->|"Có"| B7
    B7 --> B8
    B8 -->|"Không"| B9
    B8 -->|"Có"| B10
    B10 -->|"Có"| B11
    B11 -->|"Thành công"| S1
    B11 -->|"Lỗi file hoặc upload: 400, 413, 500"| F5
    B10 -->|"Không"| S1
    S1 --> B14
    B14 -->|"Có"| B12
    B14 -->|"Không"| B13
    B3 --> F5
    B16 --> F5
    B6 --> F5
    B9 --> F5
    B12 --> F5
    B13 --> F5
    F4 -.->|"Lỗi mạng, timeout"| F5
    F5 -->|"200"| F6
    F6 --> U3
    F5 -->|"401 hết phiên"| F8
    F5 -->|"Lỗi khác"| F7
    F7 --> U1
```

## Nhánh lỗi

| Điều kiện | HTTP | Thông báo cho người dùng | Hành vi UI |
|-----------|------|--------------------------|------------|
| Token thiếu, hết hạn, không hợp lệ, hoặc tài khoản không còn tồn tại | `401` (xem [PRD 4](../PRD.md#quy-ước-chung)) | Banner ở `/login`: Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại. | Chuyển `/login`; sau khi đăng nhập quay lại `/profile`, khôi phục bản nháp |
| Chiều cao thiếu, không phải số, ngoài khoảng | Client chặn; server `400 INVALID_HEIGHT` | Chiều cao phải là số từ 100 đến 250 cm. | Lỗi dưới ô |
| Cân nặng thiếu, không phải số, ngoài khoảng | Client chặn; server `400 INVALID_WEIGHT` | Cân nặng phải là số từ 30 đến 250 kg. | Lỗi dưới ô |
| Tên hiển thị quá dài | Client chặn; server `400 INVALID_DISPLAY_NAME` | Tên hiển thị tối đa 50 ký tự. | Lỗi dưới ô |
| Tải hồ sơ thất bại | `500` hoặc lỗi mạng | Không tải được hồ sơ. Vui lòng thử lại. | Trạng thái lỗi + Thử lại; không hiện form trống để tránh lưu đè |
| Lưu thất bại | `500 INTERNAL_ERROR` hoặc lỗi mạng | Đã có lỗi xảy ra. Vui lòng thử lại. (lỗi mạng: Không thể kết nối tới máy chủ. Vui lòng thử lại.) | Giữ toàn bộ dữ liệu và file; bật lại nút |
| Lưu quá nhiều lần | `429 TOO_MANY_REQUESTS` | Bạn đã lưu quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút. | Thông báo chung trên form; giữ toàn bộ dữ liệu và file; bật lại nút. Không có field nào được ghi |
| Lỗi file ảnh | Xem [flow ảnh](upload-body-photo.md#nhánh-lỗi) | | Không có field nào được ghi |

## Quy tắc

- **Tất cả hoặc không gì cả (D10):** mọi field ghi trong một `UPDATE` duy nhất, sau khi upload thành công. Sau mọi lỗi, DB giữ nguyên như trước request.
- **Dòng `profiles` không còn:** `SELECT` hoặc `UPDATE` không thấy dòng thì trả `401 TOKEN_INVALID`; nếu đã upload ảnh thì rollback trước.
- **Số đo bắt buộc ở mọi lần lưu (D12):** form gửi lại giá trị đang hiển thị, nên người đã có số đo chỉ đổi tên hoặc ảnh vẫn lưu bình thường. Người chưa có số đo phải nhập trước khi lưu, kể cả khi chỉ muốn tải ảnh; UI đánh dấu hai ô này là bắt buộc từ đầu.
- **Ảnh tuỳ chọn (D13):** nếu chưa có ảnh, UI hiện nhắc "Thêm ảnh toàn thân để thử đồ" sau khi lưu nhưng không chặn.
- **Xoá tên hiển thị (D14):** xoá trống ô rồi lưu; frontend luôn gửi `displayName`, server đổi rỗng thành `null`.
- **Email:** chỉ hiển thị. Server bỏ qua `email`, `role`, `phone` và mọi field ngoài whitelist (D11).
- **Nút Lưu** chỉ bật khi form có thay đổi và form đã tải xong.
- **Thứ tự kiểm tra ở server (D20, D21):** xác thực → Content-Type → rate limit → parse multipart. `PUT` không có parser JSON nên JSON hỏng nhận `401` hoặc `415`, không nhận `400 INVALID_JSON`.
- **Rate limit (D22, D23):** đếm cả request thất bại và request không có file. `415` không bị đếm. Thông báo ghi sẵn 10 phút là thời gian chờ tối đa nên UI không đọc `Retry-After`.

## Giữ bản nháp

| Tình huống | Hành vi |
|------------|---------|
| Lỗi validate, `4xx` (gồm `429`), `5xx`, lỗi mạng | Form giữ nguyên trong bộ nhớ, kể cả file đã chọn |
| Token hết hạn lúc gửi `PUT` hoặc lúc gọi `GET` làm mới ảnh khi form đang sửa | Text còn lại, **file bị mất**. Sau khi đăng nhập lại về `/profile`, form khôi phục text và báo: "Đã giữ lại thông tin bạn nhập. Vui lòng chọn lại ảnh." |

Cách làm: **trước mỗi request** từ `/profile` khi form có thay đổi, ghi `{ userId, displayName, heightCm, weightKg, hadPhoto }` vào `sessionStorage` key `tryon_profile_draft` (ghi trước để không phụ thuộc thứ tự redirect). Xoá khi request kết thúc không phải vì hết phiên, khi logout, hoặc sau khi khôi phục. Chỉ khôi phục khi `userId` khớp hồ sơ vừa tải; không khớp thì xoá (máy dùng chung). `sessionStorage` chỉ sống trong tab nên số đo không tồn tại lâu dài trên máy. File không lưu được vào `sessionStorage`, và IndexedDB là quá mức cần cho tình huống hiếm này.

## Ghi chú bảo mật

- `id` luôn lấy từ `sub` của JWT; request không có tham số user id nên không thể sửa hồ sơ người khác.
- Select tường minh, không lấy `password_hash` (schema mục 8). Không log số đo.
