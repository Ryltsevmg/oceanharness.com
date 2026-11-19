function localization() {
  if (typeof document === 'undefined') return { locale: 'ru-RU', messages: {} };
  return JSON.parse(document.getElementById('site-messages')?.textContent || '{"locale":"ru-RU","messages":{}}');
}

function text(source, values = {}) {
  const translated = localization().messages[source] || source;
  return translated.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

const REPOSITORY = 'https://github.com/Ryltsevmg/Ocean';
export const RELEASES_URL = `${REPOSITORY}/releases`;
export const RELEASES_API = 'https://api.github.com/repos/Ryltsevmg/Ocean/releases?per_page=100';
export const DOWNLOAD_TARGETS = [
  { platform: 'mac', arch: 'arm64', title: 'macOS', label: 'Apple silicon' },
  { platform: 'win', arch: 'x64', title: 'Windows', label: 'Intel / AMD · x64' },
  { platform: 'linux', arch: 'x64', title: 'Linux', label: 'Intel / AMD · x64' },
  { platform: 'linux', arch: 'arm64', title: 'Linux', label: 'ARM64' },
  { platform: 'mac', arch: 'x64', title: 'macOS', label: 'Intel' },
];

const TARGETS = new Set(DOWNLOAD_TARGETS.map(target => `${target.platform}-${target.arch}`));
const FORMAT_ORDER = { DMG: 0, EXE: 0, AppImage: 0, MSI: 1, DEB: 1, ZIP: 2, 'TAR.GZ': 2 };

/** Match the desktop artifactName (ocean-${version}-${os}-${arch}; the legacy ocean-chat- spelling stays accepted) and the published legacy notarized Mac ZIP. */
export function identifyAsset(name) {
  if (typeof name !== 'string' || !/^ocean(?:-chat)?-\d+\.\d+\.\d+/i.test(name) || /(?:^|[-.])(debug|symbols|blockmap|sha256|checksums?)(?:[-.]|$)/i.test(name)) return null;
  const lower = name.toLowerCase();
  const archMatch = lower.match(/-(arm64|aarch64|x64|x86_64|amd64)(?=[-.])/);
  if (!archMatch) return null;
  const arch = ['arm64', 'aarch64'].includes(archMatch[1]) ? 'arm64' : 'x64';
  let platform;
  let format;
  if (/-linux-/.test(lower)) {
    platform = 'linux';
    format = lower.endsWith('.appimage') ? 'AppImage' : lower.endsWith('.deb') ? 'DEB' : lower.endsWith('.tar.gz') ? 'TAR.GZ' : null;
  } else if (/-(win|win32|windows)-/.test(lower)) {
    platform = 'win';
    format = lower.endsWith('.exe') ? 'EXE' : lower.endsWith('.msi') ? 'MSI' : null;
  } else if (/-(mac|macos|darwin)-/.test(lower) || /-(arm64|x64)-notarized\.zip$/.test(lower)) {
    platform = 'mac';
    format = lower.endsWith('.dmg') ? 'DMG' : lower.endsWith('.zip') ? 'ZIP' : null;
  }
  if (!format || !TARGETS.has(`${platform}-${arch}`)) return null;
  return { platform, arch, format };
}

function isRepositoryUrl(value, path) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port && !url.username && !url.password
      && url.pathname.startsWith(`/Ryltsevmg/Ocean/releases/${path}/`);
  } catch { return false; }
}

/** Choose the newest published artifact independently for each platform and architecture. */
export function selectLatestDownloads(releases) {
  if (!Array.isArray(releases)) throw new Error('Invalid release response');
  const published = releases.filter(release => release && release.draft === false && Number.isFinite(Date.parse(release.published_at))
    && Array.isArray(release.assets) && isRepositoryUrl(release.html_url, 'tag'))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  if (releases.length && !published.length && !releases.every(release => release?.draft === true)) throw new Error('No valid release records');
  const chosen = new Map();
  for (const release of published) {
    const assets = release.assets.flatMap(asset => {
      const target = identifyAsset(asset?.name);
      return target && asset.state === 'uploaded' && Number.isSafeInteger(asset.size) && asset.size > 0 && isRepositoryUrl(asset.browser_download_url, 'download')
        ? [{ ...target, size: asset.size, url: asset.browser_download_url, releaseUrl: release.html_url, publishedAt: release.published_at,
          unsigned: /-(?:unsigned|unnotarized)(?=\.)/i.test(asset.name) }]
        : [];
    }).sort((a, b) => Number(a.unsigned) - Number(b.unsigned) || FORMAT_ORDER[a.format] - FORMAT_ORDER[b.format]);
    for (const { unsigned, ...asset } of assets) {
      const key = `${asset.platform}-${asset.arch}`;
      if (!chosen.has(key)) chosen.set(key, asset);
    }
  }
  return [...chosen.values()];
}

