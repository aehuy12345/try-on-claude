# Screen Descriptions

Xem token và thành phần dùng chung tại `design/design-system.md`. Màn hình đăng nhập, đăng ký, hồ sơ... sẽ được bổ sung ở các task sau.

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
- Từ màn hình này đến: `/register` (Thử đồ ngay, Đăng ký), `/login` (Đăng nhập), anchor `#features`, `#how-it-works` trong cùng trang. Trang `/login`, `/register` chưa có cho tới Task 5, 6 (hiện rơi vào 404).

### Ghi chú
- Anchor dùng `href="/#..."` nên cũng hoạt động từ trang khác (tải lại về `/` rồi cuộn). `scroll-padding-top: 5rem` để tiêu đề section không bị header che.
- Minh hoạ không dùng ảnh ngoài; sẽ thay bằng ảnh thật nếu có.
- Người dùng đã đăng nhập: tuỳ biến header (hiện "Phòng thử đồ"/avatar) sẽ làm ở task xác thực.
- Tôn trọng `prefers-reduced-motion`.
