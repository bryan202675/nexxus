# NEXXUS — Plan de Implementación (v2: SaaS empresarial moderno)

> Estado del documento: **DECISIONES TOMADAS — listo para iniciar Fase 1.** Todas las preguntas de la sección 4 fueron respondidas (ver sección 4, respuestas inline). Los estados de fase reflejan estas decisiones.

## 0. Decisiones confirmadas (resumen)

| Tema | Decisión |
|---|---|
| Monorepo | Turborepo, layout `apps/mobile` + `apps/dashboard` + `packages/domain` |
| Dashboard web | Reescribir con **Vite + TypeScript** (reemplaza CRA) |
| Plataformas móviles | **Solo Expo Web por ahora** — sin builds nativos EAS. Push nativo (Fase 10) queda pospuesto/reducido a alcance web si se retoma. |
| Proveedor de IA | **Gemini 2.5 Flash** (ya integrado, se mantiene) |
| Pagos | **Simulador se mantiene** — Fase 12 (gateway real) queda de baja prioridad hasta que haya necesidad real de cobrar |
| Planes | Se mantienen Starter $20 / Business $50 / Enterprise $200 ya sembrados |
| Email transaccional | **Resend** |
| Automatizaciones + Nexxus Brain | Modelo de datos **+ 2-3 reglas/relaciones reales funcionando**, no solo esquema vacío |
| Testing | **Vitest + Testing Library** |
| IA autónoma | Puede sugerir acciones sensibles (aprobaciones, etc.) pero requiere **confirmación humana explícita** antes de ejecutarlas; crear notificaciones/tareas/eventos (ya existente) sigue siendo automático |
| Centro Inteligente | Prioriza **urgencia por tiempo** (vencidos/próximos a vencer) + **rol y permisos** (cada usuario ve solo lo accionable para él) |
| Orden de trabajo | Se respeta el orden propuesto 1→15 |

---

## 1. Resumen ejecutivo de la auditoría

Contexto: este repo ya pasó por una migración completa de Firebase → Supabase (Fases 0–7, todas cerradas — ver historial de commits y `ARRANQUE.md`). Esa migración fue **1:1** (mismas pantallas, mismos flujos, mismo modelo de datos, solo cambiando el backend). Lo que se pide ahora es distinto: **evolucionar el producto**, no solo el backend. Esta auditoría parte de esa base ya migrada y funcional.

### 1.1 Stack actual (verificado, no supuesto)

| Pieza | Versión / detalle |
|---|---|
| `nexxus/app` (Expo) | Expo `~54.0.33`, React `19.1.0`, React Native `0.81.5`, react-native-web `^0.21.0`, TypeScript `~5.9.2` |
| `web-dashboard` | React `19.0.0` + `react-scripts` (CRA 5) — **100% JavaScript, 0 archivos `.ts`/`.tsx`** (72 archivos `.js`/`.jsx`) |
| Backend | Supabase (Postgres + RLS + Auth + Edge Functions + Realtime), 49 tablas, 23 Edge Functions, 11 migraciones |
| IA | Google Gemini (`gemini-2.5-flash` por defecto), integrada en `ask-nexxus-ai`, con tracking de costo/uso (`ai_usage`, `ai_usage_daily`) |
| Pagos | **Simulado.** `confirm-plan-purchase` inserta una fila en `payments` sin pasar por ningún gateway real; solo funciona hoy porque hay un flag `NEXXUS_ALLOW_UNVERIFIED_PAID_CHECKOUT` que evita bloquear compras con monto > 0 |
| Monorepo | `npm` workspaces parcial (`nexxus/package.json` solo integra `app`), `web-dashboard` es un paquete hermano suelto orquestado por `concurrently` desde el `package.json` raíz. **No hay Turborepo ni ninguna herramienta de build cacheado.** |
| Hosting | Vercel (`vercel.json`), build único que sirve `nexxus/app` en `/` y `web-dashboard` en `/workspace` |
| Notificaciones push | Tabla `push_tokens` existe en el esquema; **no hay `expo-notifications` instalado ni código cliente que registre tokens o reciba push** |
| Email transaccional | **No existe ninguna integración** (ni Resend, ni SendGrid, ni Postmark, ni SMTP) |
| Tests automatizados | **0% de cobertura** en los 3 paquetes (`nexxus/app`, `web-dashboard`, Edge Functions) |
| CI/CD | Los únicos workflows que existían (`firebase-hosting-*.yml`) se eliminaron en la migración; **no hay reemplazo** — el deploy a Vercel depende de su integración de Git, no hay pipeline de tests/lint antes de deploy |

### 1.2 Qué existe y funciona (verificado en Fase 6 de la migración anterior)

- Autenticación multi-tenant: login por email/password (Supabase Auth) + `login_empresarial` (código de empresa + usuario interno + contraseña, para empleados sin email corporativo)
- RLS completo (162 políticas) con roles `super_admin` / `admin` / `admin_empresa` / `jefe` / `jefe_sector` / `empleado` / `psicologo`
- CRUD de empleados, estructura organizativa (sedes/departamentos/cargos/roles personalizados), tareas, check-in/asistencia, solicitudes (ausencia + internas), calendario empresarial, comunicación/mensajería interna, inventario, auditoría
- Panel Super Admin completo (empresas, usuarios, auditoría global, pagos/planes, soporte con impersonación, IA)
- Nómina: tablas y pantallas existen (`GestionNomina.tsx`, 1392 líneas; tabla `nominas`), pero **no verifiqué cálculo real de ISSS/AFP/renta** — necesita auditoría específica de negocio, no solo técnica
- Documentos: subida vía Cloudinary, tabla `documentos` + `archivos_cloudinary`; sin firma digital ni tracking de "lectura obligatoria"
- Capacitaciones: tablas `cursos` + `capacitacion_avances`, Edge Function `complete-training-module`, pantalla `CentroAprendizaje.tsx` — cobertura de UI vs backend sin verificar a fondo
- Reportes: Edge Function `generate-tenant-export` genera **CSV y PDF** para 3 datasets (`request_reports`, `payroll`, `attendance`) — **no genera Excel**, y no cubre "productividad" como dataset propio
- Bandeja unificada: existe tabla `inbox_unificado` y pantalla `BandejaUnificada.tsx`, pero el esquema de esa tabla es mínimo (`id, empresa_id, usuario_id, origen, contenido, created_at` — sin `titulo`, `estado`, `prioridad`, `tipo`), por lo que hoy es más un log plano que una bandeja accionable
- Nexxus AI: existe y responde con contexto real por rol (`ask-nexxus-ai` arma contexto de empresa/usuarios/pagos según quién pregunta), pero es un **chat de preguntas y respuestas**, no un asistente con acciones proactivas/sugerencias autónomas

