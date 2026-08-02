alter table public.items
add column if not exists position integer;

with numbered as (
    select
        id,
        row_number() over (
            partition by proforma_id
            order by created_at asc, id asc
        ) - 1 as new_position
    from public.items
    where position is null
)
update public.items
set position = numbered.new_position
from numbered
where public.items.id = numbered.id;

alter table public.items
alter column position set not null;

alter table public.items
add constraint items_position_nonnegative check (position >= 0);

create unique index if not exists items_proforma_position_unique
on public.items (proforma_id, position);

create index if not exists items_proforma_position_idx
on public.items (proforma_id, position);
