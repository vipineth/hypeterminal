#!/usr/bin/env bash
# usage: cleanup.sh [port] [session]   stops only the server and browser session this skill started; evidence in .verify/runs is kept
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PORT=${1:-4320}
SESSION=${2:-verify-hypeterminal}
PIDF="$ROOT/.verify/state/server-$PORT.pid"
if [ -f "$PIDF" ]; then
	pid=$(cat "$PIDF")
	pkill -P "$pid" 2>/dev/null; kill "$pid" 2>/dev/null
	rm -f "$PIDF"; echo "stopped server pid $pid"
fi
agent-browser --session "$SESSION" close >/dev/null 2>&1 && echo "closed browser session $SESSION"
echo "evidence kept in $ROOT/.verify/runs"
