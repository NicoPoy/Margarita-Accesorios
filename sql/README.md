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