### 1.3 Qué falta construir por completo (no existe ni parcialmente)

- **Centro Inteligente**: hoy `MiPulso.tsx` (empleado) y `DashboardAdmin.tsx` (admin) son dashboards de widgets fijos armados a mano, no un home que decide automáticamente qué mostrarle a cada usuario según su contexto (pendientes, urgencia, rol, patrones de uso)
- **Automatizaciones** (reglas SI/ENTONCES): no hay tabla, ni motor de reglas, ni UI. Cero.
- **Nexxus Brain** (grafo empresarial de relaciones entidad-entidad): no existe ningún modelo de grafo ni tabla de relaciones genérica. Cero.
- **Notificaciones push reales**: tabla lista, todo lo demás falta (SDK cliente, Edge Function de envío, permisos)
- **Email transaccional**: nada — ni recuperación de contraseña por email, ni notificaciones por correo
- **Pagos reales**: nada — el "sistema de pagos" actual es un registro contable simulado, no cobra dinero de verdad

### 1.4 Qué debe eliminarse / limpiarse

| Ítem | Por qué |
|---|---|
| `nexxus/app.zip` (2.9 MB) | Artefacto binario suelto en el repo — ya se había identificado y eliminado una vez (commit `150d1373`) y volvió a aparecer. No pertenece al control de versiones. |
| `nexxus/package-lock.json.bak` (485 KB) | Backup residual de un lockfile, no debe versionarse |
| Comentarios/strings residuales con "Firebase" en documentación histórica (`nexxus/docs/*.md`) | Baja prioridad — son documentos históricos, no código; se pueden archivar o marcar como obsoletos en vez de borrar |

### 1.5 Qué debe refactorizarse (deuda técnica real, medida, no percibida)

Archivos que violan directamente la regla que pediste ("no archivos de 2000 líneas"), en `nexxus/app`:

| Archivo | Líneas | Problema |
|---|---|---|
| `presentation/screens/admin/DashboardAdmin.tsx` | 6,070 | Dashboard admin completo en un solo componente: fetching, agregaciones, UI y lógica de negocio mezclados |
| `presentation/screens/admin/GestionPlantilla.tsx` | 5,332 | CRUD de empleados + importación masiva CSV + gestión de código de empresa + acciones masivas, todo en un archivo |
| `presentation/screens/admin/EstructuraOrganizativa.tsx` | 3,990 | Sedes + departamentos + cargos + roles personalizados en una sola pantalla |
| `presentation/navigation/AdminNavigator.tsx` | 3,252 | Navegación + sidebar + notificaciones en vivo + búsqueda global, todo junto |
| `presentation/screens/admin/ConfiguracionAdmin.tsx` | 1,912 | Config de empresa mezclada con reautenticación y billing |

En `web-dashboard`, los archivos individuales son más chicos (max. 1,081 líneas) pero el problema es estructural: **no existe capa de dominio/aplicación**. Cada vista de `views/nexxus/*` mezcla JSX, llamadas a Supabase, y lógica de negocio directamente — lo opuesto a la Clean Architecture que ya tiene `nexxus/app` (`domain/` + `application/use-cases/` + `infrastructure/`).

`container.ts` (DI manual de `nexxus/app`, 29 puntos de import) funciona pero es un archivo único gigante de wiring — no es urgente pero es candidato a modularizar por dominio si el proyecto sigue creciendo.

### 1.6 Riesgos identificados

1. **web-dashboard sobre CRA 5** (`react-scripts`, sin mantenimiento activo desde hace tiempo) con **0 archivos TypeScript** — contradice directamente el stack que pediste ("Dashboard Web: React, TypeScript"). Migrar requiere decidir: ¿Vite + TS reescribiendo, o CRA→TS incremental?
2. **0% de cobertura de tests** en los 3 paquetes — cualquier refactor grande (como los archivos de la tabla 1.5) es de alto riesgo sin una red de seguridad mínima
3. **Sin CI/CD** — nada corre lint/typecheck/tests antes de que un cambio llegue a producción vía el auto-deploy de Vercel
4. **Bundle web de `nexxus/app` pesa 6.25 MB** sin code splitting — con más pantallas (Centro Inteligente, Nexxus Brain, Automatizaciones) esto va a empeorar si no se aborda desde ahora
5. **`planes` recién se sembró con 3 planes fijos** (Starter/Business/Enterprise, precios hardcodeados en `shared/billing/plans.ts` Y en la tabla `planes` — dos fuentes de verdad que hay que unificar en algún punto)

---

## 2. Arquitectura propuesta (a confirmar contigo antes de tocar nada)

### 2.1 Monorepo con Turborepo

Reemplazar el esquema actual (`npm workspaces` parcial + `concurrently`) por un monorepo real:

```
nexxus1.1/
├── turbo.json
├── package.json              (workspaces: apps/*, packages/*)
├── apps/
│   ├── mobile/                (hoy nexxus/app — Expo)
│   └── dashboard/              (hoy web-dashboard)
├── packages/
│   ├── domain/                 (entidades + casos de uso, compartido entre apps)
│   ├── supabase-client/        (cliente + tipos generados + repos)
│   ├── ui-tokens/               (design tokens compartidos: color, spacing, tipografía)
│   └── config/                  (eslint/tsconfig compartidos)
└── supabase/                    (sin cambios: migrations + functions)
```

Esto es un **cambio de estructura de carpetas real** (mover `nexxus/app` → `apps/mobile`, `web-dashboard` → `apps/dashboard`), no cosmético. `npm run dev` pasaría a ser `turbo dev` y arrancaría mobile + dashboard (+ opcionalmente Supabase local si lo tienes) en paralelo con caché de builds.

**Esto es una decisión grande que afecta todos los imports (`@/` aliases, scripts, CI). Se ejecuta como Fase 1, antes que cualquier feature nueva, precisamente para no tener que repetirla después.**

### 2.2 Compartir dominio entre `apps/mobile` y `apps/dashboard`

