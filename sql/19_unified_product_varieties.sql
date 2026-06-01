-- Accesorios Margarita - Variedades unificadas con stock propio
-- Ejecutar este archivo completo en Supabase SQL Editor.

alter table public.productos
add column if not exists variedades text[] not null default '{}',
add column if not exists imagenes_url text[];

create table if not exists public.producto_variantes (
  id bigserial primary key,
  producto_id bigint not null references public.productos(id) on delete cascade,
  nombre text,
  color text,
  modelo text,
  stock integer not null default 0 check (stock >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.producto_variantes
add column if not exists nombre text;

alter table public.producto_variantes enable row level security;

drop policy if exists "todos pueden ver variantes activas" on public.producto_variantes;
drop policy if exists "admins gestionan variantes de productos" on public.producto_variantes;

create policy "todos pueden ver variantes activas"
on public.producto_variantes
for select
using (activo = true or public.is_admin());

create policy "admins gestionan variantes de productos"
on public.producto_variantes
for all
using (public.is_admin())
with check (public.is_admin());

create or replace function public.validar_stock_variedades_producto()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_producto_id bigint := coalesce(new.producto_id, old.producto_id);
  v_stock_general integer;
  v_stock_variedades integer;
begin
  select stock
  into v_stock_general
  from public.productos
  where id = v_producto_id;

  select coalesce(sum(stock), 0)
  into v_stock_variedades
  from public.producto_variantes
  where producto_id = v_producto_id
    and activo = true;

  if v_stock_variedades > coalesce(v_stock_general, 0) then
    raise exception 'La suma del stock de las variedades no puede superar el stock general.';
  end if;

  return coalesce(new, old);
end;
$fn$;

drop trigger if exists validar_stock_variedades_producto on public.producto_variantes;

create constraint trigger validar_stock_variedades_producto
after insert or update or delete on public.producto_variantes
deferrable initially deferred
for each row execute function public.validar_stock_variedades_producto();

alter table public.pedido_items
add column if not exists variante_id bigint references public.producto_variantes(id),
add column if not exists variedad text;

update public.productos
set imagenes_url = array[imagen_url]
where imagen_url is not null
  and (imagenes_url is null or array_length(imagenes_url, 1) is null);

update public.producto_variantes
set nombre = nullif(trim(coalesce(nombre, concat_ws(' ', color, modelo))), '')
where nombre is null;

update public.productos
set variedades = subquery.variedades
from (
  select producto_id, array_agg(nombre order by nombre) as variedades
  from public.producto_variantes
  where activo = true
    and nombre is not null
  group by producto_id
) as subquery
where productos.id = subquery.producto_id;

update public.pedido_items
set variedad = coalesce(variedad, nullif(trim(concat_ws(' ', color, modelo)), ''))
where variedad is null;

drop function if exists public.actualizar_producto_admin(
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
);

drop function if exists public.actualizar_producto_admin(
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
  text[],
  jsonb
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
  p_variedades text[],
  p_variantes jsonb
)
returns public.productos
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_producto public.productos;
  v_variante jsonb;
  v_stock_variedades integer := 0;
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

  if p_variantes is not null and jsonb_typeof(p_variantes) = 'array' then
    select coalesce(sum(greatest(0, coalesce((item ->> 'stock')::integer, 0))), 0)
    into v_stock_variedades
    from jsonb_array_elements(p_variantes) as item;

    if v_stock_variedades > p_stock then
      raise exception 'La suma del stock de las variedades no puede superar el stock general.';
    end if;
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
    variedades = coalesce(p_variedades, '{}')
  where id = p_producto_id
    and activo = true
  returning * into v_producto;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;

  update public.producto_variantes
  set activo = false
  where producto_id = p_producto_id;

  if p_variantes is not null and jsonb_typeof(p_variantes) = 'array' then
    for v_variante in select * from jsonb_array_elements(p_variantes)
    loop
      if nullif(trim(v_variante ->> 'nombre'), '') is not null then
        insert into public.producto_variantes (producto_id, nombre, stock, activo)
        values (
          p_producto_id,
          trim(v_variante ->> 'nombre'),
          greatest(0, coalesce((v_variante ->> 'stock')::integer, 0)),
          true
        );
      end if;
    end loop;
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
  jsonb
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
  v_variante record;
  v_cantidad integer;
  v_variedad text;
  v_variante_id bigint;
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
    case when p_medio_pago = 'efectivo' then 'pendiente' else 'comprobante_pendiente' end,
    0
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_cantidad := (v_item ->> 'cantidad')::integer;
    v_variedad := nullif(trim(coalesce(v_item ->> 'variedad', '')), '');
    v_variante_id := nullif(v_item ->> 'variante_id', '')::bigint;

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad invalida.';
    end if;

    select
      productos.id,
      productos.nombre,
      coalesce(categorias.nombre, productos.categoria, 'Sin categoria') as categoria,
      productos.precio,
      productos.stock,
      productos.imagen_url
    into v_producto
    from public.productos
    left join public.categorias on categorias.id = productos.categoria_id
    where productos.id = (v_item ->> 'producto_id')::bigint
      and productos.activo = true
    for update of productos;

    if not found then
      raise exception 'Producto no encontrado.';
    end if;

    if exists (
      select 1
      from public.producto_variantes
      where producto_id = v_producto.id
        and activo = true
    ) then
      select id, nombre, stock
      into v_variante
      from public.producto_variantes
      where producto_id = v_producto.id
        and activo = true
        and (
          id = v_variante_id
          or nombre = v_variedad
        )
      for update;

      if not found then
        raise exception 'Selecciona una variedad valida para %.', v_producto.nombre;
      end if;

      if v_variante.stock < v_cantidad then
        raise exception 'No hay stock suficiente para %.', v_variante.nombre;
      end if;

      update public.producto_variantes
      set stock = stock - v_cantidad
      where id = v_variante.id;

      v_variedad := v_variante.nombre;
      v_variante_id := v_variante.id;
    else
      if v_producto.stock < v_cantidad then
        raise exception 'No hay stock suficiente para %.', v_producto.nombre;
      end if;
    end if;

    update public.productos
    set stock = stock - v_cantidad
    where id = v_producto.id;

    insert into public.pedido_items (
      pedido_id,
      producto_id,
      variante_id,
      cantidad,
      precio_unitario,
      subtotal,
      variedad,
      producto_nombre,
      producto_categoria,
      producto_imagen_url
    )
    values (
      v_pedido_id,
      v_producto.id,
      v_variante_id,
      v_cantidad,
      v_producto.precio,
      v_producto.precio * v_cantidad,
      v_variedad,
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

notify pgrst, 'reload schema';