/** Read release pages until every supported target is found or GitHub history ends. */
export async function fetchLatestDownloads(fetcher = fetch, { signal, headers = {} } = {}) {
  let nextUrl = RELEASES_API;
  const visited = new Set();
  const releases = [];
  while (nextUrl) {
    if (visited.has(nextUrl)) throw new Error('Repeated release page');
    visited.add(nextUrl);
    const response = await fetcher(nextUrl, { signal, headers: { Accept: 'application/vnd.github+json', ...headers } });
    if (!response.ok) throw new Error(`Release request failed: ${response.status}`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Invalid release response');
    releases.push(...page);
    const downloads = selectLatestDownloads(releases);
    if (downloads.length === TARGETS.size) return downloads;
    const next = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    if (!next) return downloads;
    const url = new URL(next);
    if (url.origin !== 'https://api.github.com' || url.pathname !== '/repos/Ryltsevmg/Ocean/releases' || url.username || url.password) throw new Error('Unexpected release page');
    nextUrl = url.href;
  }
  return [];
}

export function formatSize(bytes) {
  return `${new Intl.NumberFormat(localization().locale, { maximumFractionDigits: 0 }).format(bytes / 1_000_000)} ${text('МБ')}`;
}

export function formatDate(value) {
  return new Intl.DateTimeFormat(localization().locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)).replace(/\s*г\.$/u, '');
}

