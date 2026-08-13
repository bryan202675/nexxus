#!/bin/bash
# Sirve la landing (apps/mobile) y el dashboard (apps/dashboard) BAJO EL MISMO ORIGEN, tal como
# quedan en producción (Vercel, ver vercel.json: "/" -> landing, "/workspace" -> dashboard). Solo
# así se comparte sesión de Supabase Auth de verdad — con "npm start" en cada uno por separado
# (puertos 3000 y 8081) son orígenes distintos y el navegador NUNCA comparte sesión entre ellos,
# sin importar el código.
#
# Uso: ./scripts/serve-same-origin.sh
# Requiere darle permiso de ejecución una vez:
#   chmod +x scripts/serve-same-origin.sh

set -e
cd "$(dirname "$0")/.."

bash scripts/build-hosting.sh

echo "Sirviendo apps/mobile/dist (mismo origen para ambas apps)..."
npx serve apps/mobile/dist -l 5000
