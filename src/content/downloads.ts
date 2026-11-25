import { HTML_LANG, type Locale } from '../i18n/locales.ts';

/**
 * Release discovery for `/downloads/`.
 *
 * The page ships a checked snapshot so it works without JavaScript and while GitHub is unreachable, then asks the
 * Releases API for newer files. Both paths run this module: the server renders `public/downloads/releases.json`,
 * the browser replaces it with the live list. Nothing here touches the DOM, so the same code is testable under
 * `node --test` with an injected fetcher.
 *
 * Trust boundary: every URL that reaches the page must be an `https://github.com/Ryltsevmg/Ocean/releases/...`
 * address. Artifacts are accepted by name pattern, size, state and URL, never by a label the release author wrote.
 */

export const REPOSITORY = 'Ryltsevmg/Ocean';
export const RELEASES_URL = `https://github.com/${REPOSITORY}/releases`;
export const RELEASES_API = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=100`;

export type Platform = 'mac' | 'win' | 'linux';
export type Arch = 'arm64' | 'x64';
export type Format = 'DMG' | 'ZIP' | 'EXE' | 'MSI' | 'AppImage' | 'DEB' | 'TAR.GZ';

export type Target = { readonly platform: Platform; readonly arch: Arch; readonly title: string; readonly label: string };

/** The installable desktop combinations, in card order. Titles and labels are product names and stay untranslated. */
export const DOWNLOAD_TARGETS: readonly Target[] = [
  { platform: 'mac', arch: 'arm64', title: 'macOS', label: 'Apple silicon' },
  { platform: 'win', arch: 'x64', title: 'Windows', label: 'Intel / AMD · x64' },
  { platform: 'linux', arch: 'x64', title: 'Linux', label: 'Intel / AMD · x64' },
  { platform: 'linux', arch: 'arm64', title: 'Linux', label: 'ARM64' },
  { platform: 'mac', arch: 'x64', title: 'macOS', label: 'Intel' },
];

const TARGET_KEYS = new Set(DOWNLOAD_TARGETS.map(target => `${target.platform}-${target.arch}`));

/** Preference inside one release: the native installer first, then the portable archive. */
const FORMAT_ORDER: Record<Format, number> = { DMG: 0, EXE: 0, AppImage: 0, MSI: 1, DEB: 1, ZIP: 2, 'TAR.GZ': 2 };

const FORMATS_BY_PLATFORM: Record<Platform, readonly Format[]> = {
  mac: ['DMG', 'ZIP'],
  win: ['EXE', 'MSI'],
  linux: ['AppImage', 'DEB', 'TAR.GZ'],
};

export type Asset = {
  readonly platform: Platform;
  readonly arch: Arch;
  readonly format: Format;
  readonly size: number;
  readonly url: string;
  readonly releaseUrl: string;
  readonly publishedAt: string;
};

export type Snapshot = { readonly checkedAt: string; readonly downloads: readonly Asset[] };

type ReleaseAsset = { name?: string; state?: string; size?: number; browser_download_url?: string };
type ReleaseRecord = { draft?: boolean; published_at?: string; html_url?: string; assets?: ReleaseAsset[] };

/**
 * Match the desktop artifact name built by `electron-builder` (`ocean-${version}-${os}-${arch}`; the shipped
 * `ocean-chat-` spelling and the notarized Mac ZIP stay accepted) and reject everything that is not an installer.
 *
 * @param name the asset name reported by GitHub.
 * @returns the target and format, or `null` for metadata, checksums, debug symbols and unknown platforms.
 */
export function identifyAsset(name: string): { platform: Platform; arch: Arch; format: Format } | null {
  if (!/^ocean(?:-chat)?-\d+\.\d+\.\d+/i.test(name)) return null;
  if (/(?:^|[-.])(debug|symbols|blockmap|sha256|checksums?)(?:[-.]|$)/i.test(name)) return null;
  const lower = name.toLowerCase();
  const archMatch = lower.match(/-(arm64|aarch64|x64|x86_64|amd64)(?=[-.])/);
  if (!archMatch) return null;
  const arch: Arch = archMatch[1] === 'arm64' || archMatch[1] === 'aarch64' ? 'arm64' : 'x64';
  let platform: Platform | null = null;
  let format: Format | null = null;
  if (/-linux-/.test(lower)) {
    platform = 'linux';
    format = lower.endsWith('.appimage') ? 'AppImage' : lower.endsWith('.deb') ? 'DEB' : lower.endsWith('.tar.gz') ? 'TAR.GZ' : null;
  } else if (/-(win|win32|windows)-/.test(lower)) {
    platform = 'win';
    format = lower.endsWith('.exe') ? 'EXE' : lower.endsWith('.msi') ? 'MSI' : null;
  } else if (/-(?:mac|macos|darwin)-/.test(lower) || /-(?:arm64|x64)-notarized\.zip$/.test(lower)) {
    platform = 'mac';
    format = lower.endsWith('.dmg') ? 'DMG' : lower.endsWith('.zip') ? 'ZIP' : null;
  }
  if (!platform || !format || !TARGET_KEYS.has(`${platform}-${arch}`)) return null;
  return { platform, arch, format };
}

/** `https://github.com/<repo>/releases/{download,tag}/...` with no credentials, port or redirect host. */
function isRepositoryUrl(value: string, path: 'download' | 'tag'): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port && !url.username && !url.password
      && url.pathname.startsWith(`/${REPOSITORY}/releases/${path}/`);
  } catch {
    return false;
  }
}

