#!/usr/bin/env bash
# Tests end-to-end locales:
#  1. Asegura infra arriba
#  2. Migrar + seed
#  3. Levanta API en background
#  4. Espera health
#  5. Corre Vitest contra la API
#  6. Apaga API
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Asegurando infra..."
docker compose up -d
for i in {1..30}; do
  docker compose exec -T postgres pg_isready -U nexo -d nexo >/dev/null 2>&1 && break
  sleep 1
done

echo "▶ Migrando + sembrando..."
pnpm db:generate >/dev/null 2>&1 || true
pnpm db:migrate
pnpm db:seed

echo "▶ Iniciando API en background..."
mkdir -p tmp
pnpm --filter @nexo/api dev > tmp/api.log 2>&1 &
API_PID=$!
trap "kill $API_PID 2>/dev/null || true" EXIT

echo "▶ Esperando API..."
for i in {1..40}; do
  if curl -sf http://localhost:3001/health >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "▶ Corriendo tests de @nexo/shared..."
pnpm --filter @nexo/shared test

echo "▶ Corriendo tests de @nexo/api..."
pnpm --filter @nexo/api test

echo "✅ Tests OK"
