import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import { DocumentShell } from '../../src/components/document-shell.tsx';

/** The browser chrome colour the published pages declare. */
export const viewport: Viewport = { themeColor: '#0b111c' };

/**
 * The document of the addresses published before the locale prefixes existed.
 *
 * Only the English Browser Control policy lives here, so the group renders the English document element while the
 * route stays at the bare path.
 */
export default function LegacyLayout({ children }: { children: ReactNode }) {
  return <DocumentShell locale="en">{children}</DocumentShell>;
}
