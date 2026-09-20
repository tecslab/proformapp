create table public.project_incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  incident_date date not null,
  responsibility text not null default 'under_review'
    check (responsibility in ('under_review','client','provider','company','shared','not_applicable')),
  estimated_cost numeric(12,2) check (estimated_cost between 0 and 9999999999.99),
  final_cost numeric(12,2) check (final_cost between 0 and 9999999999.99),
  billable_to_client boolean,
  resolved boolean not null default false,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index incidents_project_resolved_idx on public.project_incidents(project_id, resolved);
create trigger incidents_updated_at before update on public.project_incidents
for each row execute function public.set_project_management_updated_at();
alter table public.project_incidents enable row level security;
create policy incidents_read on public.project_incidents for select to authenticated
using (user_id = auth.uid());
create policy incidents_insert on public.project_incidents for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid() and p.archived_at is null
));
create policy incidents_update on public.project_incidents for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and exists (
  select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid() and p.archived_at is null
));
-- Keep incidents as project history; resolution replaces deletion.
