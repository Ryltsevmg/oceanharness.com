/**
 * Client behaviour of the download cards.
 *
 * Replaces the browser fixture page of the static site: the component is mounted in jsdom with an injected
 * `fetch`, so the release refresh, the failure path, the retry control and focus across an update are checked
 * offline. Run through `node --import tsx` because the component itself is a TSX module.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://oceanharness.com/downloads/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { strict as assert } from 'node:assert';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DownloadCards } from '../src/components/download-cards.tsx';

const LABELS = {
  download: 'Скачать', notes: 'Что нового', allReleases: 'Все релизы', unavailable: 'Пока нет загрузки',
  retry: 'Попробовать снова', checking: 'Проверяем…', updated: 'Загрузки обновлены с GitHub.',
  empty: 'Загрузки появятся здесь после публикации.',
  stale: 'Не удалось обновить список. Показаны загрузки, проверенные {date}.',
  checked: 'Загрузки проверены {date}.', aria: 'Скачать Ocean для {platform}, {arch}',
  megabyte: 'МБ', grid: 'Загрузки по платформам', allOnGithub: 'Все загрузки на GitHub',
};

const SNAPSHOT = [{
  platform: 'mac', arch: 'arm64', format: 'DMG', size: 342_364_876,
  url: 'https://github.com/Ryltsevmg/Ocean/releases/download/v1.0.0/ocean-1.0.0-mac-arm64-unsigned.dmg',
  releaseUrl: 'https://github.com/Ryltsevmg/Ocean/releases/tag/v1.0.0',
  publishedAt: '2026-11-19T10:14:42Z',
}];

function releaseBody(tag, publishedAt, names) {
  return [{
    html_url: `https://github.com/Ryltsevmg/Ocean/releases/tag/${tag}`,
    published_at: publishedAt, draft: false,
    assets: names.map(name => ({
      name, state: 'uploaded', size: 120_000_000,
      browser_download_url: `https://github.com/Ryltsevmg/Ocean/releases/download/${tag}/${name}`,
    })),
  }];
}

function response(body, headers = {}) {
  return { ok: true, status: 200, json: async () => body, headers: { get: name => headers[name.toLowerCase()] ?? null } };
}

function mount(fetchImpl) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  globalThis.fetch = fetchImpl;
  act(() => root.render(createElement(DownloadCards, { locale: 'ru', initial: SNAPSHOT, checkedAt: '2026-11-19T10:40:43.203Z', labels: LABELS })));
  return { container, root, document };
}

const statusOf = container => container.querySelector('[data-download-status]').textContent.trim();
const cardsOf = container => [...container.querySelectorAll('.download-card')].map(card => `${card.dataset.platform}-${card.dataset.arch}`);

test('the checked snapshot renders without any request finishing, and unavailable targets collapse into one note', async () => {
  let resolveFetch;
  const { container, root } = mount(() => new Promise(resolve => { resolveFetch = resolve; }));
  assert.deepEqual(cardsOf(container), ['mac-arm64']);
  assert.equal(statusOf(container), 'Загрузки проверены 19 ноября 2026.');
  assert.match(container.querySelector('.download-missing').textContent, /macOS Intel/);
  assert.equal(container.querySelector('[data-download-retry]').hidden, true);

  resolveFetch(response(releaseBody('v1.1.0', '2026-11-20T10:00:00Z', ['ocean-1.1.0-mac-arm64.dmg', 'ocean-1.1.0-win-x64.exe'])));
  await act(async () => { await Promise.resolve(); });
  assert.deepEqual(cardsOf(container), ['mac-arm64', 'win-x64']);
  assert.equal(statusOf(container), 'Загрузки обновлены с GitHub.');
  assert.equal(container.querySelector('.download-missing').textContent.includes('Linux'), true);
  act(() => root.unmount());
});

test('a failed refresh keeps the checked list, says when it was checked and offers a retry', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (String(url).includes('api.github.com')) throw new Error('network down');
    return response({ checkedAt: '2026-11-18T09:00:00Z', downloads: SNAPSHOT });
  };
  const { container, root } = mount(fetchImpl);
  await act(async () => { await Promise.resolve(); });
  assert.equal(statusOf(container), 'Не удалось обновить список. Показаны загрузки, проверенные 18 ноября 2026.');
  const retry = container.querySelector('[data-download-retry]');
  assert.equal(retry.hidden, false, 'the retry control is offered');
  assert.equal(retry.textContent, 'Попробовать снова');

  const second = async (url) => {
    calls.push(url);
    return response(releaseBody('v1.2.0', '2026-11-21T10:00:00Z', ['ocean-1.2.0-mac-arm64.dmg']));
  };
  globalThis.fetch = second;
  await act(async () => { retry.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 0)); });
  assert.equal(statusOf(container), 'Загрузки обновлены с GitHub.');
  assert.equal(container.querySelector('[data-download-retry]').hidden, true);
  assert.ok(calls.length >= 3, 'the retry issued a new release request');
  act(() => root.unmount());
});

test('an empty release list is reported as empty instead of keeping stale cards', async () => {
  const { container, root } = mount(async () => response([], {}));
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
  assert.equal(statusOf(container), 'Загрузки появятся здесь после публикации.');
  assert.deepEqual(cardsOf(container), []);
  assert.match(container.querySelector('.download-missing').textContent, /Пока нет загрузки/);
  act(() => root.unmount());
});

test('cards are keyed by target, so an unchanged card keeps its element and the focused link keeps focus', async () => {
  let resolveFetch;
  const { container, root } = mount(() => new Promise(resolve => { resolveFetch = resolve; }));
  const link = container.querySelector('.release-notes');
  link.focus();
  assert.equal(document.activeElement, link);
  const before = container.querySelector('.download-card');

  resolveFetch(response(releaseBody('v1.0.0', '2026-11-19T10:14:42Z', ['ocean-1.0.0-mac-arm64.dmg']), {}));
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
  assert.equal(container.querySelector('.download-card'), before, 'the card element was reused');
  assert.equal(document.activeElement, container.querySelector('.release-notes'), 'focus stayed on the release link');
  act(() => root.unmount());
});
