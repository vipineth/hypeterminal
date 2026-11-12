#!/usr/bin/env bash
set -euo pipefail

# The v1.7.4 release API publishes no digest. This sha256 was computed from a download
# whose size matched the API (2274532 bytes); it pins the file, it is not an upstream checksum.

TLA_VERSION="1.7.4"
TLA_SHA256="936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88"
TLA_URL="https://github.com/tlaplus/tlaplus/releases/download/v${TLA_VERSION}/tla2tools.jar"

root="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
tools="$root/.verify/tools"
jar="$tools/tla2tools-${TLA_VERSION}.jar"

if [[ -f "$jar" ]] && echo "$TLA_SHA256  $jar" | shasum -a 256 -c --status; then
	echo "$jar"
	exit 0
fi

mkdir -p "$tools"
tmp="$(mktemp "$tools/tla2tools.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
curl -fsSL --retry 2 -o "$tmp" "$TLA_URL"
if ! echo "$TLA_SHA256  $tmp" | shasum -a 256 -c --status; then
	echo "checksum mismatch for $TLA_URL" >&2
	exit 1
fi
mv "$tmp" "$jar"
trap - EXIT
echo "$jar"
