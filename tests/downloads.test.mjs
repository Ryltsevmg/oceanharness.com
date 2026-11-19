/**
 * Release selection for `/downloads/`.
 *
 * Covers the trust boundary of the GitHub Releases API: which artifact names count as installers, how a release is
 * chosen per platform, and what makes a response or a saved snapshot untrustworthy. Fetch is injected, so no test
 * reaches the network.
 */
import { strict as assert } from 'node:assert';
import test from 'node:test';
import {
  DOWNLOAD_TARGETS,
  fetchLatestDownloads,
  formatDate,
  formatSize,
  identifyAsset,
  parseSnapshot,
  selectLatestDownloads,
} from '../src/content/downloads.ts';

const asset = (name, extra = {}) => ({
  name,
  state: 'uploaded',
  size: 100_000_000,
  browser_download_url: `https://github.com/Ryltsevmg/Ocean/releases/download/v1.0.0/${name}`,
  ...extra,
});

const release = (tag, publishedAt, assets, extra = {}) => ({
  html_url: `https://github.com/Ryltsevmg/Ocean/releases/tag/${tag}`,
  published_at: publishedAt,
  draft: false,
  assets,
  ...extra,
});

test('identifies the shipped installers and the legacy naming', () => {
  assert.deepEqual(identifyAsset('ocean-1.0.0-mac-arm64.dmg'), { platform: 'mac', arch: 'arm64', format: 'DMG' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-mac-x64.zip'), { platform: 'mac', arch: 'x64', format: 'ZIP' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-mac-arm64-notarized.zip'), { platform: 'mac', arch: 'arm64', format: 'ZIP' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-win-x64.exe'), { platform: 'win', arch: 'x64', format: 'EXE' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-linux-x86_64.tar.gz'), { platform: 'linux', arch: 'x64', format: 'TAR.GZ' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-linux-aarch64.deb'), { platform: 'linux', arch: 'arm64', format: 'DEB' });
  assert.deepEqual(identifyAsset('ocean-chat-0.9.0-mac-arm64.dmg'), { platform: 'mac', arch: 'arm64', format: 'DMG' });
});

test('rejects metadata, debug output, unknown platforms and unknown architectures', () => {
  for (const name of ['latest-mac.yml', 'ocean-1.0.0-mac-arm64.dmg.blockmap', 'ocean-1.0.0-mac-arm64-sha256sum.txt',
    'ocean-1.0.0-mac-arm64-debug.zip', 'ocean-1.0.0-freebsd-x64.tar.gz',
    'ocean-1.0.0-mac-ppc.dmg', 'ocean-1.0.0-win-arm64.exe', 'notes.txt']) {
    assert.equal(identifyAsset(name), null, name);
  }
});

test('covers every stable desktop target the page promises', () => {
  assert.deepEqual(DOWNLOAD_TARGETS.map(target => `${target.platform}-${target.arch}`),
    ['mac-arm64', 'win-x64', 'linux-x64', 'linux-arm64', 'mac-x64']);
});

test('prefers a signed artifact over the unsigned one of the same release', () => {
  const downloads = selectLatestDownloads([release('v1.0.0', '2026-11-19T10:00:00Z', [
    asset('ocean-1.0.0-mac-arm64-unsigned.dmg'),
    asset('ocean-1.0.0-mac-arm64.dmg'),
    asset('ocean-1.0.0-mac-arm64-notarized.zip'),
  ])]);
  assert.deepEqual(downloads.map(item => item.format), ['DMG']);
});

test('takes the newest release per target and the native format inside one release', () => {
  const downloads = selectLatestDownloads([
    release('v1.1.0', '2026-11-20T10:00:00Z', [asset('ocean-1.1.0-mac-arm64.zip')]),
    release('v1.0.0', '2026-11-19T10:00:00Z', [asset('ocean-1.0.0-mac-arm64.dmg'), asset('ocean-1.0.0-win-x64.exe')]),
  ]);
  assert.deepEqual(downloads.map(item => `${item.arch}:${item.format}:${item.url.split('/').pop()}`),
    ['arm64:ZIP:ocean-1.1.0-mac-arm64.zip', 'x64:EXE:ocean-1.0.0-win-x64.exe']);
});

test('refuses unpublished, unuploaded and off-repository artifacts', () => {
  assert.deepEqual(selectLatestDownloads([release('v1.0.0', '2026-11-19T10:00:00Z', [], { draft: true })]), []);
  // A published release whose only artifacts are unusable yields an empty list, not a partial one.
  assert.deepEqual(selectLatestDownloads([release('v1.0.0', '2026-11-19T10:00:00Z', [
    asset('ocean-1.0.0-mac-arm64.dmg', { state: 'deleting' }),
    asset('ocean-1.0.0-win-x64.exe', { browser_download_url: 'https://evil.example/ocean-1.0.0-win-x64.exe' }),
    asset('ocean-1.0.0-linux-x64.tar.gz', { size: 0 }),
    asset('ocean-1.0.0-linux-arm64.deb', { size: 0 }),
  ])]).length, 0);
});

test('rejects payloads that are not release records', () => {
  assert.throws(() => selectLatestDownloads([{ html_url: 'https://github.com/Ryltsevmg/Ocean/releases/tag/v1.0.0', published_at: 'not a date', assets: [] }]), /No valid release records/);
  assert.throws(() => selectLatestDownloads({}), /Invalid release response/);
});

test('follows pagination until every target is found and stops on an error page', async () => {
  const pageOne = [release('v1.1.0', '2026-11-20T10:00:00Z', [asset('ocean-1.1.0-mac-arm64.dmg')])];
  const pageTwo = [release('v1.0.0', '2026-11-19T10:00:00Z', [
    asset('ocean-1.0.0-win-x64.exe'), asset('ocean-1.0.0-linux-x64.tar.gz'),
    asset('ocean-1.0.0-linux-arm64.deb'), asset('ocean-1.0.0-mac-x64.dmg'),
  ])];
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    const body = calls.length === 1 ? pageOne : pageTwo;
    return {
      ok: true,
      status: 200,
      headers: { get: (name) => name === 'link' && calls.length === 1 ? '<https://api.github.com/repos/Ryltsevmg/Ocean/releases?per_page=100&page=2>; rel="next"' : null },
      json: async () => body,
    };
  };
  const downloads = await fetchLatestDownloads(fetcher);
  assert.equal(downloads.length, 5);
  assert.equal(calls.length, 2, 'stops once every target is available');

  await assert.rejects(fetchLatestDownloads(async () => ({ ok: false, status: 502, headers: { get: () => null }, json: async () => [] })), /Release request failed: 502/);
  await assert.rejects(fetchLatestDownloads(async () => ({
    ok: true, status: 200,
    headers: { get: () => '<https://api.github.com/repos/other/thing/releases>; rel="next"' },
    json: async () => pageOne,
  })), /Unexpected release page/);
});

test('the saved snapshot is validated before its URLs are published', () => {
  const good = {
    checkedAt: '2026-11-19T10:40:43.203Z',
    downloads: [{ platform: 'mac', arch: 'arm64', format: 'DMG', size: 342_364_876, publishedAt: '2026-11-19T10:14:42Z',
      url: 'https://github.com/Ryltsevmg/Ocean/releases/download/v1.0.0/ocean-1.0.0-mac-arm64.dmg',
      releaseUrl: 'https://github.com/Ryltsevmg/Ocean/releases/tag/v1.0.0' }],
  };
  assert.equal(parseSnapshot(good).downloads.length, 1);
  for (const broken of [
    null,
    { checkedAt: 'nope', downloads: [] },
    { ...good, downloads: [good.downloads[0], good.downloads[0]] },
    { ...good, downloads: [{ ...good.downloads[0], platform: 'win', format: 'DMG' }] },
    { ...good, downloads: [{ ...good.downloads[0], url: 'http://github.com/Ryltsevmg/Ocean/releases/download/v1.0.0/a.dmg' }] },
    { ...good, downloads: [{ ...good.downloads[0], size: null }] },
  ]) assert.throws(() => parseSnapshot(broken), /Invalid/, JSON.stringify(broken));
});

test('dates and sizes follow the locale, and Russian drops the trailing abbreviation', () => {
  const stamp = '2026-11-19T10:14:42Z';
  assert.equal(formatDate(stamp, 'ru'), '19 ноября 2026');
  assert.equal(formatDate(stamp, 'en'), 'November 19, 2026');
  assert.equal(formatDate(stamp, 'de'), '19. November 2026');
  assert.equal(formatDate(stamp, 'ja'), '2026年11月19日');
  assert.equal(formatDate(stamp, 'zh'), '2026年11月19日');
  assert.equal(formatSize(342_364_876, 'ru', 'МБ'), '342 МБ');
  assert.equal(formatSize(342_364_876, 'en', 'MB'), '342 MB');
});
