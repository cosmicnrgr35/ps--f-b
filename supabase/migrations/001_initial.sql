-- Professional Studio production schema
-- Payments/subscriptions are intentionally excluded from this migration.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.recent_work (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_services_user on public.services(user_id);
create index if not exists idx_equipment_user on public.equipment(user_id);
create index if not exists idx_clients_user on public.clients(user_id);
create index if not exists idx_bookings_user on public.bookings(user_id);
create index if not exists idx_galleries_user on public.galleries(user_id);
create index if not exists idx_recent_work_user on public.recent_work(user_id);
create index if not exists idx_reviews_user on public.reviews(user_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_analytics_user on public.analytics(user_id);

alter table public.profiles enable row level security;
alter table public.studio_state enable row level security;
alter table public.services enable row level security;
alter table public.equipment enable row level security;
alter table public.clients enable row level security;
alter table public.bookings enable row level security;
alter table public.galleries enable row level security;
alter table public.recent_work enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics enable row level security;

-- Client-side access is intentionally denied by default. The API uses the server secret
-- and applies user_id filters itself. Public portfolio reads go through public-profile.mjs.
revoke all on table public.profiles, public.studio_state, public.services, public.equipment, public.clients,
  public.bookings, public.galleries, public.recent_work, public.reviews, public.notifications, public.analytics
  from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['profiles','studio_state','services','equipment','clients','bookings','galleries','recent_work','reviews','notifications','analytics'] loop
    execute format('drop policy if exists %I_owner_select on public.%I', t, t);
    execute format('drop policy if exists %I_owner_insert on public.%I', t, t);
    execute format('drop policy if exists %I_owner_update on public.%I', t, t);
    execute format('drop policy if exists %I_owner_delete on public.%I', t, t);
    execute format('create policy %I_owner_select on public.%I for select to authenticated using (auth.uid() = user_id)', t, t);
    execute format('create policy %I_owner_insert on public.%I for insert to authenticated with check (auth.uid() = user_id)', t, t);
    execute format('create policy %I_owner_update on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy %I_owner_delete on public.%I for delete to authenticated using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','studio_state','services','equipment','clients','bookings','galleries','recent_work','reviews','notifications','analytics'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- Create the profile/state rows after sign-up. The trigger never stores passwords or tokens.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare base_slug text;
begin
  base_slug := lower(regexp_replace(split_part(coalesce(new.email,'photographer'), '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if length(base_slug) < 3 then base_slug := 'studio'; end if;
  base_slug := left(base_slug, 70);
  insert into public.profiles(user_id,slug,data) values(new.id, base_slug || '-' || substr(replace(new.id::text,'-',''),1,8), jsonb_build_object('email',new.email)) on conflict(user_id) do nothing;
  insert into public.studio_state(user_id,state) values(new.id,'{}'::jsonb) on conflict(user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Public profile lookup is performed only by the server endpoint. No anonymous table grant is needed.
