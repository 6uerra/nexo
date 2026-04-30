#!/usr/bin/env bash
# Suite completa de validación: unit + API + E2E + a11y.
# Si algo falla, exit !=0 → bloquea git push (ver .husky/pre-push).
set -e
cd "$(dirname "$0")/.."

START=$(date +%s)
mkdir -p reports

echo "▶ 1/5 Asegurando infraestructura local..."
docker compose up -d >/dev/null 2>&1
for i in {1..30}; do
  docker compose exec -T postgres pg_isready -U nexo -d nexo >/dev/null 2>&1 && break
  sleep 1
done

echo "▶ 2/5 Aplicando migraciones + seed (idempotente)..."
pnpm db:migrate >/dev/null 2>&1
pnpm db:seed >/dev/null 2>&1

# Asegurar que API y Web estén corriendo
function ensure_up() {
  local port=$1
  local name=$2
  local cmd=$3
  if curl -sf http://localhost:$port >/dev/null 2>&1 || curl -sf http://localhost:$port/health >/dev/null 2>&1; then
    echo "  $name ya corriendo en :$port"
    return
  fi
  echo "  $name no estaba arriba; lanzando..."
  mkdir -p tmp
  eval "$cmd" >tmp/$name.log 2>&1 &
  disown
  for i in {1..30}; do
    if curl -sf http://localhost:$port >/dev/null 2>&1 || curl -sf http://localhost:$port/health >/dev/null 2>&1; then
      echo "  $name listo"; return
    fi
    sleep 1
  done
  echo "  $name no respondió en 30s — abortando"; tail -30 tmp/$name.log; exit 1
}

ensure_up 3001 api 'pnpm --filter @nexo/api dev'
ensure_up 3000 web 'pnpm --filter @nexo/web dev'

echo "▶ 3/5 Tests unitarios (@nexo/shared)..."
pnpm --filter @nexo/shared test 2>&1 | tee reports/shared.log
SHARED_OK=${PIPESTATUS[0]}

echo "▶ 4/5 Tests de integración API (@nexo/api)..."
pnpm --filter @nexo/api test 2>&1 | tee reports/api.log
API_OK=${PIPESTATUS[0]}

echo "▶ 5/5 Tests E2E + accesibilidad (Playwright)..."
pnpm --filter @nexo/web test:e2e --reporter=list 2>&1 | tee reports/e2e.log || E2E_OK=$?
E2E_OK=${E2E_OK:-${PIPESTATUS[0]}}

# Resumen
END=$(date +%s)
DUR=$((END - START))

cat > reports/SUMMARY.md <<EOF
# Test Run Summary

**Fecha:** $(date '+%Y-%m-%d %H:%M:%S')
**Duración:** ${DUR}s

| Suite | Resultado |
|---|---|
| @nexo/shared (unit) | $([ $SHARED_OK -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL') |
| @nexo/api (integration) | $([ $API_OK -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL') |
| @nexo/web (E2E + a11y) | $([ $E2E_OK -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL') |

Reportes detallados:
- reports/shared.log
- reports/api.log
- reports/e2e.log
- apps/web/playwright-report/index.html (UI)
EOF

echo ""
cat reports/SUMMARY.md

if [ $SHARED_OK -ne 0 ] || [ $API_OK -ne 0 ] || [ $E2E_OK -ne 0 ]; then
  echo ""
  echo "❌ Hay tests fallando. NO se permite push."
  exit 1
fi

echo ""
echo "✅ Todos los tests pasaron."
