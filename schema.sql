-- ============================================================
--  Dire Dawa Ras Hotel Admin · Supabase SQL Schema
--  Run this entire script in:
--    Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ─── 1. CABINS ──────────────────────────────────────────────
create table if not exists public.cabins (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  max_capacity    integer     not null check (max_capacity > 0),
  regular_price   numeric     not null check (regular_price >= 0),
  discount        numeric     not null default 0 check (discount >= 0),
  description     text        not null default '',
  image           text        not null default '',
  created_at      timestamptz not null default now()
);

-- ─── 2. BOOKINGS ────────────────────────────────────────────
create table if not exists public.bookings (
  id              uuid        primary key default gen_random_uuid(),
  cabin_id        uuid        references public.cabins(id) on delete set null,
  guest_name      text        not null,
  guest_email     text        not null,
  start_date      date        not null,
  end_date        date        not null,
  status          text        not null default 'unconfirmed'
                              check (status in ('unconfirmed', 'checked-in', 'checked-out')),
  total_price     numeric     not null check (total_price >= 0),
  has_breakfast   boolean     not null default false,
  is_paid         boolean     not null default false,
  created_at      timestamptz not null default now(),
  constraint bookings_dates_check check (end_date > start_date)
);

-- ─── 3. ADMIN PROFILES (mirrors auth.users) ─────────────────
create table if not exists public.admin_profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  role        text        not null default 'staff'
                          check (role in ('admin', 'staff', 'viewer')),
  last_seen   timestamptz,
  created_at  timestamptz not null default now()
);

-- ─── 4. SETTINGS (single-row configuration) ─────────────────
create table if not exists public.settings (
  id                  integer     primary key default 1,
  min_booking_length  integer     not null default 1  check (min_booking_length >= 1),
  max_booking_length  integer     not null default 60 check (max_booking_length >= 1),
  breakfast_price     numeric     not null default 450 check (breakfast_price >= 0),
  updated_at          timestamptz not null default now(),
  constraint settings_single_row check (id = 1)
);

-- Seed the single settings row
insert into public.settings (id, min_booking_length, max_booking_length, breakfast_price)
values (1, 1, 60, 450)
on conflict (id) do nothing;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- CABINS
alter table public.cabins enable row level security;

create policy "cabins_select_all"
  on public.cabins for select
  using (true);

create policy "cabins_insert_auth"
  on public.cabins for insert
  with check (auth.role() = 'authenticated');

create policy "cabins_update_auth"
  on public.cabins for update
  using (auth.role() = 'authenticated');

create policy "cabins_delete_auth"
  on public.cabins for delete
  using (auth.role() = 'authenticated');

-- BOOKINGS
alter table public.bookings enable row level security;

create policy "bookings_all_auth"
  on public.bookings for all
  using (auth.role() = 'authenticated');

-- ADMIN PROFILES
alter table public.admin_profiles enable row level security;

create policy "profiles_select_auth"
  on public.admin_profiles for select
  using (auth.role() = 'authenticated');

create policy "profiles_insert_auth"
  on public.admin_profiles for insert
  with check (auth.role() = 'authenticated');

create policy "profiles_update_own"
  on public.admin_profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_auth"
  on public.admin_profiles for delete
  using (auth.role() = 'authenticated');

-- SETTINGS
alter table public.settings enable row level security;

create policy "settings_select_auth"
  on public.settings for select
  using (auth.role() = 'authenticated');

create policy "settings_update_auth"
  on public.settings for update
  using (auth.role() = 'authenticated');

-- ============================================================
-- TRIGGER: auto-create admin_profile on new auth.user signup
-- ============================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_profiles (id, email, role)
  values (
    new.id,
    new.email,
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop & recreate trigger to be idempotent
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ============================================================
-- STORAGE BUCKET: cabin-images
-- (Run separately in Supabase Dashboard > Storage if this
--  errors — storage schema may not be available via SQL editor)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cabin-images',
  'cabin-images',
  true,
  5242880,           -- 5 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Storage RLS
create policy "cabin_images_public_read"
  on storage.objects for select
  using (bucket_id = 'cabin-images');

create policy "cabin_images_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'cabin-images' and auth.role() = 'authenticated');

create policy "cabin_images_auth_update"
  on storage.objects for update
  using  (bucket_id = 'cabin-images' and auth.role() = 'authenticated');

create policy "cabin_images_auth_delete"
  on storage.objects for delete
  using  (bucket_id = 'cabin-images' and auth.role() = 'authenticated');

-- ============================================================
-- OPTIONAL: seed a few sample cabins to see UI immediately
-- ============================================================

insert into public.cabins (name, max_capacity, regular_price, discount, description, image)
values
  (
    'Presidential Suite',
    4,
    8500,
    500,
    'Expansive top-floor suite with panoramic views of Dire Dawa, private dining room, and butler service.',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format'
  ),
  (
    'Executive Deluxe Room',
    2,
    4200,
    0,
    'Classic colonial-era room with king bed, en-suite bathroom, and garden terrace.',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format'
  ),
  (
    'Heritage Twin Room',
    2,
    2800,
    200,
    'Comfortable twin room in the historic wing, ideal for business travelers.',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&auto=format'
  )
on conflict do nothing;
