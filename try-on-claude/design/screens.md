# Screen Descriptions

Xem token và thành phần dùng chung tại `design/design-system.md`. Màn hình hồ sơ ở cuối file.

## Landing Page — `/`

### Mục đích
Giới thiệu Try-on (thử đồ ảo bằng AI), thuyết phục khách hàng đăng ký và dẫn họ tới `/register` hoặc `/login`.

### Quyền truy cập
Public.

### Các thành phần chính
1. **Header** (`components/layout/Header.jsx`, dùng chung qua `MainLayout`)
   - Mô tả: logo Try-on bên trái; nav anchor "Tính năng" (`/#features`), "Cách hoạt động" (`/#how-it-works`); khối tài khoản bên phải: **khách** thấy "Đăng nhập" (`/login`, ghost) và "Đăng ký" (`/register`, primary); **đã đăng nhập** (`isAuthenticated` từ `useAuth()`) thấy "Hồ sơ" (`/profile`, ghost) và "Đăng xuất" (secondary, là `<button>`). Cùng quy tắc ở menu di động (hai nút cạnh nhau).
   - Tương tác: click link cuộn mượt tới section; trên mobile bấm hamburger mở/đóng menu, chọn link hoặc bấm Hồ sơ/Đăng xuất thì tự đóng, Esc đóng. "Đăng xuất" gọi `logout` của AuthContext: điều hướng về `/` (replace) trước, rồi mới xoá token ([flow](flows/logout-protected-routes.md#logout)).
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
- Từ màn hình này đến: `/register` (Thử đồ ngay, Đăng ký), `/login` (Đăng nhập), anchor `#features`, `#how-it-works` trong cùng trang. Khi đã đăng nhập: `/profile` (Hồ sơ), `/` (Đăng xuất).

### Ghi chú
- Anchor dùng `href="/#..."` nên cũng hoạt động từ trang khác (tải lại về `/` rồi cuộn). `scroll-padding-top: 5rem` để tiêu đề section không bị header che.
- Minh hoạ không dùng ảnh ngoài; sẽ thay bằng ảnh thật nếu có.
- Người dùng đã đăng nhập: header đổi sang "Hồ sơ" + "Đăng xuất" (xem Header ở trên); các CTA trong trang vẫn trỏ tới `/register`, GuestRoute sẽ chuyển người đã đăng nhập sang `/profile`. Mục "Phòng thử đồ"/avatar sẽ thêm ở sprint sau.
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
- Đến từ: Header (Đăng ký), Landing (Thử đồ ngay, CTA cuối trang), link "Đăng ký" từ `/login`.
- Đi tới: `/profile` (thành công), `/login` (link dưới form và link trong lỗi email trùng), `/` (logo).

### Ghi chú
- Trang đăng ký không tự gọi `navigate`: `GuestRoute` chuyển `/profile` khi token xuất hiện trong `AuthContext`.
- Không log hay hiển thị mật khẩu trong URL/console.
- Tôn trọng `prefers-reduced-motion` (cấu hình toàn cục).
- Link sang `/login` không mang `state.from`: đăng ký luôn về `/profile`.

## Đăng nhập — `/login`

Luồng: [design/flows/login.md](flows/login.md), [logout-protected-routes.md](flows/logout-protected-routes.md). Code: `pages/LoginPage.jsx`, `components/auth/LoginForm.jsx`, `components/ui/{TextField,Alert,Button}.jsx`, `lib/validateLogin.js` (dùng lại `isValidEmail` và chuẩn hoá của `validateRegister.js`).

### Mục đích
Đăng nhập bằng email và mật khẩu; thành công thì vào route trước đó (`state.from`) hoặc `/profile`.

### Quyền truy cập
Chỉ khách (GuestRoute). Đã có token thì chuyển `state.from` hoặc `/profile` (replace), không hiện form.

### Các thành phần chính
1. **Banner hết phiên** (`Alert tone="warning"`, `role="status"`) — chỉ hiện khi `location.state?.reason === 'session_expired'` (do `ProtectedRoute` đặt): "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại." Cố định (không tự ẩn, không đóng được), nằm trên tiêu đề; dùng chung cho `AUTH_REQUIRED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`. Mở `/login` trực tiếp thì không có.
2. **Tiêu đề** — eyebrow "Chào mừng trở lại", H1 "Đăng nhập Try-on", dòng mô tả. Hiệu ứng: `fade-up` khi vào trang.
3. **Thẻ form** (`LoginForm`, trong card trắng `rounded-card shadow-soft`)
   - **Alert lỗi chung** (`role="alert"`) đặt trên cùng form, không gắn với ô nào.
   - **Email** (`TextField`): `type="email"`, `inputmode="email"`, `autocomplete="email"`, không tự viết hoa.
   - **Mật khẩu** (`TextField` password): `autocomplete="current-password"`, nút Hiện/Ẩn (`aria-pressed`, vùng chạm 48px), không hint độ mạnh (login không áp quy tắc mật khẩu).
   - **Nút "Đăng nhập"** (primary, full-width, cao 44px+).
   - Label luôn hiển thị; lỗi nằm dưới ô, liên kết bằng `aria-describedby`, ô lỗi có `aria-invalid` và viền `danger`, icon + chữ (không chỉ màu).
4. **Link "Chưa có tài khoản? Đăng ký"** → `/register` (không mang `state.from`).
5. **Ảnh trang trí** (chỉ desktop, `aria-hidden`): khung 3:4 gradient `blush/sand/brand-100` kèm khối chữ "Chào mừng trở lại".

### Trạng thái và thông báo (khớp bảng "Nhánh lỗi" của flow)
| Trạng thái | Hiển thị |
|------------|----------|
| Mặc định | Form trống, nút bật |
| Thiếu email và/hoặc mật khẩu (client, không gửi request) | Dưới mỗi ô bị thiếu: "Vui lòng nhập email và mật khẩu." (email chỉ có khoảng trắng coi là thiếu) |
| Email sai định dạng (client) | Dưới ô email: "Email không hợp lệ." (cùng regex và chuẩn hoá với đăng ký). Mật khẩu chỉ cần không rỗng |
| Sau lỗi client | Focus vào ô lỗi đầu tiên; giữ dữ liệu; lỗi của ô tự xoá khi sửa ô đó |
| Đang submit | Nút disabled + spinner + "Đang đăng nhập...", `aria-busy`; các ô `readOnly` (giữ dữ liệu, tránh mất focus) |
| 401 `INVALID_CREDENTIALS` | Alert chung "Email hoặc mật khẩu không đúng."; giữ email, **xoá mật khẩu** và focus vào ô mật khẩu; không redirect, không xoá token |
| 400 `VALIDATION_ERROR` (hiếm, client đã chặn) | Alert chung "Vui lòng nhập email và mật khẩu." |
| 500 `INTERNAL_ERROR` | Alert chung "Đã có lỗi xảy ra. Vui lòng thử lại."; giữ email và mật khẩu |
| Lỗi mạng | Alert chung "Không thể kết nối tới máy chủ. Vui lòng thử lại."; giữ email và mật khẩu |
| Sau mọi lỗi server | Nút bật lại; Alert chung tự ẩn khi người dùng sửa bất kỳ ô nào hoặc gửi lại |

### Responsive
- Mobile (< 640px): một cột, card form `p-6`, nút full-width, banner hết phiên full-width phía trên tiêu đề; không có ảnh trang trí.
- Tablet (640-1024px): một cột căn giữa, form `max-w-md`, card `p-8`.
- Desktop (> 1024px): 2 cột, ảnh trang trí trái, form phải (cùng bố cục `/register`).

### Navigation
- Đến từ: Header (Đăng nhập), link "Đăng nhập" từ `/register` (kể cả trong lỗi email trùng), `ProtectedRoute` (kèm `state.from` và `reason`), xử lý 401 hết phiên.
- Đi tới: `state.from` hoặc `/profile` (thành công), `/register` (link dưới form), `/` (logo).

### Ghi chú
- Trang đăng nhập không tự gọi `navigate`: `GuestRoute` chuyển trang khi token xuất hiện trong `AuthContext` (nơi duy nhất điều hướng sau login/register).
- Một thông báo chung cho cả sai email lẫn sai mật khẩu (chống dò tài khoản); không nêu field nào sai.
- Không log hay hiển thị mật khẩu/token trong URL/console.
- `from` chỉ đọc từ `location.state`, không từ query string.
- Tôn trọng `prefers-reduced-motion` (cấu hình toàn cục).

## Hồ sơ — `/profile`

Luồng: [flows/profile.md](flows/profile.md), [flows/upload-body-photo.md](flows/upload-body-photo.md). Code: `pages/ProfilePage.jsx`, `components/profile/{ProfileForm,BodyPhotoPicker,ProfileSkeleton}.jsx`, `components/ui/{TextField,Alert,Button,Spinner}.jsx`, `lib/validateProfile.js`, `lib/validateBodyPhoto.js`. Dữ liệu: `services/profileService.js` (API thật), bản nháp: `lib/profileDraft.js`.

### Mục đích
Xem và cập nhật hồ sơ: tên hiển thị, chiều cao, cân nặng, ảnh toàn thân dùng làm mẫu thử đồ. Là đích sau đăng ký và đăng nhập.

### Quyền truy cập
Đã đăng nhập (`ProtectedRoute`). Hết phiên thì chuyển `/login` kèm `state.from`.

### Các thành phần chính
1. **Thông báo thành công đăng ký** (`Alert tone="success"`) — "Tạo tài khoản thành công. Hãy hoàn thiện hồ sơ để bắt đầu thử đồ." Chỉ hiện khi vừa đăng ký (cờ `justRegistered` trong `AuthContext`, tiêu thụ một lần, tải lại thì không hiện lại), đặt trên tiêu đề.
2. **Tiêu đề** — eyebrow "Hồ sơ", H1 "Hồ sơ của bạn", dòng mô tả. Hiệu ứng: `fade-up`.
3. **Thẻ nội dung** (card trắng `rounded-card shadow-soft`) chứa một trong ba trạng thái: skeleton, lỗi tải, form.
4. **Skeleton** (`ProfileSkeleton`) — cùng bố cục form (khung ảnh 3:4 + 4 ô + nút), `animate-pulse` (tắt khi reduced motion), `role="status"` kèm chữ ẩn "Đang tải hồ sơ...".
5. **Lỗi tải** — Alert danger "Không tải được hồ sơ. Vui lòng thử lại." + nút "Thử lại" (quay lại skeleton, gọi lại GET). Không hiện form trống.
6. **Form** (`ProfileForm`, `noValidate`)
   - **Vùng ảnh toàn thân** (`BodyPhotoPicker`, cột trái ở desktop): khung 3:4 nền `sand`, ảnh `object-contain` (không méo, không cắt). Ưu tiên hiển thị: ảnh mới chọn (kèm nhãn "Ảnh mới, chưa lưu") > ảnh hiện tại > ô trống "Chưa có ảnh toàn thân". Nút "Chọn ảnh" (chưa có ảnh) hoặc "Chọn ảnh khác"; khi có ảnh mới thêm "Bỏ ảnh đã chọn" (quay lại ảnh hiện tại). Input file ẩn: `accept="image/jpeg,image/png"`, không `multiple`; chọn lại cùng file được. **Hướng dẫn chọn ảnh luôn hiển thị** dưới nút (ảnh toàn thân, đứng thẳng, dọc 3:4 hoặc 9:16, chiều ngắn từ 720 px, JPG/PNG tối đa 5 MB, nền đơn giản).
   - **Alert thành công / nháp / lỗi chung** (đầu cột phải), xem bảng trạng thái.
   - **Email** (`TextField` `readOnly`, `aria-readonly`, nền `ink-50`): hint "Email dùng để đăng nhập nên không thể thay đổi."
   - **Tên hiển thị** (không bắt buộc, `autocomplete="nickname"`): xoá trống rồi lưu thì bỏ tên.
   - **Chiều cao (cm)**, **Cân nặng (kg)**: đánh dấu bắt buộc từ đầu (dấu `*` + `required` + dòng "Bắt buộc, kể cả khi bạn chỉ muốn đổi ảnh."). `inputmode="decimal"`, không `type="number"`; client đổi `,` thành `.` trước khi kiểm tra và gửi. Hint "Từ 100 đến 250 cm." / "Từ 30 đến 250 kg." (ẩn khi có lỗi).
   - **Nút "Lưu thay đổi"** (primary): chỉ bật khi form có thay đổi (so với hồ sơ đang lưu, hoặc có ảnh mới); đang gửi thì disabled + spinner + "Đang lưu...", `aria-busy`, các ô `readOnly`, nút ảnh disabled.
   - Label luôn hiển thị; lỗi nằm dưới ô (icon + chữ, `aria-describedby`, `aria-invalid`).

### Trạng thái và thông báo (khớp bảng "Nhánh lỗi" của flow)
| Trạng thái | Hiển thị |
|------------|----------|
| Đang tải | Skeleton |
| Tải lỗi (500, lỗi mạng) | "Không tải được hồ sơ. Vui lòng thử lại." + Thử lại |
| Mặc định (có dữ liệu) | Form điền sẵn; nút Lưu disabled |
| Hồ sơ mới (chưa có số đo/ảnh) | Hai ô số đo trống, vùng ảnh ở trạng thái trống; nút Lưu bật khi người dùng nhập gì đó |
| Chiều cao sai (client, không gửi request) | Dưới ô: "Chiều cao phải là số từ 100 đến 250 cm." |
| Cân nặng sai | Dưới ô: "Cân nặng phải là số từ 30 đến 250 kg." |
| Tên quá 50 ký tự | Dưới ô: "Tên hiển thị tối đa 50 ký tự." |
| Sau lỗi client hoặc server theo field | Focus vào ô lỗi đầu tiên; giữ dữ liệu; lỗi của ô tự xoá khi sửa ô đó |
| Ảnh sai loại | Alert tại vùng ảnh: "Ảnh phải ở định dạng JPG hoặc PNG." Không nhận file, giữ ảnh hiện tại |
| Ảnh quá 5 MB | "Ảnh không được vượt quá 5 MB." |
| Ảnh không giải mã được | "Không đọc được ảnh. Vui lòng chọn ảnh khác." |
| Ảnh sai ratio hoặc nhỏ | Cảnh báo mềm (Alert warning cạnh preview, vẫn nhận file): "Ảnh có thể chưa phù hợp để thử đồ. Nên dùng ảnh toàn thân, đứng thẳng, dọc tỉ lệ 3:4 hoặc 9:16, chiều ngắn từ 720 px." Nút "Chọn ảnh khác" luôn có sẵn |
| Ảnh hiện tại không tải được: `<img>` hỏng và lần làm mới URL (tối đa một lần cho mỗi lần hỏng) vẫn hỏng hoặc trả `bodyPhotoUrl` `null` | Ô trống "Không tải được ảnh" + nút Thử lại (bắt đầu một lượt làm mới mới); vẫn chọn được ảnh mới. `bodyPhotoUrl` `null` ngay lúc tải trang nghĩa là "Chưa có ảnh toàn thân" vì API không trả path nên client không phân biệt được |
| Đang lưu | Nút disabled + spinner + "Đang lưu..." |
| Lưu thành công | Alert success "Lưu thành công."; form cập nhật từ response; bỏ file đã chọn (giữ preview cục bộ nếu server không trả URL ảnh). Thông báo tự xoá khi người dùng sửa form. Sau khi bấm Lưu, nội dung Alert (cả hai dòng nếu có) được focus và cuộn vào màn hình dưới header cố định, xem dòng "Thông báo chung sau khi Lưu" |
| Lưu xong mà chưa có ảnh | Trong Alert success thêm dòng đậm "Thêm ảnh toàn thân để thử đồ" (nhắc, không chặn) |
| Khôi phục nháp sau hết phiên (`hadPhoto`) | Alert warning "Đã giữ lại thông tin bạn nhập. Vui lòng chọn lại ảnh." Text được điền lại, nút Lưu bật; mất khi gửi |
| Lỗi file phía server (`INVALID_FILE_TYPE`, `FILE_TOO_LARGE`) | Hiển thị `message` của server tại vùng ảnh. Thường cùng câu như lỗi file client; file đúng magic bytes nhưng server không giải mã được (`400 INVALID_FILE_TYPE`): "Không đọc được ảnh. Vui lòng chọn ảnh khác."; ảnh quá 70 triệu pixel hoặc vẫn trên 5 MB sau khi xử lý (`413 FILE_TOO_LARGE`, Sprint 2 Task 7): "Ảnh quá lớn để xử lý. Vui lòng chọn ảnh có độ phân giải hoặc dung lượng nhỏ hơn." Sau khi bấm Lưu, dòng lỗi (`role="alert"`) được focus và cuộn vào màn hình dưới header cố định (theo `scroll-padding-top` của `html`; tắt cuộn mượt khi `prefers-reduced-motion`), kể cả khi câu lỗi giống hệt lần trước. Nếu đồng thời có lỗi field từ server thì focus vào ô lỗi như cũ, lỗi ảnh chỉ hiển thị. Lỗi client lúc chọn file không cuộn thêm. |
| 429 `TOO_MANY_REQUESTS` (Sprint 2 Task 6, đã cài đặt) | Alert chung "Bạn đã lưu quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút."; giữ toàn bộ dữ liệu và file; nút bật lại |
| `INVALID_UPLOAD`, `UPLOAD_FAILED` | Alert chung: "Dữ liệu tải lên không hợp lệ. Vui lòng thử lại." / "Không thể tải ảnh lên lúc này. Vui lòng thử lại." |
| 500 `INTERNAL_ERROR` | Alert chung "Đã có lỗi xảy ra. Vui lòng thử lại."; giữ toàn bộ dữ liệu và file; nút bật lại |
| Lỗi mạng | Alert chung "Không thể kết nối tới máy chủ. Vui lòng thử lại."; giữ dữ liệu và file |
| Thông báo chung sau khi Lưu (Sprint 2 Task 11): "Lưu thành công." và các lỗi chung (`429`, `INVALID_UPLOAD`, `UPLOAD_FAILED`, `500`, lỗi mạng) | Alert nằm đầu cột phải còn nút Lưu ở cuối form, nên ở mobile (đo 360 × 740) trước đây Alert nằm ngoài màn hình và focus ở `BODY`. Nay nội dung Alert (`div` có `tabIndex={-1}` và `outline-none`, bọc toàn bộ chữ) được focus sau khi render và cuộn theo `scroll-padding-top` của `html`, kể cả khi lỗi lặp lại với câu giống hệt (bộ đếm tăng mỗi lần Lưu). Role `status`/`alert` của Alert giữ nguyên. Chỉ một nơi giữ focus, ưu tiên: lỗi field, rồi lỗi ảnh, rồi thông báo chung; lỗi validate client không focus thông báo chung. Alert khôi phục nháp (warning) không đổi |
| 401 hết phiên | Chuyển `/login` kèm banner (xử lý ở `apiClient`/`ProtectedRoute`); sau đăng nhập về `/profile` và khôi phục nháp |

### Responsive
- Mobile (< 640px, hỗ trợ từ 360 px): một cột; vùng ảnh trước (khung 3:4 tối đa `max-w-xs`, căn giữa), rồi các ô; hai ô số đo xếp dọc; nút Lưu full-width; card `p-5`.
- Tablet (640-1024px): một cột; hai ô số đo cạnh nhau; nút Lưu rộng theo nội dung; card `p-8`.
- Desktop (> 1024px): hai cột `18rem | 1fr`, ảnh trái, form phải; trang `max-w-5xl`.

### Navigation
- Đến từ: `/register` (sau đăng ký), `/login` (sau đăng nhập khi không có `state.from`, hoặc về `state.from=/profile`), Header (Hồ sơ).
- Đi tới: `/` (logo, Header "Đăng xuất").

### Ghi chú
- Không render HTML từ dữ liệu người dùng (tên hiển thị hiển thị dạng text). Preview ảnh dùng object URL, thu hồi khi bỏ ảnh, thay ảnh, hoặc rời trang.
- `ProfileForm` và `BodyPhotoPicker` là presentational: `ProfilePage` chịu trách nhiệm gọi dịch vụ ; lỗi server ánh xạ sang field/vùng ảnh/Alert chung ở `ProfilePage.handleSubmit` theo PRD mục 5 (hiển thị `err.message`, trừ `INTERNAL_ERROR`, `NOT_FOUND`, `INVALID_JSON`, `PAYLOAD_TOO_LARGE` dùng thông báo chung).
- Số đo gửi dạng chuỗi đã chuẩn hoá (`,` thành `.`); form luôn gửi lại giá trị đang hiển thị (D12).
- Tôn trọng `prefers-reduced-motion` (cấu hình toàn cục).
