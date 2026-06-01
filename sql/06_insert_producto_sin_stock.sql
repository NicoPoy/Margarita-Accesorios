-- Accesorios Margarita - Insertar producto sin stock
-- Antes de ejecutar:
-- 1. Subi la imagen al bucket Storage `product-images`.
-- 2. Copia la URL publica de la imagen.
-- 3. Reemplaza el valor de `imagen_url` abajo.

with categoria_anillos as (
  insert into public.categorias (nombre, activo)
  values ('Anillos', true)
  on conflict (nombre) do update
  set activo = true
  returning id, nombre
)
insert into public.productos (
  nombre,
  categoria,
  categoria_id,
  precio,
  stock,
  imagen_url,
  imagen_path,
  activo
)
select
  'Anillos dorados',
  categoria_anillos.nombre,
  categoria_anillos.id,
  1500,
  0,
  'PEGAR_URL_PUBLICA_DE_LA_IMAGEN',
  null,
  true
from categoria_anillos;
