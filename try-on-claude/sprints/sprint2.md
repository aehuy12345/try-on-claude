# Sprint 2: Gia cố hồ sơ & ảnh toàn thân
## Mục tiêu Sprint
Kiểm chứng US-02 trên app thật và xử lý các phần còn yếu về bảo mật, quyền riêng tư. Không có tính năng mới.
User Stories: US-02

## Đối chiếu US-02
US-02 đã được làm và merge ở Sprint 1 Task 7. Bảng dưới lập từ việc đọc code và tài liệu, **chưa chạy thử**; kết quả chạy thật nằm ở Task 1.

| Yêu cầu US-02 | Hiện trạng | Xử lý |
|---------------|-----------|-------|
| Chỉ người đã đăng nhập truy cập/ghi hồ sơ | Có `requireAuth`, nhưng `express.json` chạy trước (`backend/src/app.js:11`) nên request không token có thể nhận `400`/`413` thay vì `401` | Task 4 |
| Xem hồ sơ hiện tại | Đã có | Task 1, 2 kiểm chứng |
| Cập nhật chiều cao/cân nặng, hiện lỗi validate | Đã có | Task 1, 2 kiểm chứng |
| Upload ảnh, lưu vào Storage | Đã có | Task 1, 2 kiểm chứng |
| "URL được lưu trong hồ sơ" | Thực tế lưu path, API trả signed URL (`design/database/schema.md` mục 4); `US-02.md` chưa cập nhật | Task 8 |
| Ảnh mới thay ảnh cũ | Đã xoá object cũ, nhưng khi test Task 7 URL ký của ảnh đã xoá vẫn trả `200` | Task 5 |
| Thông báo nhất quán, không lộ thông tin hệ thống | Đã có | Task 1 kiểm chứng |
| Các luồng lỗi: hết phiên, sai loại file, quá dung lượng, sai ratio, số đo sai, lỗi Storage/mạng | Đã có | Task 1 kiểm chứng |
| Phi chức năng: bảo mật, dữ liệu nhạy cảm | Ảnh giữ EXIF/GPS; chưa có rate limit; mật khẩu tài khoản seed công khai trong repo public | Task 6, 7, 9 |
| Phi chức năng: CORS, mạng yếu, desktop/mobile | Đã có | Task 1 kiểm chứng |

## Tasks
### 1. Kiểm thử chấp nhận US-02 trên app thật (Priority: High)
**Mô tả:** Chạy từng acceptance criteria và luồng lỗi của `US-02.md` trên trình duyệt và API. Agent chính thực hiện.

**Công việc:**
- [x] Kiểm tra từng acceptance criteria của US-02
- [x] Kiểm tra từng luồng lỗi, gồm token hết hạn và lỗi Storage/mạng
- [x] Kiểm tra màn hình 360 px và desktop
- [x] Kiểm tra CORS bằng một origin lạ
- [x] Thêm lỗi phát hiện được vào sprint này trước khi sửa

**Acceptance Criteria:**
- Có bảng kết quả theo từng acceptance criteria và luồng lỗi, ghi đạt/không đạt
- Mục nào không kiểm tra được thì ghi rõ lý do
- Mỗi lỗi phát hiện được có task kèm acceptance criteria trong sprint này hoặc backlog

**Kết quả (2026-11-02):** 142 kiểm tra tự động (91 API, 51 giao diện) và một lượt đăng nhập lại thật. Không đạt 5 mục, đều đã có task hoặc backlog ở cột Xử lý.

**Cách chạy:** backend cổng 4100 và frontend cổng 5199 nối project Supabase thật, JWT secret tạm, `NODE_ENV=production`. Lỗi Storage, DB và URL ký được giả lập bằng cách chặn lời gọi ra ngoài của instance test, không sửa code app. Giao diện chạy trên Chrome headless với hồ sơ tạm. Hai tài khoản QA và ảnh của chúng đã được xoá sau khi test (`profiles` từ 5 về 3 dòng).

