# Deploy en Vercel

## Configuracion del proyecto

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

El archivo `vercel.json` ya deja configurado el build y el fallback a `index.html`.

## Variables de entorno

Agregar en Vercel, dentro de Project Settings > Environment Variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_public
VITE_MERCADO_PAGO_PAYMENT_LINK=https://link.mercadopago.com.ar/tu-link-de-pago
```

## Supabase

Antes de usar la app online, ejecutar en Supabase SQL Editor:

1. `sql/00_ejecutar_todo.sql`

O por partes:

1. `sql/01_schema.sql`
2. `sql/02_seed_data.sql`
3. `sql/03_auth_storage_rls.sql`
4. `sql/07_checkout_rpc.sql`

## Mercado Pago

`VITE_MERCADO_PAGO_PAYMENT_LINK` es un link fijo temporal.

Para generar links dinamicos por pedido hace falta backend, porque Mercado Pago Checkout Pro usa un access token privado. Ese token no debe ir en React ni en variables `VITE_`.
