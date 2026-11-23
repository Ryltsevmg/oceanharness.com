import type { Translate } from '../i18n/messages.ts';
import { LOCALES, localizedPath, type Locale, type PageKey } from '../i18n/locales.ts';
import type { LanguageLink, NavLink } from './site-header.tsx';

/**
 * Navigation and footer entries for one page.
 *
 * The landing page points its first link at the in-page `#features` section instead of at itself; every other page
 * points at the home route of the same locale. External links carry the `↗` mark the published markup uses.
 */

/** Which nav entry is active, plus the landing page's own section anchor. */
export type Current = PageKey | 'features' | null;

/** The four nav links of the header, already localized. */
export function navLinks(locale: Locale, ui: Translate, current: Current): readonly NavLink[] {
  // The landing page links its first entry to the in-page section and marks nothing as the current route.
  const start: NavLink = current === 'features'
    ? { label: ui('Возможности'), href: '#features' }
    : { label: ui('Главная'), href: localizedPath('home', locale), current: current === 'home' };
  return [
    start,
    { label: ui('Плагины'), href: localizedPath('plugins', locale), current: current === 'plugins' },
    { label: ui('Скачать'), href: localizedPath('downloads', locale), current: current === 'downloads' },
    { label: `${ui('GitHub')} `, href: 'https://github.com/Ryltsevmg/Ocean', current: false, external: true },
  ];
}

/** The language menu: the same page in all nine locales. */
export function languageLinks(locale: Locale, page: PageKey): readonly LanguageLink[] {
  return LOCALES.map(code => ({ code, href: localizedPath(page, code) }));
}

/** Header labels, resolved in the page locale. */
export function headerLabels(ui: Translate) {
  return {
    nav: ui('Основная навигация'),
    brand: ui('Ocean — главная'),
    language: ui('Язык сайта'),
    open: ui('Открыть меню'),
    close: ui('Закрыть меню'),
  };
}

/** Footer links: the internal routes, support, Ocean Pass and source. */
export function footerLinks(locale: Locale, ui: Translate): readonly NavLink[] {
  return [
    { label: ui('Первый запуск'), href: localizedPath('start', locale) },
    { label: ui('Плагины'), href: localizedPath('plugins', locale) },
    { label: ui('Поддержка'), href: 'https://t.me/oceanchatsupportbot' },
    { label: ui('Конфиденциальность'), href: localizedPath('privacy', locale) },
    { label: ui('Ocean Pass'), href: 'https://oceanpass.ru', external: true },
    { label: `${ui('GitHub')} `, href: 'https://github.com/Ryltsevmg/Ocean', external: true },
  ];
}
