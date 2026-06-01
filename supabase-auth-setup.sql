-- Ejecutar en Supabase SQL Editor despues de crear las tablas base.

alter table public.usuarios enable row level security;
alter table public.usuario_roles enable row level security;
alter table public.roles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, whatsapp, dni, activo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', 'Usuario'),
    nullif(new.raw_user_meta_data ->> 'whatsapp', ''),
    nullif(new.raw_user_meta_data ->> 'dni', ''),
    true
  )
  on conflict (id) do update
  set
    nombre = excluded.nombre,
    whatsapp = excluded.whatsapp,
    dni = excluded.dni,
    activo = excluded.activo;

  insert into public.usuario_roles (usuario_id, rol_id, activo)
  select new.id, roles.id, true
  from public.roles
  where roles.nombre = 'cliente'
  on conflict (usuario_id, rol_id) do update
  set activo = true;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "usuarios pueden ver su perfil" on public.usuarios;
create policy "usuarios pueden ver su perfil"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "usuarios pueden actualizar su perfil" on public.usuarios;
create policy "usuarios pueden actualizar su perfil"
on public.usuarios
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "usuarios pueden insertar su perfil" on public.usuarios;
create policy "usuarios pueden insertar su perfil"
on public.usuarios
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "usuarios pueden ver sus roles" on public.usuario_roles;
create policy "usuarios pueden ver sus roles"
on public.usuario_roles
for select
to authenticated
using (auth.uid() = usuario_id);

drop policy if exists "usuarios autenticados pueden ver roles" on public.roles;
create policy "usuarios autenticados pueden ver roles"
on public.roles
for select
to authenticated
using (true);

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
