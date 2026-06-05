# Accesorios Margarita

Tienda online hecha con React, Vite y Supabase. Incluye catalogo de productos, carrito, registro de clientes, checkout, panel de administracion, stock por variedades, pedidos y carga de imagenes en Supabase Storage.

## Requisitos

- Node.js 18 o superior
- npm
- Un proyecto de Supabase

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env.local` en la raiz del proyecto. Podes copiar la base desde `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_public
VITE_MERCADO_PAGO_PAYMENT_LINK=https://link.mercadopago.com.ar/tu-link-de-pago
```

Notas:

- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` salen de Supabase, en Project Settings > API.
- `VITE_MERCADO_PAGO_PAYMENT_LINK` es opcional si todavia no se usa Mercado Pago.
- No subir `.env.local` al repositorio.

## Base de datos en Supabase

Antes de levantar la app con datos reales, ejecutar los scripts SQL en Supabase SQL Editor.

Opcion rapida:

```sql
-- Ejecutar el contenido de:
sql/00_ejecutar_todo.sql
```

Opcion por partes:

1. `sql/01_schema.sql`
2. `sql/02_seed_data.sql`
3. `sql/03_auth_storage_rls.sql`
4. `sql/07_checkout_rpc.sql`

Si la base ya existe o faltan funciones nuevas, revisar `sql/README.md`, donde estan listadas las migraciones posteriores.

## Levantar en desarrollo

```bash
npm run dev
```

Vite va a mostrar una URL local, normalmente:

```text
http://localhost:5173
```

Abrir esa URL en el navegador.

## Build de produccion

Para verificar que el proyecto compile:

```bash
npm run build
```

Para previsualizar el build local:

```bash
npm run preview
```

## App Android

El proyecto esta preparado con Capacitor para generar una app Android sin cambiar la version web.

Requisitos extra para Android:

- Android Studio
- Android SDK instalado
- JDK 17 o superior para compilar con Gradle

Primera vez:

```bash
npm run android:add
```

Cada vez que quieras actualizar la app Android con la ultima version web:

```bash
npm run android:sync
```

Para abrir el proyecto nativo en Android Studio:

```bash
npm run android:open
```

Para generar un APK debug:

```bash
npm run android:build:debug
```

Android usa el build generado en `dist`, por eso `android:sync` ejecuta primero `npm run build`.

## Deploy

El proyecto esta preparado para Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Tambien hay una guia especifica en `DEPLOY.md`.

## Estructura principal

```text
src/
  components/   Componentes de catalogo, carrito, checkout, auth y admin
  data/         Datos base y placeholders
  lib/          Cliente de Supabase
  utils/        Helpers de CSV, contacto, formatos e imagenes
sql/            Scripts y migraciones para Supabase
public/         Imagenes y assets publicos
```

## Comandos utiles

```bash
npm run dev      # Levanta la app en modo desarrollo
npm run build    # Genera el build de produccion
npm run preview  # Sirve localmente el build generado
npm run android:sync  # Compila la web y sincroniza Android
npm run android:open  # Abre el proyecto Android en Android Studio
npm run android:build:debug  # Genera un APK debug
```
