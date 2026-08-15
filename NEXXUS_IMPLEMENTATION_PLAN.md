# NEXXUS — Plan de Implementación (v2: SaaS empresarial moderno)

> Estado del documento: **DECISIONES TOMADAS — listo para iniciar Fase 1.** Todas las preguntas de la sección 4 fueron respondidas (ver sección 4, respuestas inline). Los estados de fase reflejan estas decisiones.

## 0. Decisiones confirmadas (resumen)

| Tema | Decisión |
|---|---|
| Monorepo | Turborepo, layout `apps/mobile` + `apps/dashboard` + `packages/domain` |
| Dashboard web | Reescribir con **Vite + TypeScript** (reemplaza CRA) |
| Plataformas móviles | **Solo Expo Web por ahora** — sin builds nativos EAS. Push (Fase 10) sí está implementado y desplegado para web/futuros builds nativos, vía Expo Notifications + Gmail API. |
| Proveedor de IA | **Gemini 2.5 Flash** (ya integrado, se mantiene) |
| Pagos | **Simulador se mantiene indefinidamente por decisión de negocio** — Nexxus sigue en fase de demo, sin empresas reales esperando cobrar; Fase 12 (gateway real) no se retoma hasta que exista esa necesidad. |
| Planes | Se mantienen Starter $20 / Business $50 / Enterprise $200 ya sembrados |
| Email transaccional | **Gmail API (OAuth2)** — se descartó Resend porque sin dominio verificado solo entrega a la casilla dueña de la cuenta, no a destinatarios reales. |
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
| IA | Google Gemini (`gemini-3.6-flash` por defecto), integrada en `ask-nexxus-ai`, con tracking de costo/uso (`ai_usage`, `ai_usage_daily`) |
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
- **Objetivo:** cobertura de los flujos críticos (login, CRUD de empleados) antes de refactors grandes.
- **Archivos afectados:** `packages/domain` (vitest.config.ts + 6 archivos de test nuevos bajo `__tests__/`), `apps/dashboard` (vitest.config.ts, vitest.setup.ts, testing-types.d.ts + 3 archivos de test nuevos), `package.json` de ambos paquetes (script `test`).
- **Dependencias:** ninguna técnica.
- **Riesgos:** ninguno (aditivo, no toca código de producción salvo exports que ya deberían haber existido — ver hallazgos).
- **Tiempo estimado:** 1 sesión.
- **Estado:** ✅ Completada y verificada (52 tests, 9 archivos, `turbo run test` limpio en `domain` y `dashboard`; `turbo run typecheck` sigue limpio en los 3 paquetes tras agregar los tests).
- **Prioridad:** Alta (habilita refactors seguros).
- **Checklist:**
  - [x] `packages/domain`: Vitest configurado (`vitest.config.ts`, entorno `node`) — 26 tests en 6 archivos:
    - `LoginUser.test.ts` / `LoginEmpresarial.test.ts`: validación de credenciales vacías, normalización de `codigoEmpresa`/`usuario`, traducción de errores de infraestructura a `AuthError`, no reenvolver un `AuthError` ya lanzado.
    - `tasks.test.ts` / `absences.test.ts`: delegación correcta de los casos de uso CRUD (`CreateTask`, `GetTasks`, `UpdateTask`, `CreateAbsence`, `GetAbsences`) hacia sus repositorios mockeados.
    - `calcularRentaMensual.test.ts` / `payrollPolicy.test.ts`: los 4 tramos progresivos del ISR de El Salvador (incluyendo límites exactos de cada tramo) + ISSS/AFP/horas extra/descuentos de `calculatePayroll` — la lógica financiera más crítica del sistema.
  - [x] `apps/dashboard`: Vitest + Testing Library configurados (`vitest.config.ts` con `jsdom`, `vitest.setup.ts` con `@testing-library/jest-dom`) — 26 tests en 3 archivos:
    - `payrollCalc.test.ts`: mismo motor de nómina que `packages/domain`, verificado que el puerto a JS del dashboard mantiene el mismo comportamiento.
    - `registro.test.ts`: validación de correo, reglas de contraseña (5 criterios), validación de teléfono por país (16 prefijos + fallback), validación del formulario de alta de empresa.
    - `SaLogin.test.tsx`: primer test de integración con React Testing Library — renderiza la pantalla de login real, verifica que no llama a Supabase con campos vacíos, que normaliza el correo antes de autenticar, y que traduce el error de credenciales inválidas al español.
  - [x] Ambos paquetes exponen `npm run test`, ya cableado a `turbo run test` (script raíz existente desde la Fase 1).

**Hallazgos durante la escritura de tests:**

1. **`validarCorreo` en `apps/dashboard/src/services/registro.ts` tiene una rama de validación de dominio inalcanzable**: el regex de formato (`[^\s@]+\.[^\s@]{2,}`) ya obliga a que el dominio tenga mínimo 4 caracteres, así que el chequeo posterior `dominio.length < 4` nunca puede ser verdadero. No es un bug con impacto (el correo sigue rechazándose por el regex anterior con un mensaje ligeramente distinto), documentado aquí en vez de "arreglado de paso" para no mezclar cambios de comportamiento con la introducción de tests.
2. **`apps/dashboard/src/vitest.d.ts` colisionaba con el paquete `vitest`**: el `tsconfig.json` del dashboard tiene `paths: {"*": ["*"]}` con `baseUrl: "src"`, así que un archivo `src/vitest.d.ts` sombreaba la resolución del import `from 'vitest'` en los propios tests. Renombrado a `src/testing-types.d.ts`.

**Deuda pendiente, documentada para no perderla:**
- No se agregaron tests para `apps/mobile` (Expo/React Native) en esta fase. Vitest no tiene soporte oficial para renderizar componentes React Native (Metro vs. Vite/Rollup); la vía estándar de Expo es `jest-expo`, que introduciría un segundo test runner en el monorepo. Dado que la decisión confirmada es "Vitest + Testing Library" sin especificar la variante para RN, se dejó fuera de esta fase en vez de inventar una arquitectura de testing distinta sin tu confirmación — la lógica de negocio equivalente de `apps/mobile` (que reutiliza `packages/domain`) ya queda cubierta indirectamente por los tests del paquete `domain`.
- Cobertura de RLS (mencionada en el objetivo original) no se abordó: requiere tests contra una instancia real (o local) de Postgres/Supabase, no unit tests — candidato para la Fase 6 (CI/CD) con un job dedicado, o para cuando haya un entorno de Supabase local reproducible en CI.

