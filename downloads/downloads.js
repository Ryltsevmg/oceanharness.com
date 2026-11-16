const REPOSITORY = 'https://github.com/Ryltsevmg/Ocean';
export const RELEASES_URL = `${REPOSITORY}/releases`;
export const RELEASES_API = 'https://api.github.com/repos/Ryltsevmg/Ocean/releases?per_page=100';
export const PLATFORMS = [
  { id: 'mac', title: 'macOS', note: 'Для вашего Mac', architectures: [['arm64', 'Apple silicon'], ['x64', 'Intel']] },
  { id: 'linux', title: 'Linux', note: 'Для вашего дистрибутива', architectures: [['x64', 'Intel / AMD · x64'], ['arm64', 'ARM64']] },
  { id: 'win', title: 'Windows', note: 'Для вашего ПК', architectures: [['x64', 'Intel / AMD · x64']] },
];

const TARGETS = new Set(PLATFORMS.flatMap(platform => platform.architectures.map(([arch]) => `${platform.id}-${arch}`)));
const FORMAT_ORDER = { DMG: 0, EXE: 0, AppImage: 0, MSI: 1, DEB: 1, ZIP: 2, 'TAR.GZ': 2 };

/** Match desktop artifactName (ocean-chat-${version}-${os}-${arch}) and the published legacy notarized Mac ZIP. */
export function identifyAsset(name) {
  if (typeof name !== 'string' || !/^ocean-chat-/i.test(name) || /(?:^|[-.])(debug|symbols|blockmap|sha256|checksums?)(?:[-.]|$)/i.test(name)) return null;
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
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(bytes / 1_000_000)} МБ`;
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)).replace(/\s*г\.$/u, '');
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
  return PLATFORMS.map(platform => `<article class="download-card" data-platform="${platform.id}" aria-labelledby="title-${platform.id}">
    <div class="platform-heading"><span class="platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${platformIcons[platform.id]}</svg></span><div><h2 id="title-${platform.id}">${platform.title}</h2><p>${platform.note}</p></div></div>
    <div class="architecture-list">${platform.architectures.map(([arch, label]) => {
      const asset = downloads.find(item => item.platform === platform.id && item.arch === arch);
      if (!asset) return `<div class="architecture unavailable"><h3>${label}</h3><p class="download-unavailable">Пока нет загрузки</p><a class="text-link" href="${RELEASES_URL}">Все релизы <span aria-hidden="true">↗</span></a></div>`;
      return `<div class="architecture"><h3>${label}</h3><p class="download-meta">${asset.format} <span aria-hidden="true">·</span> ${formatSize(asset.size)}</p><p class="download-date"><time datetime="${escapeHtml(asset.publishedAt)}">${formatDate(asset.publishedAt)}</time></p><a class="button primary download-button" href="${escapeHtml(asset.url)}" aria-label="Скачать Ocean для ${platform.title}, ${label}">Скачать <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/></svg></a><a class="release-notes" href="${escapeHtml(asset.releaseUrl)}">Что нового <span aria-hidden="true">↗</span></a></div>`;
    }).join('')}</div>
  </article>`).join('\n');
}

/** Preserve unchanged cards and keep keyboard focus on the same architecture and action when release data changes. */
export function updateDownloadCards(cards, downloads) {
  const template = cards.ownerDocument.createElement('template');
  template.innerHTML = renderDownloadCards(downloads);
  for (const nextCard of [...template.content.children]) {
    const currentCard = cards.querySelector(`[data-platform="${nextCard.dataset.platform}"]`);
    if (!currentCard) {
      cards.append(nextCard);
      continue;
    }
    if (currentCard.isEqualNode(nextCard)) continue;
    const focused = cards.ownerDocument.activeElement;
    const restoreFocus = currentCard.contains(focused);
    const architectureIndex = restoreFocus ? [...currentCard.querySelectorAll('.architecture')].findIndex(item => item.contains(focused)) : -1;
    const action = restoreFocus && ['.download-button', '.release-notes', '.text-link'].find(selector => focused.matches(selector));
    currentCard.replaceWith(nextCard);
    if (restoreFocus) {
      const architecture = nextCard.querySelectorAll('.architecture')[architectureIndex] || nextCard;
      const replacement = (action && architecture.querySelector(action)) || architecture.querySelector('.text-link')
        || architecture.querySelector('.release-notes') || architecture.querySelector('.download-button');
      replacement?.focus({ preventScroll: true });
    }
  }
}

/** Refresh available files without removing a focused retry control while the request is pending. */
export async function refreshDownloads({ cards, status, retry }, fetcher = fetch) {
  if (cards.getAttribute('aria-busy') === 'true') return;
  cards.setAttribute('aria-busy', 'true');
  if (retry) {
    retry.setAttribute('aria-disabled', 'true');
    retry.textContent = 'Проверяем…';
  }
  try {
    const downloads = await fetchLatestDownloads(fetcher, { signal: AbortSignal.timeout(12_000) });
    updateDownloadCards(cards, downloads);
    status.textContent = downloads.length ? 'Загрузки обновлены с GitHub.' : 'Загрузки появятся здесь после публикации.';
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
    status.textContent = `Не удалось обновить список. Показаны загрузки, проверенные ${formatDate(savedDate)}.`;
    if (retry) retry.hidden = false;
  } finally {
    cards.removeAttribute('aria-busy');
    if (retry) {
      retry.removeAttribute('aria-disabled');
      retry.textContent = 'Попробовать снова';
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
