-- Accesorios Margarita - Setup completo Supabase
-- Podes ejecutar este archivo completo en Supabase SQL Editor.
-- Si preferis hacerlo por partes, ejecuta:
-- 01_schema.sql -> 02_seed_data.sql -> 03_auth_storage_rls.sql

create table if not exists public.roles (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  whatsapp text,
  dni text unique,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usuario_roles (
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  rol_id bigint not null references public.roles(id) on delete cascade,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (usuario_id, rol_id)
);

create table if not exists public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.productos (
  id bigint generated always as identity primary key,
  nombre text not null,
  categoria text not null,
  categoria_id bigint references public.categorias(id),
  precio numeric(12, 2) not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  imagen_url text,
  imagen_path text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.usuarios(id),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'cancelado', 'entregado')),
  medio_pago text,
  pago_estado text not null default 'pendiente',
  total numeric(12, 2) not null default 0 check (total >= 0),
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos(id) on delete cascade,
  producto_id bigint not null references public.productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal numeric(12, 2) generated always as (cantidad * precio_unitario) stored,
  created_at timestamptz not null default now()
);

alter table public.productos add column if not exists categoria_id bigint references public.categorias(id);
alter table public.productos add column if not exists imagen_path text;
alter table public.pedidos add column if not exists total numeric(12, 2) not null default 0 check (total >= 0);
alter table public.pedidos add column if not exists estado text not null default 'pendiente';
alter table public.pedidos add column if not exists medio_pago text;
alter table public.pedidos add column if not exists pago_estado text not null default 'pendiente';

create index if not exists idx_productos_categoria_id on public.productos(categoria_id);
create index if not exists idx_productos_activo_stock on public.productos(activo, stock);
create index if not exists idx_pedidos_usuario_id on public.pedidos(usuario_id);
create index if not exists idx_pedido_items_pedido_id on public.pedido_items(pedido_id);
create index if not exists idx_usuario_roles_usuario_id on public.usuario_roles(usuario_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_usuarios_updated_at on public.usuarios;
create trigger set_usuarios_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

drop trigger if exists set_categorias_updated_at on public.categorias;
create trigger set_categorias_updated_at
before update on public.categorias
for each row execute function public.set_updated_at();

drop trigger if exists set_productos_updated_at on public.productos;
create trigger set_productos_updated_at
before update on public.productos
for each row execute function public.set_updated_at();

drop trigger if exists set_pedidos_updated_at on public.pedidos;
create trigger set_pedidos_updated_at
before update on public.pedidos
for each row execute function public.set_updated_at();

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
on public.usuarios for select to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "usuarios pueden actualizar su perfil" on public.usuarios;
create policy "usuarios pueden actualizar su perfil"
on public.usuarios for update to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "usuarios pueden insertar su perfil" on public.usuarios;
create policy "usuarios pueden insertar su perfil"
on public.usuarios for insert to authenticated
with check (auth.uid() = id or public.is_admin());

drop policy if exists "usuarios pueden ver sus roles" on public.usuario_roles;
create policy "usuarios pueden ver sus roles"
on public.usuario_roles for select to authenticated
using (auth.uid() = usuario_id or public.is_admin());

drop policy if exists "admins gestionan usuario roles" on public.usuario_roles;
create policy "admins gestionan usuario roles"
on public.usuario_roles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "usuarios autenticados pueden ver roles" on public.roles;
create policy "usuarios autenticados pueden ver roles"
on public.roles for select to authenticated
using (true);

drop policy if exists "admins gestionan roles" on public.roles;
create policy "admins gestionan roles"
on public.roles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "todos pueden ver categorias activas" on public.categorias;
create policy "todos pueden ver categorias activas"
on public.categorias for select to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "admins gestionan categorias" on public.categorias;
create policy "admins gestionan categorias"
on public.categorias for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "todos pueden ver productos activos" on public.productos;
create policy "todos pueden ver productos activos"
on public.productos for select to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "admins pueden crear productos" on public.productos;
create policy "admins pueden crear productos"
on public.productos for insert to authenticated
with check (public.is_admin());

drop policy if exists "admins pueden actualizar productos" on public.productos;
create policy "admins pueden actualizar productos"
on public.productos for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins pueden eliminar productos" on public.productos;
create policy "admins pueden eliminar productos"
on public.productos for delete to authenticated
using (public.is_admin());

drop policy if exists "usuarios ven sus pedidos" on public.pedidos;
create policy "usuarios ven sus pedidos"
on public.pedidos for select to authenticated
using (auth.uid() = usuario_id or public.is_admin());

drop policy if exists "clientes crean sus pedidos" on public.pedidos;
create policy "clientes crean sus pedidos"
on public.pedidos for insert to authenticated
with check (auth.uid() = usuario_id);

drop policy if exists "admins actualizan pedidos" on public.pedidos;
create policy "admins actualizan pedidos"
on public.pedidos for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "usuarios ven items de sus pedidos" on public.pedido_items;
create policy "usuarios ven items de sus pedidos"
on public.pedido_items for select to authenticated
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
on public.pedido_items for insert to authenticated
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
on public.pedido_items for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "todos pueden ver imagenes de productos" on storage.objects;
create policy "todos pueden ver imagenes de productos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "admins pueden subir imagenes de productos" on storage.objects;
create policy "admins pueden subir imagenes de productos"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins pueden actualizar imagenes de productos" on storage.objects;
create policy "admins pueden actualizar imagenes de productos"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins pueden eliminar imagenes de productos" on storage.objects;
create policy "admins pueden eliminar imagenes de productos"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());

