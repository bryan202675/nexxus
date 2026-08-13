# Cómo arrancar Nexxus (guía rápida)

Monorepo con Turborepo. Dos apps que corren en desarrollo:

| Pieza | Qué es | Puerto |
|---|---|---|
| **`apps/dashboard`** | Dashboard — panel de Super Admin y de Admin de empresa | 3000 |
| **`apps/mobile`** | App móvil (Expo) — landing + app de empleados | 8081 |

Las dos usan la **misma base de datos real** (Supabase, proyecto `sehmquyehjboznvwztqh`), no hay datos de prueba separados. La lógica de servidor (login, creación de usuarios, stats de super admin, IA, etc.) vive en Supabase Edge Functions, ya desplegadas — no hace falta correr nada localmente para ellas.

## 1. Un solo comando

Desde la carpeta raíz del proyecto (`nexxus1.1/`):

```bash
npm run dev
```

Esto corre `turbo run dev`, que levanta las dos apps juntas con caché de Turborepo. Para parar todo: `Ctrl+C` una vez.

La primera vez, instala todo con un solo comando (workspaces de npm resuelven ambas apps):

```bash
npm install
```

## 2. Si algo falla y quieres arrancar solo una pieza

```bash
npm run dev --workspace=dashboard   # solo el dashboard web (localhost:3000)
npm run dev --workspace=mobile      # solo Expo (app móvil)
```

## 3. Requisitos antes de la primera vez

- Node instalado (cualquier versión reciente sirve).
- Los archivos `.env.local` (`apps/dashboard`) y `.env` (`apps/mobile`) ya traen las credenciales públicas de Supabase (`SUPABASE_URL` / `SUPABASE_ANON_KEY`) necesarias para desarrollo.

## 4. Probar el login desde el celular / Expo Go

La app habla directo con Supabase (mismo backend que la web), así que no depende de la IP de tu red local ni de ningún emulador. Solo necesitas conexión a internet en el celular.

## 5. Cambios en el esquema o en las políticas de seguridad (RLS)

Las reglas de acceso viven como políticas RLS de Postgres en `supabase/migrations/`, no como un archivo de reglas separado. Para aplicar una migración nueva:

```bash
# vía MCP de Supabase (recomendado, aplica directo al proyecto remoto)
# o localmente con la CLI de Supabase si tienes el stack local levantado
```

Después de cambiar políticas, revisa que no haya huecos de seguridad con el chequeo de advisors de Supabase (`get_advisors` vía MCP, o desde el Dashboard de Supabase → Database → Advisors).

## 6. Probar todo en un solo origen (como en producción)

Para casos raros donde algo depende de que la app y el dashboard compartan sesión de navegador (SSO), existe:

```bash
bash scripts/serve-same-origin.sh
```

Esto compila ambas apps y las sirve juntas en `http://localhost:5000`, igual que en producción (ver `vercel.json`). Es más lento que `npm run dev` (compila en vez de recargar en caliente), úsalo solo para verificar ese caso específico.

## 7. Subir cambios reales a producción

El hosting está en Vercel. Un push a la rama conectada dispara el deploy automáticamente (ver `vercel.json` en la raíz del repo), o manualmente:

```bash
npx vercel deploy --prod
```

Los Edge Functions de Supabase se despliegan por separado, vía el MCP de Supabase o la CLI (`supabase functions deploy <nombre>`).
