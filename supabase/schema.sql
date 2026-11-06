-- Run in a new Supabase project's SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  payload jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint valid_trip_dates check (end_date >= start_date)
);

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invites enable row level security;

create or replace function public.can_view_trip(target_trip uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from trips where id = target_trip and owner_id = auth.uid()) or exists(select 1 from trip_members where trip_id = target_trip and user_id = auth.uid()) $$;

create or replace function public.can_edit_trip(target_trip uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from trips where id = target_trip and owner_id = auth.uid()) or exists(select 1 from trip_members where trip_id = target_trip and user_id = auth.uid() and role = 'editor') $$;

create policy "trip participants can read" on public.trips for select using (public.can_view_trip(id));
create policy "owners can create" on public.trips for insert with check (owner_id = auth.uid());
create policy "editors can update" on public.trips for update using (public.can_edit_trip(id)) with check (public.can_edit_trip(id));
create policy "owners can delete" on public.trips for delete using (owner_id = auth.uid());

create policy "participants can read members" on public.trip_members for select using (public.can_view_trip(trip_id));
create policy "owners manage members" on public.trip_members for all using (exists(select 1 from public.trips where id = trip_id and owner_id = auth.uid())) with check (exists(select 1 from public.trips where id = trip_id and owner_id = auth.uid()));
create policy "editors can read invites" on public.trip_invites for select using (public.can_edit_trip(trip_id));
create policy "editors can create invites" on public.trip_invites for insert with check (created_by = auth.uid() and public.can_edit_trip(trip_id));
create policy "editors can delete invites" on public.trip_invites for delete using (public.can_edit_trip(trip_id));

create or replace function public.join_trip_by_invite(invite_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare selected trip_invites;
begin
  select * into selected from trip_invites where id = invite_id and expires_at > now();
  if selected.id is null then raise exception 'Invite is invalid or expired'; end if;
  insert into trip_members(trip_id, user_id, role) values(selected.trip_id, auth.uid(), selected.role)
  on conflict (trip_id, user_id) do update set role = excluded.role;
  delete from trip_invites where id = invite_id;
  return selected.trip_id;
end;
$$;

revoke all on function public.join_trip_by_invite(uuid) from public;
grant execute on function public.join_trip_by_invite(uuid) to authenticated;
