import type { ReactNode } from 'react';
import { HTML_LANG, type Locale } from '../i18n/locales.ts';

/** The `<html>` element of one locale, rendered by the layout of that route group. */
export function DocumentShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={HTML_LANG[locale]}>
      <body>{children}</body>
    </html>
  );
}
