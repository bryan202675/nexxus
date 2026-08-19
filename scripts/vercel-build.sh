#!/bin/sh
# Build de Vercel: dashboard (Vite) + landing como raiz, y Expo Web (apps/mobile) bajo /app.
# Movido a script porque vercel.json.buildCommand tiene un limite de 256 caracteres -- el comando
# encadenado con && lo superaba y Vercel rechazaba el deploy entero por fallo de schema (silencioso
# en el sitio: la ultima build valida seguia sirviendo, sin ningun error visible para el usuario).
set -e

npm --workspace dashboard run build
cp apps/dashboard/dist/index.html apps/dashboard/dist/app.html
cp apps/Landing/index.html apps/dashboard/dist/index.html

EXPO_PUBLIC_BASE_URL=/app npm --workspace mobile run build
cp -r apps/mobile/dist apps/dashboard/dist/app

# Defensa en profundidad: si algún build llegara a emitir source maps (ninguno lo hace por
# defecto hoy), nunca deben quedar publicados -- son lo que de verdad revela el código fuente
# original y legible desde el inspector del navegador.
find apps/dashboard/dist -iname "*.map" -delete

# Ofusca el bundle final (dashboard + landing + mobile web bajo /app) para que "Inspeccionar"
# muestre código minificado/ofuscado en vez de la estructura y nombres originales. No sustituye
# nada de seguridad real (RLS, auth, secrets) -- eso ya vive en el backend/Supabase.
# --max-old-space-size como red de seguridad: el bundle web de mobile (7.84 MB, un solo archivo
# sin code-splitting) llegó a tronar el proceso por out-of-memory con el heap default de Node.
node --max-old-space-size=4096 scripts/obfuscate-build.mjs apps/dashboard/dist
