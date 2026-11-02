-- 003_seed_profiles.sql
-- Dữ liệu mẫu CHỈ DÙNG CHO MÔI TRƯỜNG DEV. Không chạy trên production.
-- Mật khẩu test (bcrypt cost 10, sinh bằng bcrypt trong backend/):
--   buyer.full@example.com  / Test@1234   - người mua đã có đủ hồ sơ (US-02 happy path)
--   buyer.new@example.com   / Test@1234   - người mua mới đăng ký, chưa có số đo/ảnh
--   admin@example.com       / Admin@1234  - admin (dùng từ Sprint sau)
-- Idempotent: chạy lại sẽ reset 3 tài khoản này về trạng thái mẫu (theo email).
-- Lưu ý: body_photo_path của buyer.full trỏ tới object CHƯA tồn tại; muốn có ảnh thật, upload một
-- ảnh jpg vào bucket body-photos đúng path đó (Dashboard → Storage), hoặc đăng nhập và upload qua app.

insert into public.profiles (id, email, password_hash, role, display_name, height_cm, weight_kg, body_photo_path)
values
  ('11111111-1111-4111-8111-111111111111', 'buyer.full@example.com',
   '$2b$10$enzUQJcl/.X./UXR8AQ76OBz4pqvn1WJM.Pev/v9UJc43/QpsP2Rq',
   'user', 'Lan Nguyễn', 162.0, 50.5,
   '11111111-1111-4111-8111-111111111111/1761609600000.jpg'),
  ('22222222-2222-4222-8222-222222222222', 'buyer.new@example.com',
   '$2b$10$XNWnpqsF9W3w2eVvnuFK7uvtlt2tbkbcMhoc9dALdaUGq2iemPSQy',
   'user', null, null, null, null),
  ('33333333-3333-4333-8333-333333333333', 'admin@example.com',
   '$2b$10$uFn28VKsxQ03kQXgfNVxneXJ4nzRGisoxm5.QAeMJe6/mmoqUowyC',
   'admin', 'Try-on Admin', null, null, null)
on conflict (email) do update
  set password_hash   = excluded.password_hash,
      role            = excluded.role,
      display_name    = excluded.display_name,
      height_cm       = excluded.height_cm,
      weight_kg       = excluded.weight_kg,
      body_photo_path = excluded.body_photo_path;
