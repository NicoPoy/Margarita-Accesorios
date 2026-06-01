-- Accesorios Margarita - Opciones de producto, multiples imagenes y pedidos robustos
-- Ejecutar este archivo completo en Supabase SQL Editor.

alter table public.productos
add column if not exists imagenes_url text[],
add column if not exists colores text[] not null default '{}',
add column if not exists modelos text[] not null default '{}';

update public.productos
set imagenes_url = array[imagen_url]
where imagen_url is not null
  and (imagenes_url is null or array_length(imagenes_url, 1) is null);

alter table public.pedido_items
add column if not exists color text,
add column if not exists modelo text,
add column if not exists producto_nombre text,
add column if not exists producto_categoria text,
add column if not exists producto_imagen_url text;

update public.pedido_items
set
  producto_nombre = coalesce(pedido_items.producto_nombre, productos.nombre),
  producto_categoria = coalesce(
    pedido_items.producto_categoria,
    categorias.nombre,
    productos.categoria,
    'Sin categoria'
  ),
  producto_imagen_url = coalesce(
    pedido_items.producto_imagen_url,
    productos.imagen_url
  )
from public.productos
left join public.categorias on categorias.id = productos.categoria_id
where pedido_items.producto_id = productos.id;

create or replace function public.set_pedido_item_producto_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_producto record;
begin
  select
    productos.nombre,
    coalesce(categorias.nombre, productos.categoria, 'Sin categoria') as categoria,
    productos.imagen_url
  into v_producto
  from public.productos
  left join public.categorias on categorias.id = productos.categoria_id
  where productos.id = new.producto_id;

  new.producto_nombre := coalesce(new.producto_nombre, v_producto.nombre, 'Producto eliminado');
  new.producto_categoria := coalesce(new.producto_categoria, v_producto.categoria, 'Sin categoria');
  new.producto_imagen_url := coalesce(new.producto_imagen_url, v_producto.imagen_url);

  return new;
end;
$fn$;

drop trigger if exists set_pedido_item_producto_snapshot on public.pedido_items;

create trigger set_pedido_item_producto_snapshot
before insert on public.pedido_items
for each row
execute function public.set_pedido_item_producto_snapshot();

drop function if exists public.actualizar_producto_admin(
  bigint,
  text,
  bigint,
  text,
  numeric,
  integer,
  text,
  text
);

create or replace function public.actualizar_producto_admin(
  p_producto_id bigint,
  p_nombre text,
  p_categoria_id bigint,
  p_categoria text,
  p_precio numeric,
  p_stock integer,
  p_imagen_url text,
  p_imagenes_url text[],
  p_imagen_path text,
  p_colores text[],
  p_modelos text[]
)
returns public.productos
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_producto public.productos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede modificar productos.';
  end if;

  if nullif(trim(p_nombre), '') is null then
    raise exception 'El nombre del producto es obligatorio.';
  end if;

  if p_precio is null or p_precio < 0 then
    raise exception 'El precio no puede ser negativo.';
  end if;

  if p_stock is null or p_stock < 0 then
    raise exception 'El stock no puede ser negativo.';
  end if;

  if not exists (
    select 1
    from public.categorias
    where id = p_categoria_id
      and activo = true
  ) then
    raise exception 'Categoria no valida.';
  end if;

  update public.productos
  set
    nombre = trim(p_nombre),
    categoria_id = p_categoria_id,
    categoria = p_categoria,
    precio = p_precio,
    stock = p_stock,
    imagen_url = p_imagen_url,
    imagenes_url = case
      when p_imagenes_url is null or array_length(p_imagenes_url, 1) is null then
        case when p_imagen_url is null then null else array[p_imagen_url] end
      else p_imagenes_url
    end,
    imagen_path = p_imagen_path,
    colores = coalesce(p_colores, '{}'),
    modelos = coalesce(p_modelos, '{}')
  where id = p_producto_id
    and activo = true
  returning * into v_producto;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;

  return v_producto;
end;
$fn$;

grant execute on function public.actualizar_producto_admin(
  bigint,
  text,
  bigint,
  text,
  numeric,
  integer,
  text,
  text[],
  text,
  text[],
  text[]
) to authenticated;

create or replace function public.crear_pedido_con_items(
  p_items jsonb,
  p_medio_pago text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_usuario_id uuid := auth.uid();
  v_pedido_id bigint;
  v_total numeric(12, 2) := 0;
  v_item jsonb;
  v_producto record;
  v_cantidad integer;
  v_color text;
  v_modelo text;
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
    v_color := nullif(trim(coalesce(v_item ->> 'color', '')), '');
    v_modelo := nullif(trim(coalesce(v_item ->> 'modelo', '')), '');

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad invalida.';
    end if;

    select
      productos.id,
      productos.nombre,
      coalesce(categorias.nombre, productos.categoria, 'Sin categoria') as categoria,
      productos.precio,
      productos.stock,
      productos.imagen_url,
      productos.colores,
      productos.modelos
    into v_producto
    from public.productos
    left join public.categorias on categorias.id = productos.categoria_id
    where productos.id = (v_item ->> 'producto_id')::bigint
      and productos.activo = true
    for update of productos;

    if not found then
      raise exception 'Producto no encontrado.';
    end if;

    if array_length(v_producto.colores, 1) is not null
       and (v_color is null or not (v_color = any(v_producto.colores))) then
      raise exception 'Color no valido para %.', v_producto.nombre;
    end if;

    if array_length(v_producto.modelos, 1) is not null
       and (v_modelo is null or not (v_modelo = any(v_producto.modelos))) then
      raise exception 'Modelo no valido para %.', v_producto.nombre;
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
      precio_unitario,
      subtotal,
      color,
      modelo,
      producto_nombre,
      producto_categoria,
      producto_imagen_url
    )
    values (
      v_pedido_id,
      v_producto.id,
      v_cantidad,
      v_producto.precio,
      v_producto.precio * v_cantidad,
      v_color,
      v_modelo,
      v_producto.nombre,
      v_producto.categoria,
      v_producto.imagen_url
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
$fn$;

grant execute on function public.crear_pedido_con_items(jsonb, text) to authenticated;

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
  set pago_estado = 'comprobante_recibido'
  where id = p_pedido_id
    and medio_pago = 'transferencia'
    and estado <> 'entregado'
  returning * into v_pedido;

  if not found then
    raise exception 'Pedido no encontrado o no requiere comprobante.';
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

  if v_pedido.medio_pago = 'transferencia'
     and v_pedido.pago_estado not in ('comprobante_recibido', 'aprobado') then
    raise exception 'Primero confirma que recibiste el comprobante.';
  end if;

  update public.pedidos
  set
    estado = 'entregado',
    pago_estado = case
      when medio_pago = 'efectivo' then 'aprobado'
      else pago_estado
    end
  where id = p_pedido_id
  returning * into v_pedido;

  return v_pedido;
end;
$fn$;

grant execute on function public.marcar_pedido_entregado_admin(bigint) to authenticated;

notify pgrst, 'reload schema';
