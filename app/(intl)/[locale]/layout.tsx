import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import { DocumentShell } from '../../../src/components/document-shell.tsx';
import { PREFIXED_LOCALES, type Locale } from '../../../src/i18n/locales.ts';

export function generateStaticParams() {
  return PREFIXED_LOCALES.map(locale => ({ locale }));
}

/** The browser chrome colour the published pages declare. */
export const viewport: Viewport = { themeColor: '#0b111c' };

export default async function IntlLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <DocumentShell locale={locale}>{children}</DocumentShell>;
}
