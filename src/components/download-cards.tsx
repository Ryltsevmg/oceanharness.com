'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DOWNLOAD_TARGETS,
  fetchLatestDownloads,
  formatDate,
  formatSize,
  parseSnapshot,
  RELEASES_URL,
  type Asset,
} from '../content/downloads.ts';
import type { Locale } from '../i18n/locales.ts';

/**
 * The platform cards of `/downloads/`.
 *
 * The server renders the checked snapshot, so the page works with JavaScript disabled and search engines see real
 * download links. On mount this component asks the Releases API for newer files and swaps the list in place: cards
 * are keyed by platform and architecture, so an unchanged card keeps its DOM node and a focused button or link keeps
 * focus across the update. When the request fails, the saved snapshot is re-read and the page says which date the
 * list was checked, never pretending it is current.
 */

export type DownloadLabels = {
  readonly download: string;
  readonly notes: string;
  readonly allReleases: string;
  readonly unavailable: string;
  readonly retry: string;
  readonly checking: string;
  readonly updated: string;
  readonly empty: string;
  readonly stale: string;
  readonly checked: string;
  readonly aria: string;
  readonly megabyte: string;
  readonly grid: string;
  readonly allOnGithub: string;
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  mac: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  win: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18M3 12h18" /></>,
  linux: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m7 9 3 3-3 3m6 0h4" /></>,
};

function interpolate(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function DownloadCards({
  locale,
  initial,
  checkedAt,
  labels,
}: {
  locale: Locale;
  initial: readonly Asset[];
  checkedAt: string;
  labels: DownloadLabels;
}) {
  const [assets, setAssets] = useState<readonly Asset[]>(initial);
  const [status, setStatus] = useState(() => interpolate(labels.checked, { date: formatDate(checkedAt, locale) }));
  const [busy, setBusy] = useState(false);
  const [retryVisible, setRetryVisible] = useState(false);
  const [retryLabel, setRetryLabel] = useState(labels.retry);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const started = useRef(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setRetryLabel(labels.checking);
    try {
      const downloads = await fetchLatestDownloads(fetch, { signal: AbortSignal.timeout(12_000) });
      setAssets(downloads);
      setStatus(downloads.length ? labels.updated : labels.empty);
      if (document.activeElement === retryRef.current) {
        statusRef.current?.focus({ preventScroll: true });
      }
      setRetryVisible(false);
      setRetryLabel(labels.retry);
    } catch {
      let savedDate = checkedAt;
      try {
        const response = await fetch('/downloads/releases.json', { signal: AbortSignal.timeout(3_000) });
        if (!response.ok) throw new Error('Local download list unavailable');
        const snapshot = parseSnapshot(await response.json());
        setAssets(snapshot.downloads);
        savedDate = snapshot.checkedAt;
      } catch {
        // The static HTML already carries the checked list; keep it for offline use.
      }
      setStatus(interpolate(labels.stale, { date: formatDate(savedDate, locale) }));
      setRetryVisible(true);
      setRetryLabel(labels.retry);
    } finally {
      setBusy(false);
    }
  }, [checkedAt, labels, locale]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void refresh();
  }, [refresh]);

  const missing = DOWNLOAD_TARGETS.filter(target => !assets.some(asset => asset.platform === target.platform && asset.arch === target.arch));
  const ordered = DOWNLOAD_TARGETS
    .map(target => ({ target, asset: assets.find(asset => asset.platform === target.platform && asset.arch === target.arch) }))
    .filter((row): row is { target: (typeof DOWNLOAD_TARGETS)[number]; asset: Asset } => Boolean(row.asset));

  return (
    <>
      <section className="download-grid" aria-label={labels.grid} aria-busy={busy || undefined} data-download-cards>
        {ordered.map(({ target, asset }) => (
          <article className="download-card" key={`${target.platform}-${target.arch}`} data-platform={target.platform} data-arch={target.arch} aria-labelledby={`title-${target.platform}-${target.arch}`}>
            <div className="platform-heading">
              <span className="platform-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{PLATFORM_ICONS[target.platform]}</svg>
              </span>
              <div>
                <h2 id={`title-${target.platform}-${target.arch}`}>{target.title}</h2>
                <p>{target.label}</p>
              </div>
            </div>
            <div className="architecture">
              <p className="download-meta">{asset.format} <span aria-hidden="true">·</span> {formatSize(asset.size, locale, labels.megabyte)}</p>
              <p className="download-date"><time dateTime={asset.publishedAt}>{formatDate(asset.publishedAt, locale)}</time></p>
              <a
                className="button primary download-button"
                href={asset.url}
                aria-label={interpolate(labels.aria, { platform: target.title, arch: target.label })}
              >
                {labels.download} <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" /></svg>
              </a>
            </div>
            <div className="card-footer">
              <a className="release-notes" href={asset.releaseUrl}>{labels.notes} <span aria-hidden="true">↗</span></a>
            </div>
          </article>
        ))}
        {missing.length > 0 ? (
          <div className="download-missing">
            <p className="download-missing-targets">{missing.map(target => `${target.title} ${target.label}`).join(' · ')}</p>
            <p className="download-unavailable">{labels.unavailable}</p>
            <a className="text-link" href={RELEASES_URL}>{labels.allReleases}</a>
          </div>
        ) : null}
      </section>
      <div className="download-freshness">
        <div>
          <p data-download-status role="status" aria-live="polite" ref={statusRef} tabIndex={-1}>{status}</p>
          <button className="refresh-downloads" data-download-retry type="button" ref={retryRef} hidden={!retryVisible} onClick={() => void refresh()} aria-disabled={busy || undefined}>{retryLabel}</button>
        </div>
        <a className="downloads-all" href={RELEASES_URL}>{labels.allOnGithub} <span aria-hidden="true">↗</span></a>
      </div>
    </>
  );
}
