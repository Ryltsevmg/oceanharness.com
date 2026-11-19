import test from 'node:test';
import assert from 'node:assert/strict';
import { identifyAsset, selectLatestDownloads, fetchLatestDownloads, renderDownloadCards, parseSnapshot, formatDate, RELEASES_API } from '../downloads/downloads.js';

const asset = (name, extra = {}) => ({ name, size: 200_000_000, state: 'uploaded', browser_download_url: `https://github.com/Ryltsevmg/Ocean/releases/download/test/${name}`, ...extra });
const release = (date, assets, extra = {}) => ({ draft: false, prerelease: false, published_at: date, html_url: 'https://github.com/Ryltsevmg/Ocean/releases/tag/test', assets, ...extra });

test('recognizes current macOS and Linux archives and shipped future target naming', () => {
  assert.deepEqual(identifyAsset('Ocean-Chat-0.2.2-rc.2.20261115.1-arm64-notarized.zip'), { platform: 'mac', arch: 'arm64', format: 'ZIP' });
  assert.deepEqual(identifyAsset('ocean-chat-0.2.2-rc.2.20261115.1-linux-x64-unsigned.tar.gz'), { platform: 'linux', arch: 'x64', format: 'TAR.GZ' });
  assert.deepEqual(identifyAsset('ocean-chat-1.0.0-mac-x64.dmg'), { platform: 'mac', arch: 'x64', format: 'DMG' });
  assert.deepEqual(identifyAsset('ocean-chat-1.0.0-win-x64.exe'), { platform: 'win', arch: 'x64', format: 'EXE' });
  assert.deepEqual(identifyAsset('ocean-chat-1.0.0-linux-arm64.AppImage'), { platform: 'linux', arch: 'arm64', format: 'AppImage' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-mac-arm64-unsigned.dmg'), { platform: 'mac', arch: 'arm64', format: 'DMG' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-win-x64-unsigned.exe'), { platform: 'win', arch: 'x64', format: 'EXE' });
  assert.deepEqual(identifyAsset('ocean-1.0.0-linux-x64-unsigned.tar.gz'), { platform: 'linux', arch: 'x64', format: 'TAR.GZ' });
});

test('does not promote metadata, SDKs, debug archives, or unknown architectures to installers', () => {
  for (const name of ['SHA256SUMS', 'ocean-sdk-linux-x64.tar.gz', 'ocean-chat-1.0.0-win-x64.exe.blockmap', 'ocean-chat-1.0.0-mac-x64-debug.zip', 'ocean-chat-1.0.0-mac-ppc.dmg', 'ocean-chat-1.0.0.zip', 'ocean-chat-1.0.0-win-arm64.exe']) assert.equal(identifyAsset(name), null, name);
});

test('supports all stable desktop packaging targets before the next publication', () => {
  const files = ['ocean-chat-1.0.0-mac-arm64.dmg', 'ocean-chat-1.0.0-mac-arm64.zip', 'ocean-chat-1.0.0-mac-x64.dmg', 'ocean-chat-1.0.0-win-x64.exe', 'ocean-chat-1.0.0-linux-x64-unsigned.tar.gz', 'ocean-chat-1.0.0-linux-arm64-unsigned.tar.gz'];
  const chosen = selectLatestDownloads([release('2026-11-17T00:00:00Z', files.map(name => asset(name)))]);
  assert.deepEqual(chosen.map(item => `${item.platform}-${item.arch}`).sort(), ['linux-arm64', 'linux-x64', 'mac-arm64', 'mac-x64', 'win-x64']);
  assert.equal(chosen.find(item => item.platform === 'mac' && item.arch === 'arm64').format, 'DMG');
});

test('prefers signed artifacts over unsigned alternatives in the same release', () => {
  const chosen = selectLatestDownloads([release('2026-11-17T00:00:00Z', [asset('ocean-chat-1.0.0-mac-arm64-unsigned.dmg'), asset('ocean-chat-1.0.0-mac-arm64.zip')])]);
  assert.equal(chosen[0].format, 'ZIP');
  assert.doesNotMatch(chosen[0].url, /unsigned/);
  assert.equal(Object.hasOwn(chosen[0], 'unsigned'), false);
});