| Yêu cầu US-02 | Kết quả | Bằng chứng | Xử lý |
|---------------|---------|-----------|-------|
| **Acceptance criteria** | | | |
| Chỉ người đã đăng nhập truy cập/ghi hồ sơ | **Không đạt một phần** | GET/PUT không token trả `401`, `/profile` chuyển `/login`. Riêng PUT không token kèm JSON hỏng trả `400`, JSON trên 1 MB trả `413` | Task 4 |
| Xem hồ sơ hiện tại | Đạt | Đủ field, email chỉ đọc, không lộ `password_hash` hay path, `Cache-Control: no-store` | |
| Cập nhật chiều cao/cân nặng, hiện lỗi validate | Đạt | Biên 100/250 và 30/250, lỗi dưới ô, không gửi request khi sai, tải lại vẫn còn dữ liệu | |
| Upload ảnh, lưu vào Storage | Đạt | Tải về đúng byte qua URL ký; DB chỉ lưu path; URL public và URL không có auth không tải được | Task 8 sửa câu chữ US-02 |
| Ảnh mới thay ảnh cũ | **Không đạt một phần** | Hồ sơ và object được thay đúng, nhưng URL ký cũ vẫn trả `200` kèm `cf-cache-status: HIT` | Task 5 |
| Thông báo nhất quán, không lộ thông tin hệ thống | Đạt | Thông báo tiếng Việt, không có chi tiết lỗi ở response (production), UI và console. Ngoài production response `500` có `stack` theo PRD mục 4, xem dòng "Chưa kiểm tra" | |
| **Luồng lỗi** | | | |
| Token hết hạn | Đạt | `401 TOKEN_EXPIRED`; về `/login` kèm banner, xoá token; đăng nhập lại về `/profile`; số đo đang nhập được khôi phục và có nhắc chọn lại ảnh | |
| Token không hợp lệ | Đạt | Sai chữ ký, `alg: none`, `sub` không phải UUID, không có `sub`, UUID không tồn tại đều trả `401 TOKEN_INVALID` | |
| Sai loại file | Đạt | PDF, TXT, GIF, WEBP, file rỗng, text giả PNG bị từ chối; loại file lấy từ magic bytes | |
| Quá dung lượng | Đạt | Đúng 5 242 880 byte được nhận, thêm 1 byte trả `413`; client chặn trước | |
| Sai ratio/kích thước | Đạt | Ảnh nhỏ và ảnh ngang có cảnh báo mềm, vẫn lưu được; 3:4 và 9:16 không cảnh báo; luôn có hướng dẫn | |
| Số đo sai | Đạt | Thiếu, chữ, `1e2`, số âm, ngoài khoảng đều báo lỗi; `170,5` ở form được đổi thành `170.5` | |
| Lỗi Storage | Đạt | `500 UPLOAD_FAILED`, không ghi field nào (D10), form và ảnh giữ nguyên | |
| Lỗi DB khi ghi | Đạt | Thông báo chung, object vừa upload được xoá | |
| Mất mạng | Đạt | Giữ form, báo lỗi; lưu lại thành công khi có mạng; lỗi tải hồ sơ có nút Thử lại | |
| Không tải được ảnh | Đạt | Làm mới có giới hạn, rồi hiện "Không tải được ảnh" và Thử lại | |
| Không tạo được URL ký lúc mở trang | **Không đạt về trải nghiệm** | Hồ sơ có ảnh nhưng hiện "Chưa có ảnh toàn thân". Đúng với `screens.md`, đây là hạn chế đã ghi | Backlog |
| Thứ tự lỗi (PRD 4.4) | **Không đạt một phần** | Thứ tự field và file đúng. PUT có token, `Content-Type: application/json`, body hỏng trả `400 INVALID_JSON` thay vì `415` | Task 4 |
| **Phi chức năng** | | | |
| Bảo mật, không log dữ liệu nhạy cảm | Đạt phần đã kiểm tra | Log backend và console không có token, URL ký, email | Task 6, 7, 9 |
| Xoá ảnh cũ lỗi | Đạt, có rủi ro | Lưu vẫn thành công nhưng ảnh cũ nằm lại Storage, không còn được tham chiếu | Backlog |
| CORS | Đạt | `http://evil.example`, `null` và cổng khác không có `Access-Control-Allow-Origin`; Chrome ở origin lạ bị chặn; cấu hình `.env` thật cũng đúng | |
| Mạng yếu | Đạt | Nút khoá, "Đang lưu...", không gửi trùng; server treo thì hết hạn sau 60 s và giữ form | |
| 360 px, desktop 1280 px | Đạt | Không tràn ngang ở trạng thái thường, có lỗi, sau khi lưu; vùng bấm từ 44 px; lưu kèm ảnh được | |

