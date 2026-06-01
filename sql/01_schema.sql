-- Accesorios Margarita - Modelo base
-- Ejecutar primero en Supabase SQL Editor.

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
