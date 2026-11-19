import { PREFIXED_LOCALES } from './locales.ts';

/** The `[locale]` params of the eight prefixed locales; Russian pages are routed without a segment. */
export function localeParams() {
  return PREFIXED_LOCALES.map(locale => ({ locale }));
}