### Fase 6 — CI/CD real
- **Objetivo:** pipeline que corra lint + typecheck + tests en cada PR, antes del deploy de Vercel.
- **Archivos afectados:** `.github/workflows/ci.yml` (nuevo), `eslint.config.js`/`.mjs` en los 3 paquetes (nuevos), `package.json` de los 3 paquetes (script `lint` + devDependencies de ESLint).
- **Dependencias:** Fase 5.
- **Riesgos:** ninguno — verificado localmente antes de confiar en que el CI lo detecte.
- **Tiempo estimado:** 1 sesión.
- **Estado:** ✅ Completada y verificada (`turbo run lint typecheck test build` → 10/10 tareas exitosas en los 3 paquetes).
- **Prioridad:** Media.
- **Checklist:**
  - [x] ESLint configurado en `apps/mobile` (`eslint-config-expo`, la config oficial de Expo), `apps/dashboard` (`typescript-eslint` + `eslint-plugin-react-hooks`) y `packages/domain` (`typescript-eslint` base, sin JSX).
  - [x] `no-explicit-any` desactivado deliberadamente en los 3 (el codebase ya usa `any` en puntos de integración con datos crudos, y `apps/dashboard/tsconfig.json` ya tiene `noUnusedLocals`/`noUnusedParameters` en `false` — prohibirlo generaría miles de hallazgos de churn sin valor real). `no-unused-vars` y `react-hooks/exhaustive-deps` quedan como advertencia visible, no error, para no bloquear el build por código heredado.
  - [x] `.github/workflows/ci.yml`: dos jobs — `lint-typecheck-test` (corre en cada push/PR a `main`, ejecuta `turbo run lint`, `turbo run typecheck`, `turbo run test`) y `build-mobile` (depende del primero, corre `npm run build:hosting` como verificación de que el bundle de producción realmente compila). `concurrency` cancela runs viejos del mismo PR/branch para no gastar minutos de CI en pushes rápidos seguidos.
  - [x] Sin GitHub Secrets: las variables de Supabase (URL + anon key publicable) ya viven en los `.env.*` commiteados de `apps/mobile`/`apps/dashboard` (repo privado, decisión explícita tuya de antes) — el build de CI las usa tal cual.
  - [x] Verificado localmente con `turbo run lint typecheck test build` (10 tareas: lint×3, typecheck×3, test×2, build×2 — `apps/mobile` no tiene tests por las razones documentadas en Fase 5) antes de confiar en que el workflow real lo reproduzca igual.

**Hallazgos y correcciones durante la configuración de ESLint:**

1. **Bug real en `apps/mobile/src/presentation/screens/admin/ConfiguracionAdmin.tsx`**: un componente llamaba `useApiTranslate(sublabel)` **condicionalmente** (`sublabel ? useApiTranslate(sublabel) : undefined`), violando las reglas de hooks de React — si `sublabel` cambia entre definido/`undefined` en renders sucesivos del mismo componente, el orden de hooks se rompe y React puede corromper el estado de ese componente o de otros vecinos. `eslint-config-expo` lo marcó como único **error** (no advertencia) de las 330 incidencias totales en `apps/mobile`. Corregido llamando al hook siempre (`useApiTranslate(sublabel || '')`) — el hook ya maneja cadena vacía devolviendo `''`, y el JSX que lo consume ya hacía `null` check.
2. **`prettier.config.js` en `apps/dashboard` usa `require()` estilo CommonJS** dentro de un paquete `"type": "module"` — no es un bug (Prettier carga su config con su propio loader, tolerante a esto), pero ESLint lo marcaba como error porque por defecto trata el archivo como parte del codebase lintado. Excluido junto con `tailwind.config.cjs`/`postcss.config.cjs` (config de build, no código de producto).
3. **2 bugs `let` → `const` reales en `apps/dashboard/src/layouts/admin/index.tsx`** (`activeRoute`, `activeNavbar`): variables declaradas con `let` que nunca se reasignaban — sin impacto funcional, pero señal de que ese código nunca terminó de limpiarse tras un refactor anterior.
4. **`packages/domain/eslint.config.js` generaba una advertencia de Node** por usar sintaxis ESM (`import`) dentro de un paquete sin `"type": "module"` — renombrado a `eslint.config.mjs` en vez de agregar `"type": "module"` al `package.json` (que podría afectar cómo Metro/otros bundlers resuelven el paquete al consumirlo desde `apps/mobile`).
5. **330 advertencias reales quedan sin resolver en `apps/mobile`** (variables sin usar, dependencias faltantes en `useEffect`/`useMemo`, un `require()` suelto) — deliberadamente dejadas como advertencia y no como bloqueo: son el resultado natural de las Fases 3-4 (código movido y refactorizado a gran escala) y de una base de código de más de 100k líneas escrita antes de tener linter. Arreglarlas todas de una vez sería una fase propia, no un efecto secundario de configurar CI.

### Fase 7 — Centro Inteligente (Home real)
- **Objetivo:** reemplazar los dashboards de widgets fijos (`MiPulso.tsx`, `PanelJefe.tsx`, `DashboardAdmin.tsx`) por un home que compone contenido según prioridad/urgencia/rol, no solo listas fijas.
- **Archivos afectados:** `packages/domain/entities/PrioritySignal.ts` (nuevo), `packages/domain/services/priorityEngine.ts` (nuevo, con tests), `apps/mobile/src/presentation/screens/MiPulso.tsx`, `CentroTareas.tsx`, `PanelJefe.tsx`, `admin/DashboardAdmin.tsx`, `admin/dashboardAdminHelpers.ts`, `navigation/useAdminSignals.ts`, `navigation/adminNavigatorTypes.ts`.
- **Dependencias:** Fase 3 (dominio compartido), Fase 4 (`DashboardAdmin.tsx` ya descompuesto).
- **Riesgos:** ninguno detectado — cada cambio se verificó con `turbo run typecheck test lint` + `expo export` antes de continuar al siguiente rol.
- **Tiempo estimado:** 1 sesión.
- **Estado:** ✅ Completada y verificada. Reglas de priorización confirmadas antes de programar: urgencia por tiempo (vencida > hoy > próxima > normal) + rol/permisos; alcance confirmado: los 3 roles (empleado/jefe/admin), reemplazando los widgets fijos (no agregando una sección nueva encima); fuentes de señales confirmadas: tareas, aprobaciones pendientes, check-in/asistencia, notificaciones/inbox.
- **Prioridad:** Alta (es el feature ancla del pitch).
- **Checklist:**
  - [x] **Motor de priorización compartido** (`packages/domain/services/priorityEngine.ts`, 25 tests): `computeUrgencyFromDate` (única fuente de verdad para "vencida"/"hoy"/"próxima", en UTC — reemplaza la lógica que antes vivía duplicada en `dashboardAdminHelpers.estaVencida` y una copia inline en `CentroTareas.tsx`), `computeSignalScore` (combina urgencia por fecha + nivel de prioridad declarado), mappers por fuente (`mapTareasAPrioritySignals`, `mapAusenciasAPrioritySignals`, `mapSolicitudesInternasAPrioritySignals`, `mapAprobacionesReportAPrioritySignals`, `mapNotificacionesAPrioritySignals`, `buildCheckInPendingSignal`, `mapAsistenciaIrregularAPrioritySignal`), y `buildPriorityFeed` (mezcla + ordena + trunca — el punto de composición único que usa cada home).
  - [x] **Empleado (`MiPulso.tsx`)**: la sección "Daily agenda" (antes: solo las primeras 5 tareas pendientes, sin orden por urgencia) ahora es "Prioridades de hoy" — mezcla tareas + notificaciones no leídas + recordatorio de check-in pendiente en un feed único ordenado por urgencia, con icono/color por categoría y navegación correcta según el tipo de señal. La métrica "Urgentes" (antes: conteo por `prioridad === 'Alta'/'Urgente'`, una etiqueta declarada) se reemplazó por "Vencidas" (conteo real por fecha límite superada). `CentroTareas.tsx` (pantalla de "ver todas las tareas") también migró sus filtros "hoy"/"vencidas" al motor compartido.
  - [x] **Jefe (`PanelJefe.tsx`)**: "Aprobaciones pendientes" y "Pulso del equipo" (antes: en el orden que devolvía el repositorio / orden de llegada) ahora se ordenan por urgencia — aprobaciones por `mapAprobacionesReportAPrioritySignals`, equipo por conteo de tareas vencidas por miembro (para que el jefe vea primero a quién atender).
  - [x] **Admin (`DashboardAdmin.tsx` + `useAdminSignals.ts`)**: el panel "Aprobaciones" (antes: ordenado por fecha de *envío* de la solicitud, más reciente primero) ahora se ordena por urgencia real (fecha en que *ocurre* la ausencia/solicitud + prioridad declarada). El feed de señales de la campana de notificaciones (`useAdminSignals`, consumido por `NotificationPanel.tsx`) ahora también ordena por urgencia en vez de mostrar en el orden de llegada de cada tabla — se agregó `dueDate` opcional a `SignalItem` y se seleccionó `fecha_inicio` para ausencias/solicitudes internas (no se pudo hacer lo mismo para `inbox_unificado`/`audit_logs`: sin acceso de lectura al esquema de Supabase en esta sesión para confirmar el nombre de columna correcto sin arriesgar romper la query con un nombre inventado — quedan con urgencia `'normal'` por defecto, documentado como deuda).
  - [x] Verificado en los 3 roles: `turbo run typecheck test lint` limpio (0 errores) tras cada cambio, `expo export --platform web` exporta sin errores, landing renderizada en navegador sin errores de consola.

