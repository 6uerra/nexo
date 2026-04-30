#!/usr/bin/env bash
# Setup automatizado de Nexo en local.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Verificando requisitos..."
command -v node >/dev/null || { echo "Node.js no encontrado"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm no encontrado. Ejecuta: npm i -g pnpm"; exit 1; }
command -v docker >/dev/null || { echo "Docker no encontrado"; exit 1; }

echo "▶ Copiando .env si no existe..."
[ -f .env ] || cp .env.example .env

echo "▶ Instalando dependencias..."
pnpm install

echo "▶ Levantando infraestructura (Postgres, Redis, MinIO, MailHog)..."
docker compose up -d

echo "▶ Esperando a Postgres..."
for i in {1..30}; do
  docker compose exec -T postgres pg_isready -U nexo -d nexo >/dev/null 2>&1 && break
  sleep 1
done

echo "▶ Generando migraciones..."
pnpm db:generate || true

echo "▶ Aplicando migraciones..."
pnpm db:migrate

echo "▶ Sembrando datos demo..."
pnpm db:seed

cat <<EOF

✅ Listo!

Para arrancar:
  pnpm dev

Web:    http://localhost:3000
API:    http://localhost:3001
MinIO:  http://localhost:9001  (minioadmin / minioadmin)
Mails:  http://localhost:8025

Credenciales:
  super-admin     admin@nexo.local       NexoAdmin2026!
  tenant-admin    admin@demo.local       Demo2026!
  tenant-viewer   viewer@demo.local      Viewer2026!

EOF
