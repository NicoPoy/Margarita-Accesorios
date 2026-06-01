# SQL Accesorios Margarita

Scripts para montar y consultar el modelo de Supabase.

## Opcion rapida

Ejecutar completo en Supabase SQL Editor:

1. `00_ejecutar_todo.sql`

## Opcion por partes

Ejecutar en este orden:

1. `01_schema.sql`
2. `02_seed_data.sql`
3. `03_auth_storage_rls.sql`

## Consultas

- `04_queries_consulta.sql`: consultas para catalogo, sin stock, usuarios, roles, pedidos, ventas e imagenes.
- `05_admin_utils.sql`: utilidades para asignar/quitar roles manualmente.
- `06_insert_producto_sin_stock.sql`: ejemplo para insertar un producto sin stock con imagen ya subida a Storage.
- `07_checkout_rpc.sql`: funcion para crear pedidos, guardar items y descontar stock.
- `08_admin_delete_product_rpc.sql`: funcion para que admin elimine productos del catalogo.
- `09_admin_update_product_rpc.sql`: funcion para que admin modifique productos cargados.
- `10_admin_deliver_order_rpc.sql`: funcion para que admin marque pedidos como entregados.
- `11_update_order_model.sql`: migracion para bases ya creadas que no tengan columnas nuevas de pedidos.
- `12_normalize_order_model.sql`: ajusta tipos si `pago_estado` quedo bool o importaste columnas como float8.
- `13_order_functions_complete.sql`: repara las funciones de pedidos si Supabase dice que no encuentra `crear_pedido_con_items`.
- `14_create_order_rpc_only.sql`: version corta para crear solo las funciones RPC de pedidos.
- `15_seed_categories.sql`: inserta/reactiva categorias base si el selector aparece vacio.
- `16_order_item_product_snapshot.sql`: guarda nombre/categoria/imagen del producto dentro del pedido y agrega confirmacion de comprobante.
- `17_order_snapshot_trigger.sql`: version corta para snapshots de productos comprados y confirmacion de comprobante.
- `18_product_options_order_snapshots.sql`: migracion final para multiples fotos, colores/modelos opcionales, snapshots de pedidos y RPCs actualizadas.
- `19_unified_product_varieties.sql`: unifica colores/modelos como variedades con stock propio por variedad.

## Modelo incluido

- `roles`
- `usuarios`
- `usuario_roles`
- `categorias`
- `productos`
- `pedidos`
- `pedido_items`
- bucket Storage `product-images`
- triggers de `updated_at`
- trigger de alta de usuario desde `auth.users`
- policies RLS para usuarios, admin, catalogo, pedidos e imagenes
- RPC `crear_pedido_con_items` para cierre de pedidos con stock seguro
- RPC `eliminar_producto_admin` para eliminacion logica de productos
- RPC `actualizar_producto_admin` para modificar productos
- RPC `marcar_pedido_entregado_admin` para actualizar entregas de pedidos
- columnas de pedido: `estado`, `medio_pago`, `pago_estado`, `total`
- subtotal por item guardado en `pedido_items.subtotal`
- multiples imagenes por producto en `productos.imagenes_url`
- colores y modelos opcionales en `productos.colores` y `productos.modelos`
- color/modelo elegido en `pedido_items.color` y `pedido_items.modelo`
- snapshot de producto comprado en `pedido_items.producto_nombre`, `producto_categoria`, `producto_imagen_url`
