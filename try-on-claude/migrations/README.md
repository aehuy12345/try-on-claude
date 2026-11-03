# Migrations (Supabase)

Thiết kế chi tiết: [`design/database/schema.md`](../design/database/schema.md).

## Thứ tự chạy

| File | Nội dung | Môi trường |
|------|----------|------------|
| `001_create_profiles.sql` | Bảng `public.profiles`, constraints, trigger `updated_at`, bật RLS, grants | Mọi môi trường |
| `002_create_storage_buckets.sql` | Bucket private `body-photos` (5 MB, jpeg/png) | Mọi môi trường |

## Cách chạy

1. Supabase Dashboard → **SQL Editor** → New query.
2. Dán nội dung từng file theo đúng thứ tự trên → **Run** (chạy với role `postgres`).
3. Kiểm tra: Table Editor có bảng `profiles`; Storage có bucket `body-photos` (Private).

Các script idempotent: chạy lại không lỗi.

Số `003` đã dùng rồi bỏ (seed tài khoản mẫu bị gỡ vì mật khẩu đã lộ trong repo công khai); migration kế tiếp đánh số từ `004`. Cách lấy tài khoản dev: xem mục "Tài khoản dev để test thủ công" trong [`README.md`](../README.md).

## Quy ước

- Đặt tên `NNN_<mo_ta>.sql`, tăng dần. Không sửa file đã áp lên môi trường dùng chung; thay đổi schema = file mới.
- Seed dev đặt tên `NNN_seed_*.sql`. Seed không được ghi mật khẩu dạng thô và không commit hash của mật khẩu đã công khai (repo public).