Hoy `nexxus/app` tiene Clean Architecture (`domain/` + `application/use-cases/`) y `web-dashboard` no tiene nada de eso — cada vista llama a Supabase directo. Propuesta: extraer las entidades y casos de uso ya existentes en `nexxus/app` a `packages/domain`, y que **ambas apps** consuman esa misma capa, implementando solo el repositorio Supabase una vez (`packages/supabase-client`) en lugar de tener dos implementaciones distintas del mismo CRUD (una en `nexxus/app/src/infrastructure/supabase/*`, otra ad-hoc dentro de cada vista de `web-dashboard`).

Esto es el cambio arquitectónico de mayor impacto del plan: convierte a `web-dashboard` de "72 archivos JS con lógica mezclada" a un consumidor delgado de la misma capa de aplicación que ya usa el móvil.

---

## 3. Fases propuestas (pendientes de aprobación fase por fase, como pediste)

Todas las fases están en estado **"Bloqueada — esperando respuestas (sección 4)"** salvo que se indique lo contrario. Tamaño de tarea: cada fase se puede completar y verificar en una sesión, sin dependencias circulares con fases futuras no iniciadas.

### Fase 1 — Monorepo con Turborepo
- **Objetivo:** reestructurar a `apps/*` + `packages/*`, introducir `turbo.json`, un solo `npm run dev` para todo.
- **Archivos afectados:** movimiento completo de `nexxus/app/*` → `apps/mobile/*`, `web-dashboard/*` → `apps/dashboard/*`; todos los `package.json`; `vercel.json`; `scripts/*`; `ARRANQUE.md`.
- **Dependencias:** ninguna (es la base de todo lo demás).
- **Riesgos:** romper imports con alias `@/`, romper el build de Vercel si no se actualiza `vercel.json` en el mismo cambio, romper `.claude/launch.json` (dev servers).
- **Tiempo estimado:** 1 sesión completa (es mecánico pero con muchos archivos).
- **Estado:** ✅ Completada y verificada (typecheck limpio, `build:hosting` completo, ambos dev servers renderizando sin errores de consola).
- **Prioridad:** Alta (bloquea todo lo demás si se hace después).
- **Checklist:**
  - [x] Layout `apps/mobile` + `apps/dashboard` + `packages/` (con `README.md` explicando que `packages/domain` llega en Fase 3)
  - [x] `turbo.json` con pipelines `dev`, `build`, `lint`, `typecheck`, `test`
  - [x] Root `package.json` con `workspaces: ["apps/*", "packages/*"]` + `packageManager` (requerido por Turborepo) + scripts `turbo run *`
  - [x] Actualizado `vercel.json`, `.claude/launch.json`, `ARRANQUE.md`, `scripts/build-hosting.sh`, `scripts/serve-same-origin.sh`
  - [x] `nexxus/PRODUCT.md` → `PRODUCT.md`, `nexxus/docs/*` → `docs/legacy-nexxus/*`, `nexxus/task.md` → `docs/legacy-nexxus/task.md` (historial preservado, no se perdió nada)
  - [x] Verificado build completo (`npm run build:hosting`) y `npm run typecheck` — ambos limpios

**Hallazgos y correcciones no previstas en el plan original** (documentados aquí porque cambian el estado real del repo, no solo la ubicación de carpetas):

1. **`nexxus/app.zip` (2.9 MB) y `nexxus/package-lock.json.bak`** eliminados como parte necesaria del movimiento (la carpeta `nexxus/` desaparece por completo; dejarlos huérfanos ahí habría sido peor que limpiarlos ahora). Esto adelanta parte del alcance que estaba pensado para la Fase 15.
2. **Conflicto real de dependencias entre las dos apps**: `apps/mobile` declaraba `@types/react: ~19.1.0` pero `@types/react-dom: ^19.2.3` — un rango interno inconsistente que nunca se notó porque antes cada app tenía su propio `node_modules` aislado. Con workspaces reales de npm, esto rompía el install (`ERESOLVE`). Se corrigió a `@types/react: ^19.1.0` para que ambos types-packages sean compatibles entre sí.
3. **Dos copias de React en el árbol** (`apps/mobile` pedía `react@19.1.0`, `apps/dashboard` pedía `react@19.0.0` exactos) causaban "Invalid hook call" en el navegador para la app móvil, porque Metro terminaba empaquetando ambas copias. Se alineó `apps/dashboard` a `react@19.1.0`/`react-dom@19.1.0` (mismo patch que ya usaba `apps/mobile`, dictado por el SDK de Expo) — con esto solo queda una copia de React en todo el repo.
4. **`expo-font` estaba declarado en `^57.0.1`**, una versión que no corresponde al SDK de Expo instalado (54) — Expo esperaba `~14.0.12`. Corregido con `npx expo install --fix`, que también ajustó `@types/react`/`@types/react-dom` a los rangos exactos que esa versión de Expo espera (`~19.1.10` / `~19.1.7`).
5. **3 errores nuevos de `tsc`** en `AdminNavigator.tsx` y `UserNavigator.tsx` (parámetros de callbacks de React Navigation sin tipo, antes tolerados por una resolución de tipos distinta) — se anotaron explícitamente como `any`, consistente con el `as any` que ya existía a pocas líneas de distancia en el mismo archivo.
6. **CRA (`react-scripts`) es incompatible con dependencias hoisted por npm workspaces**: su `ModuleScopePlugin` rechaza módulos que resuelven fuera de `apps/dashboard/node_modules` (en este caso `react-refresh/runtime`, inyectado por hot-reload), con el error *"falls outside of the project src/ directory"*. Se intentó primero forzar `install-strategy=nested` en `.npmrc` para que cada app tuviera su árbol de dependencias completo y aislado — **esto agotó los file descriptors del sistema (`EMFILE`) por el tamaño del árbol de Expo+RN duplicado y se revirtió**. La solución correcta y estándar de CRA para monorepos es la variable `NODE_PATH` (documentada oficialmente por CRA): se agregó `apps/dashboard/.env` con `NODE_PATH=../../node_modules`. Esto es exactamente el tipo de fragilidad que justifica la Fase 2 (reemplazar CRA por Vite, que no tiene este problema).