/** Validate the locally published fallback before inserting its URLs into the page. */
export function parseSnapshot(snapshot) {
  if (!snapshot || !Number.isFinite(Date.parse(snapshot.checkedAt)) || !Array.isArray(snapshot.downloads)) throw new Error('Invalid download snapshot');
  const seen = new Set();
  for (const asset of snapshot.downloads) {
    const key = `${asset?.platform}-${asset?.arch}`;
    const formatAllowed = { mac: ['DMG', 'ZIP'], win: ['EXE', 'MSI'], linux: ['AppImage', 'DEB', 'TAR.GZ'] }[asset?.platform]?.includes(asset?.format);
    if (!TARGETS.has(key) || seen.has(key) || !formatAllowed || !Number.isSafeInteger(asset.size) || asset.size <= 0
      || !Number.isFinite(Date.parse(asset.publishedAt)) || !isRepositoryUrl(asset.url, 'download') || !isRepositoryUrl(asset.releaseUrl, 'tag')) throw new Error('Invalid snapshot artifact');
    seen.add(key);
  }
  return snapshot;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

const platformIcons = {
  mac: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  win: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/>',
  linux: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3m6 0h4"/>',
};

/** Shared by the static-page generator and the browser to keep both download lists identical. */
export function renderDownloadCards(downloads) {
  const tiles = [];
  const missing = [];
  for (const target of DOWNLOAD_TARGETS) {
    const asset = downloads.find(item => item.platform === target.platform && item.arch === target.arch);
    if (!asset) {
      missing.push(`${target.title} ${target.label}`);
      continue;
    }
    const id = `title-${target.platform}-${target.arch}`;
    tiles.push(`<article class="download-card" data-platform="${target.platform}" data-arch="${target.arch}" aria-labelledby="${id}">
    <div class="platform-heading"><span class="platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${platformIcons[target.platform]}</svg></span><div><h2 id="${id}">${target.title}</h2><p>${target.label}</p></div></div>
    <div class="architecture"><p class="download-meta">${asset.format} <span aria-hidden="true">·</span> ${formatSize(asset.size)}</p><p class="download-date"><time datetime="${escapeHtml(asset.publishedAt)}">${formatDate(asset.publishedAt)}</time></p><a class="button primary download-button" href="${escapeHtml(asset.url)}" aria-label="${escapeHtml(text('Скачать Ocean для {platform}, {arch}', { platform: target.title, arch: target.label }))}">${escapeHtml(text('Скачать'))} <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/></svg></a></div>
    <div class="card-footer"><a class="release-notes" href="${escapeHtml(asset.releaseUrl)}">${escapeHtml(text('Что нового'))} <span aria-hidden="true">↗</span></a></div>
  </article>`);
  }
  if (missing.length > 0) tiles.push(`<div class="download-missing"><p class="download-missing-targets">${escapeHtml(missing.join(' · '))}</p><p class="download-unavailable">${escapeHtml(text('Пока нет загрузки'))}</p><a class="text-link" href="${RELEASES_URL}">${escapeHtml(text('Все релизы'))}</a></div>`);
  return tiles.join('\n');
}

/** Preserve unchanged cards and keep keyboard focus on the same architecture and action when release data changes. */
export function updateDownloadCards(cards, downloads) {
  const doc = cards.ownerDocument;
  const focused = doc.activeElement;
  const inside = Boolean(focused && cards.contains(focused));
  const cardOf = node => node && typeof node.closest === 'function' ? node.closest('.download-card') : null;
  const focusedCard = cardOf(focused);
  const action = inside && focused.matches ? ['.download-button', '.release-notes', '.text-link'].find(selector => focused.matches(selector)) : undefined;
  const wasFallback = Boolean(inside && focused.closest('.download-missing'));
  const template = doc.createElement('template');
  template.innerHTML = renderDownloadCards(downloads);
  const ordered = [...template.content.children].map(node => {
    if (!node.classList.contains('download-card')) {
      const current = cards.querySelector('.download-missing');
      return current && current.isEqualNode(node) ? current : node;
    }
    const current = cards.querySelector(`[data-platform="${node.dataset.platform}"][data-arch="${node.dataset.arch}"]`);
    return current && current.isEqualNode(node) ? current : node;
  });
  for (const node of ordered) cards.append(node);
  for (const remaining of [...cards.children]) if (!ordered.includes(remaining)) remaining.remove();
  if (!inside) return;
  if (doc.activeElement === focused) return;
  const sameCard = focusedCard && ordered.find(node => node.classList?.contains('download-card')
    && node.dataset.platform === focusedCard.dataset.platform && node.dataset.arch === focusedCard.dataset.arch);
  const replacement = (action && sameCard?.querySelector(action))
    || sameCard?.querySelector('.release-notes') || sameCard?.querySelector('.download-button')
    || (wasFallback ? ordered.find(node => node.classList?.contains('download-card'))?.querySelector('.release-notes') : null)
    || cards.querySelector('.download-missing .text-link');
  replacement?.focus({ preventScroll: true });
}

/** Refresh available files without removing a focused retry control while the request is pending. */
export async function refreshDownloads({ cards, status, retry }, fetcher = fetch) {
  if (cards.getAttribute('aria-busy') === 'true') return;
  cards.setAttribute('aria-busy', 'true');
  if (retry) {
    retry.setAttribute('aria-disabled', 'true');
    retry.textContent = text('Проверяем…');
  }
  try {
    const downloads = await fetchLatestDownloads(fetcher, { signal: AbortSignal.timeout(12_000) });
    updateDownloadCards(cards, downloads);
    status.textContent = text(downloads.length ? 'Загрузки обновлены с GitHub.' : 'Загрузки появятся здесь после публикации.');
    if (retry) {
      if (cards.ownerDocument.activeElement === retry) {
        status.tabIndex = -1;
        status.focus({ preventScroll: true });
      }
      retry.hidden = true;
    }
  } catch {
    let savedDate = status.dataset.checkedAt;
    try {
      const response = await fetcher('/downloads/releases.json', { signal: AbortSignal.timeout(3_000) });
      if (!response.ok) throw new Error('Local download list unavailable');
      const snapshot = parseSnapshot(await response.json());
      updateDownloadCards(cards, snapshot.downloads);
      savedDate = snapshot.checkedAt;
    } catch {
      // The static HTML contains the same checked download list for offline use.
    }
    status.textContent = text('Не удалось обновить список. Показаны загрузки, проверенные {date}.', { date: formatDate(savedDate) });
    if (retry) retry.hidden = false;
  } finally {
    cards.removeAttribute('aria-busy');
    if (retry) {
      retry.removeAttribute('aria-disabled');
      retry.textContent = text('Попробовать снова');
    }
  }
}

if (typeof document !== 'undefined') {
  const cards = document.querySelector('[data-download-cards]');
  const status = document.querySelector('[data-download-status]');
  const retry = document.querySelector('[data-download-retry]');
  if (cards && status) {
    const controls = { cards, status, retry };
    retry?.addEventListener('click', () => refreshDownloads(controls));
    refreshDownloads(controls);
  }
}
