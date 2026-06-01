-- Accesorios Margarita - Snapshot de producto comprado sin reemplazar la RPC larga
-- Ejecutar completo en Supabase SQL Editor.

alter table public.pedido_items
  add column if not exists producto_nombre text;

alter table public.pedido_items
  add column if not exists producto_categoria text;

alter table public.pedido_items
  add column if not exists producto_imagen_url text;

update public.pedido_items
set
  producto_nombre = coalesce(pedido_items.producto_nombre, productos.nombre),
  producto_categoria = coalesce(
    pedido_items.producto_categoria,
    categorias.nombre,
    productos.categoria
  ),
  producto_imagen_url = coalesce(
    pedido_items.producto_imagen_url,
    productos.imagen_url
  )
from public.productos
left join public.categorias on categorias.id = productos.categoria_id
where productos.id = pedido_items.producto_id;

create or replace function public.set_pedido_item_producto_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as '
begin
  select
    productos.nombre,
    coalesce(categorias.nombre, productos.categoria),
    productos.imagen_url
  into
    new.producto_nombre,
    new.producto_categoria,
    new.producto_imagen_url
  from public.productos
  left join public.categorias on categorias.id = productos.categoria_id
  where productos.id = new.producto_id;

  return new;
end;
';

drop trigger if exists set_pedido_item_producto_snapshot on public.pedido_items;

create trigger set_pedido_item_producto_snapshot
before insert on public.pedido_items
for each row
execute function public.set_pedido_item_producto_snapshot();

create or replace function public.confirmar_comprobante_admin(p_pedido_id bigint)
returns public.pedidos
language sql
security definer
set search_path = public
as '
  update public.pedidos
  set pago_estado = ''comprobante_recibido''
  where id = p_pedido_id
    and medio_pago = ''transferencia''
    and public.is_admin()
  returning *;
';

grant execute on function public.confirmar_comprobante_admin(bigint) to authenticated;

notify pgrst, 'reload schema';
