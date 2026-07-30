# Cómo arrancar Nexxus (guía rápida)

Este proyecto tiene 3 piezas que corren por separado en desarrollo:

| Pieza | Qué es | Puerto |
|---|---|---|
| **Functions** | Cloud Functions (`nexxus/backend`) — login de empleados, crear usuarios, stats de super admin, etc. | 5001 |
| **Web** | Dashboard (`web-dashboard`) — panel de Super Admin y de Admin de empresa | 3000 |
| **App** | App móvil (`nexxus/app`, Expo) — landing + app de empleados | 8081 |

Las tres usan la **misma base de datos real** (Firestore de `nexxus-hr`), no hay datos de prueba separados. Solo el emulador de Functions es local; Firestore y Auth siempre son los de producción.

## 1. Un solo comando

Desde la carpeta raíz del proyecto (`nexxus1.1/`):

```bash
npm run dev
```

Esto levanta las tres piezas juntas, cada una con su color en la terminal. Para parar todo: `Ctrl+C` una vez.

La primera vez, instala dependencias si hace falta:

```bash
npm install
npm --prefix web-dashboard install
npm --workspace app --prefix nexxus install
npm --workspace backend --prefix nexxus install
```

## 2. Si algo falla y quieres arrancar solo una pieza

```bash
npm run dev:functions   # solo el emulador de Cloud Functions
npm run dev:web         # solo el dashboard web (localhost:3000)
npm run dev:app         # solo Expo (app móvil)
```

## 3. Requisitos antes de la primera vez

- Tener sesión iniciada en Firebase CLI: `npx firebase login` (una sola vez, se guarda).
- Node instalado. El emulador de Functions prefiere Node 20 (`brew install node@20`) — si lo tienes instalado, el script `dev:functions` lo detecta y lo usa solo; si no, usa el Node del sistema y también funciona (el bug de versión que rompía `loginEmpresarial` ya está corregido en el código, no depende de la versión de Node).

## 4. Probar el login desde el celular / Expo Go

La app usa la IP de tu red local automáticamente para hablar con el emulador de Functions (lo verás en la consola: `Conectando a Functions Emulator en 192.168.x.x:5001`). No necesitas configurar nada, solo que el celular y la computadora estén en la misma red WiFi.

## 5. "Missing or insufficient permissions"

Si vuelve a aparecer este error en cualquier pantalla (crear, editar o eliminar algo), casi siempre es que las reglas de Firestore (`nexxus/firestore.rules`) cambiaron en el código pero no se subieron a producción. Para subirlas:

```bash
cd nexxus
npx firebase deploy --only firestore:rules --project nexxus-hr
```

Esto es rápido (segundos) y no afecta datos, solo permisos. Es buena idea correrlo después de cualquier cambio en `firestore.rules`.

## 6. Probar todo en un solo origen (como en producción)

Para casos raros donde algo depende de que la app y el dashboard compartan sesión de navegador (SSO), existe:

```bash
bash nexxus/scripts/serve-same-origin.sh
```

Esto compila ambas apps y las sirve juntas en `http://127.0.0.1:5002` (o el puerto que indique), igual que en producción. Es más lento que `npm run dev` (compila en vez de recargar en caliente), úsalo solo para verificar ese caso específico.

## 7. Subir cambios reales a producción

```bash
npm run build:hosting                                          # compila web + app
cd nexxus && npx firebase deploy --only hosting --project nexxus-hr   # publica
```

Si además cambiaste `firestore.rules`, corre también el paso 5 antes o después (no importa el orden).