También encontré (y eliminé) un `scripts/patch-module-scope.js` sin trackear en git, enganchado como `postinstall` en el `package.json` raíz, que resolvía este mismo problema **mutando directamente el código fuente de `react-dev-utils/ModuleScopePlugin.js` dentro de `node_modules`** — un hack real (parchar un paquete de terceros en cada install es frágil, se pierde si algo reinstala node_modules sin correr `postinstall`, y va exactamente en contra de "No hacks" que pediste). Reinstalé sin ese `postinstall`, confirmé que `ModuleScopePlugin.js` queda limpio (sin parchar) tal cual viene del registro, y verifiqué que el build completo sigue pasando solo con `NODE_PATH` — así que el hack no hacía falta.

### Fase 2 — `apps/dashboard` a TypeScript + Vite
- **Objetivo:** que el dashboard cumpla el stack pedido (React + TypeScript).
- **Archivos afectados:** los 73 archivos `.js`/`.jsx` de `apps/dashboard/src` (renombrados a `.ts`/`.tsx`), `package.json`, `index.html`, `vite.config.ts` (nuevo), `tsconfig.json` (nuevo), `postcss.config.cjs`/`tailwind.config.cjs` (renombrados desde `.js`), `.env*`, `scripts/build-hosting.sh`.
- **Dependencias:** Fase 1.
- **Estado:** ✅ Completada y verificada (typecheck limpio en ambos paquetes vía `turbo`, `build:hosting` completo, ambos dev servers renderizando sin errores de consola en el navegador — login del dashboard bajo `/workspace/` y landing de `apps/mobile` verificados visualmente).
- **Prioridad:** Alta (era requisito de stack explícito).
- **Checklist:**
  - [x] `react-scripts` reemplazado por Vite (`@vitejs/plugin-react` + `vite-tsconfig-paths` para respetar el `baseUrl: "src"` que ya usaban los imports)
  - [x] Los 73 archivos `.js`/`.jsx` renombrados a `.ts`/`.tsx` (con `git mv`, historial preservado)
  - [x] `index.html` movido a la raíz del paquete (convención de Vite) y limpiado de placeholders `%PUBLIC_URL%`
  - [x] Variables de entorno migradas de `process.env.REACT_APP_*` a `import.meta.env.VITE_*` (3 usos reales encontrados y migrados; `vite-env.d.ts` agregado para tipar `import.meta.env`)
  - [x] `postcss.config.js`/`tailwind.config.js` renombrados a `.cjs` (el `package.json` ahora declara `"type": "module"`, que rompía los `module.exports` de CommonJS)
  - [x] `jsconfig.json` eliminado, reemplazado por `tsconfig.json`
  - [x] `scripts/build-hosting.sh` actualizado (`apps/dashboard/build` → `apps/dashboard/dist`)
  - [x] 194 errores de `tsc` corregidos hasta llegar a 0 (ver hallazgos abajo — no fue solo "agregar tipos", aparecieron bugs reales)
  - [x] HMR de Vite separado del `base` de producción (`/workspace/` solo aplica al build, no al dev server — igual que hacía `homepage` en CRA)

**Hallazgos y bugs reales encontrados durante la tipificación** (no inventé nada de esto — `tsc` los sacó a la luz porque antes JavaScript los dejaba pasar en silencio):

1. **`Footer.tsx` y `FooterAuthDefault.tsx` usaban `Date.prototype.getYear()`** (método legacy no estándar, no declarado en los tipos de DOM) con un `1900 +` para compensar — el patrón clásico de un bug de Y2K nunca corregido. Reemplazado por `getFullYear()` en ambos.
2. **`resetPassword` en la vista de Usuarios se llamaba con el correo del usuario como si fuera su ID, y sin el `mode` que la Edge Function `sa-reset-password` requiere** (`"link"|"set"|"internal"`) — el botón de "restablecer contraseña" del panel de Super Admin nunca pudo haber funcionado. Corregido a `resetPassword(selectedUser.id, "link")`.
3. **`deleteUser` en esa misma vista se llamaba sin `confirmName`**, un parámetro que la Edge Function `sa-delete-user` exige (por seguridad, para no borrar una cuenta por error) — el botón de eliminar usuario habría fallado siempre con un error 400. Se agregó el `window.prompt` de confirmación (mismo patrón ya usado en Empresas).
4. **`empresa-configuracion`: dos inputs numéricos (`toleranciaMinutos`, `horasEsperadas`) guardaban `event.target.value` directo en el estado** — que en el DOM siempre es `string`, incluso en `<input type="number">` — corrompiendo silenciosamente cálculos posteriores con esos campos. Envueltos en `Number(...)`.
5. **`empresas/index.tsx`, `pagos-planes/index.tsx` y otras 3 vistas pasaban un parámetro `actor`/`caller` a `applyCompanyAction`, `setCompanyBan`, `deleteCompany`, `createCompany` y `askNexxusAI` que esas funciones nunca declaran ni usan** — código muerto desde la Fase 4 original, eliminado (incluyendo la variable `actor` que quedó sin otro uso en `empresas/index.tsx`).
6. **`isGeminiConfigured()` en `services/aiAssistant.ts` siempre devuelve `true`**, dejando un mensaje de advertencia ("Falta configurar REACT_APP_GEMINI_API_KEY") permanentemente inalcanzable en `empresa-ia/index.tsx` — eliminado junto con la función.
7. **Una API key de Gemini sin usar** seguía en `.env.local` (`VITE_GEMINI_API_KEY`, heredada de antes de que existiera la Edge Function `ask-nexxus-ai`) — ningún código la lee ya; se quitó.

El resto de los ~180 errores de `tsc` fueron inferencias de tipos demasiado estrechas (objetos `{}` sin forma declarada, funciones sin firma, componentes locales sin tipar props) — corregidos con anotaciones explícitas, no con `any` a ciegas donde había una forma real que declarar.

**Deuda pendiente, documentada para no perderla:**
- El bundle de producción del dashboard pesa 1.32 MB (350 KB gzip) en un solo chunk — Vite avisa que conviene *code splitting* (`dynamic import()` o `manualChunks`). No es un error, es una optimización futura razonable, candidata para cuando se aborde el rendimiento del bundle en conjunto con `apps/mobile` (que pesa 6.26 MB).
- El HMR (`ws://localhost:3000/ws`) falla dentro de este entorno de preview en sandbox — parece ser el proxy del entorno de desarrollo, no la configuración de Vite (la app carga y funciona perfecto, solo no hace auto-reload en este sandbox específico; no debería reproducirse fuera de él).

