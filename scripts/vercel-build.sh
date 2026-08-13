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
