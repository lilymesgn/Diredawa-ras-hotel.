-- ============================================================
--  Media Manager — SQL Migration
--  Run in: Supabase Dashboard → SQL Editor → New Query → Run
--  (Run AFTER the main schema.sql has been applied)
-- ============================================================

-- ─── 1. Add hero image columns to settings ──────────────────
alter table public.settings
  add column if not exists hero_image_url        text not null default '',
  add column if not exists hero_mobile_image_url text not null default '';

-- ─── 2. Gallery table ───────────────────────────────────────
create table if not exists public.gallery (
  id          uuid        primary key default gen_random_uuid(),
  url         text        not null,
  alt         text        not null default '',
  category    text        not null
              check (category in ('exterior', 'rooms', 'dining')),
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists gallery_category_order_idx
  on public.gallery (category, sort_order);

-- ─── 3. RLS for gallery ─────────────────────────────────────
alter table public.gallery enable row level security;

create policy "gallery_select_all"
  on public.gallery for select
  using (true);

create policy "gallery_insert_auth"
  on public.gallery for insert
  with check (auth.role() = 'authenticated');

create policy "gallery_update_auth"
  on public.gallery for update
  using (auth.role() = 'authenticated');

create policy "gallery_delete_auth"
  on public.gallery for delete
  using (auth.role() = 'authenticated');

-- ─── 4. Storage buckets ─────────────────────────────────────
-- hero-images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hero-images',
  'hero-images',
  true,
  10485760,   -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- gallery-images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery-images',
  'gallery-images',
  true,
  10485760,   -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ─── 5. Storage RLS ─────────────────────────────────────────
-- hero-images
create policy "hero_images_public_read"
  on storage.objects for select
  using (bucket_id = 'hero-images');

create policy "hero_images_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'hero-images' and auth.role() = 'authenticated');

create policy "hero_images_auth_update"
  on storage.objects for update
  using (bucket_id = 'hero-images' and auth.role() = 'authenticated');

create policy "hero_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'hero-images' and auth.role() = 'authenticated');

-- gallery-images
create policy "gallery_images_public_read"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

create policy "gallery_images_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'gallery-images' and auth.role() = 'authenticated');

create policy "gallery_images_auth_update"
  on storage.objects for update
  using (bucket_id = 'gallery-images' and auth.role() = 'authenticated');

create policy "gallery_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'gallery-images' and auth.role() = 'authenticated');