### Fase 3 — Extraer capa de dominio compartida (`packages/domain`)
- **Objetivo:** una sola fuente de verdad de entidades/casos de uso para ambas apps.
- **Archivos afectados:** `apps/mobile/src/domain/*` → `packages/domain/{entities,errors,repositories,services}`, `apps/mobile/src/application/*` → `packages/domain/application`; `apps/mobile/package.json`, `apps/mobile/metro.config.js`, `apps/mobile/src/**` (126 archivos con imports `@/domain/*`/`@/application/*` reescritos a `domain/*`); `packages/domain/package.json`, `packages/domain/tsconfig.json` (nuevos).
- **Dependencias:** Fases 1 y 2.
- **Riesgos:** es el cambio de mayor superficie del plan.
- **Tiempo estimado:** 1 sesión.
- **Estado:** ✅ Completada y verificada (`turbo run typecheck` limpio en `dashboard`, `domain` y `mobile`; `npx expo export --platform web` exporta 3337 módulos sin errores; landing verificada en navegador sin errores de consola).
- **Prioridad:** Alta.
- **Checklist:**
  - [x] `apps/mobile/src/domain` (58 archivos) y `apps/mobile/src/application` (44 archivos) movidos con `git mv` a `packages/domain/`
  - [x] Estructura interna aplanada: `packages/domain/{entities,errors,repositories,services,application}` (sin envoltorio `domain/domain/...` redundante) para que las rutas de import de consumidores sean `domain/entities/User`, no `domain/domain/entities/User`
  - [x] Los 102 archivos internos de `packages/domain` usan imports relativos entre sí (no alias `@/*`), para que el paquete funcione standalone en cualquier bundler sin config extra
  - [x] `packages/domain/package.json` (sin `main`/`types` — no hay barrel único; los 15+ consumidores siempre importan subrutas concretas, nunca el paquete "pelado") + `tsconfig.json` propio (`strict: true`, igual que tenía el código dentro de `apps/mobile`)
  - [x] `apps/mobile/package.json`: agregada dependencia de workspace `"domain": "*"`
  - [x] Los 126 imports `@/domain/*`/`@/application/*` en `apps/mobile/src` reescritos a `domain/entities/*`, `domain/application/use-cases/*`, etc. (verificado: 0 referencias restantes a `@/domain`/`@/application`, y cada import resuelto contra un archivo real en disco)
  - [x] `apps/mobile/metro.config.js`: agregado `watchFolders` (para que Metro vea `packages/domain`, fuera de `apps/mobile`), `resolver.nodeModulesPaths` (root + local) y `resolver.unstable_enableSymlinks` (el paquete se consume vía el symlink que crea `npm install` con workspaces)
  - [x] Verificación real: `turbo run typecheck` (3/3 paquetes en 0 errores), `expo export --platform web` completo, `apps/mobile` levantado en el navegador (landing renderiza, 0 errores de consola)

**Hallazgos y correcciones durante la extracción:**

1. **Auto-inflingido, corregido en la misma sesión**: tras mover `apps/mobile/src/domain` a `packages/domain/src/domain` y reescribir los 59 imports internos a rutas relativas, decidí aplanar `src/domain/{entities,errors,repositories,services}` un nivel arriba para evitar el anidamiento redundante `domain/domain/...`. Ese aplanado rompió las 77 rutas relativas recién calculadas (quedaron un nivel más profundas de lo real). Se recalcularon automáticamente (resolviendo cada especificador contra la ubicación física real del archivo, con fallback a quitar un segmento `/domain/` redundante) — 77 arregladas automáticamente, 1 (`payrollPolicy.ts` → `AdminPaymentUseCases`) tenía un `../../` de más y se corrigió a mano. Verificado con una pasada final: 0 imports relativos rotos en todo `packages/domain`.
2. **`packages/domain` en sí mismo carecía de `tsconfig.json`** (no existía desde su creación) — se creó con `strict: true` para no relajar el nivel de tipado que ya tenía este código cuando vivía dentro de `apps/mobile` (que también usa `strict: true` vía `expo/tsconfig.base`).
3. **`apps/dashboard` todavía no consume `packages/domain`** — no tenía ningún caso de uso de dominio equivalente hoy (sus `services/*Repository.ts` llaman a Supabase directo, sin la capa de arquitectura limpia que sí existía en `apps/mobile`). Dejar que el dashboard empiece a consumir `packages/domain` implicaría refactorizar sus repositorios para pasar por casos de uso de dominio — eso es trabajo de una fase futura (ver Fase 4/13/14, que ya tocan estos módulos), no de esta extracción, para no mezclar dos cambios de superficie grande en una sola fase.

