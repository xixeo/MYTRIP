-- MYTRIP cloud snapshots
-- Supabase Dashboard > SQL Editor에서 전체를 한 번 실행합니다.

create table if not exists public.mytrip_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id text not null,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, trip_id)
);

alter table public.mytrip_snapshots enable row level security;

drop policy if exists "Users can read own trip snapshots" on public.mytrip_snapshots;
create policy "Users can read own trip snapshots"
on public.mytrip_snapshots for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own trip snapshots" on public.mytrip_snapshots;
create policy "Users can insert own trip snapshots"
on public.mytrip_snapshots for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own trip snapshots" on public.mytrip_snapshots;
create policy "Users can update own trip snapshots"
on public.mytrip_snapshots for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own trip snapshots" on public.mytrip_snapshots;
create policy "Users can delete own trip snapshots"
on public.mytrip_snapshots for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_mytrip_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_mytrip_snapshots_updated_at on public.mytrip_snapshots;
create trigger set_mytrip_snapshots_updated_at
before update on public.mytrip_snapshots
for each row execute function public.set_mytrip_updated_at();

create index if not exists mytrip_snapshots_user_updated_idx
on public.mytrip_snapshots (user_id, updated_at desc);
