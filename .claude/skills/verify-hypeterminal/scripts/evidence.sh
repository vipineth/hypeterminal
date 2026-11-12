#!/usr/bin/env bash
# usage: evidence.sh <run-name> <label> [session]   saves screenshot + interactive snapshot + url/title + console errors
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
RUN="$ROOT/.verify/runs/$1"; LABEL=$2; SESSION=${3:-verify-hypeterminal}
mkdir -p "$RUN"
ab() { agent-browser --session "$SESSION" "$@"; }
ab screenshot "$RUN/$LABEL.png" >/dev/null
ab snapshot -i > "$RUN/$LABEL.snapshot.txt" 2>&1
{ echo "url: $(ab get url)"; echo "title: $(ab get title)"; } > "$RUN/$LABEL.meta.txt"
ab console 2>&1 | grep -iE "error|uncaught" > "$RUN/$LABEL.console-errors.txt" || true
echo "$RUN/$LABEL.{png,snapshot.txt,meta.txt,console-errors.txt}"
