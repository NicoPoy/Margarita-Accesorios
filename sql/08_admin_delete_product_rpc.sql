-- Accesorios Margarita - Eliminacion logica de productos para admin
-- Ejecutar en Supabase SQL Editor.

create or replace function public.eliminar_producto_admin(p_producto_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede eliminar productos.';
  end if;

  update public.productos
  set activo = false
  where id = p_producto_id;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;
end;
$$;

grant execute on function public.eliminar_producto_admin(bigint) to authenticated;
