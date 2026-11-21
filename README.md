# Ocean website

Product website for [oceanharness.com](https://oceanharness.com/). A Next.js app that prerenders every page of every
locale to static HTML; GitHub Pages serves the export built by `.github/workflows/pages.yml`.

## Layout

```
app/                routes: (ru) at the bare path, (intl)/[locale] for the eight translated locales,
                    (legacy) for the pre-localization English policy address
src/views/          one module per page: metadata plus the markup
src/components/     header, language picker, footer, plugin symbol, download cards
src/content/        the plugin catalog and the release-selection logic
src/i18n/           locale registry, message lookup, metadata builder, ui/<locale>.json copy
public/             fonts, artwork, robots.txt, CNAME and the checked downloads/releases.json
scripts/            release snapshot updater, static server, legacy copy importer
tests/            checks over the built export, the copy catalogs and the release logic
```

## Local work

Install with Bun (the only package manager here; `bun.lock` is the lockfile) and build with Node 24 or newer:

```sh
bun install --frozen-lockfile
node node_modules/next/dist/bin/next build
node scripts/serve-out.mjs 4173     # http://127.0.0.1:4173/
node --test tests/
```

`node scripts/import-legacy-copy.mjs --write` fills `src/i18n/ui/*.json` from the hash catalogs of the previous
static site. Those catalogs are gone from the tree; the script stays until every page has been reviewed by hand.

`bash scripts/visual-parity.sh` screenshots the export and a reference site (set `BUILT` and `BASE`) at one viewport
and writes the pairs to `/tmp/parity`. For a narrow viewport, pixel pairs are not stable — a tall page inside a fixed
iframe clips and scrolls differently between runs — so `bash scripts/geometry-parity.sh` compares the bounding boxes
of the layout landmarks at 390px instead. Both need the export on one port and a reference tree on another.

## Publishing

A push to `main` runs the `pages` workflow: install, `next build`, the test suite over `out/`, then
`actions/deploy-pages` publishes the export. Pages must be set to **Source: GitHub Actions** in the repository
settings; the CNAME and the HTTPS certificate are carried by `public/CNAME` and the Pages domain settings.

Railway builds the same export with the root `Dockerfile` (Bun 1.4.4, Node 24, Caddy serving `out/`). The
container listens on `PORT`. GitHub Pages can stay up until DNS is pointed at the Railway service.

## Pages and content

`start/` explains installation and the first chat, `plugins/` holds the catalog and the two connection guides,
`privacy/` describes Ocean's data handling and the Browser Control extension has its own policy. The card grid mirrors
the Ocean market catalogue in `@ocean/ocean-plugin-market`: one card per installable plugin, the market's own card
excluded.

Adding a plugin means one entry in `src/content/plugins.ts` with `title` and `description` for all nine locales —
`Record<Locale, string>` makes a missing language a typecheck failure, not a Russian string on a foreign route.

## Downloads

`public/downloads/releases.json` is the checked snapshot the build renders, so the page works without JavaScript and
while the GitHub API is unavailable. `node scripts/update-downloads.mjs` refreshes it from the Releases API, and the
browser re-reads the same file when its own request fails. Commit the refreshed file with the release.

## Localization

Russian is the source language and lives at the site root; the eight other locales live under `/<locale>/`. Text in a
component is written in Russian and is itself the lookup key, resolved through `src/i18n/ui/<locale>.json`. A string
with no Cyrillic characters (`GitHub`, product names, package names) is not translated.

`tests/copy.test.mjs` fails when a Russian literal has no entry in some locale, when catalogs drift apart, or when a
placeholder such as `{date}` is lost. `tests/site.test.mjs` checks the built HTML: `<html lang>`, `canonical`, the
ten `hreflang` entries per page, the sitemap, the language menu, that no internal link points at a missing file, and
that a translated page contains no Russian text outside the language menu.

The published URL set is a compatibility contract: `/plugins/browser-control/privacy/` keeps serving English and
canonicalizes to `/en/plugins/browser-control/privacy/`, while Russian uses
`/plugins/browser-control/privacy/ru/`.

The English policy text is now the current Russian policy translated, like the other eight locales. The static site
kept `/en/plugins/browser-control/privacy/` on an older English draft, so the English page grew by one paragraph and
gained the link to the app privacy page; the section list and the effective date are unchanged.
