#!/usr/bin/env bash
# Same-origin geometry comparison at 390px between the built export and a reference tree.
#
# Pixel screenshots of a tall page inside a fixed-height iframe clip and scroll differently between runs, which
# reads as a layout change. This harness instead loads each page in a 390px iframe on the page's own origin and
# prints the bounding boxes of the layout landmarks plus the document size, so the comparison is about geometry.
#
# Usage: BUILT=http://127.0.0.1:4183 BASE=http://127.0.0.1:4190 bash scripts/geometry-parity.sh
# The two servers must serve `out/` and the reference tree respectively; the probe file is written into both.
set -u
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
BUILT_ROOT=${BUILT_ROOT:-out}
BASE_ROOT=${BASE_ROOT:-/tmp/static-base}
BUILT=${BUILT:-http://127.0.0.1:4183}
BASE=${BASE:-http://127.0.0.1:4190}

cat > "$BUILT_ROOT/__probe.html" <<'HTML'
<!doctype html><meta charset="utf-8"><body><iframe id=f style="width:390px;height:1900px;border:0"></iframe><pre id=out></pre>
<script>
const path = new URLSearchParams(location.search).get('p') || '/';
document.getElementById('f').src = path;
addEventListener('load', () => setTimeout(() => {
  const d = document.getElementById('f').contentDocument;
  const r = (sel) => { const e = d.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  document.getElementById('out').textContent = JSON.stringify({
    scrollHeight: d.documentElement.scrollHeight, scrollWidth: d.documentElement.scrollWidth,
    nav: r('.nav'), picker: r('.language-picker'), toggle: r('.menu-toggle'), links: r('.nav-links'),
    heroLead: r('.hero .lead'), whale: r('.hero-art'), demo: r('.app-preview'), grid: r('.plugin-grid'),
    card: r('.plugin-card'), help: r('.download-help'), install: r('.install'), faq: r('.faq')
  });
}, 600));
</script></body>
HTML
cp "$BUILT_ROOT/__probe.html" "$BASE_ROOT/__probe.html"

PATHS=("/" "/plugins/" "/start/" "/privacy/" "/downloads/" "/plugins/browser-control/" "/plugins/computer-use/" "/plugins/browser-control/privacy/")
LOCALES=(ru en zh ja es fr de pt ko)

probe() {
  "$CHROME" --headless=new --disable-gpu --virtual-time-budget=15000 --window-size=390,2000 \
    --dump-dom "$1/__probe.html?p=$2" 2>/dev/null | grep -o '<pre id="out">[^<]*' | sed 's/<pre id="out">//'
}

fails=0
for locale in "${LOCALES[@]}"; do
  for p in "${PATHS[@]}"; do
    if [ "$p" = "/plugins/browser-control/privacy/" ]; then
      url=$([ "$locale" = ru ] && echo "/plugins/browser-control/privacy/ru/" || echo "/$locale$p")
    elif [ "$locale" = ru ]; then url="$p"; else url="/$locale$p"; fi
    b=$(probe "$BUILT" "$url"); a=$(probe "$BASE" "$url")
    if [ -z "$b" ] || [ -z "$a" ]; then echo "EMPTY $url"; fails=$((fails+1));
    elif [ "$a" = "$b" ]; then echo "OK   $url"; else echo "DIFF $url"; echo "   built $b"; echo "   base  $a"; fails=$((fails+1)); fi
  done
done
echo "geometry sweep: $(( ${#LOCALES[@]} * ${#PATHS[@]} )) routes, $fails mismatches"
