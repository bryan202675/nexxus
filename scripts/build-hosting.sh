#!/usr/bin/env bash
# Arma el bundle unico de hosting (Vercel): la app Expo (landing + app) en la raiz y el
# dashboard de Super Admin en /workspace, mismo origen -> misma sesion de Supabase Auth.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building apps/mobile (Expo web export)..."
npm --workspace mobile run build:web

echo "==> Building apps/dashboard (Vite)..."
npm --workspace dashboard run build

echo "==> Merging apps/dashboard build into apps/mobile/dist/workspace..."
rm -rf apps/mobile/dist/workspace
mkdir -p apps/mobile/dist/workspace
cp -r apps/dashboard/dist/. apps/mobile/dist/workspace/

echo "==> Done. Deploy with: npx vercel deploy --prebuilt=false (o via el dashboard/CI de Vercel)"
