create table public.project_proformas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  proforma_id uuid not null references public.proformas(id),
  relation_type text not null default 'initial' check (relation_type in ('initial', 'additional')),
  subtotal_snapshot numeric(12,2) not null check (subtotal_snapshot >= 0),
  discount_percentage_snapshot numeric(7,4) not null default 0 check (discount_percentage_snapshot between 0 and 100),
  discount_amount_snapshot numeric(12,2) not null default 0 check (discount_amount_snapshot >= 0),
  net_subtotal_snapshot numeric(12,2) not null check (net_subtotal_snapshot >= 0),
  iva_percentage_snapshot numeric(7,4) not null default 0 check (iva_percentage_snapshot >= 0),
  iva_amount_snapshot numeric(12,2) not null default 0 check (iva_amount_snapshot >= 0),
  total_snapshot numeric(12,2) not null check (total_snapshot >= 0),
  created_at timestamptz not null default now(),
  unique(project_id, proforma_id)
);

create table public.project_scope_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  project_proforma_id uuid not null references public.project_proformas(id) on delete cascade,
  source_item_id uuid not null references public.items(id),
  description text not null,
  comment text,
  quantity numeric(12,2) not null check (quantity > 0),
  unit text not null,
  quoted_unit_cost numeric(12,2) not null check (quoted_unit_cost >= 0),
  quoted_gain_percentage numeric(7,4) not null default 0 check (quoted_gain_percentage >= 0),
  quoted_line_total numeric(12,2) not null check (quoted_line_total >= 0),
  position integer not null check (position >= 0),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(project_id, source_item_id)
);

create index project_proformas_project_idx on public.project_proformas(project_id);
create index project_proformas_proforma_idx on public.project_proformas(proforma_id);
create index project_scope_items_project_idx on public.project_scope_items(project_id);
create index project_scope_items_project_proforma_idx on public.project_scope_items(project_proforma_id);

alter table public.project_proformas enable row level security;
alter table public.project_scope_items enable row level security;

create policy "Users can view their own imported proformas"
on public.project_proformas for select
using ((select auth.uid()) = user_id);

create policy "Users can view their own project scope items"
on public.project_scope_items for select
using ((select auth.uid()) = user_id);

create or replace function public.import_proforma_items_to_project(
  p_project_id uuid,
  p_proforma_id uuid,
  p_item_ids uuid[],
  p_relation_type text default 'initial'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_project public.projects%rowtype;
  v_proforma public.proformas%rowtype;
  v_project_proforma_id uuid;
  v_requested_count integer;
  v_valid_count integer;
  v_imported_count integer;
  v_discount_amount numeric(12,2);
  v_net_subtotal numeric(12,2);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_relation_type not in ('initial', 'additional') then
    raise exception 'Invalid relation type' using errcode = '22023';
  end if;

  v_requested_count := coalesce(cardinality(p_item_ids), 0);
  if v_requested_count = 0 then
    raise exception 'Select at least one item' using errcode = '22023';
  end if;

  if v_requested_count <> (select count(distinct value) from unnest(p_item_ids) as selected(value)) then
    raise exception 'The item selection contains duplicates' using errcode = '22023';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
    and user_id = v_user_id
    and archived_at is null
  for update;

  if not found then
    raise exception 'Project not found' using errcode = 'P0002';
  end if;

  select * into v_proforma
  from public.proformas
  where id = p_proforma_id
    and user_id = v_user_id
  for share;

  if not found then
    raise exception 'Proforma not found' using errcode = 'P0002';
  end if;

  if v_proforma.status <> 'finalized' then
    raise exception 'Only finalized proformas can be imported' using errcode = '23514';
  end if;

  if v_proforma.client_id <> v_project.client_id then
    raise exception 'The proforma and project must belong to the same client' using errcode = '23514';
  end if;

  select count(*) into v_valid_count
  from public.items
  where proforma_id = p_proforma_id
    and id = any(p_item_ids);

  if v_valid_count <> v_requested_count then
    raise exception 'One or more selected items do not belong to the proforma' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.project_scope_items
    where project_id = p_project_id
      and source_item_id = any(p_item_ids)
  ) then
    raise exception 'One or more selected items were already imported' using errcode = '23505';
  end if;

  v_discount_amount := round(v_proforma.subtotal * coalesce(v_proforma.descuento, 0) / 100, 2);
  v_net_subtotal := round(v_proforma.subtotal - v_discount_amount, 2);

  insert into public.project_proformas (
    user_id,
    project_id,
    proforma_id,
    relation_type,
    subtotal_snapshot,
    discount_percentage_snapshot,
    discount_amount_snapshot,
    net_subtotal_snapshot,
    iva_percentage_snapshot,
    iva_amount_snapshot,
    total_snapshot
  ) values (
    v_user_id,
    p_project_id,
    p_proforma_id,
    p_relation_type,
    v_proforma.subtotal,
    coalesce(v_proforma.descuento, 0),
    v_discount_amount,
    v_net_subtotal,
    v_proforma.iva_percentage,
    v_proforma.iva_amount,
    v_proforma.total
  )
  on conflict (project_id, proforma_id) do nothing
  returning id into v_project_proforma_id;

  if v_project_proforma_id is null then
    select id into v_project_proforma_id
    from public.project_proformas
    where project_id = p_project_id
      and proforma_id = p_proforma_id;
  end if;

  insert into public.project_scope_items (
    user_id,
    project_id,
    project_proforma_id,
    source_item_id,
    description,
    comment,
    quantity,
    unit,
    quoted_unit_cost,
    quoted_gain_percentage,
    quoted_line_total,
    position
  )
  select
    v_user_id,
    p_project_id,
    v_project_proforma_id,
    items.id,
    items.description,
    items.comment,
    items.quantity,
    items.unit,
    items.unit_cost,
    items.percentage_gain,
    items.line_total,
    items.position
  from public.items
  where items.proforma_id = p_proforma_id
    and items.id = any(p_item_ids)
  order by items.position, items.id;

  get diagnostics v_imported_count = row_count;

  return jsonb_build_object(
    'project_proforma_id', v_project_proforma_id,
    'imported_count', v_imported_count
  );
end;
$$;

revoke all on function public.import_proforma_items_to_project(uuid, uuid, uuid[], text) from public;
grant execute on function public.import_proforma_items_to_project(uuid, uuid, uuid[], text) to authenticated;
