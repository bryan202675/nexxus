#!/usr/bin/env bash
# Arma el bundle unico de Firebase Hosting: la app Expo (landing + app) en la raiz y el
# dashboard de Super Admin (CRA) en /workspace, mismo origen -> misma sesion de Firebase Auth.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building nexxus/app (Expo web export)..."
npm --workspace app --prefix nexxus run build:web

echo "==> Building web-dashboard (CRA)..."
npm --prefix web-dashboard run build

echo "==> Merging web-dashboard build into nexxus/app/dist/workspace..."
rm -rf nexxus/app/dist/workspace
mkdir -p nexxus/app/dist/workspace
cp -r web-dashboard/build/. nexxus/app/dist/workspace/

echo "==> Done. Deploy with: (cd nexxus && npx firebase deploy --only hosting)"
