import { DEFAULT_LOCALE, type Locale } from './locales.ts';
import en from './ui/en.json';
import zh from './ui/zh.json';
import ja from './ui/ja.json';
import es from './ui/es.json';
import fr from './ui/fr.json';
import de from './ui/de.json';
import pt from './ui/pt.json';
import ko from './ui/ko.json';

/**
 * UI copy store.
 *
 * Russian text in a component is the source and, at the same time, the lookup key: `ui('Плагины')` returns the
 * Russian string unchanged and the reviewed translation of that string in every other locale. A string that has not
 * been translated stays Russian, which the build-time check in `tests/content.test.mjs` rejects instead of shipping.
 */
const CATALOGS: Record<Exclude<Locale, typeof DEFAULT_LOCALE>, Readonly<Record<string, string>>> = {
  en, zh, ja, es, fr, de, pt, ko,
};

/** A bound translator for one locale. */
export type Translate = (source: string, values?: Readonly<Record<string, string>>) => string;

function substitute(text: string, values?: Readonly<Record<string, string>>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** Resolve the UI strings of a locale. */
export function messages(locale: Locale): Translate {
  const catalog = locale === DEFAULT_LOCALE ? null : CATALOGS[locale];
  return (source, values) => substitute(catalog?.[source] ?? source, values);
}

/** Every locale catalog keyed by locale, used by the completeness tests. */
export function catalogs(): Readonly<Record<Exclude<Locale, typeof DEFAULT_LOCALE>, Readonly<Record<string, string>>>> {
  return CATALOGS;
}
