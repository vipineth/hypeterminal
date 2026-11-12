#!/usr/bin/env bash
# usage: launch.sh [port]   starts the terminal dev server for verification and waits until /perp renders
set -euo pipefail
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PORT=${1:-4320}
STATE="$ROOT/.verify/state"
mkdir -p "$STATE"
if [ -f "$STATE/server-$PORT.pid" ] && kill -0 "$(cat "$STATE/server-$PORT.pid")" 2>/dev/null; then
	echo "already running on $PORT (pid $(cat "$STATE/server-$PORT.pid"))"; exit 0
fi
if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
	echo "port $PORT is taken by a process we did not start; pick another port" >&2; exit 1
fi
[ -d "$ROOT/node_modules" ] || (cd "$ROOT" && pnpm install)
(cd "$ROOT/apps/terminal" && pnpm exec lingui compile >/dev/null 2>&1 || true)
cd "$ROOT/apps/terminal"
nohup pnpm exec vite dev --port "$PORT" --strictPort > "$STATE/server-$PORT.log" 2>&1 &
echo $! > "$STATE/server-$PORT.pid"
for _ in $(seq 1 90); do
	if curl -sf -o /dev/null "http://localhost:$PORT/perp"; then
		echo "ready http://localhost:$PORT (pid $(cat "$STATE/server-$PORT.pid"), log $STATE/server-$PORT.log)"; exit 0
	fi
	sleep 1
done
echo "server did not become ready; see $STATE/server-$PORT.log" >&2; exit 1
