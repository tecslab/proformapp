create table public.project_receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  project_id uuid not null references public.projects(id),
  project_proforma_id uuid references public.project_proformas(id),
  description text not null check (length(trim(description)) > 0),
  expected_amount numeric(12,2) not null check (expected_amount > 0),
  due_date date,
  status text not null default 'pending' check (status in ('pending','partial','paid','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  project_id uuid not null references public.projects(id),
  project_proforma_id uuid references public.project_proformas(id),
  scope_item_id uuid references public.project_scope_items(id),
  execution_item_id uuid references public.project_execution_items(id),
  provider_id uuid references public.providers(id),
  receivable_id uuid references public.project_receivables(id),
  direction text not null check (direction in ('in','out')),
  type text not null check (type in ('client_advance','client_partial_payment','client_balance',
    'provider_advance','provider_payment','material_purchase','labor_payment','transport','refund','other')),
  amount numeric(12,2) not null check (amount > 0),
  transaction_date date not null,
  description text not null check (length(trim(description)) > 0),
  payment_method text,
  notes text,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  check (
    (type in ('client_advance','client_partial_payment','client_balance') and direction = 'in')
    or (type in ('provider_advance','provider_payment','material_purchase','labor_payment','transport') and direction = 'out')
    or type in ('refund','other')
  ),
  check (receivable_id is null or (direction = 'in' and type in ('client_advance','client_partial_payment','client_balance'))),
  check ((voided_at is null and void_reason is null) or (voided_at is not null and length(trim(void_reason)) > 0))
);
create index receivables_project_status_idx on public.project_receivables(project_id, status);
create index transactions_project_date_idx on public.project_transactions(project_id, transaction_date);
create index transactions_provider_idx on public.project_transactions(provider_id);
create index transactions_execution_idx on public.project_transactions(execution_item_id);
create index transactions_receivable_idx on public.project_transactions(receivable_id);

alter table public.project_receivables enable row level security;
alter table public.project_transactions enable row level security;
create policy receivables_read on public.project_receivables for select to authenticated using (user_id = auth.uid());
create policy receivables_insert on public.project_receivables for insert to authenticated with check (user_id = auth.uid());
create policy receivables_update on public.project_receivables for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transactions_read on public.project_transactions for select to authenticated using (user_id = auth.uid());
create policy transactions_insert on public.project_transactions for insert to authenticated with check (user_id = auth.uid());
create policy transactions_update on public.project_transactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- No DELETE policies or cascading financial deletes.

create function public.validate_project_financial_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_scope public.project_scope_items%rowtype;
  v_execution public.project_execution_items%rowtype;
  v_receivable public.project_receivables%rowtype;
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if tg_table_name = 'project_transactions' then
      if (to_jsonb(new) - 'voided_at' - 'void_reason') is distinct from (to_jsonb(old) - 'voided_at' - 'void_reason')
         or old.voided_at is not null or new.voided_at is null
         or coalesce(length(trim(new.void_reason)),0) = 0 then
        raise exception 'Transactions can only be voided once with a reason';
      end if;
      new.voided_at := now();
      return new;
    else
      if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at')
         or old.status = 'cancelled' or new.status <> 'cancelled' then
        raise exception 'Expected collections can only be cancelled';
      end if;
      new.updated_at := now();
      return new;
    end if;
  end if;

  if not exists (select 1 from public.projects p where p.id = new.project_id
    and p.user_id = auth.uid() and p.archived_at is null) then
    raise exception 'Project unavailable';
  end if;
  if new.project_proforma_id is not null and not exists (
    select 1 from public.project_proformas p where p.id = new.project_proforma_id
      and p.project_id = new.project_id and p.user_id = auth.uid()
  ) then raise exception 'Invalid imported proforma'; end if;

  if tg_table_name = 'project_receivables' then
    if new.status <> 'pending' then raise exception 'New expected collections must be pending'; end if;
  else
    if new.voided_at is not null or new.void_reason is not null then raise exception 'Cannot insert voided transactions'; end if;
    if new.scope_item_id is not null then
      select * into v_scope from public.project_scope_items where id = new.scope_item_id
        and project_id = new.project_id and user_id = auth.uid() and archived_at is null;
      if not found then raise exception 'Invalid scope item'; end if;
      if new.project_proforma_id is not null and new.project_proforma_id <> v_scope.project_proforma_id then
        raise exception 'Scope and proforma mismatch';
      end if;
      new.project_proforma_id := v_scope.project_proforma_id;
    end if;
    if new.execution_item_id is not null then
      select * into v_execution from public.project_execution_items where id = new.execution_item_id
        and project_id = new.project_id and user_id = auth.uid() and archived_at is null and status <> 'cancelled';
      if not found then raise exception 'Invalid execution item'; end if;
      if new.direction <> 'out' then raise exception 'Execution payments must be outgoing'; end if;
      if new.scope_item_id is not null and new.scope_item_id is distinct from v_execution.scope_item_id then
        raise exception 'Execution and scope mismatch';
      end if;
      if new.provider_id is not null and v_execution.provider_id is not null and new.provider_id <> v_execution.provider_id then
        raise exception 'Execution and provider mismatch';
      end if;
      new.scope_item_id := v_execution.scope_item_id;
      new.provider_id := coalesce(new.provider_id, v_execution.provider_id);
      if v_execution.scope_item_id is not null then
        select * into v_scope from public.project_scope_items where id = v_execution.scope_item_id;
        if new.project_proforma_id is not null and new.project_proforma_id <> v_scope.project_proforma_id then
          raise exception 'Execution and proforma mismatch';
        end if;
        new.project_proforma_id := v_scope.project_proforma_id;
      end if;
    end if;
    if new.provider_id is not null and not exists (
      select 1 from public.providers where id = new.provider_id and user_id = auth.uid()
    ) then raise exception 'Invalid provider'; end if;
    if new.receivable_id is not null then
      select * into v_receivable from public.project_receivables where id = new.receivable_id
        and project_id = new.project_id and user_id = auth.uid() for update;
      if not found or v_receivable.status = 'cancelled' then raise exception 'Expected collection unavailable'; end if;
      if new.project_proforma_id is not null and v_receivable.project_proforma_id is not null
        and new.project_proforma_id <> v_receivable.project_proforma_id then
        raise exception 'Collection and proforma mismatch';
      end if;
      new.project_proforma_id := coalesce(new.project_proforma_id, v_receivable.project_proforma_id);
    end if;
  end if;
  return new;
end;
$$;
create trigger validate_receivable before insert or update on public.project_receivables
for each row execute function public.validate_project_financial_write();
create trigger validate_transaction before insert or update on public.project_transactions
for each row execute function public.validate_project_financial_write();

-- Status is derived from actual non-voided receipts; cancellation remains an explicit state.
create view public.project_receivable_balances with (security_invoker = true) as
select r.*,
  coalesce(p.collected,0) as collected,
  r.expected_amount - coalesce(p.collected,0) as balance,
  case when r.status = 'cancelled' then 'cancelled'
       when coalesce(p.collected,0) >= r.expected_amount then 'paid'
       when coalesce(p.collected,0) > 0 then 'partial' else 'pending' end as effective_status
from public.project_receivables r
left join (
  select receivable_id, sum(amount) as collected from public.project_transactions
  where voided_at is null and direction = 'in' and type in ('client_advance','client_partial_payment','client_balance')
  group by receivable_id
) p on p.receivable_id = r.id;
