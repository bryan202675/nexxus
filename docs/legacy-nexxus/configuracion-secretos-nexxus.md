# Configuración de secretos Nexxus

Este archivo indica dónde configurar secretos. No guardes valores reales en el repositorio, chats, capturas ni documentación.

## API de Gemini

La IA de Nexxus lee la API key desde variables de entorno del backend Firebase Functions:

```bash
GEMINI_API_KEY="tu_api_key_de_gemini"
GEMINI_MODEL="gemini-2.5-flash"
```

Código que la usa:

- `backend/index.js`
- Función callable: `askNexxusAI`

La API key se envía desde el servidor a Gemini con el header `x-goog-api-key`. El frontend nunca debe recibir ni almacenar esta clave.

Para entorno local, exporta las variables antes de levantar Functions:

```bash
export GEMINI_API_KEY="tu_api_key_de_gemini"
export GEMINI_MODEL="gemini-2.5-flash"
```

Para producción, configúralas en el entorno seguro de Firebase/Google Cloud para Cloud Functions antes de desplegar. No uses archivos versionados para esto.

## Contraseña del super admin

El super admin se crea con el script:

```bash
npm --prefix backend run seed:super-admin
```

Ese script lee estas variables:

```bash
NEXXUS_SUPER_ADMIN_EMAIL="correo_del_super_admin"
NEXXUS_SUPER_ADMIN_PASSWORD="contraseña_segura"
NEXXUS_SUPER_ADMIN_NAME="Nombre visible"
```

Código que la usa:

- `backend/scripts/seed-super-admin.js`

La contraseña debe tener al menos 14 caracteres e incluir mayúscula, minúscula, número y símbolo. El script no la imprime en consola ni la guarda en Firestore.

Si el usuario ya existe y necesitas rotar la contraseña, agrega esta variable solo para esa ejecución:

```bash
NEXXUS_SUPER_ADMIN_ROTATE_PASSWORD="true"
```

Ejemplo local sin guardar secretos:

```bash
export NEXXUS_SUPER_ADMIN_EMAIL="admin@example.com"
export NEXXUS_SUPER_ADMIN_PASSWORD="no_pegues_aqui_la_real"
export NEXXUS_SUPER_ADMIN_NAME="Nexxus Super Admin"
npm --prefix backend run seed:super-admin
```

Reemplaza los valores de ejemplo directamente en tu terminal o en el gestor seguro de secretos. No los escribas en este archivo.

El script registra un evento en `audit_logs` indicando creación, actualización o rotación, sin registrar el valor de la contraseña.

## Backups automáticos de Firestore

La función programada `exportFirestoreBackup` ejecuta una exportación administrada de Firestore cada 24 horas.

Configura el bucket destino en el entorno seguro de Firebase/Google Cloud Functions:

```bash
NEXXUS_FIRESTORE_BACKUP_BUCKET="gs://tu-bucket-de-backups"
```

Código que la usa:

- `backend/index.js`
- Función programada: `exportFirestoreBackup`

El bucket debe existir previamente y la cuenta de servicio de Cloud Functions necesita permisos para ejecutar exportaciones de Firestore y escribir en ese bucket. No configures este valor en archivos versionados.

## Checkout y activación de planes

La función `confirmPlanPurchase` no activa planes pagados sin verificación externa, salvo que se habilite de forma explícita para pruebas controladas:

```bash
NEXXUS_ALLOW_UNVERIFIED_PAID_CHECKOUT="true"
```

No habilites esa variable en producción. Sin esa variable, los planes con monto mayor a cero deben integrarse con un proveedor de pago real antes de marcarse como `paid`. Los códigos promocionales de costo cero pueden completar la activación sin cargo.
