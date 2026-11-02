# PRD – Try-on (mức Sprint 1, gia cố Sprint 2)

Phạm vi tài liệu: US-01, US-02, gồm phần gia cố US-02 của Sprint 2. Các phần còn lại của PRD (Epic 2–4, metrics sản phẩm) sẽ bổ sung ở sprint sau.

**Tài liệu liên quan:** [schema](database/schema.md) · Flows: [đăng ký](flows/register.md), [đăng nhập](flows/login.md), [hồ sơ](flows/profile.md), [ảnh toàn thân](flows/upload-body-photo.md), [logout & bảo vệ route](flows/logout-protected-routes.md)

## Mục lục
1. [Phạm vi](#1-phạm-vi)
2. [Quyết định đã chốt](#2-quyết-định-đã-chốt)
3. [Quy tắc validate](#3-quy-tắc-validate)
4. [API contract](#4-api-contract)
5. [Quy ước phía frontend](#5-quy-ước-phía-frontend)
6. [Phi chức năng](#6-phi-chức-năng)
7. [Rủi ro đã chấp nhận và đề xuất backlog](#7-rủi-ro-đã-chấp-nhận-và-đề-xuất-backlog)

## 1. Phạm vi

| Tính năng | User story | Actor | Ưu tiên | Phụ thuộc | Route |
|-----------|-----------|-------|---------|-----------|-------|
| Đăng ký | US-01 | Khách | Must | `profiles` | `/register` |
| Đăng nhập, logout, bảo vệ route | US-01 | Khách, người dùng | Must | Đăng ký | `/login` |
| Xem, cập nhật hồ sơ | US-02 | Người dùng đã đăng nhập | Must | Đăng nhập | `/profile` |
| Upload, thay ảnh toàn thân | US-02 | Người dùng đã đăng nhập | Must | Hồ sơ, bucket `body-photos` | `/profile` |

Ngoài phạm vi Sprint 1: xác minh email, quên/đổi mật khẩu, xoá ảnh, xoá tài khoản, phone, rate limit (xem [mục 7](#7-rủi-ro-đã-chấp-nhận-và-đề-xuất-backlog)). Rate limit của `PUT /api/user/profile` được thiết kế ở Sprint 2 (D21–D24).

**Thuật ngữ:** "avatar" trong sprint backlog = ảnh toàn thân = `body_photo` ([schema mục 1](database/schema.md#1-nguyên-tắc-chung)).

## 2. Quyết định đã chốt

| # | Vấn đề | Quyết định | Lý do |
|---|--------|-----------|-------|
| D1 | Sau đăng ký | `201` trả JWT như login, tự đăng nhập, chuyển `/profile` kèm thông báo thành công | Chưa có dashboard; bước kế tiếp của người dùng mới là nhập số đo. Không có xác minh email nên trả token không mất lớp bảo vệ nào |
| D2 | Sau đăng nhập | Về route định vào trước đó (`location.state.from`), mặc định `/profile` | Dùng state thay vì `?next=` nên không tạo open redirect |
| D3 | Đã đăng nhập mở `/login`, `/register` | Chuyển `/profile` (`replace`) | Không có lý do hiện form cho người đã có phiên |
| D4 | Lưu token | `localStorage`, key `tryon_token`, gửi qua header `Authorization: Bearer` | Khớp `apiClient.js`; CORS hiện không bật credentials; không cần chống CSRF. Đổi lại token đọc được nếu dính XSS, giảm thiểu bằng TTL ngắn và kỷ luật render |
| D5 | Logout | Chỉ phía client, không có endpoint. Token cũ còn hiệu lực đến khi hết hạn | JWT stateless, US-01 chỉ yêu cầu xoá token client |
| D6 | TTL JWT | `JWT_EXPIRES_IN=24h`, không có refresh token | Ảnh toàn thân và số đo là dữ liệu nhạy cảm, token không thu hồi được nên 7 ngày là quá dài. Đánh đổi: đăng nhập lại mỗi ngày |
| D7 | Mật khẩu | Bắt buộc: ≥ 8 ký tự, ≤ 72 byte UTF-8, có chữ và số. Chữ hoa, ký tự đặc biệt chỉ là khuyến nghị trên UI | US-01 ghi "nên"; quy tắc phức tạp không tăng an toàn tương xứng. bcrypt chỉ dùng 72 byte đầu nên phải chặn trên |
| D8 | Chống dò tài khoản khi login | Cùng `401` + cùng thông báo; email không tồn tại vẫn chạy `bcrypt.compare` với hash giả | Chi phí một dòng code, đồng đều thời gian phản hồi. Đăng ký vẫn lộ email qua `409` vì US-01 yêu cầu báo email trùng |
| D9 | `PUT /profile` | Một request `multipart/form-data` gộp field + ảnh. Không có endpoint upload riêng | Khớp US-02 và schema mục 7. Một nút Lưu cho một kết quả duy nhất |
| D10 | Upload lỗi khi field hợp lệ | **Tất cả hoặc không gì cả:** không ghi field nào, form giữ nguyên để thử lại | Field và path ghi trong cùng một `UPDATE`, sau khi upload thành công, nên không có trạng thái nửa vời |
| D11 | Field không được phép (`email`, `role`, `phone`, `passwordHash`...) | Server bỏ qua, không báo lỗi; chỉ đọc theo whitelist | Nhất quán với cách register xử lý `role` (schema mục 7). Response trả giá trị thật nên client thấy không có gì đổi. Task 7 ghi "email, phone" được giải quyết theo US-02: email khoá, không có phone |
| D12 | Số đo khi lưu | `heightCm`, `weightKg` bắt buộc ở **mọi** `PUT`, kể cả khi chỉ đổi tên hoặc ảnh | Form luôn gửi đủ giá trị đang hiển thị nên người đã có số đo không thấy khác biệt; người chưa có phải nhập, đổi lại hồ sơ đã lưu luôn có số đo |
| D13 | Ảnh khi lưu | Tuỳ chọn. Không gửi file = giữ ảnh cũ. Sprint 1 không có chức năng xoá ảnh | US-02 ghi "ảnh (nếu có)". Điều kiện phải có ảnh mới thử đồ thuộc US-05 |
| D14 | Tên hiển thị | Thiếu field = giữ nguyên; chuỗi rỗng hoặc toàn khoảng trắng = xoá (`null`) | Khớp comment `profiles_display_name_len` trong migration 001. Client lỗi gửi thiếu field không xoá nhầm dữ liệu |
| D15 | Ratio, kích thước ảnh | **Cảnh báo mềm ở client**, không chặn lưu, server không kiểm tra khuyến nghị này (giới hạn pixel của D27 là việc khác) | US-02 ghi "khuyến nghị". Chặn cứng sẽ loại nhiều ảnh dùng được (vd 2:3) |
| D16 | Loại file ở server | Kiểm tra **magic bytes**; `ext` và `contentType` lấy từ kết quả này, không tin MIME khai báo hay tên file | MIME do client khai báo giả mạo được, bucket cũng chỉ kiểm giá trị được khai |
| D17 | Lỗi theo field | Giữ nguyên format `errorHandler.js`, server trả **lỗi đầu tiên**, `code` xác định field | Không phải đổi `errorHandler`. Client đã tự validate đủ mọi field trước khi gửi nên server trả lỗi chủ yếu để phòng thủ |
| D18 | Nhận biết hết phiên ở frontend | Theo `code` (`AUTH_REQUIRED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`), không theo URL hay status | `INVALID_CREDENTIALS` của login cũng là 401 nhưng không được redirect |
| D19 | Hạn token ở frontend | Không tự giải mã `exp`; guard chỉ xét có token hay không, server là bên quyết định | Tránh lỗi do đồng hồ máy khách sai và không cần thêm logic giải mã. Đánh đổi: token hết hạn chỉ bị phát hiện ở lần gọi API kế tiếp |

**Gia cố Sprint 2.** D20–D30 là thiết kế đích của Sprint 2 Task 4, 6, 7, người dùng đã chốt ngày 2026-11-02. D20 (Task 4) đã cài đặt trong code. Code chưa làm theo D21–D30; phần liên quan trong tài liệu sẽ đúng với code sau khi Task 6, 7 xong.

| # | Vấn đề | Quyết định | Lý do |
|---|--------|-----------|-------|
| D20 | Vị trí `express.json` | Bỏ khỏi `app.js`, gắn bằng `router.use` đầu `auth.routes.js`. Router sau này cần JSON tự gắn parser sau `requireAuth` | Request chưa xác thực không còn được parse. Gắn ở router, không ở từng route, nên mọi `/api/auth/*`, kể cả route không tồn tại, giữ nguyên hành vi |
| D21 | Vị trí rate limit | `requireAuth` → `requireMultipart` → limiter → multer | Cần `req.userId` nên đứng sau xác thực; phải chặn trước khi multer đọc file. Request sai Content-Type không chiếm bộ nhớ nên không tính, và thứ tự 401 → 415 giữ nguyên |
| D22 | Ngưỡng | **20 request mỗi 10 phút, theo user.** Đếm mọi `PUT` multipart đã qua xác thực, gồm cả request thất bại và request không có file | Nút Lưu bị khoá khi đang gửi, nên 20 lần vượt xa cách dùng thật. Thử lại sau timeout mất 60 giây mỗi lần nên tối đa 10 lần trong cửa sổ; mất mạng thì không tới server. Limiter đứng trước multer nên không biết có file hay không. Request thất bại vẫn tốn bộ nhớ, nếu không đếm thì gửi 5 MB kèm số đo sai sẽ không bao giờ bị chặn |
| D23 | Phản hồi khi vượt ngưỡng | `429 TOO_MANY_REQUESTS`, qua `errorHandler`. UI hiện `message` ở thông báo chung, giữ form và file. Có header `Retry-After` và `RateLimit` (`standardHeaders: 'draft-8'`), frontend không đọc, không thêm `exposedHeaders` | Thông báo ghi độ dài cửa sổ nên đúng trong mọi trường hợp và không cần số giây. `Retry-After` chỉ phục vụ client không phải trình duyệt |
| D24 | Nơi lưu bộ đếm | Store mặc định, trong bộ nhớ process | Đủ cho một instance, không thêm hạ tầng. Giới hạn ghi ở mục 7 |
| D25 | Loại metadata | Mọi ảnh được giải mã và encode lại bằng `sharp` sau kiểm tra magic bytes, trước `SELECT` path cũ và upload. Áp hướng xoay EXIF (`autoOrient()`), chuyển sRGB, bỏ toàn bộ metadata và ICC (mặc định của `sharp`). Giữ định dạng: JPEG ra JPEG, PNG ra PNG, nên `ext`, `contentType` vẫn theo D16 | Đứng trước mọi lời gọi Supabase nên lỗi ở bước này không thể vi phạm D10. Magic bytes vẫn là cổng đầu nên `sharp` chỉ nhận JPEG/PNG. Chuyển sRGB trước khi bỏ ICC nên ảnh Display P3 không lệch màu. Encode lại cũng bỏ dữ liệu nối sau cuối file. Không đổi PNG sang JPEG vì sẽ mất kênh alpha |
| D26 | Thông số encode, ảnh vượt 5 MB sau encode | Lần 1: JPEG `quality: 90`; PNG `compressionLevel: 9, adaptiveFiltering: true`. Nếu trên 5 242 880 byte thì encode lần 2: JPEG `quality: 75`; PNG `compressionLevel: 9`. Vẫn vượt: `413 FILE_TOO_LARGE`. Không upload khi vượt | Ảnh nén thấp, độ phân giải cao có thể lớn lên khi encode lại, nếu không xử lý sẽ thành `500 UPLOAD_FAILED` do bucket từ chối. Không tự thu nhỏ ảnh vì âm thầm giảm chất lượng ảnh thử đồ |
| D27 | Bom giải nén | Từ chối ảnh có `width × height` > 70 000 000 bằng `413 FILE_TOO_LARGE`. So từ `metadata()` với `limitInputPixels: false`, chỉ đọc header, không dò câu lỗi của `sharp`. Khi giải mã đặt `limitInputPixels: 70000000` | Bao phủ cảm biến 64 MP (9248 × 6936). Mặc định của `sharp` khoảng 268 MP là quá rộng: đo được 64 MP đã đạt đỉnh 612 MB |
| D28 | Phân loại lỗi `sharp` | `failOn: 'warning'`. Lỗi khi đọc hoặc giải mã: `400 INVALID_FILE_TYPE`, "Không đọc được ảnh. Vui lòng chọn ảnh khác.". Riêng câu lỗi chứa `out of memory`, hoặc lỗi do tham số sai (ném đồng bộ khi dựng pipeline): `500 UPLOAD_FAILED`, ghi log | `sharp` không có mã lỗi riêng (`err.code` rỗng), chỉ có câu chữ, và PNG hỏng còn báo `unable to write to target`. Vì vậy mặc định coi là file hỏng, chỉ tách lỗi hết bộ nhớ. `warning` là mức docs khuyên cho dữ liệu không tin cậy; mọi mức trừ `none` đều từ chối file cụt |
| D29 | Xử lý đồng thời | Mỗi process chỉ xử lý **một ảnh tại một thời điểm**, các request khác chờ trong hàng đợi trong bộ nhớ | Rate limit không chặn request gửi cùng lúc. Đo được 4 ảnh 64 MP song song đạt đỉnh 2 255 MB, tuần tự 613 MB. Ảnh 12 MP chỉ mất khoảng 0,2 giây nên hàng đợi gần như không ảnh hưởng người dùng |
| D30 | Ảnh đã có trong Storage | Không viết job xử lý lại. D25 áp dụng cho ảnh tải lên sau Task 7. Trước khi deploy, kiểm tra bucket và xoá ảnh test còn lại | Ngày 2026-11-02 bucket `body-photos` có 0 object, chưa deploy nên chưa có ảnh người dùng thật. Job chạy một lần tốn công mà gần như không có dữ liệu để xử lý |

## 3. Quy tắc validate

Client và server áp dụng cùng quy tắc. Server là bên quyết định.

| Field | Quy tắc | Xử lý trước khi kiểm tra |
|-------|---------|--------------------------|
| `email` | ≤ 254 ký tự, regex `^[^@\s]+@[^@\s]+\.[^@\s]+$` (khớp CHECK migration 001) | `trim().toLowerCase()` |
| `password` (đăng ký) | Chuỗi; ≥ 8 code point; ≤ 72 byte UTF-8; có `\p{L}` và `\p{N}`. Khoảng trắng hợp lệ | `normalize('NFC')`, không trim. NFC để cùng mật khẩu tiếng Việt gõ từ các hệ điều hành khác nhau cho cùng hash |
| `confirmPassword` | Bằng `password` | |
| `password` (đăng nhập) | Chỉ kiểm tra là chuỗi không rỗng. Dài hơn 72 byte coi như sai mật khẩu (vẫn chạy so sánh hash giả), tránh bcrypt cắt bớt rồi khớp | `normalize('NFC')`, không trim |
| `displayName` | ≤ 50 code point (`[...s].length`, khớp `char_length`) | `trim()`; rỗng thành `null` |
| `heightCm` | Bắt buộc; regex `^\d{1,3}(\.\d+)?$`; 100–250 | Kiểm tra khoảng trên giá trị gốc rồi mới làm tròn 1 chữ số thập phân. Client đổi `,` thành `.` trước khi gửi |
| `weightKg` | Bắt buộc; cùng regex; 30–250 | Như `heightCm` |
| `bodyPhoto` | Tối đa 1 file; ≤ 5 242 880 byte; magic bytes JPEG (`FF D8 FF`) hoặc PNG (`89 50 4E 47 0D 0A 1A 0A`) | |

**Khuyến nghị ảnh (chỉ cảnh báo, D15):** chiều ngắn ≥ 720 px và tỉ lệ rộng/cao trong khoảng ±0,03 quanh 0,75 (3:4) hoặc 0,5625 (9:16). Chi tiết ở [flow ảnh](flows/upload-body-photo.md).

**Chỉ server kiểm tra (Sprint 2 Task 7, D27, D28):** ảnh phải giải mã được và không quá 70 000 000 pixel. Client chỉ kiểm tra giải mã được bằng phần tử `Image`, không kiểm tra số pixel.

## 4. API contract

### Quy ước chung
- Base: `/api`. JSON dùng `camelCase`. Không endpoint nào trả `password_hash`.
- Thân lỗi (khớp `errorHandler.js`), không có field bổ sung:

```json
{ "error": { "message": "Thông báo tiếng Việt hiển thị được cho người dùng", "code": "MA_LOI" } }
```

- `error.stack` chỉ xuất hiện ngoài production với status ≥ 500; UI không bao giờ hiển thị.
- Mọi lỗi do `AppError` của 4 endpoint này mang `message` tiếng Việt an toàn để hiển thị.
- Mã có sẵn từ `errorHandler.js`: `404 NOT_FOUND`, `500 INTERNAL_ERROR` ở mọi endpoint; `400 INVALID_JSON`, `413 PAYLOAD_TOO_LARGE` chỉ ở `/api/auth/*` sau D20 (trước đó ở mọi endpoint). Message của các mã này là tiếng Anh, frontend thay bằng thông báo chung ([mục 5](#5-quy-ước-phía-frontend)).
- Express 5 để `req.body` là `undefined` khi không có body: controller JSON phải dùng `req.body ?? {}` để trả 400 thay vì 500.
- Các response của auth và profile đặt `Cache-Control: no-store`.

**Lỗi xác thực dùng chung cho endpoint có `Auth: Bearer`** (`message` của 3 mã này không hiển thị trên UI, xem [mục 5](#5-quy-ước-phía-frontend)):

| Status | `code` | Điều kiện | `message` |
|--------|--------|-----------|-----------|
| 401 | `AUTH_REQUIRED` | Thiếu header hoặc sai dạng `Bearer <token>` | Vui lòng đăng nhập để tiếp tục. |
| 401 | `TOKEN_EXPIRED` | `TokenExpiredError` | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. |
| 401 | `TOKEN_INVALID` | Lỗi JWT khác, hoặc `sub` không còn trong `profiles` | Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại. |

### 4.1 `POST /api/auth/register`

Auth: không. Request `application/json`:

```json
{ "email": "lan@example.com", "password": "Matkhau123", "confirmPassword": "Matkhau123" }
```

Response `201` (cùng dạng với login). Field khác trong body, kể cả `role`, bị bỏ qua.

```json
{
  "token": "<jwt>",
  "user": { "id": "uuid", "email": "lan@example.com", "role": "user" }
}
```

| Status | `code` | Điều kiện | `message` |
|--------|--------|-----------|-----------|
| 400 | `INVALID_EMAIL` | Thiếu hoặc sai định dạng | Email không hợp lệ. |
| 400 | `INVALID_PASSWORD` | Không đạt D7 | Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số, tối đa 72 ký tự (ít hơn nếu dùng chữ có dấu). |
| 400 | `PASSWORD_MISMATCH` | Xác nhận không khớp | Mật khẩu xác nhận không khớp. |
| 400 | `VALIDATION_ERROR` | Postgres `23514` | Dữ liệu không hợp lệ. Vui lòng kiểm tra lại. |
| 409 | `EMAIL_TAKEN` | Email đã có, hoặc Postgres `23505` | Email này đã được sử dụng. |

Thứ tự kiểm tra: email → password → xác nhận → trùng email.

### 4.2 `POST /api/auth/login`

Auth: không. Request `application/json`:

```json
{ "email": "lan@example.com", "password": "Matkhau123" }
```

Response `200`: cùng dạng 4.1. JWT payload `{ sub: id, role }`, thuật toán HS256, hạn theo `JWT_EXPIRES_IN`.

| Status | `code` | Điều kiện | `message` |
|--------|--------|-----------|-----------|
| 400 | `VALIDATION_ERROR` | `email` hoặc `password` thiếu, rỗng, không phải chuỗi | Vui lòng nhập email và mật khẩu. |
| 401 | `INVALID_CREDENTIALS` | Email không tồn tại, sai mật khẩu, hoặc email sai định dạng | Email hoặc mật khẩu không đúng. |

### 4.3 `GET /api/user/profile`

Auth: Bearer. Response `200`: đối tượng hồ sơ, không bọc thêm lớp ngoài.

```json
{
  "id": "uuid",
  "email": "buyer.full@example.com",
  "role": "user",
  "displayName": "Lan Nguyễn",
  "heightCm": 162,
  "weightKg": 50.5,
  "bodyPhotoUrl": "https://<ref>.supabase.co/storage/v1/object/sign/body-photos/...?token=...",
  "updatedAt": "2026-10-28T04:00:00.000Z"
}
```

`displayName`, `heightCm`, `weightKg` là `null` khi chưa có. `bodyPhotoUrl` là signed URL TTL 1 giờ; `null` khi chưa có ảnh, object không tồn tại, hoặc tạo URL lỗi (không trả 500).

Lỗi: xác thực dùng chung, `500 INTERNAL_ERROR`.

### 4.4 `PUT /api/user/profile`

Auth: Bearer. Request bắt buộc `multipart/form-data`:

| Part | Loại | Bắt buộc | Ghi chú |
|------|------|----------|---------|
| `heightCm` | text | Có | |
| `weightKg` | text | Có | |
| `displayName` | text | Không | Thiếu = giữ nguyên; rỗng = xoá (D14) |
| `bodyPhoto` | file | Không | Thiếu = giữ ảnh cũ (D13) |

Part text khác bị bỏ qua (D11). Response `200`: đối tượng hồ sơ như 4.3, kèm `bodyPhotoUrl` mới.

Ba mục dưới và các dòng có ghi D2x trong bảng lỗi là hành vi đích của Sprint 2, đã chốt, chưa cài đặt.

**Thứ tự middleware (D20, D21; Task 4, 6):** `cors` → `Cache-Control: no-store` → `requireAuth` → `requireMultipart` → limiter → multer → controller. Route này không có `express.json`, nên body JSON hỏng hoặc trên 1 MB nhận `401` khi không có token, `415` khi có token.

**Limiter (D22–D24; Task 6):** `express-rate-limit`, tạo một lần lúc nạp module: `windowMs: 600000`, `limit: 20`, `keyGenerator: (req) => req.userId`, `standardHeaders: 'draft-8'`, `legacyHeaders: false`, `handler` gọi `next(new AppError(429, ...))`. Giữ mặc định của `skipFailedRequests`, `skipSuccessfulRequests` (`false`) và `validate`. Cửa sổ cố định, bắt đầu từ request đầu tiên; request bị chặn không kéo dài cửa sổ.

**Xử lý ảnh (D25–D29; Task 7):** làm ở service, không đưa vào `parseProfileInput` để validator vẫn đồng bộ. Các bước xem [flow ảnh](flows/upload-body-photo.md).

Multer dùng `memoryStorage`, `limits: { fileSize: 5242880, files: 1, fields: 10, fieldSize: 1024 }`, `.single('bodyPhoto')`. Middleware bọc multer đổi mọi lỗi thành `AppError` theo bảng dưới, vì `errorHandler.js` không biết `MulterError` và sẽ trả 500.

| Status | `code` | Điều kiện | `message` |
|--------|--------|-----------|-----------|
| 400 | `INVALID_DISPLAY_NAME` | > 50 ký tự | Tên hiển thị tối đa 50 ký tự. |
| 400 | `INVALID_HEIGHT` | Thiếu, không phải số, ngoài khoảng | Chiều cao phải là số từ 100 đến 250 cm. |
| 400 | `INVALID_WEIGHT` | Thiếu, không phải số, ngoài khoảng | Cân nặng phải là số từ 30 đến 250 kg. |
| 400 | `INVALID_FILE_TYPE` | Magic bytes không phải JPEG/PNG, kể cả file rỗng | Ảnh phải ở định dạng JPG hoặc PNG. |
| 400 | `INVALID_FILE_TYPE` | Đúng magic bytes nhưng không đọc hoặc giải mã được, gồm file cụt (D28) | Không đọc được ảnh. Vui lòng chọn ảnh khác. |
| 400 | `INVALID_UPLOAD` | `MulterError` khác `LIMIT_FILE_SIZE` (nhiều file, sai tên part, vượt giới hạn field), multipart hỏng | Dữ liệu tải lên không hợp lệ. Vui lòng thử lại. |
| 400 | `VALIDATION_ERROR` | Postgres `23514` | Dữ liệu không hợp lệ. Vui lòng kiểm tra lại. |
| 413 | `FILE_TOO_LARGE` | `LIMIT_FILE_SIZE` | Ảnh không được vượt quá 5 MB. |
| 413 | `FILE_TOO_LARGE` | Quá 70 triệu pixel (D27), hoặc vẫn trên 5 MB sau encode lần 2 (D26) | Ảnh quá lớn để xử lý. Vui lòng chọn ảnh có độ phân giải hoặc dung lượng nhỏ hơn. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Content-Type không phải multipart | Định dạng yêu cầu không được hỗ trợ. |
| 429 | `TOO_MANY_REQUESTS` | Vượt 20 request trong 10 phút (D22) | Bạn đã lưu quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút. |
| 500 | `UPLOAD_FAILED` | Storage từ chối hoặc lỗi khi upload; hết bộ nhớ hoặc lỗi nội bộ khi xử lý ảnh (D28) | Không thể tải ảnh lên lúc này. Vui lòng thử lại. |
| 500 | `INTERNAL_ERROR` | Lỗi DB khác | Thông báo chung ở frontend |

Cộng thêm lỗi xác thực dùng chung. Thứ tự: xác thực → Content-Type → rate limit → parse multipart (`FILE_TOO_LARGE` có thể đến trước lỗi field) → `displayName` → `heightCm` → `weightKg` → loại file (magic bytes) → xử lý ảnh → ghi. Các bước xử lý và ghi xem [flow ảnh](flows/upload-body-photo.md).

## 5. Quy ước phía frontend

Thay đổi cần làm ở `apiClient.js` và route (Task 5–7):

- **Thông báo:** hiển thị `err.message`, trừ `code` thuộc `INTERNAL_ERROR`, `NOT_FOUND`, `INVALID_JSON`, `PAYLOAD_TOO_LARGE`: hiển thị "Đã có lỗi xảy ra. Vui lòng thử lại."
- **Ánh xạ field:** `INVALID_EMAIL`, `EMAIL_TAKEN` → ô email; `INVALID_PASSWORD` → ô mật khẩu; `PASSWORD_MISMATCH` → ô xác nhận; `INVALID_DISPLAY_NAME`, `INVALID_HEIGHT`, `INVALID_WEIGHT` → ô tương ứng; `INVALID_FILE_TYPE`, `FILE_TOO_LARGE` → vùng chọn ảnh (hai mã này có nhiều câu, luôn hiển thị `err.message`). Mã khác, gồm `TOO_MANY_REQUESTS` → thông báo chung trên form. Frontend không đọc `Retry-After`.
- **401 toàn cục:** với `AUTH_REQUIRED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, UI không dùng `err.message` mà hiện một banner cố định ở `/login`: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.". Xem [flow logout & bảo vệ route](flows/logout-protected-routes.md).
- **Route:** `/login`, `/register` bọc `GuestRoute`; `/profile` bọc `ProtectedRoute`. `design/screens.md` sẽ được agent-uiux bổ sung.

## 6. Phi chức năng

- **Bảo mật:** bcrypt cost 10. Không log mật khẩu, token, số đo, ảnh hay signed URL. `verifyToken` chỉ nhận `algorithms: ['HS256']`. CORS chỉ `CLIENT_URL`. `id` luôn lấy từ JWT, không nhận từ request. Frontend không render HTML từ dữ liệu người dùng. `PUT /api/user/profile` có rate limit theo user (D22, sau Task 6).
- **Quyền riêng tư:** bucket private, signed URL chỉ trả cho chính chủ, không lưu signed URL lâu dài ở client. Ảnh tải lên được bỏ EXIF, GPS và mọi metadata trước khi vào Storage (D25, sau Task 7). Log lỗi xử lý ảnh chỉ ghi `err.message`, không ghi nội dung file.
- **Hiệu năng & mạng yếu:** nút gửi bị vô hiệu kèm trạng thái đang xử lý; `PUT` dùng `AbortSignal.timeout(60000)`. Gửi lại sau lỗi mạng là an toàn (ảnh mới thay ảnh trước đó). Xử lý ảnh 12 MP mất khoảng 0,2 giây, ảnh 64 MP khoảng 0,8 giây (đo trên máy dev bằng ảnh tổng hợp).
- **Usability:** form dùng token Input trong `design-system.md`; lỗi hiển thị bằng chữ dưới field; hoạt động từ 360 px.

## 7. Rủi ro đã chấp nhận và đề xuất backlog

Các mục dưới **chưa được xử lý**. Thêm vào backlog nếu người dùng đồng ý.

| Rủi ro / đề xuất | Tác động | Đề xuất |
|------------------|----------|---------|
| Chưa có rate limit `/api/auth/*` | Dò mật khẩu ở login; spam đăng ký; nhiều tài khoản cùng gửi `PUT` sẽ vượt qua giới hạn theo user | `express-rate-limit` cho `/api/auth/*`, **ưu tiên cao trước khi deploy** |
| Bộ đếm rate limit nằm trong process (D24) | Restart thì mất bộ đếm. Chạy N instance thì ngưỡng thực tế tới 20 × N. Cửa sổ cố định nên sát ranh giới có thể lọt tới 40 request liên tiếp | Chấp nhận khi chạy một instance. Trước khi chạy nhiều instance, chuyển sang store dùng chung |
| Hàng đợi xử lý ảnh không giới hạn độ dài (D29) | Nhiều tài khoản gửi ảnh khổng lồ cùng lúc có thể làm người khác chờ tới timeout 60 giây | Chấp nhận khi đã có rate limit `/api/auth/*`. Giới hạn độ dài hàng đợi khi có số liệu thật |
| Bộ nhớ đỉnh khi xử lý ảnh (D27, D29) | Một ảnh 64 MP xoay 90° đạt đỉnh khoảng 610 MB, ảnh 12 MP khoảng 160 MB (đo trên máy dev). Instance quá nhỏ có thể bị hệ điều hành dừng process, lúc đó không trả được `500` | Instance deploy từ 1 GB RAM, hoặc giảm giới hạn pixel (50 MP đỉnh khoảng 490 MB, 24 MP khoảng 260 MB) |
| Token không thu hồi được | Token lộ dùng được tới 24 giờ, logout không vô hiệu nó | Khi cần: danh sách thu hồi hoặc refresh token |
| Ảnh đã có trước Task 7 vẫn giữ EXIF (D30) | Ngày 2026-11-02 bucket trống nên chưa có ảnh nào như vậy; ảnh tải lên trước khi Task 7 xong sẽ giữ metadata cho tới khi được thay hoặc xoá | Kiểm tra bucket và xoá ảnh test trước khi deploy |
| `failOn: 'warning'` có thể từ chối ảnh trình duyệt vẫn đọc được (D28) | Người dùng được báo chọn ảnh khác dù preview hiển thị bình thường | Thử với ảnh điện thoại thật ở Task 7. Nếu từ chối nhầm thì hạ xuống `error` (vẫn từ chối file cụt) |
| File JPEG hỏng giữa dữ liệu có thể không phát hiện được | `sharp` giải mã thành công, ảnh lưu bị nhiễu; người dùng thấy ngay trên preview | Chấp nhận |
| Encode lại không giữ nguyên ảnh gốc (D25, D26) | JPEG giảm chất lượng nhẹ; APNG chỉ còn khung đầu; PNG palette có thể lớn lên và bị từ chối | Chấp nhận với ảnh toàn thân |
| Không xoá được ảnh/dữ liệu | Người dùng không tự xoá được dữ liệu nhạy cảm | US mới: xoá ảnh, xoá tài khoản |
| Chưa có CSP | XSS đọc được token trong `localStorage` | Thêm CSP/`helmet` khi deploy |
| Server không kiểm tra kích thước ảnh | Ảnh quá nhỏ vẫn lưu được, ảnh hưởng chất lượng thử đồ | Xem lại ở US-05 |
| Object mồ côi | Rollback lỗi hoặc hai `PUT` đồng thời để lại file không được tham chiếu; không ảnh hưởng người dùng | Job dọn dẹp định kỳ khi cần |