/**
 * Choose the newest published artifact for each target.
 *
 * A release counts when it is not a draft, has a parseable publication time, a tag URL on the repository and an
 * asset list. Within one release a signed artifact beats the unsigned one, then the native installer beats the
 * archive. Throws when the response carries records that are neither drafts nor usable, because showing a partial
 * list would be worse than showing the checked snapshot.
 *
 * @param releases release records as returned by the GitHub API.
 * @returns one asset per available target, in `DOWNLOAD_TARGETS` order.
 */
export function selectLatestDownloads(releases: readonly ReleaseRecord[]): Asset[] {
  if (!Array.isArray(releases)) throw new Error('Invalid release response');
  const published = releases
    .filter(release => Boolean(release) && release.draft === false && Number.isFinite(Date.parse(String(release.published_at)))
      && Array.isArray(release.assets) && isRepositoryUrl(String(release.html_url), 'tag'))
    .sort((a, b) => Date.parse(String(b.published_at)) - Date.parse(String(a.published_at)));
  if (releases.length && !published.length && !releases.every(release => release?.draft === true)) throw new Error('No valid release records');
  const chosen = new Map<string, Asset>();
  for (const release of published) {
    const releaseUrl = String(release.html_url);
    const publishedAt = String(release.published_at);
    const candidates: (Asset & { unsigned: boolean })[] = [];
    for (const asset of release.assets ?? []) {
      const name = asset.name;
      const url = asset.browser_download_url;
      const target = typeof name === 'string' ? identifyAsset(name) : null;
      if (!target || asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || !asset.size || asset.size <= 0) continue;
      if (typeof url !== 'string' || !isRepositoryUrl(url, 'download')) continue;
      candidates.push({ ...target, size: asset.size, url, releaseUrl, publishedAt, unsigned: /-(?:unsigned|unnotarized)(?=\.)/i.test(name) });
    }
    candidates.sort((a, b) => Number(a.unsigned) - Number(b.unsigned) || FORMAT_ORDER[a.format] - FORMAT_ORDER[b.format]);
    for (const { unsigned: _unsigned, ...asset } of candidates) {
      const key = `${asset.platform}-${asset.arch}`;
      if (!chosen.has(key)) chosen.set(key, asset);
    }
  }
  return DOWNLOAD_TARGETS
    .map(target => chosen.get(`${target.platform}-${target.arch}`))
    .filter((asset): asset is Asset => asset !== undefined);
}

/**
 * Read release pages until every target is found or GitHub history ends.
 *
 * @param fetcher the fetch implementation, injectable for tests.
 * @param options signal and extra headers for the request.
 * @returns the available assets, possibly fewer than the target list.
 */
