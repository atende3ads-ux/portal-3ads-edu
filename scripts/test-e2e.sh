#!/usr/bin/env bash
#
# Executa os testes de ponta a ponta da API contra o banco de teste.
#
# Sobe o servidor, espera ficar pronto, roda a suíte e derruba o servidor —
# inclusive se a suíte falhar, para não deixar processo pendurado ocupando a
# porta (que já causou um falso resultado: o servidor antigo continuava
# respondendo com código desatualizado).

set -euo pipefail

PORT="${PORT:-3100}"
BASE_URL="http://127.0.0.1:${PORT}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

TEST_DB="${DATABASE_URL_TEST:?DATABASE_URL_TEST não configurada. Ver .env.example.}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "→ aplicando migrações no banco de teste"
DATABASE_URL="$TEST_DB" npx prisma migrate deploy >/dev/null

echo "→ compilando"
npx next build >/dev/null

echo "→ subindo servidor na porta ${PORT}"
DATABASE_URL="$TEST_DB" NODE_ENV=production npx next start -p "$PORT" >/tmp/portal-e2e.log 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null "${BASE_URL}/entrar" 2>/dev/null; then
    break
  fi
  sleep 0.5
done

if ! curl -fsS -o /dev/null "${BASE_URL}/entrar" 2>/dev/null; then
  echo "servidor não respondeu; log em /tmp/portal-e2e.log" >&2
  tail -20 /tmp/portal-e2e.log >&2
  exit 1
fi

echo "→ executando a suíte"
# Os arquivos rodam em sequência: cada um limpa o banco no seu `before`,
# e rodar em paralelo faria um apagar a massa do outro.
NODE_ENV=test BASE_URL="$BASE_URL" node --env-file=.env --import tsx --test \
  --test-concurrency=1 \
  tests/server/api-e1.test.ts \
  tests/server/api-e2.test.ts
