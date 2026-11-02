# Design System: Try-on

Phong cách: thời trang, editorial, sang và hiện đại. Nền ngà ấm, chữ than ấm, điểm nhấn đỏ rượu vang (wine) và vàng champagne. Token được hiện thực bằng `@theme` trong `frontend/src/index.css` (Tailwind v4) nên dùng trực tiếp như class (`bg-brand-700`, `text-ink-600`, `font-display`...). Không hardcode mã màu trong component.

## Màu sắc

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `brand-50` | #fbf1f4 | Nền icon, vùng nhấn rất nhạt |
| `brand-100` | #f5dce3 | Chữ nhạt trên nền brand đậm |
| `brand-200` .. `brand-500` | #ebb9c7, #dd8ba1, #c85d78, #a83a58 | Gradient, minh hoạ |
| `brand-600` | #8b2644 | Focus ring, minh hoạ |
| `brand-700` | #721e38 | **Màu chính**: nút primary, link nhấn, eyebrow |
| `brand-800` | #5a182d | Hover nút primary, khối CTA |
| `brand-900` | #3d101f | Đậm nhất |
| `ink-900` | #171512 | Chữ chính, footer |
| `ink-800` / `ink-700` | #26231f / #3c3732 | Chữ phụ đậm |
| `ink-600` | #544d46 | Chữ thân bài |
| `ink-500` | #6b635a | Chữ chú thích |
| `ink-300` .. `ink-100` | #b9b1a8, #d9d3cc, #ece8e3 | Viền, nền hover, chữ trên nền tối |
| `canvas` | #faf7f2 | Nền trang |
| `sand` | #f1e9df | Nền section xen kẽ |
| `blush` | #f6e4e1 | Nền nhấn hồng nhạt, glow |
| `gold-300` / `gold-500` / `gold-700` | #e4cd9a / #c19a4b / #8a6a24 | Điểm nhấn (số bước, chấm, tiêu đề footer). Không dùng `gold-500` cho chữ nhỏ trên nền sáng |
| `success` / `warning` / `danger` | #1f7a4d / #9a5b00 / #b42318 | Phản hồi trạng thái (kèm icon/chữ, không chỉ màu) |

Tương phản (WCAG AA): `ink-900` trên `canvas` khoảng 17:1; `ink-600` trên `canvas` khoảng 7.5:1; `canvas` trên `brand-700` khoảng 11:1; `ink-300` trên `ink-900` trên 8:1; `ink-500` trên `canvas` khoảng 5:1.

## Typography

- **Display**: Playfair Display Variable (`font-display`), dùng cho logo, H1, H2, số bước. Có subset tiếng Việt.
- **Sans**: Inter Variable (`font-sans`, mặc định), dùng cho mọi phần còn lại.
- Cả hai self-host qua `@fontsource-variable/*`, import trong `index.css`.

| Vai trò | Lớp Tailwind |
|---------|--------------|
| H1 hero | `font-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight` |
| H2 section | `font-display text-3xl sm:text-4xl font-medium tracking-tight` |
| H3 card | `text-lg font-semibold` |
| Body | `text-base leading-relaxed` (hero lead `sm:text-lg`) |
| Chú thích | `text-sm` / `text-xs` |
| Eyebrow | `text-xs font-semibold uppercase tracking-[0.22em] text-brand-700` |

Mỗi màn hình dùng tối đa 3-4 cỡ chữ. Tiêu đề dùng `text-balance`.

## Spacing, radius, shadow

- Lưới 4/8px (thang spacing mặc định Tailwind). Section dọc `py-20 lg:py-28`; container `max-w-6xl px-4 sm:px-6`.
- Radius: nút/chip `rounded-full`; card `rounded-card` (1.25rem); khối lớn/CTA `rounded-[2rem]`.
- Shadow: `shadow-soft` (card, nút), `shadow-lift` (hover card, khung minh hoạ).

## Thành phần

- **Button** (`components/ui/Button.jsx`): cao tối thiểu 44px (`min-h-11`), `rounded-full`. Variant: `primary` (nền `brand-700`), `secondary` (viền `ink-300`, hover đảo màu), `ghost`, `light` (trên nền brand tối). Trạng thái: hover nâng 2px, focus ring 2px `brand-600`, disabled opacity 50%.
- **Card**: nền trắng, `rounded-card`, `ring-1 ring-ink-900/5`, `shadow-soft`; hover `-translate-y-1` + `shadow-lift`.
- **Input** (cho Task 5-6): cao 48px, `rounded-xl`, viền `ink-200`, focus viền `brand-600` + ring; lỗi viền `danger` kèm thông báo chữ dưới field. Label luôn hiển thị.
- **Badge/Chip**: `rounded-full px-3 py-1 text-xs font-medium`; active nền `ink-900` chữ `canvas`, mặc định nền trắng chữ `ink-700`.
- **Logo** (`components/ui/Logo.jsx`): icon móc áo SVG + chữ "Try-on" Playfair.

## Icon

SVG inline, nét 1.6-1.8px, `stroke="currentColor"`, bo tròn đầu nét, kích thước 24px (`size-6`), `aria-hidden` khi trang trí.

## Breakpoints (Tailwind mặc định)

Mobile < 640px, `sm` 640px, `md` 768px (hiện nav ngang, ẩn hamburger), `lg` 1024px, `xl` 1280px. Thiết kế mobile-first, kiểm tra từ 360px.

## Motion

- Hiệu ứng chỉ dùng `transform`/`opacity`: `animate-fade-up` (0.7s ease-out) cho hero, `animate-float` cho chip minh hoạ, transition 200-300ms cho hover.
- `prefers-reduced-motion: reduce`: tắt animation/transition và smooth scroll (đã cấu hình toàn cục trong `index.css`).

## Accessibility

- Focus: `:focus-visible` outline 2px `brand-600`, offset 3px (toàn cục). Có skip link "Bỏ qua tới nội dung chính".
- Vùng chạm tối thiểu 44x44px trên mobile.
- Semantic HTML: `header`, `nav` (có `aria-label`), `main#main`, `section` với `aria-labelledby`, `footer`.
- Hamburger: `aria-expanded`, `aria-controls`, `aria-label` đổi theo trạng thái; Esc để đóng.
- Không truyền tải thông tin chỉ bằng màu; ảnh/icon trang trí `aria-hidden`.
