/**
 * Locale registry for the site.
 *
 * Russian pages live at the site root; the eight translated locales live under `/<locale>/`. The routes, `hreflang`
 * codes and language labels below are the published contract: changing one changes live URLs and search-engine
 * alternates, so every edit must keep `sitemap.xml` and the language menu in step.
 */

export const LOCALES = ['ru', 'en', 'zh', 'ja', 'es', 'fr', 'de', 'pt', 'ko'] as const;

export type Locale = (typeof LOCALES)[number];

/** The default locale: its pages carry no path prefix and own `x-default`. */
export const DEFAULT_LOCALE = 'ru' satisfies Locale;

/** Locales other than the default, in the order the language menu and sitemap list them. */
export const PREFIXED_LOCALES = LOCALES.filter((locale): locale is Locale => locale !== DEFAULT_LOCALE);

/** BCP 47 tags used in `<html lang>`, `hreflang` and `Intl` formatting; only two differ from the path segment. */
export const HTML_LANG: Record<Locale, string> = {
  ru: 'ru',
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
  es: 'es',
  fr: 'fr',
  de: 'de',
  pt: 'pt-BR',
  ko: 'ko',
};

/** Language names in the language menu are endonyms and are never translated. */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  zh: '中文',
  ja: '日本語',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ko: '한국어',
};

export const SITE_ORIGIN = 'https://oceanharness.com';

/**
 * Site routes in publishing order. Each one is prerendered for every locale.
 *
 * `key` names the page in code; `path` is the default-locale URL; `privacyLegacy` marks the Browser Control policy,
 * whose English URL was published before the localized routes and keeps its address without a locale prefix.
 */
export const PAGES = [
  { key: 'home', path: '/', privacyLegacy: false },
  { key: 'downloads', path: '/downloads/', privacyLegacy: false },
  { key: 'plugins', path: '/plugins/', privacyLegacy: false },
  { key: 'browser-control', path: '/plugins/browser-control/', privacyLegacy: false },
  { key: 'computer-use', path: '/plugins/computer-use/', privacyLegacy: false },
  { key: 'start', path: '/start/', privacyLegacy: false },
  { key: 'privacy', path: '/privacy/', privacyLegacy: false },
  { key: 'browser-control-privacy', path: '/plugins/browser-control/privacy/', privacyLegacy: true },
] as const;

export type PageKey = (typeof PAGES)[number]['key'];

/** The page record for a key. */
export function page(key: PageKey): (typeof PAGES)[number] {
  const found = PAGES.find(item => item.key === key);
  if (!found) throw new Error(`Unknown page ${key}`);
  return found;
}

/**
 * Absolute path of a page in a locale.
 *
 * The default locale keeps the bare path. The Browser Control privacy policy is the exception: the published English
 * address is `/plugins/browser-control/privacy/`, so only Russian gets the `/ru/` suffix it was given later.
 */
export function localizedPath(key: PageKey, locale: Locale): string {
  const { path, privacyLegacy } = page(key);
  if (locale === DEFAULT_LOCALE) return privacyLegacy ? `${path}ru/` : path;
  if (privacyLegacy) return path;
  return `/${locale}${path}`;
}

/** Fully qualified URL of a page in a locale, as used by `canonical`, `og:url` and the sitemap. */
export function localizedUrl(key: PageKey, locale: Locale): string {
  return `${SITE_ORIGIN}${localizedPath(key, locale)}`;
}

/** `hreflang` → absolute URL map for one page, including the `x-default` pointer to the Russian source. */
export function hreflangAlternates(key: PageKey): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of LOCALES) alternates[HTML_LANG[locale]] = localizedUrl(key, locale);
  alternates['x-default'] = localizedUrl(key, DEFAULT_LOCALE);
  return alternates;
}
