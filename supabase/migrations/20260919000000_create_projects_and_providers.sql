create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  client_id uuid not null references public.clients(id),
  name text not null check (length(trim(name)) > 0),
  status text not null default 'draft' check (
    status in (
      'draft',
      'waiting_advance',
      'approved',
      'in_progress',
      'waiting_client',
      'waiting_supplier',
      'finishing',
      'pending_collection',
      'completed',
      'paused',
      'cancelled'
    )
  ),
  start_date date,
  expected_end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (expected_end_date is null or start_date is null or expected_end_date >= start_date)
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null check (length(trim(name)) > 0),
  type text not null check (type in ('supplier', 'master', 'contractor', 'service', 'other')),
  specialty text,
  cedula_ruc text,
  phone text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_status_idx on public.projects(user_id, status);
create index projects_user_client_idx on public.projects(user_id, client_id);
create index providers_user_active_idx on public.providers(user_id, active);
create index providers_user_name_idx on public.providers(user_id, name);

create function public.set_project_management_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_project_management_updated_at();

create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_project_management_updated_at();

alter table public.projects enable row level security;
alter table public.providers enable row level security;

create policy "Users can view their own projects"
on public.projects for select
using ((select auth.uid()) = user_id);

create policy "Users can create projects for their own clients"
on public.projects for insert
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = projects.client_id
      and clients.user_id = (select auth.uid())
      and clients.deleted_at is null
  )
);

create policy "Users can update their own projects"
on public.projects for update
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.clients
    where clients.id = projects.client_id
      and clients.user_id = (select auth.uid())
      and clients.deleted_at is null
  )
);

create policy "Users can delete their own projects"
on public.projects for delete
using ((select auth.uid()) = user_id);

create policy "Users can view their own providers"
on public.providers for select
using ((select auth.uid()) = user_id);

create policy "Users can create their own providers"
on public.providers for insert
with check ((select auth.uid()) = user_id);

create policy "Users can update their own providers"
on public.providers for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own providers"
on public.providers for delete
using ((select auth.uid()) = user_id);