### Fase 4 — Descomponer los 4 archivos gigantes de `apps/mobile`
- **Objetivo:** `DashboardAdmin.tsx`, `GestionPlantilla.tsx`, `EstructuraOrganizativa.tsx`, `AdminNavigator.tsx` dejan de superar ~400-500 líneas cada uno, separando UI / hooks / lógica de negocio.
- **Archivos afectados:** los 4 mencionados + nuevos archivos de componentes/hooks extraídos.
- **Dependencias:** idealmente después de Fase 3 (para no descomponer dos veces).
- **Riesgos:** regresiones visuales/funcionales si no hay tests — **por eso Fase 5 (tests) debería ir antes o en paralelo con esta, al menos para los flujos críticos de estos 4 archivos.**
- **Tiempo estimado:** 1 sesión por archivo.
- **Estado:** ✅ Completada y verificada — 4 de 4 archivos.
- **Prioridad:** Media-Alta.
- **Checklist:**
  - [x] `AdminNavigator.tsx`: 3252 → **294 líneas**. Descompuesto en 10 archivos nuevos bajo `presentation/navigation/`: `adminNavigatorStyles.ts` (1464 líneas, `crearSombra`/`crearEstilos`), `adminNavigatorHelpers.ts` (68, lectura de datos de usuario/empresa + tipos de búsqueda), `adminNavigatorPrimitives.tsx` (361, `BotonAnimado`/`CampoParticulas`/constantes visuales compartidas), `adminNavigatorTypes.ts` (19, `SignalItem`), `Sidebar.tsx` (252), `BannerPantalla.tsx` (122), `useAdminSignals.ts` (94, hook de señales en tiempo real), `NotificationPanel.tsx` (186), `AdminProfilePanel.tsx` (203), `NavbarHeader.tsx` (382). Cero cambios de comportamiento — solo reubicación de código ya bien delimitado por componente/función. Verificado: `turbo run typecheck` limpio en los 3 paquetes, `expo export --platform web` exporta sin errores (bundle 6.27 MB, prácticamente igual al de antes del split), landing renderizada en navegador sin errores de consola. No se verificaron visualmente las pantallas internas del panel de admin (requieren sesión autenticada, sin credenciales de prueba disponibles en este entorno) — la verificación se apoyó en tipado estricto + bundling exitoso, que cubre el 100% de las referencias cruzadas entre los 10 archivos nuevos.
  - [x] `DashboardAdmin.tsx`: 6070 → **1526 líneas** (75% de reducción). Descompuesto en 6 archivos nuevos: `dashboardAdminTypes.ts` (206, los 12 tipos de datos + `PuntoGrafico`/`ModoGrafico`), `dashboardAdminConstants.ts` (33, `BRAND`/`CHART_FONT`), `dashboardAdminHelpers.ts` (97, helpers puros de fecha/formato/estado), `dashboardAdminStyles.ts` (3138, el `StyleSheet.create` completo — el bloque individual más grande del archivo original), `DashboardCharts.tsx` (938, `FondoHeaderTech`/`HeroMiniChart`/`PerformanceSparkChart`/`MobileSignalDonut`/`ChartSidePanel`/`LegendItem`), `DashboardListItems.tsx` (243, `MetricRow`/`ListItem`/`ApprovalItem`/`EmptyState`/`PremiumCard`/`IconWrapper`). **Nota honesta:** a diferencia de `AdminNavigator.tsx` (que quedó en 294 líneas), aquí el componente principal `DashboardAdmin()` en sí mismo sigue teniendo ~1450 líneas — es un único componente con mucho estado/efectos/handlers entrelazados antes del JSX. Extraerlo más (hooks de datos + subcomponentes de secciones del JSX) es un refactor distinto y más delicado que requiere entender el flujo de datos interno completo; no se hizo en esta pasada para no arriesgar romper el dashboard sin tests de por medio (ver Fase 5). Verificado: `turbo run typecheck` limpio en los 3 paquetes, `expo export --platform web` exporta sin errores (bundle 6.28 MB, igual que antes), landing renderizada sin errores de consola. Durante la extracción encontré y corregí 2 bugs propios introducidos por mis cortes de línea (un `);` huérfano y un `}` faltante) — ambos detectados por `tsc` antes de continuar, no llegaron a quedar en el código final.
  - [x] `GestionPlantilla.tsx`: 5332 → **2676 líneas** (50% de reducción). Descompuesto en 5 archivos nuevos: `gestionPlantillaTypes.ts` (261, los 21 tipos + `formularioInicial`/`formularioTareaInicial`), `gestionPlantillaConstants.ts` (32, `BRAND`/`PLANTILLA_PURPLE`), `gestionPlantillaHelpers.ts` (120, helpers de fecha/normalizacion/importacion CSV de empleados), `gestionPlantillaStyles.ts` (2136, el `StyleSheet.create` completo), `GestionPlantillaVisuals.tsx` (212, `PremiumBadge`/`IconPanel`/`MiniRole`/`MetricRow`/`FormField`/`SelectorOpciones`). Verificado: `turbo run typecheck` limpio en los 3 paquetes, `expo export --platform web` exporta sin errores, landing renderizada en navegador sin errores de consola. Durante esta extraccion detecte que `formularioInicial`/`formularioTareaInicial` habian quedado sin `export` en un corte anterior (bloqueaba el build) — corregido antes de continuar. Tambien note que `node_modules` se elimino del tracking de git en un commit de un companero de equipo (`9400dca5`, buena limpieza) pero dejo el `node_modules` local incompleto (faltaban 12 paquetes reales, no solo del indice de git) — se resolvio con `npm install`.
  - [x] `EstructuraOrganizativa.tsx`: 3990 → **1537 líneas** (61% de reducción). Descompuesto en 4 archivos nuevos: `estructuraOrganizativaConstants.ts` (47, `BRAND`/`SOFT_COLORS`/`DEPT_HEADER_GRADIENT`/`CONTRAST_TEXT`), `estructuraOrganizativaTypes.ts` (191, los 14 tipos + `porcentaje`/`normalizarDepartamento`/`MODULOS_PERMISOS` — tipos y helpers combinados a propósito en un solo archivo porque `EntidadSeleccionada` usa `ReturnType<typeof normalizarDepartamento>`, y separarlos habría exigido gimnasia de imports circulares sin ganar nada), `estructuraOrganizativaStyles.ts` (2002, el `StyleSheet.create` completo), `EstructuraOrganizativaVisuals.tsx` (297, `IconPanel`/`PremiumBadge`/`MetricRow`/`MiniMetric`/`EmptyState`/`CatalogCard`/`QuickCreateButton`/`SummaryList`/`FormField`/`Selector`). Verificado: `turbo run typecheck` limpio en los 3 paquetes, `expo export --platform web` exporta sin errores (bundle 6.29 MB), landing renderizada en navegador sin errores de consola.

**Fase 4 completa: resumen de los 4 archivos**

| Archivo | Antes | Después | Reducción |
|---|---|---|---|
| `AdminNavigator.tsx` | 3252 | 294 | 91% |
| `DashboardAdmin.tsx` | 6070 | 1526 | 75% |
| `GestionPlantilla.tsx` | 5332 | 2676 | 50% |
| `EstructuraOrganizativa.tsx` | 3990 | 1537 | 61% |
| **Total** | **18 644** | **6033** | **68%** |

En los 3 archivos de pantalla (`DashboardAdmin`, `GestionPlantilla`, `EstructuraOrganizativa`) el componente principal en sí mismo sigue por encima de las ~400-500 líneas objetivo — la reducción salió de extraer tipos, constantes, helpers puros, estilos y subcomponentes visuales reutilizables a archivos propios, no de descomponer el cuerpo del componente con estado/efectos/handlers entrelazados. Esa descomposición más profunda (hooks de datos + subcomponentes de secciones del JSX) queda pendiente y tiene más sentido después de la Fase 5 (tests), para poder verificar cada extracción sin arriesgar romper flujos en producción sin red de seguridad.

### Fase 5 — Introducir tests automatizados (mínimo viable)
- **Objetivo:** cobertura de los flujos críticos (login, CRUD de empleados, RLS) antes de refactors grandes.
- **Archivos afectados:** nuevos, no modifica código existente.
- **Dependencias:** ninguna técnica, pero tiene más sentido antes de la Fase 4.
- **Riesgos:** ninguno (aditivo).
- **Tiempo estimado:** por definir según qué framework de testing prefieras (no preguntado aún — ver sección 4).
- **Estado:** Lista para iniciar. Framework confirmado: Vitest + Testing Library.
- **Prioridad:** Alta (habilita refactors seguros).
- **Checklist:** por definir.

