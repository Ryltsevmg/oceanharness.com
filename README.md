# Ocean website

Product website for [oceanharness.com](https://oceanharness.com/), published from `main` by GitHub Pages. HTML, CSS, JavaScript, fonts and artwork are served directly; no application server or build step is required.

## Local preview and checks

Run `python3 -m http.server 4173 --bind 127.0.0.1` from this directory, then open `http://127.0.0.1:4173/`.

- `node --test tests/downloads.test.mjs` checks release selection, parsing and rendering.
- Open `/tests/downloads-browser.html` in the local preview and run its checks for focus preservation, retries and failed requests. It uses injected responses and does not download installers.
- Check the homepage, navigation, disclosure controls and download layout at desktop and narrow mobile widths before publishing. Browser fixtures and local design reviews are excluded from GitHub Pages in `_config.yml`.

## Downloads

The download page queries public GitHub releases and picks the newest available artifact for each platform and architecture. When the API is unavailable, it uses `downloads/releases.json`; without JavaScript, the generated HTML links remain available.

Run `node scripts/update-downloads.mjs` to update both the saved release list and the HTML download cards, then review and commit both files. Do not hand-edit only one copy. Missing platform builds have a release-list link rather than a download button.

## Pages and artwork

`start/` explains installation and the first chat. `plugins/` contains the catalog and connection guides. `privacy/` describes Ocean's data handling; the separate Browser Control policy remains at its published URL, with a Russian translation under `ru/`.

Shared navigation styles and mobile behavior live in `styles.css` and `site.js`. HTML navigation and footers are repeated across pages; update them together and keep `sitemap.xml` current.

The approved whale source is `ocean-whale-line.png`. Responsive WebP copies in `assets/` reduce page weight without changing the artwork; `assets/ocean-social.jpg` is used for link previews.