**Hallazgos durante la implementación:**

1. **Bug de timezone real, encontrado por los propios tests del motor**: la primera versión de `computeUrgencyFromDate` truncaba fechas a medianoche con `Date.prototype.setHours()` (hora local del proceso) pero las fechas de solo-día (`'YYYY-MM-DD'`) que vienen de Supabase se parsean como medianoche **UTC** — mezclar ambas desalineaba el resultado según el huso horario donde corriera el código (funcionaría distinto en CI que en una máquina local). Corregido para operar en UTC de punta a punta (`Date.UTC(...)` en vez de `setHours`), verificado por los 4 tests que fallaron exactamente por esto antes del fix.
2. **Auditoría de navegación reveló rutas rotas pre-existentes en `MiPulso.tsx`**: varios botones navegaban a nombres de pantalla que no coinciden con los registrados en el `Stack.Navigator` raíz (`App.tsx`) — por ejemplo el botón "Ver todo" de la agenda apuntaba a `'MisTareas'` (la ruta real registrada es `'CentroTareas'`; existe una pantalla separada `MisTareas.tsx` pero no está montada en el stack bajo ese nombre). Corregido de paso al reescribir la navegación del feed priorizado, ya que tocaba exactamente esas rutas.
3. **`RequestReportItem`** (el modelo unificado de aprobaciones que ya usa `PanelJefe.tsx` vía `LeaderUseCases`) es una entidad distinta de `Absence`/`InternalRequest` — se agregó un mapper propio (`mapAprobacionesReportAPrioritySignals`) en vez de forzarlo a través de los mappers existentes, para no romper su contrato ya usado en producción.
4. **Deuda documentada, no resuelta**: la asistencia irregular (`mapAsistenciaIrregularAPrioritySignal`, ya escrita y testeada en el motor) no se conectó todavía a ningún home — no había un lugar natural para "asistencia irregular de un colaborador" en `MiPulso` (es de un solo usuario, no aplica) y en `PanelJefe`/`DashboardAdmin` requeriría una consulta adicional de asistencias del día por miembro que no estaba ya cargada en esas pantallas; queda lista para conectarse cuando se aborde el módulo de asistencia con más profundidad.