test('selects by publication time per target, includes available prereleases, and prefers DMG over ZIP in one release', () => {
  const chosen = selectLatestDownloads([
    release('2026-11-14T00:00:00Z', [asset('ocean-chat-9.0.0-mac-arm64.dmg'), asset('ocean-chat-9.0.0-linux-x64.tar.gz')]),
    release('2026-11-16T00:00:00Z', [asset('ocean-chat-1.0.0-mac-arm64.zip'), asset('ocean-chat-1.0.0-mac-arm64.dmg')], { prerelease: true }),
    release('2026-11-17T00:00:00Z', [asset('ocean-chat-2.0.0-win-x64.exe')], { draft: true }),
  ]);
  assert.equal(chosen.length, 2);
  assert.equal(chosen.find(item => item.platform === 'mac').format, 'DMG');
  assert.match(chosen.find(item => item.platform === 'mac').url, /1\.0\.0/);
  assert.match(chosen.find(item => item.platform === 'linux').url, /9\.0\.0/);
});

test('rejects invalid response payloads and ignores unpublished or untrusted artifacts', () => {
  assert.throws(() => selectLatestDownloads({ message: 'API rate limit exceeded' }));
  assert.throws(() => selectLatestDownloads([{ assets: [] }]));
  assert.deepEqual(selectLatestDownloads([]), []);
  assert.deepEqual(selectLatestDownloads([release(null, [], { draft: true })]), []);
  assert.deepEqual(selectLatestDownloads([release('2026-11-16T00:00:00Z', [
    asset('ocean-chat-1.0.0-win-x64.exe', { state: 'new' }),
    asset('ocean-chat-1.0.0-linux-x64.tar.gz', { size: 0 }),
    asset('ocean-chat-1.0.0-mac-x64.dmg', { browser_download_url: 'https://elsewhere.example/setup.dmg' }),
  ])]), []);
});

test('fetch follows GitHub pagination and stops on errors instead of exposing an incomplete list', async () => {
  const urls = [];
  const second = 'https://api.github.com/repos/Ryltsevmg/Ocean/releases?per_page=100&page=2';
  const fetcher = async url => {
    urls.push(url);
    return new Response(JSON.stringify([release(url === second ? '2026-11-14T00:00:00Z' : '2026-11-16T00:00:00Z', [asset(url === second ? 'ocean-chat-1.0.0-linux-x64.tar.gz' : 'ocean-chat-1.0.0-mac-arm64.dmg')])]), { headers: url === second ? {} : { link: `<${second}>; rel="next"` } });
  };
  const chosen = await fetchLatestDownloads(fetcher);
  assert.deepEqual(urls, [RELEASES_API, second]);
  assert.equal(chosen.length, 2);
  await assert.rejects(fetchLatestDownloads(async () => new Response('{}', { status: 403 })), /403/);
  await assert.rejects(fetchLatestDownloads(async () => new Response('[]', { headers: { link: '<https://other.example/>; rel="next"' } })), /Unexpected release page/);
});

test('empty targets have a real fallback link and no fabricated download or version labels', () => {
  const html = renderDownloadCards(selectLatestDownloads([release('2026-11-15T00:00:00Z', [asset('ocean-chat-0.2.2-rc.2-mac-arm64.dmg')])]));
  assert.equal((html.match(/class="button primary download-button"/g) || []).length, 1);
  assert.equal((html.match(/Пока нет загрузки/g) || []).length, 4);
  assert.match(html, /aria-label="Скачать Ocean для macOS, Apple silicon"/);
  assert.doesNotMatch(html.replace(/href="[^"]*"/g, ''), /0\.2\.2|rc\.2/i);
});

test('saved fallback validates dates, targets, duplicate artifacts, and trusted download URLs', () => {
  const snapshot = { checkedAt: '2026-11-16T00:00:00Z', downloads: selectLatestDownloads([release('2026-11-15T00:00:00Z', [asset('ocean-chat-1.0.0-mac-arm64.dmg')])]) };
  assert.deepEqual(parseSnapshot(snapshot), snapshot);
  assert.throws(() => parseSnapshot({ ...snapshot, checkedAt: 'not-a-date' }));
  assert.throws(() => parseSnapshot({ ...snapshot, downloads: [...snapshot.downloads, ...snapshot.downloads] }));
  assert.throws(() => parseSnapshot({ ...snapshot, downloads: [{ ...snapshot.downloads[0], url: 'javascript:alert(1)' }] }));
});

test('Russian dates fit standalone metadata and sentences without a duplicated full stop', () => {
  assert.equal(formatDate('2026-11-15T07:41:10Z'), '15 ноября 2026');
  assert.equal(`Проверено ${formatDate('2026-11-15T07:41:10Z')}.`.endsWith('..'), false);
});