export async function fetchLatestDownloads(
  fetcher: typeof fetch = fetch,
  { signal, headers = {} }: { signal?: AbortSignal; headers?: Record<string, string> } = {},
): Promise<Asset[]> {
  let nextUrl: string | null = RELEASES_API;
  const visited = new Set<string>();
  const releases: ReleaseRecord[] = [];
  while (nextUrl) {
    if (visited.has(nextUrl)) throw new Error('Repeated release page');
    visited.add(nextUrl);
    const response = await fetcher(nextUrl, { ...(signal ? { signal } : {}), headers: { Accept: 'application/vnd.github+json', ...headers } });
    if (!response.ok) throw new Error(`Release request failed: ${response.status}`);
    const page = await response.json() as ReleaseRecord[];
    if (!Array.isArray(page)) throw new Error('Invalid release response');
    releases.push(...page);
    const downloads = selectLatestDownloads(releases);
    if (downloads.length === TARGET_KEYS.size) return downloads;
    const next = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    if (!next) return downloads;
    const url = new URL(next);
    if (url.origin !== 'https://api.github.com' || url.pathname !== `/repos/${REPOSITORY}/releases` || url.username || url.password) throw new Error('Unexpected release page');
    nextUrl = url.href;
  }
  return [];
}

/**
 * Compare two artifact lists by the fields the page renders.
 *
 * A periodic refresh that finds the same installers leaves the saved snapshot byte-identical, so the build
 * commits nothing and the check time keeps naming the release the list was last confirmed for.
 *
 * @param left one artifact list, in page order.
 * @param right the other artifact list, in page order.
 * @returns whether both lists carry the same artifacts in the same order.
 */
export function sameDownloads(left: readonly Asset[], right: readonly Asset[]): boolean {
  return left.length === right.length && left.every((asset, index) => {
    const other = right[index];
    return other !== undefined && asset.platform === other.platform && asset.arch === other.arch
      && asset.format === other.format && asset.size === other.size && asset.url === other.url
      && asset.releaseUrl === other.releaseUrl && asset.publishedAt === other.publishedAt;
  });
}

/**
 * Validate the checked snapshot before its URLs are rendered.
 *
 * @param snapshot the parsed `downloads/releases.json`.
 * @returns the same object, once every field has been checked.
 */
export function parseSnapshot(snapshot: unknown): Snapshot {
  const value = snapshot as Partial<Snapshot> | null;
  if (!value || !Number.isFinite(Date.parse(String(value.checkedAt))) || !Array.isArray(value.downloads)) throw new Error('Invalid download snapshot');
  const seen = new Set<string>();
  for (const asset of value.downloads as Partial<Asset>[]) {
    if (!asset || !TARGET_KEYS.has(`${asset.platform}-${asset.arch}`) || !FORMATS_BY_PLATFORM[asset.platform as Platform]?.includes(asset.format as Format)) throw new Error('Invalid snapshot artifact');
    const key = `${asset.platform}-${asset.arch}`;
    if (seen.has(key)) throw new Error('Invalid snapshot artifact');
    if (!Number.isSafeInteger(asset.size) || !asset.size || asset.size <= 0
      || !Number.isFinite(Date.parse(String(asset.publishedAt))) || !isRepositoryUrl(String(asset.url), 'download') || !isRepositoryUrl(String(asset.releaseUrl), 'tag')) throw new Error('Invalid snapshot artifact');
    seen.add(key);
  }
  return value as Snapshot;
}

/** Megabytes in the locale's number format, without a decimal part. */
export function formatSize(bytes: number, locale: Locale, unit: string): string {
  return `${new Intl.NumberFormat(HTML_LANG[locale], { maximumFractionDigits: 0 }).format(bytes / 1_000_000)} ${unit}`;
}

/**
 * A release date in the locale's long form.
 *
 * Russian appends «г.» to a standalone date; the published copy puts these dates inside sentences and in `<time>`
 * elements, so the trailing abbreviation is dropped to avoid a doubled full stop.
 */
export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(HTML_LANG[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(value))
    .replace(/\s*г\.$/u, '');
}
