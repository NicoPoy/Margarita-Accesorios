-- Accesorios Margarita - Actualizacion del modelo de pedidos
-- Ejecutar en Supabase SQL Editor si tu base ya existia antes de agregar pagos/pedidos completos.

alter table public.pedidos
  add column if not exists estado text not null default 'pendiente';

alter table public.pedidos
  add column if not exists medio_pago text;

alter table public.pedidos
  add column if not exists pago_estado text not null default 'pendiente';

alter table public.pedidos
  add column if not exists total numeric(12, 2) not null default 0;

alter table public.pedidos
  add column if not exists fecha timestamptz not null default now();

alter table public.pedidos
  add column if not exists created_at timestamptz not null default now();

alter table public.pedidos
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_estado_check'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_estado_check
      check (estado in ('pendiente', 'confirmado', 'cancelado', 'entregado'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_total_check'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_total_check
      check (total >= 0);
  end if;
end;
$$;

alter table public.pedido_items
  add column if not exists precio_unitario numeric(12, 2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pedido_items'
      and column_name = 'subtotal'
  ) then
    alter table public.pedido_items
      add column subtotal numeric(12, 2)
      generated always as (cantidad * precio_unitario) stored;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedido_items_precio_unitario_check'
      and conrelid = 'public.pedido_items'::regclass
  ) then
    alter table public.pedido_items
      add constraint pedido_items_precio_unitario_check
      check (precio_unitario >= 0);
  end if;
end;
$$;

update public.pedidos
set total = pedido_totales.total
from (
  select
    pedido_id,
    coalesce(sum(cantidad * precio_unitario), 0) as total
  from public.pedido_items
  group by pedido_id
) as pedido_totales
where pedidos.id = pedido_totales.pedido_id;

create index if not exists idx_pedidos_usuario_id on public.pedidos(usuario_id);
create index if not exists idx_pedidos_estado on public.pedidos(estado);
create index if not exists idx_pedido_items_pedido_id on public.pedido_items(pedido_id);
