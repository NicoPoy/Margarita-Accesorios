-- Accesorios Margarita - Modificacion de productos para admin
-- Ejecutar en Supabase SQL Editor.

create or replace function public.actualizar_producto_admin(
  p_producto_id bigint,
  p_nombre text,
  p_categoria_id bigint,
  p_categoria text,
  p_precio numeric,
  p_stock integer,
  p_imagen_url text,
  p_imagen_path text
)
returns public.productos
language plpgsql
security definer
set search_path = public
as $$
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
    imagen_path = p_imagen_path
  where id = p_producto_id
    and activo = true
  returning * into v_producto;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;

  return v_producto;
end;
$$;

grant execute on function public.actualizar_producto_admin(
  bigint,
  text,
  bigint,
  text,
  numeric,
  integer,
  text,
  text
) to authenticated;
