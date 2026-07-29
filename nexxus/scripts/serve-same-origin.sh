#!/bin/bash
# Sirve la landing (nexxus/app) y el dashboard (web-dashboard) BAJO EL MISMO ORIGEN, tal como
# quedan en producción (Firebase Hosting: "/" -> landing, "/workspace" -> dashboard). Solo así se
# comparte sesión de Firebase Auth de verdad — con "npm start" en cada uno por separado (puertos
# 3000 y 8081) son orígenes distintos y el navegador NUNCA comparte sesión entre ellos, sin
# importar el código.
#
# Uso: ./scripts/serve-same-origin.sh
# Requiere haber corrido esto una vez desde nexxus/ (o darle permiso de ejecución):
#   chmod +x scripts/serve-same-origin.sh

set -e
cd "$(dirname "$0")/.."

echo "Construyendo web-dashboard (producción)..."
(cd ../web-dashboard && npm run build)

echo "Construyendo nexxus/app (web)..."
(cd app && npm run build:web)

echo "Copiando web-dashboard/build a app/dist/workspace..."
rm -rf app/dist/workspace
mkdir -p app/dist/workspace
cp -r ../web-dashboard/build/* app/dist/workspace/

echo "Sirviendo con el emulador de Firebase Hosting (mismo origen para ambas apps)..."
npx firebase emulators:start --only hosting --project nexxus-hr
