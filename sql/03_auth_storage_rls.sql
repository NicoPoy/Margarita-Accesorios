-- Accesorios Margarita - Auth, Storage y permisos RLS
-- Ejecutar despues de 01_schema.sql y 02_seed_data.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.usuarios enable row level security;
alter table public.usuario_roles enable row level security;
alter table public.roles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuario_roles
    join public.roles on roles.id = usuario_roles.rol_id
    where usuario_roles.usuario_id = auth.uid()
      and usuario_roles.activo = true
      and roles.nombre = 'admin'
  );
$$;

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
using (auth.uid() = id or public.is_admin());

drop policy if exists "usuarios pueden actualizar su perfil" on public.usuarios;
create policy "usuarios pueden actualizar su perfil"
on public.usuarios
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "usuarios pueden insertar su perfil" on public.usuarios;
create policy "usuarios pueden insertar su perfil"
on public.usuarios
for insert
to authenticated
with check (auth.uid() = id or public.is_admin());

drop policy if exists "usuarios pueden ver sus roles" on public.usuario_roles;
create policy "usuarios pueden ver sus roles"
on public.usuario_roles
for select
to authenticated
using (auth.uid() = usuario_id or public.is_admin());

drop policy if exists "admins gestionan usuario roles" on public.usuario_roles;
create policy "admins gestionan usuario roles"
on public.usuario_roles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "usuarios autenticados pueden ver roles" on public.roles;
create policy "usuarios autenticados pueden ver roles"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "admins gestionan roles" on public.roles;
create policy "admins gestionan roles"
on public.roles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "todos pueden ver categorias activas" on public.categorias;
create policy "todos pueden ver categorias activas"
on public.categorias
for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "admins gestionan categorias" on public.categorias;
create policy "admins gestionan categorias"
on public.categorias
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "todos pueden ver productos activos" on public.productos;
create policy "todos pueden ver productos activos"
on public.productos
for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "admins pueden crear productos" on public.productos;
create policy "admins pueden crear productos"
on public.productos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins pueden actualizar productos" on public.productos;
create policy "admins pueden actualizar productos"
on public.productos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins pueden eliminar productos" on public.productos;
create policy "admins pueden eliminar productos"
on public.productos
for delete
to authenticated
using (public.is_admin());

drop policy if exists "usuarios ven sus pedidos" on public.pedidos;
create policy "usuarios ven sus pedidos"
on public.pedidos
for select
to authenticated
using (auth.uid() = usuario_id or public.is_admin());

drop policy if exists "clientes crean sus pedidos" on public.pedidos;
create policy "clientes crean sus pedidos"
on public.pedidos
for insert
to authenticated
with check (auth.uid() = usuario_id);

drop policy if exists "admins actualizan pedidos" on public.pedidos;
create policy "admins actualizan pedidos"
on public.pedidos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "usuarios ven items de sus pedidos" on public.pedido_items;
create policy "usuarios ven items de sus pedidos"
on public.pedido_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.pedidos
    where pedidos.id = pedido_items.pedido_id
      and pedidos.usuario_id = auth.uid()
  )
);

drop policy if exists "clientes crean items de sus pedidos" on public.pedido_items;
create policy "clientes crean items de sus pedidos"
on public.pedido_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pedidos
    where pedidos.id = pedido_items.pedido_id
      and pedidos.usuario_id = auth.uid()
  )
);

drop policy if exists "admins gestionan items de pedidos" on public.pedido_items;
create policy "admins gestionan items de pedidos"
on public.pedido_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "todos pueden ver imagenes de productos" on storage.objects;
create policy "todos pueden ver imagenes de productos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "admins pueden subir imagenes de productos" on storage.objects;
create policy "admins pueden subir imagenes de productos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins pueden actualizar imagenes de productos" on storage.objects;
create policy "admins pueden actualizar imagenes de productos"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins pueden eliminar imagenes de productos" on storage.objects;
create policy "admins pueden eliminar imagenes de productos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
