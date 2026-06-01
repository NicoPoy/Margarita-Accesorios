-- Accesorios Margarita - Marcar pedidos como entregados para admin
-- Ejecutar en Supabase SQL Editor.

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
