#!/usr/bin/env bash
set -uo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
root="$(git -C "$here" rev-parse --show-toplevel)"
SYNC_COMMIT="1b50aa2"
COVERED=(
	packages/hl-react/src/store.ts
	packages/hl-react/src/hooks/utils/useSub.ts
	packages/hl-react/src/internal/websocket/staleness.ts
	packages/hl-react/src/internal/websocket/visibility.ts
	packages/hl-react/src/internal/websocket/reliability.ts
	packages/hl-react/src/clients.ts
	packages/hl-react/package.json
)

# config:property:kind:expected   expected is "holds" or "finding"
CHECKS=(
	races:ModelConsistent:INVARIANT:holds
	races:RefCountMatchesHooks:INVARIANT:holds
	races:NoOrphanListener:INVARIANT:holds
	races:NoLeakAfterUnmount:INVARIANT:holds
	races:StoreHandleLive:INVARIANT:holds
	races:EventuallyLive:PROPERTY:holds
	tab:ModelConsistent:INVARIANT:holds
	tab:RefCountMatchesHooks:INVARIANT:holds
	tab:StoreHandleLive:INVARIANT:holds
	tab:NoOrphanListener:INVARIANT:finding
	tab:NoLeakAfterUnmount:INVARIANT:finding
	tab:EventuallyLive:PROPERTY:holds
	network:ModelConsistent:INVARIANT:holds
	network:RefCountMatchesHooks:INVARIANT:holds
	network:StoreHandleLive:INVARIANT:holds
	network:NoOrphanListener:INVARIANT:finding
	network:NoLeakAfterUnmount:INVARIANT:finding
	network:EventuallyLive:PROPERTY:finding
)

# scenario:expected   replays of model paths against the real store.ts and SDK
REPLAYS=(
	remount-while-subscribing:holds
	hide-show-recovers:holds
	unmount-then-drop:finding
	show-during-subscribe:finding
	frozen-after-resubscribe-failure:finding
)

command -v bun >/dev/null || { echo "FAIL bun is not on PATH (needed for the real-code replays)"; exit 2; }
jar="$("$here/scripts/fetch-tla.sh")" || { echo "FAIL could not fetch tla2tools.jar"; exit 2; }
start=$(date +%s)
run="$root/.verify/tlc/$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$run"
cp "$here/model/HlSubscriptions.tla" "$run/"

for check in "${CHECKS[@]}"; do
	IFS=: read -r cfg prop kind _ <<<"$check"
	name="$cfg-$prop"
	{ cat "$here/model/$cfg.cfg"; echo "$kind $prop"; } >"$run/$name.cfg"
	(
		cd "$run" &&
			mkdir -p "$run/tmp-$name" &&
			java -XX:+UseParallelGC -Xmx1g -Djava.io.tmpdir="$run/tmp-$name" -cp "$jar" tlc2.TLC -workers auto \
				-metadir "$run/meta-$name" -config "$name.cfg" HlSubscriptions.tla >"$name.out" 2>&1
		echo $? >"$name.exit"
	) &
done
for replay in "${REPLAYS[@]}"; do
	scenario="${replay%%:*}"
	bun "$here/scripts/replay.ts" "$root" "$scenario" >"$run/replay-$scenario.out" 2>&1 &
done
wait

mismatches=()
lines=()
for check in "${CHECKS[@]}"; do
	IFS=: read -r cfg prop kind expected <<<"$check"
	name="$cfg-$prop"
	out="$run/$name.out"
	if grep -q "No error has been found" "$out"; then
		got=holds
	elif grep -qE "(Invariant|Temporal properties were) .*violated|is violated" "$out"; then
		got=finding
	else
		got=error
	fi
	states=$(grep -oE "[0-9,]+ distinct states found" "$out" | tail -1 | cut -d' ' -f1)
	mark=ok
	[[ "$got" != "$expected" ]] && mark=MISMATCH && mismatches+=("$name expected $expected got $got")
	lines+=("$(printf '%-9s %-22s %-8s %-8s %8s states  %s' "$cfg" "$prop" "$expected" "$got" "${states:-?}" "$mark")")
done

for replay in "${REPLAYS[@]}"; do
	scenario="${replay%%:*}"
	expected="${replay##*:}"
	got=$(sed -n "s/^RESULT $scenario //p" "$run/replay-$scenario.out")
	got="${got:-error}"
	mark=ok
	[[ "$got" != "$expected" ]] && mark=MISMATCH && mismatches+=("replay $scenario expected $expected got $got")
	lines+=("$(printf '%-9s %-33s %-8s %-8s %s' replay "$scenario" "$expected" "$got" "$mark")")
done

elapsed=$(( $(date +%s) - start ))
stale=""
if ! git -C "$root" diff --quiet "$SYNC_COMMIT" -- "${COVERED[@]}" 2>/dev/null; then
	stale=" STALE: covered files changed since $SYNC_COMMIT"
fi

if [[ ${#mismatches[@]} -eq 0 ]]; then
	echo "PASS ${#lines[@]} checks match expected in ${elapsed}s${stale}"
else
	echo "FAIL ${#mismatches[@]} of ${#lines[@]} checks differ from expected in ${elapsed}s${stale}"
fi
echo
printf '%-9s %-22s %-8s %-8s\n' config property expected got
printf '%s\n' "${lines[@]}"
if ((${#mismatches[@]})); then printf "  %s\n" "${mismatches[@]}"; fi
echo
echo "Output: $run/<config>-<property>.out and $run/replay-<scenario>.out"
[[ ${#mismatches[@]} -eq 0 ]]
