#!/usr/bin/env bash
# Arranca el emulador de Cloud Functions (backend/index.js) contra Firestore/Auth reales de
# nexxus-hr -- no emula Firestore ni Auth, solo Functions, para no necesitar datos de prueba
# duplicados en local.
#
# Fuerza Node 20 si esta disponible (brew install node@20) porque el emulador de Functions
# envuelve ("stubbea") el modulo firebase-admin para avisar cuando una llamada afecta produccion,
# y esa envoltura puede perder metodos estaticos como admin.firestore.FieldValue bajo ciertas
# combinaciones de Node/firebase-tools. El codigo del backend ya no depende de eso (usa
# require("firebase-admin/firestore") en vez de admin.firestore.FieldValue), pero Node 20 es la
# version que declara nexxus/backend/package.json y evita sorpresas futuras.
set -euo pipefail
cd "$(dirname "$0")/../nexxus/backend"

if [ -x /usr/local/opt/node@20/bin/node ]; then
  export PATH="/usr/local/opt/node@20/bin:$PATH"
fi

echo "==> Node: $(node -v)"
exec npx firebase emulators:start --only functions --project nexxus-hr
