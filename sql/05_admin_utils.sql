-- Accesorios Margarita - Utilidades admin
-- Ejecutar solo cuando necesites asignar o revisar roles manualmente.

-- Asignar rol admin a un usuario existente por DNI.
-- Cambiar el DNI antes de ejecutar.
insert into public.usuario_roles (usuario_id, rol_id, activo)
select usuarios.id, roles.id, true
from public.usuarios
join public.roles on roles.nombre = 'admin'
where usuarios.dni = '41391521'
on conflict (usuario_id, rol_id) do update
set activo = true;

-- Quitar rol cliente a un admin si queres que solo quede como gestion.
-- Cambiar el DNI antes de ejecutar si corresponde.
update public.usuario_roles
set activo = false
from public.usuarios, public.roles
where usuario_roles.usuario_id = usuarios.id
  and usuario_roles.rol_id = roles.id
  and usuarios.dni = '41391521'
  and roles.nombre = 'cliente';

-- Reactivar rol cliente a un usuario por DNI.
-- Cambiar el DNI antes de ejecutar si corresponde.
insert into public.usuario_roles (usuario_id, rol_id, activo)
select usuarios.id, roles.id, true
from public.usuarios
join public.roles on roles.nombre = 'cliente'
where usuarios.dni = '41391521'
on conflict (usuario_id, rol_id) do update
set activo = true;
