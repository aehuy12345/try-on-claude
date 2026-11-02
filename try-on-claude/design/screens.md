# Screen Descriptions

Xem token và thành phần dùng chung tại `design/design-system.md`. Màn hình đăng nhập, hồ sơ... sẽ được bổ sung ở các task sau.

## Landing Page — `/`

### Mục đích
Giới thiệu Try-on (thử đồ ảo bằng AI), thuyết phục khách hàng đăng ký và dẫn họ tới `/register` hoặc `/login`.

### Quyền truy cập
Public.

### Các thành phần chính
1. **Header** (`components/layout/Header.jsx`, dùng chung qua `MainLayout`)
   - Mô tả: logo Try-on bên trái; nav anchor "Tính năng" (`/#features`), "Cách hoạt động" (`/#how-it-works`); nút "Đăng nhập" (`/login`, ghost) và "Đăng ký" (`/register`, primary).
   - Tương tác: click link cuộn mượt tới section; trên mobile bấm hamburger mở/đóng menu, chọn link thì tự đóng, Esc đóng.
   - Trạng thái: default (trong suốt) / đã cuộn (nền `canvas/90` + blur + viền mảnh) / menu mở. Hamburger có `aria-expanded`.
   - Hiệu ứng: đổi nền khi cuộn (transition màu 300ms). Sticky `top-0`.
2. **Hero** (`HeroSection`, `HeroVisual`)
   - Mô tả: eyebrow, H1 "Thử đồ trên chính bạn, trước khi mua", mô tả giá trị, CTA chính "Thử đồ ngay" (`/register`), CTA phụ "Xem cách hoạt động" (`#how-it-works`); bên phải là minh hoạ phòng thử đồ vẽ bằng SVG/CSS (khung 3:4, dáng người mặc váy, chip danh mục, mũi tên, thanh "Thêm vào giỏ").
   - Tương tác: hai nút CTA. Minh hoạ chỉ trang trí (`aria-hidden`).
   - Trạng thái: nút default/hover/focus.
   - Hiệu ứng: `fade-up` khi vào trang, chip "AI đang ghép đồ..." trôi nhẹ (`float`).
3. **Features** (`FeaturesSection`, id `features`)
   - Mô tả: 4 card: Thấy chính mình mặc đồ, Vuốt để đổi outfit, Thêm vào giỏ ngay, Hồ sơ số đo của bạn (nội dung ở `landingContent.js`).
   - Tương tác: card chỉ để đọc.
   - Hiệu ứng: hover nâng card, icon đổi sang nền brand.
4. **How it works** (`HowItWorksSection`, id `how-it-works`)
   - Mô tả: 3 bước đánh số 01-03 (Tạo hồ sơ, Chọn danh mục, Thử và chọn mua).
5. **CTA cuối trang** (`CtaSection`)
   - Mô tả: khối nền `brand-800` bo góc, tiêu đề và nút "Thử đồ ngay" (`/register`).
6. **Footer** (`components/layout/Footer.jsx`)
   - Mô tả: logo + giới thiệu ngắn, 2 cột link (Khám phá, Tài khoản), dòng bản quyền.

### Responsive
- Mobile (< 640px): một cột; hero căn giữa, hai CTA xếp dọc full-width, minh hoạ nằm dưới; features 1 cột; các bước xếp dọc; nav thu thành hamburger (< 768px).
- Tablet (640-1024px): features 2 cột; từ 768px hiện nav ngang; các bước 3 cột; hero vẫn một cột căn giữa.
- Desktop (> 1024px): hero 2 cột (chữ trái, minh hoạ phải); features 4 cột; footer 3 cột.

### Navigation
- Đến màn hình này từ: logo ở mọi trang, trang 404, đường dẫn trực tiếp.
- Từ màn hình này đến: `/register` (Thử đồ ngay, Đăng ký), `/login` (Đăng nhập), anchor `#features`, `#how-it-works` trong cùng trang. `/register` đã có; `/login` chưa có tới Task 6 (hiện rơi vào 404).

### Ghi chú
- Anchor dùng `href="/#..."` nên cũng hoạt động từ trang khác (tải lại về `/` rồi cuộn). `scroll-padding-top: 5rem` để tiêu đề section không bị header che.
- Minh hoạ không dùng ảnh ngoài; sẽ thay bằng ảnh thật nếu có.
- Người dùng đã đăng nhập: tuỳ biến header (hiện "Phòng thử đồ"/avatar) sẽ làm ở task xác thực.
- Tôn trọng `prefers-reduced-motion`.

## Đăng ký — `/register`

Luồng: [design/flows/register.md](flows/register.md). Code: `pages/RegisterPage.jsx`, `components/auth/RegisterForm.jsx`, `components/ui/TextField.jsx`, `components/ui/Alert.jsx`, `lib/validateRegister.js`.

### Mục đích
Tạo tài khoản mới bằng email và mật khẩu; thành công thì tự đăng nhập và sang `/profile`.

### Quyền truy cập
Chỉ khách (GuestRoute). Đã có token thì chuyển `/profile` (replace), không hiện form.