**Chưa kiểm tra và lý do:**
- **Điện thoại thật:** 360 px chạy bằng giả lập của Chrome.
- **Tiện ích Claude in Chrome:** tiện ích mở được trang ngoài nhưng báo trang lỗi với mọi địa chỉ localhost, chưa rõ nguyên nhân, nên phải dùng Chrome headless.
- **Token hết hạn tự nhiên sau 24 giờ:** dùng token có `exp` trong quá khứ; lượt đăng nhập lại xác nhận TTL là 86 400 giây.
- **Sự cố thật của Storage/DB:** chỉ giả lập ở lời gọi ra ngoài của backend.
- **`stack` trong response `500` ngoài production:** lượt thử bị hỏng do thiếu cấu hình giả lập lỗi, chỉ đối chiếu code và PRD mục 4.

---

### 2. Thêm test tự động cho hồ sơ (Priority: High)
**Mô tả:** Backend chưa có test. Dùng `node:test` nên không phải cài test runner. Giao agent-coder.

**Công việc:**
- [x] Thêm script `npm test` ở backend
- [x] Test `profile.validator` (biên chiều cao, cân nặng, tên hiển thị, loại file)
- [x] Test thứ tự lỗi của `PUT /api/user/profile` theo PRD 4.4
- [x] Test token ký đúng nhưng nội dung lạ (`sub` không phải UUID)
- [x] Cập nhật mục Commands trong `CLAUDE.md`

**Acceptance Criteria:**
- `npm test` pass khi không có kết nối Supabase thật
- Test không đọc hoặc ghi dữ liệu trên project Supabase
- `CLAUDE.md` ghi đúng lệnh chạy test

