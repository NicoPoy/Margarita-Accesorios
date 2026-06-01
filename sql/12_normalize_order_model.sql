-- Accesorios Margarita - Normalizar tipos del modelo de pedidos
-- Ejecutar en Supabase SQL Editor si el visualizador muestra pago_estado como bool
-- o total/subtotal como float8.

alter table public.pedidos
  add column if not exists estado text not null default 'pendiente';

alter table public.pedidos
  add column if not exists medio_pago text;

alter table public.pedidos
  add column if not exists total numeric(12, 2) not null default 0;

alter table public.pedido_items
  add column if not exists precio_unitario numeric(12, 2) not null default 0;

do $$
declare
  v_pago_estado_type text;
begin
  select data_type
  into v_pago_estado_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'pedidos'
    and column_name = 'pago_estado';

  if v_pago_estado_type is null then
    alter table public.pedidos
      add column pago_estado text not null default 'pendiente';
  elsif v_pago_estado_type = 'boolean' then
    alter table public.pedidos
      alter column pago_estado drop default;

    alter table public.pedidos
      alter column pago_estado type text
      using case
        when pago_estado = true then 'aprobado'
        else 'pendiente'
      end;

    alter table public.pedidos
      alter column pago_estado set default 'pendiente';

    alter table public.pedidos
      alter column pago_estado set not null;
  elsif v_pago_estado_type <> 'text' then
    alter table public.pedidos
      alter column pago_estado type text
      using coalesce(pago_estado::text, 'pendiente');

    alter table public.pedidos
      alter column pago_estado set default 'pendiente';

    alter table public.pedidos
      alter column pago_estado set not null;
  end if;
end;
$$;

alter table public.pedidos
  alter column total type numeric(12, 2)
  using coalesce(total, 0)::numeric(12, 2);

alter table public.pedido_items
  alter column precio_unitario type numeric(12, 2)
  using coalesce(precio_unitario, 0)::numeric(12, 2);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pedido_items'
      and column_name = 'subtotal'
      and is_generated = 'NEVER'
  ) then
    update public.pedido_items
    set subtotal = cantidad * precio_unitario
    where subtotal is null
       or subtotal <> cantidad * precio_unitario;

    alter table public.pedido_items
      alter column subtotal type numeric(12, 2)
      using coalesce(subtotal, cantidad * precio_unitario)::numeric(12, 2);
  elsif not exists (
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
    where conname = 'pedidos_estado_check'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_estado_check
      check (estado in ('pendiente', 'confirmado', 'cancelado', 'entregado'));
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
