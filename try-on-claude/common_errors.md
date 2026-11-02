# Common Errors

Nhật ký lỗi đã gặp và cách sửa, nhóm theo loại. Đọc trước mỗi task.

## Thư viện / API

- **supabase-js: `storage.listBuckets()` không có `.abortSignal()`** (Sprint 1 – Task 1). Gọi `.abortSignal()` làm health check luôn lỗi "is not a function". **Sửa:** tự làm timeout bằng `Promise.race` với một promise `setTimeout`, nhớ `clearTimeout` trong `finally`. **Bài học:** tra Context7 xem method nào hỗ trợ `abortSignal`, đừng đoán.

## Bảo mật

- **`cors({ origin: 'http://...' })` trả `Access-Control-Allow-Origin` cho mọi origin** (Sprint 1 – Task 1). **Sửa:** dùng origin function `cors({ origin: (origin, cb) => cb(null, origin === env.clientUrl) })`. **Bài học:** luôn test CORS bằng một origin lạ (vd `curl -H "Origin: http://evil.example"`); response không được có header `Access-Control-Allow-Origin`.

## Cấu hình / Git

- **`.gitignore` có `.env.*` nên ignore luôn `.env.example`** (Sprint 1 – Task 1). **Sửa:** thêm `!.env.example` ngay sau dòng `.env.*`. **Bài học:** kiểm tra bằng `git check-ignore -v <file>`: `.env` phải bị ignore, `.env.example` thì không.
- **Điền nhầm `SUPABASE_URL` bằng Postgres connection string** (`postgresql://...pooler.supabase.com`) khiến backend crash "Invalid supabaseUrl". Ngoài ra value có dấu cách thừa sau `=`. **Sửa:** `SUPABASE_URL=https://<project-ref>.supabase.co` (lấy ở hộp thoại Connect / Settings → API Keys), không để dấu cách. **Bài học:** khi kiểm tra `.env` thì che toàn bộ value, không in ra phần nào, vì connection string chứa mật khẩu DB.
