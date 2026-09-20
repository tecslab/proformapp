create table public.project_execution_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  scope_item_id uuid references public.project_scope_items(id),
  provider_id uuid references public.providers(id),
  description text not null check (length(trim(description)) > 0),
  category text,
  estimated_cost numeric(12,2) check (estimated_cost >= 0),
  committed_cost numeric(12,2) check (committed_cost >= 0),
  status text not null default 'planned' check (status in ('planned', 'quoted', 'committed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index execution_project_idx on public.project_execution_items(project_id);
create index execution_scope_idx on public.project_execution_items(scope_item_id);
create index execution_provider_idx on public.project_execution_items(provider_id);

create trigger execution_updated_at before update on public.project_execution_items
for each row execute function public.set_project_management_updated_at();

alter table public.project_execution_items enable row level security;
create policy execution_read on public.project_execution_items for select to authenticated
using (user_id = (select auth.uid()));

-- Both INSERT and UPDATE validate every relationship, including writes via REST.
create policy execution_insert on public.project_execution_items for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid() and p.archived_at is null)
  and (scope_item_id is null or exists (
    select 1 from public.project_scope_items s
    where s.id = scope_item_id and s.project_id = project_execution_items.project_id
      and s.user_id = auth.uid() and s.archived_at is null
  ))
  and (provider_id is null or exists (
    select 1 from public.providers p where p.id = provider_id and p.user_id = auth.uid()
  ))
);
create policy execution_update on public.project_execution_items for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid() and p.archived_at is null)
  and (scope_item_id is null or exists (
    select 1 from public.project_scope_items s
    where s.id = scope_item_id and s.project_id = project_execution_items.project_id
      and s.user_id = auth.uid() and s.archived_at is null
  ))
  and (provider_id is null or exists (
    select 1 from public.providers p where p.id = provider_id and p.user_id = auth.uid()
  ))
);
-- No DELETE policy: cancelled/archived work keeps its historical references.
