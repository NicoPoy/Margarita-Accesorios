-- Accesorios Margarita - Crear pedido y descontar stock
-- Ejecutar despues de 01_schema.sql, 02_seed_data.sql y 03_auth_storage_rls.sql.

alter table public.pedidos add column if not exists medio_pago text;
alter table public.pedidos add column if not exists pago_estado text not null default 'pendiente';

create or replace function public.crear_pedido_con_items(
  p_items jsonb,
  p_medio_pago text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_pedido_id bigint;
  v_total numeric(12, 2) := 0;
  v_item jsonb;
  v_producto record;
  v_cantidad integer;
begin
  if v_usuario_id is null then
    raise exception 'Tenes que iniciar sesion para finalizar el pedido.';
  end if;

  if p_medio_pago not in ('efectivo', 'transferencia') then
    raise exception 'Medio de pago no valido para cierre directo.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos.';
  end if;

  insert into public.pedidos (usuario_id, estado, medio_pago, pago_estado, total)
  values (
    v_usuario_id,
    'pendiente',
    p_medio_pago,
    case when p_medio_pago = 'efectivo' then 'pendiente' else 'comprobante_pendiente' end,
    0
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_cantidad := (v_item ->> 'cantidad')::integer;

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad invalida.';
    end if;

    select id, nombre, precio, stock
    into v_producto
    from public.productos
    where id = (v_item ->> 'producto_id')::bigint
      and activo = true
    for update;

    if not found then
      raise exception 'Producto no encontrado.';
    end if;

    if v_producto.stock < v_cantidad then
      raise exception 'No hay stock suficiente para %.', v_producto.nombre;
    end if;

    update public.productos
    set stock = stock - v_cantidad
    where id = v_producto.id;

    insert into public.pedido_items (
      pedido_id,
      producto_id,
      cantidad,
      precio_unitario
    )
    values (
      v_pedido_id,
      v_producto.id,
      v_cantidad,
      v_producto.precio
    );

    v_total := v_total + (v_producto.precio * v_cantidad);
  end loop;

  update public.pedidos
  set total = v_total
  where id = v_pedido_id;

  return jsonb_build_object(
    'pedido_id', v_pedido_id,
    'total', v_total,
    'medio_pago', p_medio_pago
  );
exception
  when others then
    if v_pedido_id is not null then
      delete from public.pedidos where id = v_pedido_id;
    end if;

    raise;
end;
$$;

grant execute on function public.crear_pedido_con_items(jsonb, text) to authenticated;
