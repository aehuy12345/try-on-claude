# Sprint 1: Project Setup & Authentication
## Mục tiêu Sprint
Thiết lập project và xây dựng các tính năng authentication cơ bản
User Stories: US-01, US-02
## Tasks
### 1. Thiết lập Project (Priority: High)
**Mô tả:** Khởi tạo và cấu hình project
**Công việc:**
- [x] Khởi tạo project backend với NodeJS/ExpressJS trong `backend/` (ES modules, script `dev` có auto-reload, script `start`)
- [x] Cấu hình ESLint, Prettier cho backend
- [x] Khởi tạo project frontend với ReactJS/Vite trong `frontend/`
- [x] Cài đặt và cấu hình TailwindCSS cho frontend (theo hướng dẫn tích hợp Vite của phiên bản hiện tại)
- [x] Cài đặt React Router, tạo khung routing (layout chung, trang 404)
- [x] Cấu hình ESLint, Prettier cho frontend
- [x] Tạo Supabase project
- [x] Cài `@supabase/supabase-js` cho backend, tạo module Supabase client dùng service role key (chỉ ở backend)
- [x] Cấu hình JWT cho authentication (cài `jsonwebtoken`, `bcrypt`; secret và TTL lấy từ env)
- [x] Setup environment variables (`backend/.env.example`: `PORT`, `CLIENT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; `frontend/.env.example`: `VITE_API_URL`)
- [x] Tạo cấu trúc thư mục cho frontend, backend và các thư mục `design/`, `migrations/`
- [x] Setup CORS cho API (chỉ cho phép origin `CLIENT_URL`)
- [x] Tạo error-handling middleware chung và endpoint `GET /api/health` (kiểm tra kết nối Supabase)
- [x] Tạo API client dùng chung ở frontend (đọc `VITE_API_URL`, tự gắn JWT)
- [x] Tạo file README với hướng dẫn setup & run project
- [x] Cập nhật mục Commands trong `CLAUDE.md` với lệnh dev/build/lint/test thực tế

**Acceptance Criteria:**
- Frontend và backend chạy được trên local; frontend gọi được `GET /api/health` thành công (không lỗi CORS)
- TailwindCSS hoạt động trên frontend
- Backend kết nối được Supabase
- Environment variables được cấu hình đúng; `.env` không bị commit, có `.env.example` cho cả hai project
- Lint chạy không lỗi trên cả frontend và backend
- File README được tạo và chứa hướng dẫn setup & run project

---

### 2. Tạo Landing Page (Priority: Medium)
**Mô tả:** Xây dựng trang landing page cho ứng dụng

**Công việc:**
- [x] Thiết kế layout landing page
- [x] Tạo header với logo và navigation
- [x] Tạo hero section
- [x] Tạo features section
- [x] Tạo footer
- [x] Responsive design cho mobile và tablet
- [x] Thêm routing cho landing page

**Acceptance Criteria:**
- Landing page hiển thị đầy đủ các sections
- Responsive trên các thiết bị
- Navigation hoạt động
- UI/UX thân thiện, đẹp mắt và fashionista

---

### 3. Thiết kế Database (Priority: High)
**Mô tả:** Thiết kế schema cho sprint 1 (auth/profile)

**Công việc:**
- [x] Xác định bảng cho các tính năng trong sprint 1 và các cột cần thiết
- [x] Thiết lập indexes và constraints
- [x] Viết script/migration SQL trên Supabase
- [x] Thiết kế storage cho các tính năng trong sprint 1 trên Supabase
- [x] Thiết kế script/migration cho storage
- [x] Áp migration `001`–`003` lên Supabase (SQL Editor) và kiểm tra bảng/bucket/seed

> Ghi chú: thiết kế ở `design/database/schema.md`, scripts ở `migrations/` (đã chạy thử trên PostgreSQL tạm). Đã áp lên project `try-on` ngày 2026-10-28 (`001`, `002` có trong lịch sử migration; `003` không được ghi lịch sử nhưng dữ liệu khớp seed); kiểm tra lại bảng/bucket/seed ngày 2026-11-02.

**Acceptance Criteria:**
- Schema `profiles` được tạo trên Supabase, có unique email
- Có sẵn dữ liệu mẫu cho bảng `profiles` ứng với user stories trong sprint 1
- Storage được tạo trên Supabase cho avatar
- Lưu được schema vào thư mục /design, scripts vào thư mục /migrations

---

### 4. Thiết kế Flow (Priority: High)
**Mô tả:** Xác định luồng auth/profile cho sprint 1

**Công việc:**
- [x] Phác thảo flow đăng ký (register)
- [x] Phác thảo flow đăng nhập (login + JWT)
- [x] Phác thảo flow lấy/cập nhật profile và upload avatar (Storage)
- [x] Phác thảo flow logout và bảo vệ routes
- [x] Lưu lại sơ đồ/ngắn gọn trong thư mục thiết kế

> Ghi chú: tài liệu ở `design/flows/` và `design/PRD.md` (API contract, quyết định D1–D19 ở mục 2). Người dùng đã review và chốt ngày 2026-11-02.

**Acceptance Criteria:**
- Có tài liệu flow rõ ràng cho register, login, profile (get/update), upload avatar, logout
- Flow được review và chốt trước khi dev tính năng

---

### 5. Tạo tính năng Đăng ký (Priority: High)
**Mô tả:** Xây dựng chức năng đăng ký tài khoản mới dựa trên flow đã chốt

**Công việc:**
- [x] Tạo API endpoint đăng ký (POST /api/auth/register)
- [x] Validate dữ liệu đầu vào (email, password, etc.)
- [x] Hash password trước khi lưu
- [x] Tạo UI form đăng ký
- [x] Kết nối frontend với API đăng ký
- [x] Xử lý error và success messages
- [x] Email validation và unique check
- [x] Bổ sung màn hình `/register` vào `design/screens.md` (agent-uiux)
- [x] Tạo `AuthContext` (token, cờ `justRegistered`) và `GuestRoute` theo `design/flows/logout-protected-routes.md` (chuyển từ Task 6 sang, vì đăng ký xong tự đăng nhập, D1)
- [x] Tạo trang `/profile` tạm để đăng ký xong không rơi vào 404; Task 7 thay bằng trang thật

**Acceptance Criteria:**
- User có thể đăng ký tài khoản mới
- Password được hash an toàn
- Validation hoạt động đúng
- Error handling đầy đủ
- Không cho phép email trùng lặp
- Đăng ký thành công tự đăng nhập, chuyển tới `/profile` (trang tạm) và hiện thông báo thành công

---

### 6. Tạo tính năng Đăng nhập (Priority: High)
**Mô tả:** Xây dựng chức năng đăng nhập

**Công việc:**
- [ ] Tạo API endpoint đăng nhập (POST /api/auth/login)
- [ ] Verify email và password
- [ ] Generate JWT token khi đăng nhập thành công
- [ ] Tạo UI form đăng nhập
- [ ] Kết nối frontend với API đăng nhập
- [ ] Lưu JWT token (localStorage/cookie)
- [ ] Implement logout functionality
- [ ] Protected routes setup
- [ ] Xử lý error messages
- [ ] Bổ sung màn hình `/login` vào `design/screens.md`, đổi header khi đã đăng nhập thành "Hồ sơ" và "Đăng xuất" (agent-uiux)
- [ ] Đổi `JWT_EXPIRES_IN` thành `24h` trong `backend/.env.example` và `backend/.env` (D6)
- [ ] Xử lý 401 toàn cục trong `apiClient.js` theo `code`, sửa comment "callers decide" (D18)

**Acceptance Criteria:**
- User có thể đăng nhập với email/password
- JWT token được tạo và lưu trữ
- Redirect sau khi đăng nhập thành công
- Logout hoạt động đúng
- Protected routes chỉ truy cập khi đã login
- Sai mật khẩu không redirect; token hết hạn đưa về `/login` kèm banner (phần phía server chỉ test đủ sau khi có `requireAuth` ở Task 7)

---

### 7. Tạo tính năng Cập nhật Hồ sơ (Priority: Medium)
**Mô tả:** Cho phép user cập nhật thông tin cá nhân

**Công việc:**
- [ ] Tạo API endpoint lấy thông tin user (GET /api/user/profile)
- [ ] Tạo API endpoint cập nhật profile (PUT /api/user/profile)
- [ ] Implement JWT verification middleware
- [ ] Tạo UI profile page
- [ ] Form cập nhật hồ sơ (tên hiển thị, chiều cao, cân nặng; email chỉ đọc, không có phone, theo US-02)
- [ ] Upload ảnh toàn thân (sử dụng Supabase Storage)
- [ ] Validate dữ liệu cập nhật
- [ ] Xử lý upload file
- [ ] Update UI sau khi save thành công
- [ ] Bổ sung màn hình `/profile` vào `design/screens.md` (agent-uiux), thay trang tạm của Task 5
- [ ] Cài `multer`, bọc lỗi multer thành `AppError` theo `design/PRD.md` mục 4.4
- [ ] Giới hạn `verifyToken` trong `config/jwt.js` với `algorithms: ['HS256']`

**Acceptance Criteria:**
- User có thể xem thông tin profile
- User có thể cập nhật thông tin
- Upload ảnh toàn thân hoạt động với Supabase Storage
- Validation đầy đủ
- Chỉ user đã login mới truy cập được
- UI phản hồi khi save thành công/thất bại

## Backlog cho sprint sau
- **Rate limit (ưu tiên cao, làm trước khi deploy):** dùng `express-rate-limit` cho `/api/auth/*` và `PUT /api/user/profile`. **Acceptance Criteria:** vượt ngưỡng trả `429` theo format lỗi chung; request trong ngưỡng không bị ảnh hưởng.
- **Đồng bộ validate email client và server (ưu tiên thấp):** server chặn thêm U+0085 và NUL, `frontend/src/lib/validateRegister.js` chưa chặn. **Acceptance Criteria:** hai bên cùng từ chối các ký tự này; client báo "Email không hợp lệ." mà không gửi request.
- **Chuẩn hoá line ending (ưu tiên thấp):** `npm run format` và `prettier --check` báo lệch trên nhiều file do CRLF/`autocrlf` trên Windows. **Acceptance Criteria:** có `.gitattributes` hoặc cấu hình Prettier thống nhất; `prettier --check` sạch ở `backend` và `frontend`; `git status` không còn file sửa chỉ do line ending.

## Definition of Done
- Code được review
- Unit tests passed (nếu có)
- Functionality tested trên môi trường local
- Documentation cập nhật
- Code được merge vào branch chính

## Notes
- Ưu tiên hoàn thành Task 1 trước để các task khác có thể triển khai
- Task 3 và 4 cần hoàn thành trước Task 5
- Tập trung vào security cho authentication features