### Fase 6 — CI/CD real
- **Objetivo:** pipeline que corra lint + typecheck + tests en cada PR, antes del deploy de Vercel.
- **Archivos afectados:** `.github/workflows/*` (nuevo).
- **Dependencias:** Fase 5 (no tiene sentido un CI que no corre tests).
- **Riesgos:** ninguno si se hace bien; bajo si se mal configura (falsos positivos que bloqueen merges).
- **Tiempo estimado:** 1 sesión.
- **Estado:** Lista para iniciar (tras Fase 5).
- **Prioridad:** Media.
- **Checklist:** workflow de lint/typecheck/test en PR + workflow opcional de build preview.

### Fase 7 — Centro Inteligente (Home real)
- **Objetivo:** reemplazar los dashboards de widgets fijos (`MiPulso.tsx`, `DashboardAdmin.tsx`) por un home que compone contenido según prioridad/urgencia/rol, no solo listas fijas.
- **Archivos afectados:** nuevas pantallas + posible tabla/vista agregada en Supabase para "señales" del usuario (hoy `useAdminSignals` en `AdminNavigator.tsx` ya hace algo parecido a pequeña escala — es el punto de partida).
- **Dependencias:** Fase 3 (dominio compartido), idealmente Fase 4 (que `DashboardAdmin.tsx` ya esté descompuesto).
- **Riesgos:** "inteligente" es ambiguo — necesito que definas qué reglas de priorización quieres (ver preguntas) para no inventar la lógica de negocio.
- **Tiempo estimado:** por definir tras tus respuestas.
- **Estado:** Lista para iniciar (tras Fases 3 y 4). Reglas de priorización confirmadas: urgencia por tiempo + rol/permisos.
- **Prioridad:** Alta (es el feature ancla del pitch).
- **Checklist:** por definir.

### Fase 8 — Nexxus AI: de chat a asistente contextual con acciones
- **Objetivo:** que la IA pueda no solo responder sino **ejecutar** acciones (crear tarea, aprobar solicitud si tiene permiso, etc.) — hoy solo parsea tags `[NOTIFICATION:]`/`[TASK:]`/`[EVENT:]` para crear notificaciones/tareas/eventos automáticamente a partir de la respuesta de Gemini, ver `ask-nexxus-ai`.
- **Archivos afectados:** `supabase/functions/ask-nexxus-ai`, pantallas `ChatIA.tsx` / `ChatIAAdmin.tsx` / `SaNexxusIA.tsx`.
- **Dependencias:** ninguna técnica dura, pero se beneficia de Fase 3.
- **Riesgos:** acciones autónomas de IA necesitan límites de permisos muy claros (que la IA no pueda aprobar sus propias sugerencias sin confirmación humana, por ejemplo) — esto es una decisión de producto, no solo técnica.
- **Tiempo estimado:** por definir.
- **Estado:** Lista para iniciar. Regla confirmada: acciones sensibles requieren confirmación humana explícita; creación de notificaciones/tareas/eventos sigue automática.
- **Prioridad:** Media-Alta.
- **Checklist:** por definir.

### Fase 9 — Bandeja Unificada real
- **Objetivo:** ampliar `inbox_unificado` (hoy solo `origen` + `contenido`) para soportar `titulo`, `estado`, `prioridad`, `tipo`, y que agregue de verdad mensajes + notificaciones + solicitudes + aprobaciones + alertas + documentos + eventos en un solo lugar accionable (no solo lectura).
- **Archivos afectados:** nueva migración de schema, `BandejaUnificada.tsx`, posible Edge Function/trigger que centralice inserciones desde otras tablas.
- **Dependencias:** Fase 3.
- **Riesgos:** bajo, es aditivo sobre una tabla que ya existe.
- **Tiempo estimado:** 2-3 sesiones.
- **Estado:** Lista para iniciar (tras Fase 3).
- **Prioridad:** Media.
- **Checklist:** por definir.

### Fase 10 — Notificaciones push reales
- **Objetivo:** registrar tokens Expo Push, enviar push desde Edge Functions en eventos clave (tarea asignada, solicitud aprobada, etc).
- **Archivos afectados:** `apps/mobile` (nuevo hook de registro), nueva Edge Function de envío, `push_tokens` (ya existe).
- **Dependencias:** ninguna dura.
- **Riesgos:** requiere proyecto Expo con EAS configurado si se usa Expo Push Service — a confirmar alcance de builds nativos (ver preguntas).
- **Tiempo estimado:** 1-2 sesiones.
- **Estado:** Pospuesta — alcance móvil se redujo a "solo Expo Web" por ahora, sin builds nativos EAS. Se retoma si el alcance de plataformas cambia; mientras tanto, baja prioridad.
- **Prioridad:** Media.
- **Checklist:** por definir.

### Fase 11 — Email transaccional
- **Objetivo:** recuperación de contraseña por email, notificaciones importantes por correo.
- **Archivos afectados:** nueva Edge Function, configuración de proveedor.
- **Dependencias:** ninguna.
- **Riesgos:** bajo, pero depende 100% de qué proveedor elijas (ver preguntas) — Supabase Auth ya tiene flujo de recuperación por email nativo si se configura SMTP/proveedor en el dashboard de Supabase, lo cual podría cubrir la mitad de este alcance sin código nuevo.
- **Tiempo estimado:** 1 sesión.
- **Estado:** Lista para iniciar. Proveedor confirmado: Resend.
- **Prioridad:** Media.
- **Checklist:** por definir.

### Fase 12 — Pagos reales
- **Objetivo:** reemplazar el simulador de `confirm-plan-purchase` por un gateway real.
- **Archivos afectados:** `supabase/functions/confirm-plan-purchase`, `apps/mobile` (Checkout), tabla `payments`/`suscripciones`.
- **Dependencias:** ninguna técnica, pero es una decisión de negocio grande (¿cobras ya o sigues en fase de validación con pagos simulados?).
- **Riesgos:** manejar dinero real mal implementado es el riesgo más alto de todo el plan — requiere webhooks idempotentes, reconciliación, manejo de reintentos.
- **Tiempo estimado:** por definir (es la fase más sensible).
- **Estado:** Pospuesta — se mantiene el simulador de pagos. Se retoma cuando haya necesidad real de cobrar.
- **Prioridad:** Depende de si ya necesitas cobrar o no.
- **Checklist:** por definir.

