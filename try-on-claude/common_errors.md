# Common Errors

Nhật ký lỗi đã gặp và cách sửa, nhóm theo loại. Đọc trước mỗi task.

## Thư viện / API

- **supabase-js: `storage.listBuckets()` không có `.abortSignal()`** (Sprint 1 – Task 1). Gọi `.abortSignal()` làm health check luôn lỗi "is not a function". **Sửa:** tự làm timeout bằng `Promise.race` với một promise `setTimeout`, nhớ `clearTimeout` trong `finally`. **Bài học:** tra Context7 xem method nào hỗ trợ `abortSignal`, đừng đoán.

- **React Router: `await navigate()` resolve trước khi React commit route mới** (Sprint 1 – Task 6). Logout gọi `await navigate('/', { replace: true })` rồi xoá token: `ProtectedRoute` còn mounted với location cũ nên render `<Navigate to="/login">`, người dùng rơi vào `/login` thay vì `/`. **Sửa:** `navigate('/', { replace: true, flushSync: true })`. **Bài học:** type definitions và docs chỉ cho biết API tồn tại, không chứng minh thứ tự render; luồng điều hướng phải chạy thử trên trình duyệt trước khi bàn giao.

## Bảo mật

- **`cors({ origin: 'http://...' })` trả `Access-Control-Allow-Origin` cho mọi origin** (Sprint 1 – Task 1). **Sửa:** dùng origin function `cors({ origin: (origin, cb) => cb(null, origin === env.clientUrl) })`. **Bài học:** luôn test CORS bằng một origin lạ (vd `curl -H "Origin: http://evil.example"`); response không được có header `Access-Control-Allow-Origin`.
- **JWT hợp lệ nhưng `sub` không phải UUID gây 500** (Sprint 1 – Task 7). `requireAuth` chỉ kiểm tra `sub` là chuỗi nên Postgres báo `22P02`. **Sửa:** kiểm tra `sub` bằng regex UUID, sai thì trả `401 TOKEN_INVALID`. **Bài học:** test cả token ký đúng nhưng nội dung lạ, không chỉ token sai chữ ký.

## Cấu hình / Git

- **`.gitignore` có `.env.*` nên ignore luôn `.env.example`** (Sprint 1 – Task 1). **Sửa:** thêm `!.env.example` ngay sau dòng `.env.*`. **Bài học:** kiểm tra bằng `git check-ignore -v <file>`: `.env` phải bị ignore, `.env.example` thì không.
- **Điền nhầm `SUPABASE_URL` bằng Postgres connection string** (`postgresql://...pooler.supabase.com`) khiến backend crash "Invalid supabaseUrl". Ngoài ra value có dấu cách thừa sau `=`. **Sửa:** `SUPABASE_URL=https://<project-ref>.supabase.co` (lấy ở hộp thoại Connect / Settings → API Keys), không để dấu cách. **Bài học:** khi kiểm tra `.env` thì che toàn bộ value, không in ra phần nào, vì connection string chứa mật khẩu DB.
- **Kết luận về `main` từ branch local chưa cập nhật** (Sprint 1 – Task 7). Xem `main` local nên báo sai là chưa có code US-01, trong khi remote đã có Task 5 qua pull request #1. **Sửa:** `git fetch` rồi so với `origin/main` trước khi kết luận. **Bài học:** luôn fetch trước khi nhận định về trạng thái branch.
- **Dừng background task trên Windows không dừng process con** (Sprint 1 – Task 7). Sau khi dừng task `npm start` và `npm run dev`, `node` vẫn giữ cổng 4000 và 5173. **Sửa:** tìm PID qua `netstat -ano`, đối chiếu lệnh và thời điểm tạo rồi `Stop-Process` đúng PID đó. **Bài học:** kiểm tra cổng đã trống rồi mới báo server đã dừng.

## Giao diện

- **`<img onError>` gọi lại API có thể lặp vô hạn** (Sprint 1 – Task 7). URL mới vẫn hỏng thì `onError` lại gọi tiếp. **Sửa:** dùng ref giới hạn một lần làm mới cho mỗi lượt hỏng, sau đó hiện ô lỗi kèm Thử lại. **Bài học:** mọi retry tự động phải có giới hạn.
- **Class truyền thêm không thắng class gốc của Tailwind** (Sprint 1 – Task 7). `bg-ink-50` thêm qua `inputClassName` thua `bg-white` trong `TextField`, ô email chỉ đọc vẫn nền trắng. **Sửa:** dùng `bg-ink-50!`. **Bài học:** Tailwind ưu tiên theo thứ tự trong CSS, không theo thứ tự trong `class`; kiểm tra bằng computed style.
- **Lỗi chọn file còn lại sau khi lưu thành công** (Sprint 1 – Task 7). Lỗi file nằm ở state riêng, không được xoá khi lưu không kèm ảnh. **Sửa:** xoá `photo.error` khi lưu thành công. **Bài học:** kiểm tra trạng thái kết hợp (lỗi một vùng rồi thành công ở vùng khác), không chỉ từng trạng thái riêng.

## Bàn giao subagent

- **Báo cáo của subagent có thể sai so với tài liệu** (Sprint 1 – Task 7). agent-uiux báo PRD chưa quy định định dạng số và dùng regex riêng, trong khi PRD mục 3 đã có `^d{1,3}(.d+)?$`. **Sửa:** đổi validate client theo PRD. **Bài học:** đối chiếu báo cáo với tài liệu và code, không tin tóm tắt.
- **Subagent test trên trình duyệt làm ảnh hưởng môi trường của người dùng** (Sprint 1 – Task 7). agent-coder gọi `localStorage.clear()` trên `localhost:5173` và dừng cả các `npm run dev` đã chạy từ trước. **Bài học:** khi giao việc phải ghi rõ chỉ dừng tiến trình tự bật và chỉ xoá đúng key đã tạo.
