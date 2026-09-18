-- ============================================================================
-- MineTree — initial schema
-- Tables: profiles, links, analytics_events
-- Plus: RLS, triggers (profile bootstrap, updated_at), reorder RPC, Storage
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES — one row per auth user, keyed by the same UUID
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique not null,
  display_name text not null default '',
  bio          text not null default '',
  avatar_url   text,
  theme_config jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

comment on table public.profiles is 'Public creator profile; id mirrors auth.users.id';

-- ----------------------------------------------------------------------------
-- 2. LINKS — ordered per profile; position drives drag-and-drop ordering
-- ----------------------------------------------------------------------------
create table if not exists public.links (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  url        text not null,
  icon       text not null default 'link',
  position   integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- The public page sorts by (position, created_at) and the dashboard by profile.
create index if not exists links_profile_position_idx
  on public.links (profile_id, position, created_at);

-- ----------------------------------------------------------------------------
-- 3. ANALYTICS EVENTS — append-only, written via service-role / RPC
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id         bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  link_id    uuid references public.links (id) on delete set null,
  event_type text not null check (event_type in ('page_view', 'link_click')),
  referrer   text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_profile_idx
  on public.analytics_events (profile_id, event_type, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. HELPER: does the current user own this profile row?
-- ----------------------------------------------------------------------------
create or replace function public.is_profile_owner(profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = profile and p.id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.links            enable row level security;
alter table public.analytics_events enable row level security;

-- PROFILES -------------------------------------------------------------------
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());

-- LINKS ----------------------------------------------------------------------
-- Anyone may read any link row (needed to render public pages); the app only
-- queries is_active for anon visitors, but ownership rules govern writes.
create policy "links_select_public"
  on public.links for select
  to anon, authenticated
  using (true);

create policy "links_insert_own"
  on public.links for insert
  to authenticated
  with check (public.is_profile_owner(profile_id));

create policy "links_update_own"
  on public.links for update
  to authenticated
  using (public.is_profile_owner(profile_id))
  with check (public.is_profile_owner(profile_id));

create policy "links_delete_own"
  on public.links for delete
  to authenticated
  using (public.is_profile_owner(profile_id));

-- ANALYTICS ------------------------------------------------------------------
-- Events are INSERT-only, written by the service-role key in /api routes and
-- by an authenticated user for their own profile (page_view ping).
create policy "analytics_insert_authenticated_own"
  on public.analytics_events for insert
  to authenticated
  with check (public.is_profile_owner(profile_id));

-- Note: deliberately NO anon policies on analytics_events — anonymous
-- link_click beacons are recorded through /api/click using the service role.

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: bootstrap a profile row on signup
--    username defaults to a slug of the email; the onboarding step will
--    prompt the user to claim a clean username.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base  text;
  taken boolean := true;
  n     integer := 0;
begin
  base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]+', '', 'g'));
  if base is null or length(base) < 3 then
    base := 'user';
  end if;
  base := left(base, 20);

  while taken loop
    begin
      insert into public.profiles (id, username, display_name)
      values (
        new.id,
        case when n = 0 then base else base || n::text end,
        coalesce(new.raw_user_meta_data ->> 'full_name', '')
      );
      taken := false;
    exception when unique_violation then
      n := n + 1;
      if n > 100 then
        -- pathological case: fall back to id suffix
        insert into public.profiles (id, username, display_name)
        values (new.id, left(base, 12) || '-' || left(new.id::text, 8), '');
        taken := false;
      end if;
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 7. TRIGGER: keep profiles.updated_at-style auditing simple (noop guard)
--    (profiles has no updated_at column per spec; kept minimal on purpose.)
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 8. RPC: atomic link reorder from the drag-and-drop dashboard
--    Body: {"p_order": ["<linkId1>", "<linkId2>", ...]} — full order of the
--    caller's links. Security-definer + ownership guard inside.
-- ----------------------------------------------------------------------------
create or replace function public.reorder_links(p_order uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  update public.links l
  set position = ord.pos
  from (select pos, value from unnest(p_order) with ordinality as t(value, pos)) ord
  where l.id = ord.value
    and l.profile_id = caller;
end;
$$;

grant execute on function public.reorder_links(uuid[]) to authenticated;

-- ----------------------------------------------------------------------------
-- 9. RPC: public click counter for the /api/click beacon (no anon table access)
-- ----------------------------------------------------------------------------
create or replace function public.record_link_click(p_link_id uuid, p_referrer text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select profile_id into owner from public.links where id = p_link_id and is_active;
  if owner is null then
    return; -- silently ignore unknown / inactive links
  end if;

  insert into public.analytics_events (profile_id, link_id, event_type, referrer)
  values (owner, p_link_id, 'link_click', nullif(left(p_referrer, 512), ''));
end;
$$;

grant execute on function public.record_link_click(uuid, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 10. STORAGE: avatars bucket + per-owner write / public-read policies
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- 11. Realtime for the dashboard preview (optional but nice)
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.links;
alter publication supabase_realtime add table public.profiles;
