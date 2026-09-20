-- Independent aggregates avoid multiplying sales/costs when a project has
-- several proformas, execution tasks and transactions.
create view public.project_financial_summary with (security_invoker = true) as
with scope_totals as (
  select project_proforma_id,
    sum(quoted_line_total) as original_sales,
    sum(quoted_unit_cost * quantity) as quoted_cost
  from public.project_scope_items where archived_at is null
  group by project_proforma_id
), sales as (
  select pp.project_id,
    sum(case when pp.subtotal_snapshot = 0 then 0 else
      round(pp.net_subtotal_snapshot * s.original_sales / pp.subtotal_snapshot, 2) end) as net_sales,
    sum(case when pp.subtotal_snapshot = 0 then 0 else
      round(pp.total_snapshot * s.original_sales / pp.subtotal_snapshot, 2) end) as client_total_due,
    round(sum(s.quoted_cost), 2) as quoted_cost
  from public.project_proformas pp
  join scope_totals s on s.project_proforma_id = pp.id
  group by pp.project_id
), payments as (
  select execution_item_id, sum(amount) as paid
  from public.project_transactions
  where voided_at is null and direction = 'out'
  group by execution_item_id
), commitments as (
  select e.project_id,
    sum(e.committed_cost) as committed_cost,
    sum(greatest(e.committed_cost - coalesce(p.paid,0),0)) as supplier_balance,
    sum(greatest(coalesce(p.paid,0) - e.committed_cost,0)) as paid_over_commitment
  from public.project_execution_items e
  left join payments p on p.execution_item_id = e.id
  where e.archived_at is null and e.status <> 'cancelled' and e.committed_cost is not null
  group by e.project_id
), money as (
  select t.project_id,
    coalesce(sum(t.amount) filter (where t.direction = 'in'),0) as inflows,
    coalesce(sum(t.amount) filter (where t.direction = 'out'),0) as paid_cost,
    coalesce(sum(t.amount) filter (where t.direction = 'in'
      and t.type in ('client_advance','client_partial_payment','client_balance')),0) as collected,
    coalesce(sum(t.amount) filter (where t.direction = 'out'
      and (e.id is null or e.committed_cost is null or e.archived_at is not null or e.status = 'cancelled')),0) as paid_uncommitted_costs
  from public.project_transactions t
  left join public.project_execution_items e on e.id = t.execution_item_id
  where t.voided_at is null
  group by t.project_id
), overdue as (
  select project_id, count(*) as overdue_receivables
  from public.project_receivable_balances
  where effective_status in ('pending','partial')
    and due_date < (now() at time zone 'America/Guayaquil')::date
  group by project_id
), totals as (
  select p.id as project_id, p.user_id, p.name, p.status, p.archived_at,
    coalesce(s.net_sales,0) as net_sales,
    coalesce(s.client_total_due,0) as client_total_due,
    coalesce(s.quoted_cost,0) as quoted_cost,
    coalesce(c.committed_cost,0) as committed_cost,
    coalesce(c.supplier_balance,0) as supplier_balance,
    coalesce(c.paid_over_commitment,0) as paid_over_commitment,
    coalesce(m.collected,0) as collected,
    coalesce(m.paid_cost,0) as paid_cost,
    coalesce(m.paid_uncommitted_costs,0) as paid_uncommitted_costs,
    coalesce(m.inflows,0) - coalesce(m.paid_cost,0) as project_cash,
    coalesce(o.overdue_receivables,0) as overdue_receivables
  from public.projects p
  left join sales s on s.project_id = p.id
  left join commitments c on c.project_id = p.id
  left join money m on m.project_id = p.id
  left join overdue o on o.project_id = p.id
)
select *,
  client_total_due - collected as client_balance,
  net_sales - quoted_cost as quoted_margin,
  net_sales - committed_cost - paid_uncommitted_costs - paid_over_commitment as expected_margin,
  case when status = 'completed' then net_sales - paid_cost else null end as actual_margin,
  status in ('approved','waiting_advance') and collected = 0 as advance_pending,
  project_cash < supplier_balance as cash_shortfall,
  status in ('finishing','pending_collection','completed') and client_total_due > collected as closing_balance_pending
from totals;

grant select on public.project_financial_summary to authenticated;
