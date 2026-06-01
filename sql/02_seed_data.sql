-- Accesorios Margarita - Datos iniciales
-- Ejecutar despues de 01_schema.sql.

insert into public.roles (nombre)
values
  ('admin'),
  ('cliente')
on conflict (nombre) do nothing;

insert into public.categorias (nombre, activo)
values
  ('Accesorios', true),
  ('Anillos', true),
  ('Aros', true),
  ('Belleza', true),
  ('Hebillas', true),
  ('Pulseras', true)
on conflict (nombre) do update
set activo = excluded.activo;

update public.productos
set categoria_id = categorias.id
from public.categorias
where public.productos.categoria_id is null
  and lower(public.productos.categoria) = lower(categorias.nombre);

-- Opcional: asigna rol cliente a usuarios existentes que todavia no tengan ningun rol.
insert into public.usuario_roles (usuario_id, rol_id, activo)
select usuarios.id, roles.id, true
from public.usuarios
cross join public.roles
where roles.nombre = 'cliente'
  and not exists (
    select 1
    from public.usuario_roles
    where usuario_roles.usuario_id = usuarios.id
  )
on conflict (usuario_id, rol_id) do nothing;