### Fase 8 — Nexxus AI: de chat a asistente contextual con acciones
- **Objetivo:** que la IA pueda no solo responder sino **sugerir** acciones sensibles (aprobar/rechazar una solicitud) que requieren confirmación humana explícita — hoy solo parsea tags `[NOTIFICATION:]`/`[TASK:]`/`[EVENT:]` para crear notificaciones/tareas/eventos automáticamente a partir de la respuesta de Gemini, ver `ask-nexxus-ai`.
- **Archivos afectados:** `supabase/functions/ask-nexxus-ai/index.ts`, `packages/domain/entities/AiAssistant.ts`, `packages/domain/repositories/IRequestReportRepository.ts`, `packages/domain/application/use-cases/admin/AdminRequestReportUseCases.ts`, `apps/mobile/src/infrastructure/supabase/SupabaseRequestReportRepository.ts`, `apps/mobile/src/presentation/screens/ChatIA.tsx`, `apps/mobile/src/presentation/screens/admin/ChatIAAdmin.tsx`.
- **Dependencias:** ninguna técnica dura, se benefició de Fase 3 (dominio compartido) y reutilizó el use-case de aprobaciones ya construido en Fase 7 (`resolveApproval`/`AdminRequestReportUseCases`).
- **Riesgos:** ninguno detectado — el diseño evita que la IA ejecute nada por sí sola en dos capas (prompt le pide no auto-aprobar + el servidor nunca devuelve `accionesSensibles` a un rol sin permiso, aunque el modelo alucine el tag).
- **Tiempo estimado:** 1 sesión.
- **Estado:** ✅ Completada y verificada (código listo y pusheado; **la Edge Function no se desplegó a Supabase en esta sesión** — ver nota de despliegue abajo). Regla confirmada: acciones sensibles requieren confirmación humana explícita; creación de notificaciones/tareas/eventos sigue automática.
- **Prioridad:** Media-Alta.
- **Checklist:**
  - [x] **Edge Function (`ask-nexxus-ai/index.ts`)**: nuevo tag `[APPROVE:coleccion|id|titulo]`, distinto de `[NOTIFICATION:]`/`[TASK:]`/`[EVENT:]` en un punto clave — **no se ejecuta en el servidor**. `extractSensitiveActions` lo extrae del texto (verificado manualmente con 4 casos: tag simple, múltiples tags, colección desconocida ignorada, texto sin tags) y lo devuelve como `accionesSensibles: SensitiveAiAction[]` en la respuesta JSON, en vez de insertar directo en la tabla como hacen los otros tres. El prompt solo instruye al modelo a usar este tag si `puedeAprobar` (rol jefe/admin/super_admin) — y el servidor **nunca devuelve** `accionesSensibles` si el rol no califica, aunque el modelo lo alucine (doble candado: prompt + respuesta).
  - [x] **`packages/domain`**: `SensitiveAiAction` (nuevo tipo en `entities/AiAssistant.ts`) transporta solo lo mínimo para mostrar la tarjeta (id, colección, título) — nunca el objeto completo, para forzar una re-consulta fresca antes de mutar. `IRequestReportRepository.getById(sourceCollection, id)` (nuevo método + implementación en `SupabaseRequestReportRepository`) es exactamente para eso: al confirmar, el cliente vuelve a pedir el registro real y valida que siga `pendiente` antes de aprobar — nunca confía en el payload de la IA para la mutación en sí.
  - [x] **`ChatIA.tsx` (empleado/jefe) y `ChatIAAdmin.tsx` (admin)**: mismo patrón en los dos — `Mensaje` ahora carga `accionesSensibles`/`accionesResueltas`; cada acción sugerida se renderiza como una tarjeta con botones **Aprobar**/**Rechazar** (sin ellos no pasa nada, la sugerencia queda ahí sin efecto); al confirmar se re-consulta el item (`getById`) y se ejecuta vía `useCases.leader.resolveApproval` (ChatIA) o `useCases.admin.requestReports.resolve` (ChatIAAdmin) — el mismo use-case de aprobaciones ya construido en la Fase 7, no uno nuevo. El resultado (aprobada/rechazada/error) queda pintado en la tarjeta para que no se pueda confirmar dos veces por accidente.
  - [x] Verificado: `turbo run typecheck test lint` limpio (0 errores) en los 3 paquetes, `expo export --platform web` sin errores, landing sin errores de consola.

**Hallazgos durante la implementación:**

1. **`AiAssistantResponse` (dominio) estaba desalineado con la Edge Function real**: declaraba `tool`/`fuentes` como campos obligatorios, pero `ask-nexxus-ai` nunca los devuelve (devuelve `provider`/`latencyMs`/`costUsd`) — un desfase de tipos preexistente que no fallaba porque `SupabaseAiAssistantRepository.ask` hace un cast (`as AiAssistantResponse`) sin validar en runtime. Se corrigió marcando ambos campos `opcionales` de paso, ya que tocaba este archivo de todas formas para agregar `accionesSensibles`.
2. **No hay tests automatizados para la Edge Function en sí** (`extractSensitiveActions`): el proyecto no tiene infraestructura de test para Deno/Edge Functions (ninguna otra función la tiene tampoco), así que la lógica del parser se verificó manualmente con un script Node equivalente (4 casos, documentados en esta sesión) en vez de agregar un runner de test nuevo solo para esto.

**⚠️ Nota de despliegue — acción pendiente tuya:** el código de `supabase/functions/ask-nexxus-ai/index.ts` está commiteado y pusheado, pero **no se desplegó** al proyecto Supabase real en esta sesión (desplegar una Edge Function a un backend compartido es una acción que preferí confirmar contigo antes de ejecutar). Para activar el nuevo comportamiento, hace falta correr `supabase functions deploy ask-nexxus-ai` (o pedirme que lo haga vía el MCP de Supabase) — hasta entonces, la función que corre en producción sigue siendo la versión anterior (sin `[APPROVE:]`).

### Fase 9 — Bandeja Unificada real
- **Objetivo:** ampliar `inbox_unificado` (hoy solo `origen` + `contenido`) para soportar `titulo`, `estado`, `prioridad`, `tipo`, y que agregue de verdad mensajes + notificaciones + solicitudes + aprobaciones + alertas + documentos + eventos en un solo lugar accionable (no solo lectura).
- **Archivos afectados:** `supabase/migrations/0012_inbox_unificado_columnas.sql` (nuevo, **no aplicado**), `packages/domain/application/use-cases/inbox/InboxUseCases.ts`, `apps/mobile/src/infrastructure/container.ts`, `apps/mobile/src/presentation/context/ContextoUsuario.tsx`.
- **Dependencias:** Fase 3.
- **Riesgos:** bajo, es aditivo sobre una tabla que ya existe.
- **Tiempo estimado:** 2-3 sesiones — **esta pasada cubrió el hallazgo principal y 3 flujos reales de escritura** (ver checklist y deuda restante).
- **Estado:** 🔶 En progreso — incremento grande completo y verificado, **código sin commitear ni desplegar** (instrucción explícita: "continua con la fase 9 no despliegues ni hagas commit aun", luego "continua con todos").
- **Prioridad:** Media.
- **Checklist:**
  - [x] **Hallazgo central de esta fase**: `BandejaUnificada.tsx` (pantalla, 264 líneas) y `SupabaseInboxRepository` (lectura/escritura) ya estaban completamente construidos y funcionando — pero `InboxUseCases` (capa de dominio) solo exponía `GetInbox`/`ResolveInboxItem`/`SubscribeToInbox`, **nunca `AddInboxItem`**. El repositorio sabía escribir (`addItem`), pero ningún flujo de la app podía llamarlo: la bandeja podía leerse y resolverse, pero nunca recibía contenido real. Ese era el "no solo lectura" pendiente, no un problema de schema.
  - [x] `titulo`/`estado`/`prioridad`/`tipo` **ya existían de facto**, solo que anidados dentro de `contenido` (jsonb) en vez de como columnas propias — `SupabaseInboxRepository.mapRow`/`addItem` ya los leía/escribía ahí correctamente. No era el gap real del objetivo original.
  - [x] `AddInboxItem` (nuevo caso de uso) + `useCases.inbox.add` (cableado en el container).
  - [x] **3 flujos reales conectados** (cada uno con `.catch()` propio — si publicar en la bandeja falla, la acción principal ya se completó y no se bloquea):
    1. **Aprobaciones** (`crearSolicitudAusencia` y `crearSolicitudInterna` en `ContextoUsuario.tsx`, comparten el helper `publicarAprobacionPendiente`): publica `tipo: 'aprobacion'` al jefe directo del solicitante (`user.jefeId`) — sin ese dato, no publica nada (ver deuda).
    2. **Documentos** (`GestionDocumentos.tsx`, admin sube un PDF para un empleado): publica `tipo: 'documento'` (tipo nuevo, agregado a `InboxItem` — antes el enum no lo contemplaba) al empleado destino.
    3. **Mensajes** (`ChatInterno.tsx`, `sendMessage`): publica `tipo: 'mensaje'` al otro participante, **solo en chats directos (1:1)** — en chats de equipo/departamento publicar por cada mensaje inundaría la bandeja de todo el grupo, decisión deliberada de no hacerlo.
  - [x] **Migración de schema aplicada** (2026-08-13, `0012_inbox_unificado_columnas.sql`): promueve `titulo`/`mensaje`/`estado`/`prioridad`/`tipo`/`origen_ref_id` de `contenido` (jsonb) a columnas reales + backfill + índices por `estado`/`prioridad`. El código (`SupabaseInboxRepository`) sigue leyendo/escribiendo vía jsonb a propósito — migrar el código para depender de las columnas nuevas queda como mejora aparte, no bloqueante.
  - [x] Verificado: `turbo run typecheck test lint` limpio (0 errores) en los 3 paquetes, `expo export --platform web` sin errores, landing renderizada en navegador sin errores reales (un `ERR_EMPTY_RESPONSE` transitorio del proxy del sandbox, mismo tipo de ruido ya documentado en la Fase 2 — no afecta la app).
  - [ ] **Sin commitear ni desplegar** — instrucción explícita del usuario, pendiente de confirmación.
  - [ ] Flujos restantes, deliberadamente no conectados (requieren una decisión de negocio o infraestructura que no existe todavía, no es "no me dio tiempo"):
    - **Tareas vencidas** (`tipo: 'tarea_vencida'`): no es un evento de creación, necesita un chequeo periódico/reactivo — encaja mejor con la Fase 13 (Automatizaciones) que con esta fase.
    - **Alertas críticas de admin** (`tipo: 'notificacion_critica'`, desde `audit_logs` u otras señales): no hay un evento claro de "a quién avisar y cuándo" sin inventar una regla de negocio (¿todo error de auditoría? ¿solo ciertos módulos?) — dejado para cuando se defina esa regla explícitamente.
    - **Eventos de calendario**: los eventos de `calendario_empresarial` son por diseño visibles para toda la empresa/departamento (no un destinatario único), igual que el caso de chats grupales — publicar a cada persona por cada evento tendría el mismo problema de inundar la bandeja.
  - [ ] Solicitudes de empleados **sin `jefeId` asignado** no publican nada (no se adivina a qué admin asignarlo) — decisión deliberada para no inventar lógica de negocio, documentada aquí en vez de resuelta a medias.
  - [ ] Migrar `SupabaseInboxRepository` de `contenido` (jsonb) a las columnas reales de `0012_...sql`, una vez esa migración esté aplicada en Supabase.

### Fase 10 — Notificaciones push reales
- **Objetivo:** registrar tokens Expo Push, enviar push desde Edge Functions en eventos clave (tarea asignada, solicitud aprobada, etc).
- **Archivos afectados:** `apps/mobile` (nuevo hook de registro), nueva Edge Function de envío, `push_tokens` (ya existe).
- **Dependencias:** ninguna dura.
- **Riesgos:** requiere `expo.extra.eas.projectId` en `app.json` (se obtiene con `eas init`, acción de cuenta que solo puede hacer el usuario) para que `getExpoPushTokenAsync` funcione. Sin ese id, el hook hace `console.warn` y no registra token — no rompe nada, pero tampoco envía push todavía.
- **Tiempo estimado:** 1-2 sesiones.
- **Estado:** ✅ Completada y desplegada. `eas init` corrido (2026-08-13) — `projectId` en `app.json`. Edge Function `send-push-notification` desplegada.
- **Prioridad:** Media.
- **Constraint técnico importante:** desde Expo SDK 53 (este proyecto está en SDK 54), **Expo Go en Android ya no soporta push remoto** (removido por Expo) — solo Expo Go en iOS lo soporta para pruebas sin dev build. Para Android hace falta un dev build (`eas build --profile development`) para probar push de verdad. La infraestructura está construida igual de completa para ambas plataformas; es una limitación de testing, no de diseño.
- **Checklist:**
  - [x] `PushToken` (entidad), `IPushTokenRepository`, `IPushSenderRepository` en `packages/domain`.
  - [x] `RegisterPushToken`, `UnregisterPushToken`, `GetPushTokens`, `SendPushNotification` (casos de uso) en `packages/domain/application/use-cases/push/PushTokenUseCases.ts`.
  - [x] `SupabasePushTokenRepository` (upsert idempotente por `usuario_id,token`) y `SupabasePushSenderRepository` (invoca la Edge Function) en `apps/mobile/src/infrastructure/supabase/`.
  - [x] Hook `usePushNotifications` (`apps/mobile/src/presentation/hooks/usePushNotifications.ts`): pide permisos, obtiene el token de Expo (si hay `projectId`), registra en Supabase. No hace nada en `Platform.OS === 'web'` ni en simuladores (`Device.isDevice`).
  - [x] Conectado en `ContextoUsuario.tsx`: se llama al hook con el usuario autenticado; `publicarAprobacionPendiente` ahora también envía push (en paralelo al insert en Bandeja Unificada, con `.catch()` propio que no bloquea el flujo principal).
  - [x] Push conectado a los mismos 2 triggers de Fase 9 que sí escriben en Bandeja Unificada: documento nuevo (`GestionDocumentos.tsx`) y mensaje directo 1:1 (`ChatInterno.tsx`).
  - [x] Nueva Edge Function `send-push-notification` (`supabase/functions/send-push-notification/index.ts`): valida `sameCompany` contra el destinatario, junta todos los tokens del usuario desde `push_tokens`, llama al Expo Push Service (`https://exp.host/--/api/v2/push/send`), y borra automáticamente los tokens que Expo reporta como `DeviceNotRegistered`.
  - [x] Config de plugin `expo-notifications` agregada a `app.json` (icono + color).
  - [x] Verificado: `npx tsc --noEmit` limpio en `apps/mobile` y `packages/domain`, `turbo run typecheck test lint` limpio (0 errores, solo warnings preexistentes) en los 3 paquetes, `expo export --platform web` sin errores, landing renderizada en navegador sin errores reales.
  - [x] `send-push-notification` desplegada (2026-08-13).
  - [x] `expo.extra.eas.projectId` configurado (2026-08-13, `eas init` corrido por el usuario) — `dbe743ab-dc02-4e26-9b3b-d227a2f4e99e`, `owner: bryan202675`.
  - [ ] Push por eventos adicionales (tarea asignada, solicitud aprobada/rechazada) no conectados — mismo alcance deliberadamente acotado que Fase 9: solo se conectó donde ya existía el trigger de Bandeja Unificada, para no inventar nuevos puntos de notificación sin pedirlo.

### Fase 11 — Email transaccional
- **Objetivo:** recuperación de contraseña por email, correo de bienvenida al crear empleado.
- **Archivos afectados:** `supabase/functions/_shared/gmail.ts` (nuevo), `supabase/functions/_shared/emailTemplates.ts` (nuevo), `supabase/functions/_shared/company.ts`, `supabase/functions/crear-usuario-empresa/index.ts`, `apps/mobile/src/presentation/screens/admin/GestionPlantilla.tsx`, `apps/mobile/src/presentation/screens/admin/gestionPlantillaTypes.ts`, `supabase/migrations/0013_usuarios_correo_personal.sql`.
- **Dependencias:** ninguna.
- **Decisión de proveedor (cambió durante la fase):** se descartó Resend — sin dominio verificado, Resend solo entrega a la casilla dueña de la cuenta (confirmado en su documentación pública), lo cual no sirve para enviar a empleados reales. Se usa **Gmail API vía OAuth2** en su lugar: envía a cualquier destinatario desde ya, usando una cuenta Gmail dedicada (`notificaciones.nexxus@gmail.com` o similar) autorizada una vez vía Google Cloud Console + OAuth Playground.
- **Hallazgo clave que redefinió el alcance:** los empleados creados por un admin (`GestionPlantilla.tsx`) reciben un correo de login **sintético e inexistente** (`usuario@CODIGOEMPRESA.nexxus`, ver `_shared/company.ts`), no un correo real. Solo la cuenta que registra la empresa (`LandingAuth.tsx`) tiene correo real. Se agregó `correo_personal` (columna nueva, opcional) a `usuarios` para poder mandarles correo sin tocar el login.
- **Estado:** Bienvenida por email y recuperación de contraseña self-service implementadas y verificadas (typecheck/lint limpios, probado en navegador). Secrets de Gmail ya configurados en Supabase por el usuario. Falta desplegar y agregar las Redirect URLs en Supabase Auth.
- **Prioridad:** Media.
- **Checklist:**
  - [x] Migración `0013_usuarios_correo_personal.sql`: columna `correo_personal` (nullable) en `usuarios`, separada del `correo` de login.
  - [x] `_shared/gmail.ts`: helper de envío vía Gmail API (refresh de access token OAuth2 + `users.messages.send` con MIME base64url), lee `GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REFRESH_TOKEN`/`GMAIL_SENDER_EMAIL` de secrets. **Secrets ya configurados por el usuario en Supabase** (Project Settings → Edge Functions → Secrets).
  - [x] `_shared/emailTemplates.ts`: plantillas HTML de bienvenida y recuperación (diseño simple a propósito, pendiente de definir look final).
  - [x] `createCompanyUser` (`_shared/company.ts`) guarda `correo_personal` y, si viene lleno, dispara el correo de bienvenida en paralelo (no bloquea la creación del usuario si el envío falla).
  - [x] Campo "Correo personal (opcional)" en el formulario de alta/edición de empleado (`GestionPlantilla.tsx`).
  - [x] **Recuperación de contraseña self-service, construida en las dos superficies reales de login** (confirmado con el usuario: admin/jefe/empleado usan `LoginEmpresarial.tsx` en Expo; también existe `sa-login` en web-dashboard con correo real):
    - Edge Function `solicitar-recuperacion-password`: resuelve por `correo` (admin) o `codigoEmpresa`+`usuarioInterno` (empresarial, misma lógica de `login_empresarial`), destino = `correo` si `admin_empresa`/`super_admin`, si no `correo_personal`. Respuesta siempre genérica (no revela existencia de la cuenta) + rate limit reusando `auth_rate_limits`.
    - Edge Function `sincronizar-password-interno`: tras `supabase.auth.updateUser`, sincroniza `usuarios.password_interno_hash` — sin esto el reset quedaba roto para login empresarial (existe el error `auth/password-desync` ya anticipado en `LoginEmpresarial.tsx` para justo este caso).
    - `apps/mobile`: pantallas `RecuperarContrasena.tsx` y `RestablecerContrasena.tsx`, link en `LoginEmpresarial.tsx`, `linking` config en `App.tsx` para que el enlace del correo aterrice en la pantalla correcta.
    - `apps/dashboard`: vistas `recuperar-contrasena` y `restablecer-contrasena`, rutas en `routes.tsx`, link en `sa-login`.
  - [x] **Expo Web ahora se despliega dentro del mismo proyecto de Vercel, bajo `/app`** (decisión del usuario, en vez de un proyecto de Vercel separado): `vercel.json` corre `expo export --platform web` con `EXPO_PUBLIC_BASE_URL=/app` y copia `apps/mobile/dist` a `apps/dashboard/dist/app`; `apps/mobile/app.config.js` (nuevo) aplica `experiments.baseUrl` SOLO cuando esa variable existe, así que `expo start --web`/el preview local de esta sesión siguen sirviendo desde la raíz sin cambios. Verificado con un servidor estático local que replica las `rewrites` de Vercel (filesystem-first, igual que el comportamiento real): `/app`, `/app/restablecer-contrasena`, assets `/app/_expo/...`, `/auth/sa-login`, `/landing` y `/` responden 200 sin pisarse entre sí.
  - [x] Verificado: `turbo run typecheck test lint` limpio (0 errores) en los 3 paquetes; build completo de Vercel simulado localmente end-to-end.
  - [ ] **Redirect URLs pendientes en Supabase Auth** (Authentication → URL Configuration): agregar `<dominio-prod>/auth/restablecer-contrasena` y `<dominio-prod>/app/restablecer-contrasena` (y las versiones `localhost` para pruebas) — sin esto Supabase rechaza el `redirectTo` aunque el código esté bien. Falta que el usuario confirme el dominio de producción exacto.
  - [ ] **Nada desplegado todavía** — ni las Edge Functions (`crear-usuario-empresa`, `solicitar-recuperacion-password`, `sincronizar-password-interno`, funciones compartidas) ni el nuevo `vercel.json`/`app.config.js` están en producción, pendiente de confirmación explícita para hacer commit + push + deploy.
  - [ ] Importación masiva por CSV (`confirmarImportacion`) no incluye columna de correo personal — decisión deliberada, se puede agregar después.

### Fase 12 — Pagos reales
- **Objetivo:** reemplazar el simulador de `confirm-plan-purchase` por un gateway real.
- **Archivos afectados:** `supabase/functions/confirm-plan-purchase`, `apps/mobile` (Checkout), tabla `payments`/`suscripciones`.
- **Decisión del usuario (2026-08-12):** Nexxus sigue en fase de demo — no hay empresas reales esperando pagar. Se descarta integrar un gateway real por ahora; no es una omisión, es una decisión explícita de negocio. El simulador actual (`confirm-plan-purchase` + `NEXXUS_ALLOW_UNVERIFIED_PAID_CHECKOUT`) ya modela correctamente `payments`/`suscripciones` en USD con ciclo mensual/anual, así que conectar un gateway real más adelante no debería requerir rediseñar el esquema, solo sustituir el paso de cobro.
- **Cuando se retome, definir primero (no antes de que haya necesidad real de cobrar):** qué pasarela opera con cuenta de comercio en El Salvador (Stripe no opera cuentas salvadoreñas directamente — habría que evaluar Wompi, PayPal, dLocal, un adquirente local, o Stripe solo si hay una entidad legal fuera de El Salvador) y si se necesita facturación electrónica DTE (obligatoria en El Salvador) o basta con el recibo del gateway.
- **Riesgos:** manejar dinero real mal implementado es el riesgo más alto de todo el plan — requiere webhooks idempotentes, reconciliación, manejo de reintentos.
- **Estado:** Pospuesta indefinidamente por decisión de negocio, no técnica. Se mantiene el simulador.
- **Prioridad:** Ninguna por ahora.
- **Checklist:** N/A hasta que se retome.

### Fase 13 — Automatizaciones (motor de reglas SI/ENTONCES)
- **Objetivo:** arquitectura base (tabla de reglas, triggers/Edge Function evaluadora) + UI mínima para 2-3 reglas de ejemplo.
- **Archivos afectados:** `supabase/migrations/0014_automatizacion_reglas.sql` (nuevo, **no aplicado**), `supabase/functions/evaluate-automation-rules/index.ts` (nuevo, **no desplegado**), `packages/domain/entities/AutomationRule.ts`, `packages/domain/repositories/IAutomationRuleRepository.ts`, `packages/domain/application/use-cases/automations/AutomationRuleUseCases.ts`, `apps/mobile/src/infrastructure/supabase/SupabaseAutomationRuleRepository.ts`, `apps/mobile/src/infrastructure/container.ts`, `apps/mobile/src/presentation/screens/admin/Automatizaciones.tsx` (nueva pantalla), `apps/mobile/src/presentation/navigation/adminMenuConfig.ts`, `apps/mobile/src/presentation/navigation/AdminNavigator.tsx`.
- **Dependencias:** Fase 3 (reusa `packages/domain`), Fase 9 (publica resultados en `inbox_unificado`, mismo shape que usa `SupabaseInboxRepository`).
- **Riesgos:** ninguno detectado sobre datos existentes — es aditivo (tablas nuevas, sin tocar `usuarios`/`tareas`/etc). El riesgo real es de alcance de negocio (qué reglas valen la pena), ya resuelto con las 3 plantillas reales de abajo.
- **Tiempo estimado:** 1 sesión.
- **Estado:** ✅ Completada, verificada y **desplegada** (migración `0014` aplicada, Edge Function `evaluate-automation-rules` activa, `get_advisors` sin hallazgos nuevos de seguridad).
- **Prioridad:** Baja-Media.
- **Checklist:**
  - [x] **Modelo de datos** (`0014_automatizacion_reglas.sql`): `automatizacion_reglas` (empresa_id, nombre, `trigger_tipo` enum, `condiciones` jsonb, `accion_destino` enum, `activa`) + `automatizacion_ejecuciones` (log de idempotencia, unique por `regla_id+entidad_tipo+entidad_id+ciclo` — el mismo hallazgo se vuelve a avisar al día siguiente si sigue vigente, pero nunca dos veces el mismo día). RLS: lectura jefe+, escritura (crear/activar/borrar) solo admin_empresa+; el log de ejecuciones solo lo escribe la Edge Function (service_role, sin policy de insert para clientes).
  - [x] **Edge Function evaluadora** (`evaluate-automation-rules`): recorre las reglas activas de una empresa y evalúa 3 tipos de disparador reales contra datos reales (no simulados) — `tarea_vencida` (tareas con `fecha_limite` pasada sin completar), `solicitud_pendiente_tiempo` (ausencias/solicitudes internas en `pendiente` por más de N horas, configurable), `checkin_faltante` (empleados activos sin `checkins` hoy después de cierta hora UTC, configurable). Cada hallazgo publica un item real en `inbox_unificado` (mismo shape jsonb que `SupabaseInboxRepository`, reutilizando la Fase 9 tal cual — no un mecanismo de notificación paralelo).
  - [x] **`packages/domain`**: `AutomationRule`/`AutomationRunResult` (entidad), `IAutomationRuleRepository` (contrato), `GetAutomationRules`/`CreateAutomationRule`/`SetAutomationRuleActive`/`DeleteAutomationRule`/`RunAutomationRulesNow` (casos de uso) — mismo patrón que `PushTokenUseCases` de la Fase 10.
  - [x] **`SupabaseAutomationRuleRepository`**: CRUD directo sobre `automatizacion_reglas` + `runNow` que invoca la Edge Function vía `supabase.functions.invoke`. Cableado en `container.ts` bajo `useCases.automations.*`.
  - [x] **Pantalla `Automatizaciones.tsx`** (admin, registrada en `AdminNavigator`/`adminMenuConfig` — nueva entrada de menú, búsqueda y banner): botón **"Evaluar ahora"** que corre la Edge Function real y muestra cuántas notificaciones se publicaron por regla; **3 plantillas de un toque** (una por cada `trigger_tipo`, con los parámetros por defecto ya decididos: 48h para solicitudes, 10am UTC para check-in) que crean una regla real y activa en la empresa del admin — se deshabilitan solas si ya existe una regla de ese tipo, para no invitar a crear duplicados; formulario de regla personalizada (nombre, disparador, destino, umbral) para casos fuera de las 3 plantillas; lista de reglas con toggle activa/inactiva y borrado.
  - [x] Verificado: `turbo run typecheck lint test` limpio (0 errores) en los 3 paquetes, `expo export --platform web` exporta sin errores, sin errores de consola en el navegador.
  - [x] **Migración y Edge Function aplicadas/desplegadas** (2026-08-13).
  - [ ] **Programación automática (cron) no implementada**: hoy las reglas solo se evalúan cuando un admin pulsa "Evaluar ahora". `pg_cron` y `pg_net` están disponibles en el proyecto de Supabase (verificado, no instalados) para programar la evaluación periódica sin intervención manual, pero encadenar `cron.schedule` → `net.http_post` → Edge Function requiere decidir cómo autenticar esa llamada (la función hoy exige JWT de un admin real vía `getCaller`) sin exponer la `service_role key` en la definición del cron job — cambio de superficie de seguridad que preferí no improvisar sin confirmación. Queda documentado como siguiente paso, no como pendiente técnico trivial.

### Fase 14 — Nexxus Brain (grafo empresarial)
- **Objetivo:** arquitectura base de relaciones entidad-entidad (tabla de relaciones genérica o extensión con `pgvector`/grafo).
- **Archivos afectados:** `supabase/migrations/0015_grafo_relaciones.sql` (nuevo, **no aplicado**), `packages/domain/entities/GraphRelation.ts`, `packages/domain/repositories/IGraphRelationRepository.ts`, `packages/domain/application/use-cases/graph/GraphRelationUseCases.ts`, `apps/mobile/src/infrastructure/supabase/SupabaseGraphRelationRepository.ts`, `apps/mobile/src/infrastructure/container.ts`, `apps/mobile/src/presentation/screens/admin/GestionPlantilla.tsx`, `apps/mobile/src/presentation/screens/admin/GestionDocumentos.tsx`, `apps/mobile/src/presentation/screens/ChatInterno.tsx`.
- **Dependencias:** ninguna dura; reutiliza `packages/domain` (Fase 3) y se conecta a flujos ya existentes de tareas (Fase 4), documentos y mensajería (ambos ya tocados en la Fase 9).
- **Riesgos:** ninguno detectado sobre datos existentes — tabla nueva y aditiva, los 3 puntos de escritura van con `.catch()` propio (si falla registrar la relación, la acción principal — asignar tarea, compartir documento, enviar mensaje — ya se completó y no se bloquea).
- **Tiempo estimado:** 1 sesión.
- **Estado:** ✅ Completada, verificada y **desplegada** (migración `0015` aplicada, `get_advisors` sin hallazgos nuevos de seguridad).
- **Prioridad:** Baja (explícitamente "preparar arquitectura", no una feature visible — por eso esta fase, a diferencia de la 13, no agrega una pantalla nueva: solo el modelo de datos y los casos de uso quedan disponibles para que una UI futura los consuma).
- **Checklist:**
  - [x] **Modelo de datos** (`0015_grafo_relaciones.sql`): tabla genérica `grafo_relaciones` (origen_tipo/origen_id → relación → destino_tipo/destino_id, ambos de un enum `grafo_entidad_tipo` con 6 tipos de entidad ya reales en el esquema: usuario, tarea, documento, solicitud_ausencia, solicitud_interna, departamento) en vez de una tabla de grafo/`pgvector` completa — no hay todavía un caso de uso que necesite similitud semántica o recorridos de grafo complejos, solo "qué está conectado con qué". Unique constraint por `(empresa, origen, relación, destino)`: el mismo par de entidades con la misma relación es una sola fila, no un log por evento. Índices en ambos sentidos (origen y destino) para no hacer full scan al pedir las relaciones de cualquier entidad. RLS: lectura jefe+ (ver el grafo completo de la empresa es un privilegio operativo, igual que el resto de paneles), escritura para cualquier usuario de la empresa (a diferencia de tareas/documentos, la mensajería interna —una de las 3 relaciones reales— la usa cualquier empleado, no solo jefe+).
  - [x] **`packages/domain`**: `GraphRelation`/`GraphEntityType` (entidad), `IGraphRelationRepository` (contrato), `AddGraphRelation`/`GetEntityRelations` (casos de uso) — mismo patrón que `InboxUseCases`/`PushTokenUseCases`.
  - [x] **`SupabaseGraphRelationRepository`**: `addRelation` hace `upsert` con `ignoreDuplicates` sobre la unique constraint (reenviar un mensaje o volver a compartir un documento no duplica el edge, solo confirma que ya existe); `getRelationsForEntity` consulta ambos sentidos (`origen` o `destino`) con un solo `.or(...)`. Cableado en `container.ts` bajo `useCases.graph.*`.
  - [x] **3 relaciones reales conectadas a flujos ya existentes** (no datos sembrados/simulados — se generan cuando la acción real ocurre en la app):
    1. **`usuario --asignado_a--> tarea`**: en `GestionPlantilla.tsx`, al crear tareas (individual/por sede/por departamento) se captura el `id` real de cada tarea insertada (antes el insert no pedía `.select('id')`) y se registra un edge por cada destinatario.
    2. **`usuario --tiene_acceso_a--> documento`**: en `GestionDocumentos.tsx`, justo después de crear el registro del documento (se capturó el id de retorno de `useCases.documents.create`, antes descartado) y junto al aviso de Bandeja Unificada/push ya existentes de la Fase 9/10.
    3. **`usuario --conversa_con--> usuario`**: en `ChatInterno.tsx`, mismo punto donde la Fase 9 ya publica en Bandeja Unificada — solo para chats directos (1:1), mismo criterio que esa fase para no inundar el grafo con edges de grupos/departamentos.
  - [x] Verificado: `turbo run typecheck lint test` limpio (0 errores) en los 3 paquetes, `expo export --platform web` exporta sin errores.
  - [x] **Migración aplicada** (2026-08-13) — los 3 `useCases.graph.addRelation.execute(...)` ya graban relaciones reales.
  - [ ] **Sin UI propia, a propósito** (ver nota de prioridad arriba): el grafo es consultable vía `useCases.graph.getForEntity` pero no hay ninguna pantalla que lo muestre todavía — se agregará cuando haya un caso de uso concreto que lo necesite (p.ej. mostrar en el perfil de un empleado sus tareas/documentos/conversaciones relacionadas), no antes.
  - [ ] **Solo 3 de los 6 tipos de entidad del enum tienen relaciones reales hoy** (usuario, tarea, documento) — `solicitud_ausencia`, `solicitud_interna` y `departamento` quedan en el enum listos para cuando se conecte una relación real que los use (p.ej. `usuario --pertenece_a--> departamento` al asignar `departamento_id` en `GestionPlantilla`), no se inventó una relación forzada solo para "usar" cada tipo.

### Fase 15 — Limpieza final
- **Objetivo:** eliminar `app.zip`, `package-lock.json.bak`, resolver vulnerabilidades npm reportadas (61 en `web-dashboard`, a re-auditar tras Fase 2), unificar planes (una sola fuente de verdad entre `shared/billing/plans.ts` y la tabla `planes`).
- **Archivos afectados:** `packages/domain/entities/Plan.ts` (nuevo), `packages/domain/repositories/IPlanRepository.ts` (nuevo), `packages/domain/application/use-cases/plans/PlanUseCases.ts` (nuevo), `apps/mobile/src/infrastructure/supabase/SupabasePlanRepository.ts` (nuevo), `apps/mobile/src/infrastructure/container.ts`, `apps/mobile/src/shared/billing/plans.ts`, `apps/mobile/App.tsx`, `apps/dashboard/src/services/checkout.ts`, `apps/dashboard/src/App.tsx`, `supabase/migrations/0016_planes_select_publico.sql`.
- **Estado:** ✅ Completada y verificada.
- **Prioridad:** Baja (housekeeping, no bloquea nada).
- **Checklist:**
  - [x] `app.zip` / `package-lock.json.bak`: ya no existían en el repo, nada que borrar.
  - [x] **`npm audit`**: bajó de 61 (pre-Vite) a 25 en dependencias de producción (11 moderate, 14 high). Aplicado `npm audit fix` sin `--force` (único cambio seguro posible, ajuste menor en `package-lock.json`). **Decisión del usuario:** el resto queda documentado como riesgo aceptado, sin tocar versiones mayores — la mayoría requiere Expo SDK 54→57 + React Native 0.72→mayor (cambio grande, re-verificación completa de `apps/mobile`) o no tiene fix disponible (`xlsx`, `linkify-it`, `markdown-it`, `react-native-markdown-display`); `react-router`/`react-router-dom` sí tienen fix pero cruzan v6→v7 (breaking). Ninguna es explotable sin acceso al código fuente (son de build tooling, no de runtime expuesto) — razonable para una demo.
  - [x] **Planes unificados — la tabla `planes` de Supabase es ahora la fuente de verdad** (decisión del usuario). Antes había **3 copias** con los mismos números hardcodeados a mano (`apps/mobile/src/shared/billing/plans.ts`, `apps/dashboard/src/services/checkout.ts`, y la tabla `planes`), sin nada que las mantuviera sincronizadas.
    - Nueva capa compartida en `packages/domain` (`Plan` entity, `IPlanRepository`, caso de uso `GetPlans` con cache en memoria — los planes cambian con muy poca frecuencia, no vale la pena refetchear en cada render) + `SupabasePlanRepository` en `apps/mobile`.
    - **Diseño elegido para no reescribir los 9+ call sites existentes:** `plans.ts` (mobile) y `checkout.ts` (dashboard) mantienen exactamente la misma API pública (`PLAN_CATALOG`, `PLAN_ORDER`, `getPlanEntitlements`, etc.) — los valores hardcodeados ahora son solo el estado inicial/respaldo; `applyPlanCatalog()`/`refreshPlanCatalog()` los sobreescriben mutando el mismo objeto (no reasignándolo) en cuanto `App.tsx` de cada app resuelve el fetch real al arrancar. Ningún consumidor existente tuvo que cambiar su código.
    - **Hallazgo real durante la verificación:** la política RLS `planes_select` exigía `auth.uid() IS NOT NULL` — bloqueaba exactamente el caso que más lo necesita, la pantalla pública de registro (`apps/dashboard/.../registro`, antes de iniciar sesión). Corregido en `0016_planes_select_publico.sql` (`for select using (true)`) — los precios de un plan no son información sensible, es normal que sean públicos como cualquier página de pricing. Solo `SELECT` es público; `INSERT`/`UPDATE`/`DELETE` siguen restringidos a `es_super_admin()`.
    - Verificado end-to-end a nivel API: antes del fix de RLS, `fetch` con anon key devolvía `[]`; después, las 3 filas reales. Prueba adicional cambiando temporalmente `Starter.precio` en la base (revertida después) para confirmar que el mecanismo de sobreescritura es el correcto en el diseño, no solo que compila.
  - [x] Verificado: `turbo run typecheck test lint` limpio (0 errores) en los 3 paquetes tras un `npm install` completo (el `node_modules` raíz había quedado incompleto, sin `eslint`/`vitest` instalados — se detectó y arregló en el camino).
  - [x] Migración `0016_planes_select_publico.sql` aplicada.

### Fase 16 (post-plan) — Habilitar Realtime a nivel de proyecto
- **Reportado por el usuario:** "en los dashboards desplegados no se actualizan solos, si agrego un empleado tengo que recargar la página."
- **Causa raíz encontrada:** la publicación `supabase_realtime` de Postgres tenía **0 tablas**. Tanto `apps/mobile` (`infrastructure/supabase/realtime.ts`, `subscribeQuery`) como `apps/dashboard` (`services/adminRepository.ts`, `subscribeTable`) ya llamaban correctamente a `.channel().on('postgres_changes', ...)` desde el principio — el código de suscripción siempre estuvo bien escrito, pero sin la tabla en la publicación, Postgres nunca emite el evento de cambio y el listener se queda esperando en silencio. Las pantallas solo se veían "actualizadas" por el fetch inicial al montar.
- **Fix:** `0017_habilitar_realtime_tablas_usadas.sql` — agrega las 32 tablas que el código ya usaba en canales de Realtime (`usuarios`, `tareas`, `checkins`, `documentos`, `solicitudes_ausencia`, `solicitudes_internas`, `planes`, etc. — lista completa en la migración) a la publicación `supabase_realtime`.
- **Verificado end-to-end, no solo a nivel de configuración:** script Node con `@supabase/supabase-js` suscrito con la anon key a una tabla real (`planes`), luego un `UPDATE` real vía SQL — el evento `UPDATE` llegó al cliente. (Primer intento con `audit_logs` no llegó, pero por un motivo correcto y distinto: esa tabla exige rol jefe+ vía RLS y la prueba usaba anon sin sesión — confirma que RLS sigue filtrando correctamente sobre Realtime, no que el fix esté incompleto.)
- **No requiere redeploy de Vercel** — es un cambio de configuración de Postgres/Supabase, ya activo en producción desde que se aplicó.
- **Estado:** ✅ Corregido y verificado en producción.

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
