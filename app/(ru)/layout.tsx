import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import { DocumentShell } from '../../src/components/document-shell.tsx';

/** The browser chrome colour the published pages declare. */
export const viewport: Viewport = { themeColor: '#0b111c' };

export default function RuLayout({ children }: { children: ReactNode }) {
  return <DocumentShell locale="ru">{children}</DocumentShell>;
}