create or replace function public.crear_pedido_con_items(
  p_items jsonb,
  p_medio_pago text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_pedido_id bigint;
  v_total numeric(12, 2) := 0;
  v_item jsonb;
  v_producto record;
  v_cantidad integer;
begin
  if v_usuario_id is null then
    raise exception 'Tenes que iniciar sesion para finalizar el pedido.';
  end if;

  if p_medio_pago not in ('efectivo', 'transferencia') then
    raise exception 'Medio de pago no valido para cierre directo.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos.';
  end if;

  insert into public.pedidos (usuario_id, estado, medio_pago, pago_estado, total)
  values (
    v_usuario_id,
    'pendiente',
    p_medio_pago,
    case when p_medio_pago = 'efectivo' then 'pendiente' else 'comprobante_pendiente' end,
    0
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_cantidad := (v_item ->> 'cantidad')::integer;

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad invalida.';
    end if;

    select id, nombre, precio, stock
    into v_producto
    from public.productos
    where id = (v_item ->> 'producto_id')::bigint
      and activo = true
    for update;

    if not found then
      raise exception 'Producto no encontrado.';
    end if;

    if v_producto.stock < v_cantidad then
      raise exception 'No hay stock suficiente para %.', v_producto.nombre;
    end if;

    update public.productos
    set stock = stock - v_cantidad
    where id = v_producto.id;

    insert into public.pedido_items (
      pedido_id,
      producto_id,
      cantidad,
      precio_unitario
    )
    values (
      v_pedido_id,
      v_producto.id,
      v_cantidad,
      v_producto.precio
    );

    v_total := v_total + (v_producto.precio * v_cantidad);
  end loop;

  update public.pedidos
  set total = v_total
  where id = v_pedido_id;

  return jsonb_build_object(
    'pedido_id', v_pedido_id,
    'total', v_total,
    'medio_pago', p_medio_pago
  );
exception
  when others then
    if v_pedido_id is not null then
      delete from public.pedidos where id = v_pedido_id;
    end if;

    raise;
end;
$$;

grant execute on function public.crear_pedido_con_items(jsonb, text) to authenticated;

create or replace function public.eliminar_producto_admin(p_producto_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede eliminar productos.';
  end if;

  update public.productos
  set activo = false
  where id = p_producto_id;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;
end;
$$;

grant execute on function public.eliminar_producto_admin(bigint) to authenticated;

create or replace function public.actualizar_producto_admin(
  p_producto_id bigint,
  p_nombre text,
  p_categoria_id bigint,
  p_categoria text,
  p_precio numeric,
  p_stock integer,
  p_imagen_url text,
  p_imagen_path text
)
returns public.productos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede modificar productos.';
  end if;

  if nullif(trim(p_nombre), '') is null then
    raise exception 'El nombre del producto es obligatorio.';
  end if;

  if p_precio is null or p_precio < 0 then
    raise exception 'El precio no puede ser negativo.';
  end if;

  if p_stock is null or p_stock < 0 then
    raise exception 'El stock no puede ser negativo.';
  end if;

  if not exists (
    select 1
    from public.categorias
    where id = p_categoria_id
      and activo = true
  ) then
    raise exception 'Categoria no valida.';
  end if;

  update public.productos
  set
    nombre = trim(p_nombre),
    categoria_id = p_categoria_id,
    categoria = p_categoria,
    precio = p_precio,
    stock = p_stock,
    imagen_url = p_imagen_url,
    imagen_path = p_imagen_path
  where id = p_producto_id
    and activo = true
  returning * into v_producto;

  if not found then
    raise exception 'Producto no encontrado.';
  end if;

  return v_producto;
end;
$$;

grant execute on function public.actualizar_producto_admin(
  bigint,
  text,
  bigint,
  text,
  numeric,
  integer,
  text,
  text
) to authenticated;

create or replace function public.marcar_pedido_entregado_admin(p_pedido_id bigint)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido public.pedidos;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede marcar pedidos como entregados.';
  end if;

  update public.pedidos
  set
    estado = 'entregado',
    pago_estado = case
      when pago_estado = 'pendiente' then 'pendiente'
      else pago_estado
    end
  where id = p_pedido_id
  returning * into v_pedido;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  return v_pedido;
end;
$$;

grant execute on function public.marcar_pedido_entregado_admin(bigint) to authenticated;

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
