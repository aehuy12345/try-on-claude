-- 001_create_profiles.sql
-- Sprint 1 – Task 3: bảng user của ứng dụng (US-01, US-02).
-- KHÔNG dùng Supabase Auth: backend Express tự hash mật khẩu (bcrypt) và phát hành JWT,
-- nên bảng này không tham chiếu auth.users.
-- Idempotent: chạy lại nhiều lần không lỗi. Chạy trong Supabase SQL Editor (role postgres).
-- gen_random_uuid() có sẵn trong PostgreSQL 13+, không cần extension pgcrypto.

create table if not exists public.profiles (
  id               uuid        primary key default gen_random_uuid(),
  email            text        not null,
  password_hash    text        not null,
  role             text        not null default 'user',
  display_name     text,
  height_cm        numeric(4,1),
  weight_kg        numeric(4,1),
  body_photo_path  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Email luôn lưu dạng lowercase, đã trim; unique => không trùng không phân biệt hoa thường.
  constraint profiles_email_key        unique (email),
  constraint profiles_email_lowercase  check (email = lower(btrim(email))),
  constraint profiles_email_format     check (char_length(email) <= 254
                                              and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  -- Chặn lưu nhầm mật khẩu plaintext: chỉ chấp nhận chuỗi bcrypt ($2a/$2b/$2y, 60 ký tự).
  constraint profiles_password_hash_bcrypt check (password_hash ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$'),
  constraint profiles_role_check       check (role in ('user', 'admin')),
  -- Tên hiển thị tuỳ chọn: null hoặc 1–50 ký tự sau khi trim (backend đổi chuỗi rỗng thành null).
  constraint profiles_display_name_len check (display_name is null
                                              or char_length(btrim(display_name)) between 1 and 50),
  constraint profiles_height_range     check (height_cm is null or height_cm between 100 and 250),
  constraint profiles_weight_range     check (weight_kg is null or weight_kg between 30 and 250),
  -- Path tương đối trong bucket body-photos: <user_id>/<timestamp>.<jpg|png>
  constraint profiles_body_photo_path_format check (body_photo_path is null
                                              or body_photo_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]+\.(jpg|png)$')
);

comment on table  public.profiles                 is 'User của ứng dụng (người mua + admin). Chỉ backend truy cập bằng service role.';
comment on column public.profiles.email           is 'Lowercase, unique. Dùng để đăng nhập, không sửa ở màn hình hồ sơ.';
comment on column public.profiles.password_hash   is 'bcrypt hash (cost 10). Không bao giờ trả về client.';
comment on column public.profiles.role            is 'user | admin. Admin dùng từ Sprint sau (US-03, US-04, US-09).';
comment on column public.profiles.body_photo_path is 'Path object trong bucket private body-photos (ảnh toàn thân, sprint backlog gọi là avatar). Lưu path, không lưu URL.';

-- Trigger tự cập nhật updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Bảo mật: bật RLS và KHÔNG tạo policy nào cho anon/authenticated
-- => qua Data API (PostgREST) chỉ service role (bypass RLS) đọc/ghi được.
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update, delete on table public.profiles to service_role;