**Kết quả (2026-11-02):** `npm test` trên Node 24: 93 pass, 0 fail, 4 todo. 4 case todo là hành vi đúng mà Task 4 phải đạt; Task 4 bỏ cờ `todo` khi sửa xong. Chạy được khi không có `backend/.env`; với `.env` giả có giá trị riêng, app vẫn dùng cấu hình giả của test. Không chạy được trên Node 20, xem [Backlog cho sprint sau](#backlog-cho-sprint-sau).

---

### 3. Chốt thiết kế gia cố (Priority: High)
**Mô tả:** Chốt các quyết định cho Task 4–7 trước khi code. Giao agent-ba.

**Công việc:**
- [x] Chốt ngưỡng rate limit, mã lỗi và thông báo `429`
- [x] Chốt cách loại metadata ảnh và xử lý file hỏng
- [x] Chốt thứ tự xác thực và parse body
- [x] Thêm quyết định D20 trở đi vào `design/PRD.md`, cập nhật API contract và mục 7
- [x] Cập nhật `design/flows/profile.md`, `design/flows/upload-body-photo.md`

**Acceptance Criteria:**
- PRD, flows và schema không mâu thuẫn nhau
- Người dùng review và chốt trước khi code Task 4, 6, 7

**Kết quả (2026-11-02):** người dùng đã chốt D20–D30 trong `design/PRD.md`. Hành vi `sharp` và middleware đã thử trên ảnh tổng hợp và app mô phỏng, chưa thử với ảnh điện thoại thật và chưa cài vào code; Task 7 phải thử ảnh thật. Task 5 chưa được chốt ở đây.

---

### 4. Xác thực trước khi parse body (Priority: Medium)
**Mô tả:** `express.json` đang chạy trước `requireAuth`, lệch thứ tự ở PRD 4.4. Giao agent-coder.

**Công việc:**
- [x] Bỏ `express.json` khỏi `app.js`, gắn bằng `router.use` đầu `auth.routes.js` (D20)
- [x] Bỏ cờ `todo` của 4 case trong `backend/test/profile.http.test.js`
- [x] Thêm test cho các trường hợp bên dưới

**Acceptance Criteria:**
- `PUT /api/user/profile` không token, kèm JSON hỏng hoặc body trên 1 MB, trả `401`
- `PUT /api/user/profile` có token, `Content-Type: application/json`, body hỏng hoặc trên 1 MB, trả `415` (phát hiện ở Task 1)
- `/api/auth/*` vẫn trả lỗi JSON như trước
- Route không tồn tại ngoài `/api/auth/*`, kèm JSON hỏng, trả `404`

**Kết quả (2026-11-02):** `npm test` trên Node 24 exit 0 ba lần liên tiếp: 113 pass, 0 fail, 0 todo. Chạy các test này trên code cũ thì 10 case fail, các case của `/api/auth/*` vẫn pass, nên hành vi auth không đổi. Chạy thử trên instance nối Supabase thật (`NODE_ENV=production`, JWT secret tạm, không ghi dữ liệu): đủ 4 acceptance criteria, multipart vẫn tới bước validate, CORS preflight không đổi. Chưa thử đăng nhập và lưu hồ sơ thành công trên project thật, vì lưu hồ sơ sẽ ghi dữ liệu.

---

### 5. URL ký của ảnh đã thay (Priority: Medium)
**Mô tả:** Khi test Task 7 của Sprint 1, URL ký của ảnh đã xoá vẫn trả `200` (nghi do cache CDN; Task 1 tái hiện được và response có `cf-cache-status: HIT`, chưa kết luận nguyên nhân), có thể tới hết TTL 1 giờ. agent-ba điều tra, agent-coder sửa nếu cần.

**Công việc:**
- [x] Tái hiện và xác định nguyên nhân
- [x] Chọn giữa việc sửa và chấp nhận rủi ro, người dùng chốt
- [x] Sửa code hoặc ghi vào `design/PRD.md` mục 7

**Acceptance Criteria:**
- Xác định được nguyên nhân
- Hoặc URL cũ không còn tải được ảnh sau khi thay, hoặc PRD mục 7 ghi rõ việc chấp nhận rủi ro kèm thời hạn tối đa

**Kết quả (2026-11-02):** nguyên nhân là cache CDN, không phải token: object đã mất khỏi Storage, URL chưa từng được tải thì không tải được từ lần đo đầu, còn bản `200` có `cf-cache-status: HIT`. Người dùng chốt phương án B: TTL 300 s (D31) và chấp nhận rủi ro ở PRD mục 7, thời hạn tối đa 5 phút tính từ lúc cấp URL. `cacheControl` không có tác dụng trên URL ký, purge bị `403`.

- **Số đo (một PoP `HKG`):** 101/103 object hết trả ảnh trong khoảng 1 phút sau khi xoá, lần `200` cuối muộn nhất ở 56,8 s. Token hết hạn chặn bản cache đang HIT với TTL 90, 300, 600.
- **Code:** `npm test` exit 0, 114 pass, 0 fail; test TTL mới fail khi đổi lại 3600. Lint backend, frontend và build frontend exit 0.
- **Chạy thử trên project thật:** URL có `exp - iat = 300`; sau 313 s URL cũ trả `400`, `GET /api/user/profile` trả URL mới tải được. Trên Chrome headless, ảnh lỗi được làm mới đúng 1 lần rồi hiện lại, không lặp request. Tài khoản QA và ảnh đã xoá: `profiles` 3 dòng, bucket 0 object như trước.

**Chưa kiểm tra và lý do:**
- **2/103 object trả ảnh trở lại sau khi đã `400`:** một object vẫn trả ảnh ở 540 s lúc dừng đo. Đợt đo thêm 60 object không gặp lại, nên chưa biết token hết hạn có chặn được trường hợp này không. Giới hạn 5 phút với trường hợp này là suy luận, PRD mục 7 đã ghi rõ.
- **PoP khác, trình duyệt khác Chrome headless, điện thoại thật:** chưa có điều kiện đo.
- **Gói Supabase của project:** không đọc được bằng công cụ hiện có; `x-smart-cdn: true` và purge bị `403` trái nhau.

---

### 6. Rate limit cho cập nhật hồ sơ (Priority: High)
**Mô tả:** Mỗi `PUT /api/user/profile` có thể chiếm tới 5 MB bộ nhớ. Giao agent-coder. Phần `/api/auth/*` thuộc US-01, xem [Backlog cho sprint sau](#backlog-cho-sprint-sau).

**Công việc:**
- [ ] Cài `express-rate-limit`
- [ ] Đặt limiter sau `requireAuth`, `requireMultipart` và trước multer, tính theo user, 20 request mỗi 10 phút (D21, D22)
- [ ] Trả `429` theo format lỗi chung
- [ ] Kiểm tra UI hiện thông báo tiếng Việt (đọc code thấy `ProfilePage` đã hiện `err.message`, sửa nếu chạy thử không đúng)

**Acceptance Criteria:**
- Vượt ngưỡng trả `429` đúng format lỗi chung
- Request trong ngưỡng không bị ảnh hưởng
- Request bị chặn không đi tới multer
- Request `415` không bị đếm; request thất bại có bị đếm
- UI hiện thông báo tiếng Việt và giữ nguyên dữ liệu form

---

### 7. Loại metadata ảnh (Priority: High)
**Mô tả:** Ảnh điện thoại có thể chứa toạ độ GPS trong EXIF (PRD mục 7). Giao agent-coder.

**Công việc:**
- [ ] Cài `sharp`
- [ ] Áp hướng xoay EXIF vào ảnh rồi mới bỏ metadata, trước khi upload
- [ ] Xử lý file đúng magic bytes nhưng không giải mã được
- [ ] Xử lý mỗi process một ảnh tại một thời điểm (D29)
- [ ] Thêm test với ảnh có EXIF GPS và ảnh chụp xoay, sinh bằng `sharp` (`jpegBuffer` trong test chỉ có magic bytes)
- [ ] Thử với ảnh điện thoại thật, gồm kiểm tra `failOn: 'warning'` có từ chối nhầm không

**Acceptance Criteria:**
- Ảnh trong Storage không còn EXIF/GPS
- Ảnh hiển thị đúng chiều sau khi lưu
- File đúng magic bytes nhưng hỏng trả `400 INVALID_FILE_TYPE`
- D10 vẫn đúng: lỗi xử lý ảnh thì không ghi field nào
- Ảnh quá 70 triệu pixel, hoặc vẫn trên 5 MB sau encode lần 2, trả `413 FILE_TOO_LARGE` (D26, D27)
- Ảnh gần 5 MB lớn lên khi encode không gây `500`
- Ảnh được xử lý tuần tự trong mỗi process (D29)
- Đã thử với ảnh điện thoại thật

---

### 8. Đồng bộ tài liệu US-02 (Priority: Low)
**Mô tả:** `US-02.md` còn lệch với thiết kế đã chốt. Giao agent-ba.

**Công việc:**
- [ ] Đổi "URL được lưu trong hồ sơ" thành lưu path, API trả signed URL
- [ ] Bỏ chữ "có thể" ở việc xoá ảnh cũ, vì thiết kế đã quyết định xoá

**Acceptance Criteria:**
- `US-02.md` khớp `design/PRD.md` và `design/database/schema.md`

---

### 9. Xử lý tài khoản seed (Priority: High, làm trước khi deploy)
**Mô tả:** Repo public và `design/database/schema.md` ghi mật khẩu dạng thô của 3 tài khoản seed (có một admin), các tài khoản này đang nằm trên project Supabase. Giao agent-coder.

**Công việc:**
- [ ] Xoá mật khẩu dạng thô khỏi `design/database/schema.md`
- [ ] Đổi mật khẩu hoặc xoá 3 tài khoản seed trên Supabase (người dùng xác nhận lúc thực hiện)
- [ ] Ghi cách tạo tài khoản dev để test thủ công

**Acceptance Criteria:**
- Môi trường deploy không còn tài khoản seed dùng mật khẩu đã công khai (đã xoá hoặc đổi mật khẩu)
- Đăng nhập bằng mật khẩu cũ thất bại
- Có cách lấy tài khoản dev mà không để lộ mật khẩu trong repo

> Ghi chú: mật khẩu cũ vẫn còn trong lịch sử git, nên phải đổi hoặc xoá trên DB, không chỉ sửa file.

## Backlog cho sprint sau
- **Epic 2 (US-03, US-04):** dự kiến cho Sprint 3.
- **Kiểm tra bucket trước deploy (ưu tiên cao, làm trước khi deploy, D30):** ngày 2026-11-02 `body-photos` có 0 object. **Acceptance Criteria:** trước khi deploy, bucket không còn ảnh test và không còn ảnh giữ EXIF/GPS.
- **Store rate limit dùng chung (làm trước khi chạy nhiều instance, D24):** **Acceptance Criteria:** ngưỡng 20 request mỗi 10 phút đúng trên toàn bộ instance và không mất khi restart.
- **Giới hạn độ dài hàng đợi xử lý ảnh (ưu tiên thấp, D29):** **Acceptance Criteria:** có số liệu thật về độ dài hàng đợi; hàng đợi đầy thì trả lỗi rõ ràng thay vì chờ tới timeout.
- **Rate limit `/api/auth/*` (ưu tiên cao, làm trước khi deploy):** thuộc US-01, xem `sprints/sprint1.md`.
- **Các mục còn lại trong backlog của `sprints/sprint1.md`:** footer, validate email, lỗi JSON ở login (US-01); chuẩn hoá line ending.
- **Các mục trong `design/PRD.md` mục 7:** xoá ảnh và xoá tài khoản (cần user story mới), CSP/`helmet`, thu hồi token, dọn object mồ côi.
- **Kiểm tra kích thước ảnh ở server:** xem lại ở US-05.
- **Phân biệt "chưa có ảnh" với "không tạo được URL ký" (ưu tiên thấp, phát hiện ở Task 1):** lỗi tạm thời của Storage khiến người đã có ảnh thấy "Chưa có ảnh toàn thân". **Acceptance Criteria:** hồ sơ có path nhưng không tạo được URL thì hiện "Không tải được ảnh" kèm Thử lại; hồ sơ chưa có path vẫn hiện "Chưa có ảnh toàn thân"; API không trả path; cập nhật PRD 4.3, `screens.md`, flow ảnh.
- **Ảnh cũ nằm lại khi xoá lỗi (ưu tiên trung bình, phát hiện ở Task 1):** thay ảnh mà bước xoá ảnh cũ lỗi thì ảnh riêng tư còn trong Storage. PRD mục 7 mới nêu phần URL đã cấp (D31), chưa nêu việc ảnh còn nằm lại. **Acceptance Criteria:** PRD mục 7 ghi trường hợp này; job dọn object mồ côi xoá được các ảnh không còn được tham chiếu.
- **Health check trả `503` một lần (ưu tiên thấp, phát hiện ở Task 1):** `GET /api/health` trả `503` một lần ngay sau khi instance test khởi động, lần gọi kế tiếp trả `200`; 3 lần gọi trên instance khởi động sau đó đều `200`. Chưa rõ nguyên nhân, response không ghi lý do. **Acceptance Criteria:** tái hiện và xác định được nguyên nhân, hoặc ghi nhận không tái hiện được sau khi thử lại nhiều lần khởi động.
- **Yêu cầu Node sai (ưu tiên cao, làm trước khi deploy, phát hiện ở Task 2):** `engines`, `CLAUDE.md` ghi Node >= 20, nhưng `@supabase/supabase-js` đã cài yêu cầu Node >= 22. Trên Node 20.20.2 app crash ngay lúc nạp `config/supabase.js` ("native WebSocket not found"), `npm test` cũng lỗi. **Acceptance Criteria:** `engines`, `CLAUDE.md`, README ghi cùng một phiên bản Node tối thiểu; backend khởi động và `npm test` pass trên đúng phiên bản đó.

## Definition of Done
- Code được review
- `npm test` ở backend pass
- Lint và build chạy không lỗi; đã thử endpoint và màn hình liên quan trên môi trường local
- Documentation cập nhật
- Code được merge vào branch chính

## Notes
- Thứ tự: Task 1 → 2 → 3 → Task 4–7 → Task 8, 9. Riêng phần điều tra của Task 5 có thể làm trước khi chốt Task 3.
- Làm trên một branch, đề xuất `feature/US-02-hardening`.
- Khi giao việc cho subagent, đưa vào prompt các lỗi liên quan trong `common_errors.md`: chỉ dừng tiến trình tự bật, chỉ xoá đúng key đã tạo, test token ký đúng nhưng nội dung lạ, tra Context7 thay vì đoán API (`express-rate-limit`, `sharp`).
