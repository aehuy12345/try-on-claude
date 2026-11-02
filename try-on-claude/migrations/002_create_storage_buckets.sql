-- 002_create_storage_buckets.sql
-- Sprint 1 – Task 3: bucket lưu ảnh toàn thân của người dùng (US-02; sprint backlog gọi là "avatar").
-- Private: chỉ backend (service role) upload/xoá; client xem ảnh qua signed URL do backend cấp.
-- Giới hạn tại bucket: 5 MB (5 * 1024 * 1024 bytes), chỉ image/jpeg và image/png.
-- Idempotent: chạy lại sẽ cập nhật cấu hình bucket.
-- Không tạo policy trên storage.objects => anon/authenticated không truy cập được object.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('body-photos', 'body-photos', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set name               = excluded.name,
      public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
