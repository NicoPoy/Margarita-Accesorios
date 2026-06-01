-- Accesorios Margarita - Solo RPC de pedidos
-- Ejecutar este archivo completo en Supabase SQL Editor.

create or replace function public.crear_pedido_con_items(
  p_items jsonb,
  p_medio_pago text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $crear_pedido$
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

  insert into public.pedidos (usuario_id, fecha, estado, medio_pago, pago_estado, total)
  values (
    v_usuario_id,
    now(),
    'pendiente',
    p_medio_pago,
    case
      when p_medio_pago = 'efectivo' then 'pendiente'
      else 'comprobante_pendiente'
    end,
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
$crear_pedido$;

grant execute on function public.crear_pedido_con_items(jsonb, text) to authenticated;

create or replace function public.marcar_pedido_entregado_admin(p_pedido_id bigint)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $marcar_entregado$
declare
  v_pedido public.pedidos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede marcar pedidos como entregados.';
  end if;

  update public.pedidos
  set estado = 'entregado'
  where id = p_pedido_id
  returning * into v_pedido;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  return v_pedido;
end;
$marcar_entregado$;

grant execute on function public.marcar_pedido_entregado_admin(bigint) to authenticated;

notify pgrst, 'reload schema';