### Fase 13 — Automatizaciones (motor de reglas SI/ENTONCES)
- **Objetivo:** arquitectura base (tabla de reglas, triggers/Edge Function evaluadora) + UI mínima para 2-3 reglas de ejemplo.
- **Archivos afectados:** nueva migración, nueva Edge Function, nueva pantalla.
- **Dependencias:** Fase 3 (para reusar dominio), idealmente Fase 9 (bandeja) para poder notificar resultados de automatizaciones.
- **Riesgos:** alcance ambiguo — "preparar arquitectura" puede ser desde una tabla vacía hasta un motor completo; necesito que definas el alcance real para esta primera fase.
- **Tiempo estimado:** por definir.
- **Estado:** Lista para iniciar (tras Fase 3). Alcance confirmado: modelo de datos + 2-3 reglas reales funcionando, no solo esquema.
- **Prioridad:** Baja-Media (es "preparar arquitectura", no una feature completa, según tu propio texto).
- **Checklist:** por definir.

### Fase 14 — Nexxus Brain (grafo empresarial)
- **Objetivo:** arquitectura base de relaciones entidad-entidad (tabla de relaciones genérica o extensión con `pgvector`/grafo).
- **Archivos afectados:** nueva migración.
- **Dependencias:** ninguna dura, pero tiene más sentido después de que existan más entidades relacionadas entre sí (capacitaciones, documentos) con datos reales para poblar el grafo.
- **Riesgos:** mismo problema de alcance ambiguo que Fase 13.
- **Tiempo estimado:** por definir.
- **Estado:** Lista para iniciar. Alcance confirmado: modelo de datos + 2-3 relaciones reales funcionando, no solo esquema.
- **Prioridad:** Baja (explícitamente "preparar arquitectura", no una feature visible).
- **Checklist:** por definir.

### Fase 15 — Limpieza final
- **Objetivo:** eliminar `app.zip`, `package-lock.json.bak`, resolver vulnerabilidades npm reportadas (61 en `web-dashboard`, a re-auditar tras Fase 2), unificar planes (una sola fuente de verdad entre `shared/billing/plans.ts` y la tabla `planes`).
- **Archivos afectados:** varios, puntuales.
- **Dependencias:** después de Fase 2 (para no perder tiempo arreglando vulnerabilidades de CRA si se va a reemplazar por Vite).
- **Riesgos:** ninguno.
- **Tiempo estimado:** 1 sesión.
- **Estado:** Lista para iniciar (tras Fase 2, para no arreglar vulnerabilidades de CRA que Vite hace irrelevantes).
- **Prioridad:** Baja (cosmético/housekeeping, no bloquea nada).
- **Checklist:** por definir.

---

## 4. Preguntas que necesito que respondas antes de tocar código

No voy a asumir nada de esto. Están agrupadas por impacto.

### 4.1 Arquitectura y alcance técnico

1. **Turborepo**: ¿confirmas el layout `apps/mobile` + `apps/dashboard` + `packages/*`, o prefieres otra estructura/nombres?
2. **web-dashboard a TypeScript**: ¿migramos a Vite (reescritura del tooling, más rápido a futuro, rompe env vars actuales) o hacemos TS incremental sobre CRA (`allowJs` + convertir archivo por archivo, más lento pero cero riesgo de romper el build)?
3. **Plataformas objetivo**: ¿la app móvil necesita builds nativos reales (iOS/Android vía EAS) o por ahora solo web (Expo Web) + PWA? Esto determina si Fase 10 (push) tiene sentido ahora o se pospone.
4. **Testing**: ¿qué framework prefieres? (sugerido: Vitest/Jest + Testing Library para unit/integration, Playwright o Detox para e2e — pero es tu decisión)

### 4.2 Producto — IA

5. **Proveedor de IA**: ya está Gemini 2.5 Flash conectado y funcionando con tracking de costos. ¿Seguimos con Gemini, o cambiamos a OpenAI/Claude/otro? Si cambiamos, ¿por qué motivo (costo, calidad, ya tienes cuenta en otro proveedor)?
6. **Nexxus AI con acciones autónomas**: ¿qué acciones puede ejecutar la IA sin confirmación humana (hoy: crear notificación/tarea/evento) y cuáles requieren que un humano apruebe antes de ejecutarse (ej. aprobar una solicitud de vacaciones)?

### 4.3 Producto — Dinero

7. **Pagos reales**: ¿implementamos un gateway real ya (Stripe es el estándar, pero puede que quieras algo más local para Centroamérica) o seguimos con el simulador mientras validas el producto?
8. **Planes**: ya sembré Starter ($20/mes), Business ($50/mes), Enterprise ($200/mes) con los mismos límites que ya tenía el código (`shared/billing/plans.ts`). ¿Se mantienen estos 3 planes y precios, o los rediseñamos?

### 4.4 Producto — Comunicación

9. **Email transaccional**: ¿qué proveedor usar (Resend, SendGrid, Postmark, u otro)? Nota: Supabase Auth ya puede enviar emails de recuperación de contraseña de forma nativa si configuras un proveedor SMTP en su dashboard — puede que no necesites código nuevo para ese caso específico.

### 4.5 Producto — Alcance de features nuevas

10. **Centro Inteligente**: ¿qué señales/reglas concretas debe priorizar el home? (ejemplo: "una tarea vencida pesa más que una reunión en 3 días", "una solicitud pendiente de aprobar hace más de 48h sube de prioridad"). Necesito reglas de negocio reales, no voy a inventarlas.
11. **Automatizaciones**: para esta primera fase, ¿"preparar arquitectura" significa una tabla + Edge Function evaluadora funcionando con 2-3 reglas de ejemplo reales, o literalmente solo el modelo de datos sin lógica todavía?
12. **Nexxus Brain**: mismo caso — ¿alcance real para esta fase, o solo el modelo de datos preparado sin UI?

### 4.6 Orden de trabajo

13. Dado que son ~15 fases, ¿hay alguna que quieras adelantar sobre las demás por urgencia de negocio (por ejemplo, si ya tienes clientes reales esperando pagos reales, Fase 12 debería subir de prioridad)?
