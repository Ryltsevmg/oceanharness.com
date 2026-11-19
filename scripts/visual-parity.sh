#!/usr/bin/env bash
# Pixel comparison of the Next export against the published static pages.
# Usage: bash scripts/visual-parity.sh [width] [height]
set -u
W=${1:-1440}
H=${2:-1800}
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
BUILT=${BUILT:-http://127.0.0.1:4183}
BASE=${BASE:-http://127.0.0.1:4182}
OUT=${OUT:-/tmp/parity}
mkdir -p "$OUT"

ROUTES=(
  / /plugins/ /downloads/ /start/ /privacy/ /plugins/browser-control/ /plugins/computer-use/
  /plugins/browser-control/privacy/ru/
  /en/ /en/plugins/ /en/downloads/ /zh/plugins/ /ja/start/ /de/privacy/ /ko/plugins/ /es/plugins/ /fr/plugins/ /pt/plugins/
)

for path in "${ROUTES[@]}"; do
  name=$(echo "$path" | sed 's|^/||; s|/$||; s|/|_|g'); name=${name:-home}
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=${W},${H} --screenshot="$OUT/$name-built.png" "$BUILT$path" >/dev/null 2>&1
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=${W},${H} --screenshot="$OUT/$name-base.png" "$BASE$path" >/dev/null 2>&1
done

echo "screenshots in $OUT"
