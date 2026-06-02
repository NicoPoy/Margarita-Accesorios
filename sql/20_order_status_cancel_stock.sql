-- Accesorios Margarita - Estados claros de pedidos y cancelacion con devolucion de stock
-- Ejecutar en Supabase SQL Editor despues de las migraciones anteriores.

alter table public.pedidos
  add column if not exists estado text not null default 'pendiente';

alter table public.pedidos
  add column if not exists pago_estado text not null default 'pendiente';

alter table public.pedidos
  add column if not exists actualizado_en timestamptz not null default now();

alter table public.pedido_items
  add column if not exists variante_id bigint references public.producto_variantes(id);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_estado_check'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos drop constraint pedidos_estado_check;
  end if;

  alter table public.pedidos
    add constraint pedidos_estado_check
    check (estado in ('pendiente', 'confirmado', 'entregado', 'cancelado'));

  if exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_pago_estado_check'
      and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos drop constraint pedidos_pago_estado_check;
  end if;

  alter table public.pedidos
    add constraint pedidos_pago_estado_check
    check (
      pago_estado in (
        'pendiente',
        'comprobante_pendiente',
        'comprobante_recibido',
        'aprobado',
        'cancelado'
      )
    );
end;
$$;

create index if not exists idx_pedidos_estado on public.pedidos(estado);
create index if not exists idx_pedidos_pago_estado on public.pedidos(pago_estado);

create or replace function public.confirmar_comprobante_admin(p_pedido_id bigint)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pedido public.pedidos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede confirmar comprobantes.';
  end if;

  update public.pedidos
  set
    pago_estado = 'comprobante_recibido',
    actualizado_en = now()
  where id = p_pedido_id
    and estado not in ('entregado', 'cancelado')
    and medio_pago = 'transferencia'
  returning * into v_pedido;

  if not found then
    raise exception 'No se pudo confirmar el comprobante del pedido.';
  end if;

  return v_pedido;
end;
$fn$;

grant execute on function public.confirmar_comprobante_admin(bigint) to authenticated;

create or replace function public.marcar_pedido_entregado_admin(p_pedido_id bigint)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pedido public.pedidos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede marcar pedidos como entregados.';
  end if;

  select *
  into v_pedido
  from public.pedidos
  where id = p_pedido_id;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if v_pedido.estado = 'cancelado' then
    raise exception 'No se puede entregar un pedido cancelado.';
  end if;

  if v_pedido.estado = 'entregado' then
    return v_pedido;
  end if;

  if v_pedido.medio_pago = 'transferencia'
     and v_pedido.pago_estado not in ('comprobante_recibido', 'aprobado') then
    raise exception 'Primero confirma que recibiste el comprobante.';
  end if;

  update public.pedidos
  set
    estado = 'entregado',
    pago_estado = case
      when pago_estado = 'pendiente' then 'pendiente'
      else pago_estado
    end,
    actualizado_en = now()
  where id = p_pedido_id
  returning * into v_pedido;

  return v_pedido;
end;
$fn$;

grant execute on function public.marcar_pedido_entregado_admin(bigint) to authenticated;

create or replace function public.cancelar_pedido_admin(p_pedido_id bigint)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pedido public.pedidos;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cancelar pedidos.';
  end if;

  select *
  into v_pedido
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if v_pedido.estado = 'cancelado' then
    return v_pedido;
  end if;

  if v_pedido.estado = 'entregado' then
    raise exception 'No se puede cancelar un pedido ya entregado.';
  end if;

  for v_item in
    select producto_id, variante_id, cantidad
    from public.pedido_items
    where pedido_id = p_pedido_id
  loop
    update public.productos
    set stock = stock + v_item.cantidad
    where id = v_item.producto_id;

    if v_item.variante_id is not null then
      update public.producto_variantes
      set stock = stock + v_item.cantidad
      where id = v_item.variante_id;
    end if;
  end loop;

  update public.pedidos
  set
    estado = 'cancelado',
    pago_estado = 'cancelado',
    actualizado_en = now()
  where id = p_pedido_id
  returning * into v_pedido;

  return v_pedido;
end;
$fn$;

grant execute on function public.cancelar_pedido_admin(bigint) to authenticated;

notify pgrst, 'reload schema';
