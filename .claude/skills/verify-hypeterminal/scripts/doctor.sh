#!/usr/bin/env bash
# usage: doctor.sh [port]   read-only: is the instance on this port ours, up, and serving the app?
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PORT=${1:-4320}
PIDF="$ROOT/.verify/state/server-$PORT.pid"
ok=1
if [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then echo "process: ours, pid $(cat "$PIDF")"; else echo "process: no server we started on $PORT"; ok=0; fi
owner=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -1)
[ -n "$owner" ] && echo "port $PORT: listening (pid $owner)" || { echo "port $PORT: nothing listening"; ok=0; }
title=$(curl -sf "http://localhost:$PORT/perp" | grep -ao '<title>[^<]*' | head -1 | sed 's/<title>//')
[ -n "$title" ] && echo "app: /perp serves \"$title\"" || { echo "app: /perp did not return HTML"; ok=0; }
echo "branch: $(git -C "$ROOT" rev-parse --abbrev-ref HEAD) @ $(git -C "$ROOT" rev-parse --short HEAD)"
[ $ok = 1 ] && echo "DOCTOR OK" || { echo "DOCTOR FAIL"; exit 1; }
