import type { ReactNode } from 'react';
import type { PluginIcon } from '../content/plugins.ts';

/**
 * Line icons shared by the plugin cards and the site chrome.
 *
 * Every mark is a 24×24 stroked drawing with the same weight and rounding, so a card grid never shows a mix of
 * optical sizes. The paths are the published ones; changing one changes what an installed plugin looks like next to.
 */
const MARKS: Record<PluginIcon, ReactNode> = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z" />
    </>
  ),
  cursor: <path d="m4 3 7.7 18 2.6-6.7L21 11.7 4 3Z" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 7.7-7.7M18 5l3 3M15 8l2 2" />
    </>
  ),
  board: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="10" cy="18" r="1.6" />
    </>
  ),
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  play: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  palette: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="8" r="2" />
      <circle cx="8" cy="15" r="2" />
      <circle cx="16" cy="15" r="2" />
    </>
  ),
  branch: (
    <>
      <path d="M6 3v12" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M12 3.5 5 6.2V12c0 4.3 2.9 7.4 7 8.8 4.1-1.4 7-4.5 7-8.8V6.2l-7-2.7Z" />
      <path d="m9.2 11.8 2 2 3.6-3.6" />
    </>
  ),
  wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />,
  mic: (
    <>
      <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  type: <path d="M5 7V5h14v2M12 5v14M9 19h6" />,
};

/** The stroked card symbol of one plugin, sized and coloured by the surrounding `.plugin-symbol`. */
export function PluginSymbol({ icon }: { icon: PluginIcon }) {
  return (
    <span className="plugin-symbol">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {MARKS[icon]}
      </svg>
    </span>
  );
}

/** The globe mark of the language picker. */
export function LanguageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z" />
    </svg>
  );
}
