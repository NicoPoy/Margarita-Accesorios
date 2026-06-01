-- Accesorios Margarita - Categorias base
-- Ejecutar en Supabase SQL Editor si el selector de categorias aparece vacio.

insert into public.categorias (nombre, activo)
values
  ('Accesorios', true),
  ('Anillos', true),
  ('Aros', true),
  ('Belleza', true),
  ('Collares', true),
  ('Hebillas', true),
  ('Pulseras', true)
on conflict (nombre) do update
set activo = excluded.activo;

notify pgrst, 'reload schema';
