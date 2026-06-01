-- Accesorios Margarita - Queries de consulta y diagnostico
-- Estas consultas son para revisar datos desde Supabase SQL Editor.

-- 1. Categorias activas ordenadas alfabeticamente.
select
  id,
  nombre,
  activo,
  created_at,
  updated_at
from public.categorias
where activo = true
order by nombre;

-- 2. Catalogo principal: solo productos activos con stock.
select
  productos.id,
  productos.nombre,
  categorias.nombre as categoria,
  productos.precio,
  productos.stock,
  productos.imagen_url,
  productos.activo,
  productos.updated_at
from public.productos
left join public.categorias on categorias.id = productos.categoria_id
where productos.activo = true
  and productos.stock > 0
order by categorias.nombre nulls last, productos.nombre;

-- 3. Productos sin stock, vista util para admin.
select
  productos.id,
  productos.nombre,
  coalesce(categorias.nombre, productos.categoria) as categoria,
  productos.precio,
  productos.stock,
  productos.imagen_url,
  productos.updated_at
from public.productos
left join public.categorias on categorias.id = productos.categoria_id
where productos.activo = true
  and productos.stock = 0
order by productos.updated_at desc;

-- 4. Productos con categoria pendiente de vincular.
select
  id,
  nombre,
  categoria,
  categoria_id
from public.productos
where categoria_id is null
order by nombre;

-- 5. Cantidad de productos por categoria.
select
  coalesce(categorias.nombre, productos.categoria, 'Sin categoria') as categoria,
  count(*) as cantidad_productos,
  sum(case when productos.stock > 0 then 1 else 0 end) as con_stock,
  sum(case when productos.stock = 0 then 1 else 0 end) as sin_stock
from public.productos
left join public.categorias on categorias.id = productos.categoria_id
where productos.activo = true
group by coalesce(categorias.nombre, productos.categoria, 'Sin categoria')
order by categoria;

-- 6. Usuarios con sus roles.
select
  usuarios.id,
  usuarios.nombre,
  usuarios.whatsapp,
  usuarios.dni,
  usuarios.activo,
  coalesce(string_agg(roles.nombre, ', ' order by roles.nombre), 'Sin rol') as roles
from public.usuarios
left join public.usuario_roles on usuario_roles.usuario_id = usuarios.id
  and usuario_roles.activo = true
left join public.roles on roles.id = usuario_roles.rol_id
group by usuarios.id, usuarios.nombre, usuarios.whatsapp, usuarios.dni, usuarios.activo
order by usuarios.created_at desc;

-- 7. Ver usuarios admin.
select
  usuarios.id,
  usuarios.nombre,
  usuarios.whatsapp,
  usuarios.dni
from public.usuarios
join public.usuario_roles on usuario_roles.usuario_id = usuarios.id
join public.roles on roles.id = usuario_roles.rol_id
where usuario_roles.activo = true
  and roles.nombre = 'admin'
order by usuarios.nombre;

-- 8. Pedidos con datos del cliente.
select
  pedidos.id,
  pedidos.fecha,
  pedidos.estado,
  pedidos.medio_pago,
  pedidos.pago_estado,
  pedidos.total,
  usuarios.nombre as cliente,
  usuarios.whatsapp,
  usuarios.dni
from public.pedidos
join public.usuarios on usuarios.id = pedidos.usuario_id
order by pedidos.fecha desc;

-- 9. Detalle de un pedido. Cambiar el valor de :pedido_id por el id real.
select
  pedido_items.pedido_id,
  productos.nombre as producto,
  coalesce(categorias.nombre, productos.categoria) as categoria,
  pedido_items.cantidad,
  pedido_items.precio_unitario,
  pedido_items.subtotal
from public.pedido_items
join public.productos on productos.id = pedido_items.producto_id
left join public.categorias on categorias.id = productos.categoria_id
where pedido_items.pedido_id = :pedido_id
order by productos.nombre;

-- 10. Ventas por producto.
select
  productos.id,
  productos.nombre,
  coalesce(categorias.nombre, productos.categoria) as categoria,
  coalesce(sum(pedido_items.cantidad), 0) as unidades_vendidas,
  coalesce(sum(pedido_items.subtotal), 0) as total_vendido
from public.productos
left join public.categorias on categorias.id = productos.categoria_id
left join public.pedido_items on pedido_items.producto_id = productos.id
left join public.pedidos on pedidos.id = pedido_items.pedido_id
  and pedidos.estado <> 'cancelado'
group by productos.id, productos.nombre, coalesce(categorias.nombre, productos.categoria)
order by total_vendido desc, unidades_vendidas desc;

-- 11. Imagenes subidas al bucket de productos.
select
  name,
  bucket_id,
  created_at,
  updated_at,
  metadata
from storage.objects
where bucket_id = 'product-images'
order by created_at desc;

-- 12. Buscar productos por texto. Cambiar 'anillo' por el texto deseado.
select
  productos.id,
  productos.nombre,
  coalesce(categorias.nombre, productos.categoria) as categoria,
  productos.precio,
  productos.stock
from public.productos
left join public.categorias on categorias.id = productos.categoria_id
where productos.activo = true
  and (
    productos.nombre ilike '%anillo%'
    or coalesce(categorias.nombre, productos.categoria) ilike '%anillo%'
  )
order by productos.nombre;