### Các thành phần chính
1. **Tiêu đề** — eyebrow "Bắt đầu", H1 "Tạo tài khoản Try-on", dòng mô tả. Hiệu ứng: `fade-up` khi vào trang.
2. **Thẻ form** (`RegisterForm`, trong card trắng `rounded-card shadow-soft`)
   - **Email** (`TextField`): `type="email"`, `inputmode="email"`, `autocomplete="email"`, không tự viết hoa.
   - **Mật khẩu** (`TextField` password): `autocomplete="new-password"`, nút Hiện/Ẩn (`aria-pressed`, vùng chạm 48px), hint "Ít nhất 8 ký tự, gồm chữ và số. Nên thêm chữ hoa và ký tự đặc biệt." (hint ẩn khi đang có lỗi).
   - **Xác nhận mật khẩu**: như trên, không hint.
   - **Nút "Đăng ký"** (primary, full-width, cao 44px+).
   - **Alert lỗi chung** (`role="alert"`) đặt trên cùng form.
   - Mọi ô có label luôn hiển thị; lỗi nằm dưới ô, liên kết bằng `aria-describedby`, ô lỗi có `aria-invalid` và viền `danger`, icon + chữ (không chỉ màu).
3. **Link "Đã có tài khoản? Đăng nhập"** → `/login` (không mang `state.from`).
4. **Ảnh trang trí** (chỉ desktop, `aria-hidden`): khung 3:4 gradient `blush/sand/brand-100` kèm khối chữ.

### Trạng thái và thông báo (khớp bảng "Nhánh lỗi" của flow)
| Trạng thái | Hiển thị |
|------------|----------|
| Mặc định | Form trống, nút bật |
| Lỗi validate client (khi bấm Đăng ký, không gửi request) | Email: "Email không hợp lệ." (trim + lowercase, <= 254 ký tự, `^[^@\s]+@[^@\s]+\.[^@\s]+$`). Mật khẩu: "Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số, tối đa 72 ký tự (ít hơn nếu dùng chữ có dấu)." (NFC, >= 8 code point, <= 72 byte UTF-8, có chữ và số, không trim). Xác nhận: "Mật khẩu xác nhận không khớp." Focus chuyển tới ô lỗi đầu tiên; giữ dữ liệu. Lỗi của ô nào (client hoặc server) tự xoá khi người dùng sửa ô đó (`onFieldChange`) |
| Đang submit | Nút disabled + spinner + "Đang tạo tài khoản...", `aria-busy`; các ô `readOnly` (giữ dữ liệu, tránh mất focus) |
| 409 `EMAIL_TAKEN` | Lỗi dưới ô email "Email này đã được sử dụng." kèm link "Đăng nhập" (`/login`) |
| 400 `INVALID_EMAIL` / `INVALID_PASSWORD` / `PASSWORD_MISMATCH` | Lỗi dưới ô tương ứng (cùng câu chữ như client) |
| 400 `VALIDATION_ERROR` | Alert chung "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." |
| 500 `INTERNAL_ERROR` | Alert chung "Đã có lỗi xảy ra. Vui lòng thử lại." |
| Lỗi mạng | Alert chung "Không thể kết nối tới máy chủ. Vui lòng thử lại." |
| Sau mọi lỗi server | Nút bật lại, dữ liệu đã nhập được giữ |

### Responsive
- Mobile (< 640px): một cột, card form `p-6`, nút full-width; không có ảnh trang trí.
- Tablet (640-1024px): một cột căn giữa, form `max-w-md`, card `p-8`.
- Desktop (> 1024px): 2 cột, ảnh trang trí trái, form phải.

### Navigation
- Đến từ: Header (Đăng ký), Landing (Thử đồ ngay, CTA cuối trang), link "Đăng ký" từ `/login` (Task 6).
- Đi tới: `/profile` (thành công), `/login` (link dưới form và link trong lỗi email trùng), `/` (logo).

### Ghi chú
- Trang đăng ký không tự gọi `navigate`: `GuestRoute` chuyển `/profile` khi token xuất hiện trong `AuthContext`.
- Không log hay hiển thị mật khẩu trong URL/console.
- Tôn trọng `prefers-reduced-motion` (cấu hình toàn cục).
- `/login` chưa có tới Task 6: link "Đăng nhập" tạm rơi vào 404.

## Hồ sơ (tạm) — `/profile`

### Mục đích
Đích sau đăng ký để không rơi vào 404. Task 7 thay bằng trang hồ sơ thật (ảnh toàn thân, chiều cao, cân nặng).

### Quyền truy cập
Đã đăng nhập (ProtectedRoute sẽ do agent-coder làm; bản UI hiện chưa chặn).

### Các thành phần chính
1. **Thông báo thành công** (`Alert tone="success"`, `role="status"`): "Tạo tài khoản thành công. Hãy hoàn thiện hồ sơ để bắt đầu thử đồ." Chỉ hiện khi vừa đăng ký (cờ `justRegistered`, tiêu thụ một lần, tải lại trang thì không hiện lại). Cờ nằm trong `AuthContext`, không dùng router state.
2. **Tiêu đề** "Hồ sơ của bạn" và dòng giải thích trang đang tạm.

### Responsive
Một cột `max-w-3xl` ở mọi breakpoint.

### Navigation
- Đến từ: `/register` (sau đăng ký thành công).
- Đi tới: logo về `/`.
